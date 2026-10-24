import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useSiswa } from '../../context/SiswaContext'
import {
  buatJurnal,
  daftarJurnalSiswa,
  formatTanggalJurnal,
  tanggalHariIni,
} from '../../lib/jurnal'
import type { JurnalBaca } from '../../lib/tipe'
import { Badge, Field, Notice, PageHeader, btnPrimary, inputCls } from '../../components/ui'

/** Jurnal baca siswa: catat judul + kesan; lihat tanggapan guru. */
export default function SiswaJurnal() {
  const { sesi } = useSiswa()
  const [list, setList] = useState<JurnalBaca[]>([])
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState('')
  const [ok, setOk] = useState('')
  const [judul, setJudul] = useState('')
  const [pengarang, setPengarang] = useState('')
  const [catatan, setCatatan] = useState('')
  const [tanggalBaca, setTanggalBaca] = useState(tanggalHariIni())
  const [proses, setProses] = useState(false)
  const [formBuka, setFormBuka] = useState(false)

  const muat = useCallback(async () => {
    if (!sesi?.nisn) return
    setLoading(true)
    setGalat('')
    try {
      setList(await daftarJurnalSiswa(sesi.nisn))
    } catch (e) {
      const kode = (e as { code?: string })?.code
      setGalat(
        kode === 'permission-denied'
          ? 'Belum bisa memuat jurnal. Admin perlu menambahkan aturan perpus_jurnal (lihat docs/RULES_SISWA_LOGIN.md).'
          : kode === 'failed-precondition'
            ? 'Indeks Firestore belum siap. Tunggu beberapa menit atau buat indeks dari tautan di konsol browser.'
            : 'Gagal memuat jurnal.',
      )
      setList([])
    }
    setLoading(false)
  }, [sesi?.nisn])

  useEffect(() => {
    void muat()
  }, [muat])

  if (!sesi) return null

  async function kirim(e: FormEvent) {
    e.preventDefault()
    setProses(true)
    setGalat('')
    setOk('')
    try {
      await buatJurnal({
        siswaId: sesi.nisn,
        siswaNama: sesi.nama,
        kelas: sesi.kelas,
        judul,
        pengarang,
        catatan,
        tanggalBaca,
      })
      setOk('Jurnal tersimpan.')
      setJudul('')
      setPengarang('')
      setCatatan('')
      setTanggalBaca(tanggalHariIni())
      setFormBuka(false)
      await muat()
    } catch (err) {
      const kode = (err as { code?: string })?.code
      setGalat(
        kode === 'permission-denied'
          ? 'Belum diizinkan menulis jurnal. Periksa aturan Firestore perpus_jurnal.'
          : err instanceof Error
            ? err.message
            : 'Gagal menyimpan.',
      )
    }
    setProses(false)
  }

  return (
    <div>
      <PageHeader
        judul="Jurnal baca"
        keterangan="Catat buku yang sudah dibaca dan kesan singkat. Guru dapat memberi tanggapan."
        aksi={
          <button type="button" className={btnPrimary} onClick={() => setFormBuka((v) => !v)}>
            {formBuka ? 'Tutup form' : 'Tulis jurnal'}
          </button>
        }
      />

      {galat && (
        <div className="mb-4">
          <Notice tipe="error">{galat}</Notice>
        </div>
      )}
      {ok && (
        <div className="mb-4">
          <Notice>{ok}</Notice>
        </div>
      )}

      {formBuka && (
        <form onSubmit={kirim} className="card-soft mb-4 space-y-3 p-4">
          <Field label="Judul buku">
            <input
              className={inputCls}
              required
              maxLength={300}
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Judul yang dibaca"
            />
          </Field>
          <Field label="Pengarang" hint="Opsional">
            <input
              className={inputCls}
              maxLength={120}
              value={pengarang}
              onChange={(e) => setPengarang(e.target.value)}
            />
          </Field>
          <Field label="Tanggal baca">
            <input
              className={inputCls}
              type="date"
              required
              value={tanggalBaca}
              onChange={(e) => setTanggalBaca(e.target.value)}
            />
          </Field>
          <Field label="Kesan / ringkasan" hint="Maksimal 2000 karakter">
            <textarea
              className={`${inputCls} min-h-[100px]`}
              required
              maxLength={2000}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Apa yang kamu pelajari atau sukai dari buku ini?"
            />
          </Field>
          <button type="submit" className={btnPrimary} disabled={proses}>
            {proses ? 'Menyimpan…' : 'Simpan jurnal'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-muted">Memuat…</div>
      ) : list.length === 0 ? (
        <Notice>Belum ada jurnal. Tekan “Tulis jurnal” setelah selesai membaca sebuah buku.</Notice>
      ) : (
        <ul className="space-y-3">
          {list.map((j) => (
            <li key={j.id} className="card-soft p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-[#1a1d33]">{j.judul}</div>
                  {j.pengarang && <div className="text-sm text-muted">{j.pengarang}</div>}
                </div>
                <div className="text-xs text-muted">{formatTanggalJurnal(j.tanggalBaca)}</div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[#2b2f4a]">{j.catatan}</p>
              {j.tanggapanGuru ? (
                <div className="mt-3 rounded-lg border border-muh-100 bg-muh-50/50 px-3 py-2">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge>Tanggapan guru</Badge>
                    {j.guruNama && <span className="text-xs text-muted">{j.guruNama}</span>}
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-[#2b2f4a]">{j.tanggapanGuru}</p>
                </div>
              ) : (
                <div className="mt-2 text-xs text-muted">Belum ada tanggapan guru.</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
