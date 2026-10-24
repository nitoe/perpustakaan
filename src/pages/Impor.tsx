import { useMemo, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import { catat } from '../lib/data'
import { buatCsv, parseCsv, unduhTeks } from '../lib/csv'
import { CONTOH_TEMPLAT, KOLOM_TEMPLAT, bacaBaris, normTeks, type BarisImpor } from '../lib/impor'
import { bersihkan } from '../lib/katalog'
import { kodeEksemplar, pesanNomor } from '../lib/penomoran'
import { useKoleksi } from '../lib/useKoleksi'
import type { Buku, Kategori } from '../lib/tipe'
import { Badge, Notice, PageHeader, StatStrip, btnGhost, btnPrimary } from '../components/ui'

const OPS_PER_BATCH = 450

interface Ringkas {
  judul: number
  eksemplar: number
  awal: number
}

export default function Impor() {
  const { profil } = useAuth()
  const katalog = useKoleksi<Buku>('perpus_buku')
  const kategori = useKoleksi<Kategori>('perpus_kategori')
  const [baris, setBaris] = useState<BarisImpor[] | null>(null)
  const [nama, setNama] = useState('')
  const [galat, setGalat] = useState('')
  const [lewati, setLewati] = useState(true)
  const [proses, setProses] = useState<{ selesai: number; total: number } | null>(null)
  const [hasil, setHasil] = useState<Ringkas | null>(null)

  const siap = useMemo(() => (baris ?? []).filter((b) => b.galat.length === 0 && !(lewati && b.duplikat)), [baris, lewati])
  const jumlahGalat = (baris ?? []).filter((b) => b.galat.length > 0).length
  const jumlahDuplikat = (baris ?? []).filter((b) => b.galat.length === 0 && b.duplikat).length
  const totalEks = siap.reduce((n, b) => n + b.jumlah, 0)

  function unduhTemplat() {
    unduhTeks('templat-impor-buku.csv', buatCsv([KOLOM_TEMPLAT, ...CONTOH_TEMPLAT]))
  }

  async function pilihBerkas(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setGalat('')
    setHasil(null)
    setBaris(null)
    if (file.size > 5_000_000) return setGalat('Berkas terlalu besar (maksimal 5 MB).')
    try {
      const tabel = parseCsv(await file.text())
      const baca = bacaBaris(tabel, katalog.data)
      if (baca.galatUmum) return setGalat(baca.galatUmum)
      if (baca.baris.length > 3000) return setGalat('Maksimal 3000 baris sekali impor. Pecah berkasnya.')
      setNama(file.name)
      setBaris(baca.baris)
    } catch {
      setGalat('Berkas tidak dapat dibaca. Simpan dari Excel sebagai "CSV UTF-8" lalu coba lagi.')
    }
  }

  async function jalankan() {
    if (siap.length === 0) return
    setGalat('')
    setHasil(null)
    setProses({ selesai: 0, total: siap.length })
    let selesai = 0
    try {
      // 1. Kategori baru (dari kolom "kategori" yang belum ada).
      const peta = new Map(kategori.data.map((k) => [normTeks(k.nama), k.id]))
      const baru = new Map<string, string>()
      for (const b of siap) {
        const kunci = normTeks(b.kategoriNama)
        if (kunci && !peta.has(kunci) && !baru.has(kunci)) baru.set(kunci, b.kategoriNama!.trim())
      }
      if (baru.size > 0) {
        const batch = writeBatch(db)
        for (const [kunci, namaAsli] of baru) {
          const ref = doc(collection(db, 'perpus_kategori'))
          batch.set(ref, { nama: namaAsli, kode: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
          peta.set(kunci, ref.id)
        }
        await batch.commit()
      }

      // 2. Pesan nomor kode eksemplar sekaligus.
      const awal = totalEks > 0 ? await pesanNomor(totalEks) : 0
      let nomor = awal

      // 3. Tulis per batch (buku + eksemplarnya tidak dipecah antar batch).
      let batch = writeBatch(db)
      let ops = 0
      let dalamBatch = 0
      const kirim = async () => {
        if (ops === 0) return
        await batch.commit()
        selesai += dalamBatch
        setProses({ selesai, total: siap.length })
        batch = writeBatch(db)
        ops = 0
        dalamBatch = 0
      }
      for (const b of siap) {
        if (ops + 1 + b.jumlah > OPS_PER_BATCH) await kirim()
        const bukuRef = doc(collection(db, 'perpus_buku'))
        const kat = normTeks(b.kategoriNama)
        batch.set(bukuRef, {
          ...bersihkan({ ...b.buku, kategoriId: kat ? peta.get(kat) : undefined }),
          eksemplarTotal: b.jumlah,
          eksemplarTersedia: b.jumlah,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        ops++
        for (let i = 0; i < b.jumlah; i++) {
          batch.set(doc(db, 'perpus_eksemplar', kodeEksemplar(nomor++)), {
            ...bersihkan({ rak: b.rak, tahunMasuk: b.tahunMasuk, sumber: b.sumber }),
            bukuId: bukuRef.id,
            judul: b.buku.judul,
            kondisi: 'baik',
            status: 'tersedia',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
          ops++
        }
        dalamBatch++
      }
      await kirim()
      void catat(profil, `impor ${siap.length} judul`, 'perpus_buku', nama)
      setHasil({ judul: siap.length, eksemplar: totalEks, awal })
      setBaris(null)
    } catch (e) {
      const kode = (e as { code?: string })?.code
      setGalat(
        `${kode === 'permission-denied' ? 'Tidak ada izin menulis.' : 'Impor terhenti karena gangguan.'} ${selesai} judul sudah masuk. ` +
          'Pilih berkas yang sama lagi: judul yang sudah masuk akan dilewati sebagai duplikat.',
      )
    }
    setProses(null)
  }

  return (
    <div className="w-full">
      <PageHeader judul="Impor buku" keterangan="Masukkan banyak buku sekaligus dari berkas CSV (bisa disimpan dari Excel)." />

      {galat && (
        <div className="mb-4">
          <Notice tipe="error">{galat}</Notice>
        </div>
      )}

      {hasil && (
        <div className="mb-4 space-y-3">
          <Notice>
            Impor selesai: {hasil.judul} judul{hasil.eksemplar > 0 ? ` dan ${hasil.eksemplar} eksemplar` : ''} masuk ke katalog.
          </Notice>
          <div className="flex flex-wrap gap-3">
            <Link to="/katalog" className={btnPrimary}>
              Lihat katalog
            </Link>
            {hasil.eksemplar > 0 && (
              <Link to={`/label?dari=${hasil.awal}&sampai=${hasil.awal + hasil.eksemplar - 1}`} className={btnGhost}>
                Cetak label eksemplar baru
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="card-soft mb-4 space-y-3 p-4 text-sm">
        <ol className="list-decimal space-y-1 pl-5 text-[#2b2f4a]">
          <li>Unduh templat, isi di Excel (satu buku per baris), lalu simpan sebagai <b>CSV UTF-8</b>.</li>
          <li>Pilih berkasnya di bawah. Baris akan diperiksa dulu; belum ada yang disimpan.</li>
          <li>Periksa ringkasan, lalu tekan Impor. Kode label dibuat otomatis (PRP-000123).</li>
        </ol>
        <div className="flex flex-wrap items-center gap-3">
          <button className={btnGhost} onClick={unduhTemplat}>
            Unduh templat
          </button>
          <input type="file" accept=".csv,text/csv,.txt" onChange={(e) => void pilihBerkas(e)} disabled={proses !== null || katalog.loading} className="text-sm" />
        </div>
        <div className="text-xs text-muted">
          Kolom wajib: <b>judul</b>. Kolom lain boleh kosong. Kategori yang belum ada dibuat otomatis. Jenis: cetak, digital, atau keduanya.
          Berkas digital memerlukan tautan_digital berawalan https://.
        </div>
      </div>

      {baris && (
        <>
          <StatStrip
            items={[
              { label: 'Baris dibaca', nilai: baris.length },
              { label: 'Siap diimpor', nilai: siap.length },
              { label: 'Duplikat', nilai: jumlahDuplikat },
              { label: 'Bermasalah', nilai: jumlahGalat },
            ]}
          />
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={lewati} onChange={(e) => setLewati(e.target.checked)} />
              Lewati duplikat
            </label>
            <button className={btnPrimary} disabled={proses !== null || siap.length === 0} onClick={() => void jalankan()}>
              {proses ? `Mengimpor… ${proses.selesai}/${proses.total}` : `Impor ${siap.length} judul (${totalEks} eksemplar)`}
            </button>
          </div>
          <div className="mb-2 text-xs text-muted">{nama} — menampilkan 100 baris pertama</div>
          <div className="card-soft overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs text-muted">
                <tr>
                  <th className="px-3 py-2">Baris</th>
                  <th className="px-3 py-2">Judul</th>
                  <th className="px-3 py-2">Jenis</th>
                  <th className="px-3 py-2">Eks.</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {baris.slice(0, 100).map((b) => (
                  <tr key={b.no}>
                    <td className="px-3 py-2 text-muted">{b.no}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{b.buku.judul || '—'}</div>
                      <div className="text-xs text-muted">{[b.buku.pengarang, b.kategoriNama].filter(Boolean).join(' · ')}</div>
                    </td>
                    <td className="px-3 py-2">{b.buku.jenis}</td>
                    <td className="tabular px-3 py-2">{b.jumlah}</td>
                    <td className="px-3 py-2">
                      {b.galat.length > 0 ? (
                        <span className="text-red-700">{b.galat.join('; ')}</span>
                      ) : b.duplikat ? (
                        <Badge>Duplikat: {b.duplikat}</Badge>
                      ) : (
                        <span className="text-muh-700">Siap</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
