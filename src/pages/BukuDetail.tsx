import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import { catat } from '../lib/data'
import { bisaKelola } from '../lib/peran'
import {
  MAKS_EKSEMPLAR_SEKALI,
  hapusBuku,
  tambahEksemplar,
  tautanAman,
  ubahDataEksemplar,
  ubahStatusEksemplar,
} from '../lib/katalog'
import { useKoleksi } from '../lib/useKoleksi'
import type { Buku, Eksemplar, KondisiBuku, Kategori, StatusEksemplar } from '../lib/tipe'
import { Badge, Field, Modal, Notice, PageHeader, btnDanger, btnGhost, btnPrimary, inputCls } from '../components/ui'
import Sampul from '../components/Sampul'

const NAMA_KONDISI: Record<KondisiBuku, string> = { baik: 'Baik', rusak_ringan: 'Rusak ringan', rusak_berat: 'Rusak berat' }
const NAMA_STATUS: Record<StatusEksemplar, string> = {
  tersedia: 'Tersedia',
  dipinjam: 'Dipinjam',
  hilang: 'Hilang',
  dihapus: 'Dikeluarkan',
}
const NAMA_FORMAT: Record<string, string> = { pdf: 'PDF', web: 'halaman web', video: 'video', audio: 'audio' }

export default function BukuDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const { peran, profil } = useAuth()
  const nav = useNavigate()
  const kelola = bisaKelola(peran)
  const buku = useKoleksi<Buku>('perpus_buku')
  const kategori = useKoleksi<Kategori>('perpus_kategori')
  const [eks, setEks] = useState<Eksemplar[]>([])
  const [eksGalat, setEksGalat] = useState('')
  const [semua, setSemua] = useState(false)
  const [modal, setModal] = useState<'tambah' | { ubah: Eksemplar } | null>(null)
  const [pesan, setPesan] = useState('')

  useEffect(() => {
    if (!id) return
    return onSnapshot(
      query(collection(db, 'perpus_eksemplar'), where('bukuId', '==', id)),
      (snap) => {
        setEks(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as Eksemplar))
        setEksGalat('')
      },
      () => setEksGalat('Gagal memuat eksemplar.'),
    )
  }, [id])

  const b = buku.data.find((x) => x.id === id)
  const namaKat = useMemo(() => kategori.data.find((k) => k.id === b?.kategoriId)?.nama, [kategori.data, b])
  const daftar = useMemo(
    () => eks.filter((e) => semua || e.status !== 'dihapus').sort((a, c) => a.id.localeCompare(c.id)),
    [eks, semua],
  )

  if (buku.loading) return <div className="text-sm text-muted">Memuat…</div>
  if (!b) {
    return (
      <div className="w-full space-y-3">
        <Notice tipe="warn">Buku tidak ditemukan.</Notice>
        <Link to="/katalog" className={btnGhost}>
          Kembali ke katalog
        </Link>
      </div>
    )
  }
  const bacaan = tautanAman(b.tautanDigital)

  async function ubahStatus(e: Eksemplar, baru: StatusEksemplar, konfirmasi: string) {
    if (!window.confirm(konfirmasi)) return
    setPesan('')
    try {
      await ubahStatusEksemplar(e, baru)
      void catat(profil, `eksemplar ${baru}`, 'perpus_eksemplar', e.id)
    } catch (err) {
      setPesan(err instanceof Error ? err.message : 'Gagal mengubah status.')
    }
  }

  async function hapus() {
    if (!window.confirm(`Hapus buku "${b!.judul}" dari katalog? Tindakan ini tidak bisa dibatalkan.`)) return
    try {
      await hapusBuku(b!.id)
      void catat(profil, 'hapus buku', 'perpus_buku', b!.id)
      nav('/katalog', { replace: true })
    } catch (err) {
      setPesan(err instanceof Error ? err.message : 'Gagal menghapus.')
    }
  }

  return (
    <div className="w-full">
      <PageHeader
        judul={b.judul}
        keterangan={[b.pengarang, b.penerbit, b.tahun].filter(Boolean).join(' · ')}
        aksi={
          kelola && (
            <div className="flex gap-2">
              <Link to={`/katalog/${b.id}/ubah`} className={btnGhost}>
                Ubah
              </Link>
              {peran === 'admin' && (
                <button className={btnDanger} onClick={() => void hapus()}>
                  Hapus
                </button>
              )}
            </div>
          )
        }
      />

      {pesan && (
        <div className="mb-4">
          <Notice tipe="error">{pesan}</Notice>
        </div>
      )}

      <div className="card-soft mb-4 flex flex-col gap-4 p-4 sm:flex-row">
        <Sampul id={b.coverId} className="h-48 w-auto shrink-0 self-start" />
        <div className="min-w-0 flex-1 space-y-3 text-sm">
          <div className="flex flex-wrap gap-1.5">
            {namaKat && <Badge>{namaKat}</Badge>}
            <Badge>{b.jenis === 'cetak' ? 'Buku cetak' : b.jenis === 'digital' ? 'Digital' : 'Cetak + digital'}</Badge>
            {b.jenjangBaca && <Badge>{b.jenjangBaca}</Badge>}
          </div>
          {b.sinopsis && <p className="whitespace-pre-line text-[#2b2f4a]">{b.sinopsis}</p>}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {b.isbn && (
              <>
                <dt className="text-muted">ISBN</dt>
                <dd>{b.isbn}</dd>
              </>
            )}
            {b.klasifikasi && (
              <>
                <dt className="text-muted">Klasifikasi</dt>
                <dd>{b.klasifikasi}</dd>
              </>
            )}
            {b.bahasa && (
              <>
                <dt className="text-muted">Bahasa</dt>
                <dd>{b.bahasa}</dd>
              </>
            )}
          </dl>
          {b.jenis !== 'cetak' &&
            (bacaan ? (
              <a href={bacaan} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
                Buka bacaan ({NAMA_FORMAT[b.formatDigital ?? 'web'] ?? 'tautan'})
              </a>
            ) : (
              <Notice tipe="warn">Tautan bacaan digital belum valid.</Notice>
            ))}
        </div>
      </div>

      {b.jenis !== 'digital' && (
        <div className="card-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div>
              <div className="font-semibold">Eksemplar</div>
              <div className="tabular text-sm text-muted">
                {b.eksemplarTersedia ?? 0} tersedia dari {b.eksemplarTotal ?? 0}
              </div>
            </div>
            {kelola && (
              <div className="flex gap-2">
                <Link to={`/label?buku=${b.id}`} className={btnGhost}>
                  Cetak label
                </Link>
                <button className={btnPrimary} onClick={() => setModal('tambah')}>
                  Tambah eksemplar
                </button>
              </div>
            )}
          </div>
          {eksGalat && (
            <div className="p-4">
              <Notice tipe="error">{eksGalat}</Notice>
            </div>
          )}
          {daftar.length === 0 ? (
            <div className="p-4 text-sm text-muted">Belum ada eksemplar.</div>
          ) : (
            <ul className="divide-y divide-border">
              {daftar.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <span className="font-mono font-semibold">{e.id}</span>
                    <span className="ml-3 text-muted">
                      {[e.rak && `Rak ${e.rak}`, NAMA_KONDISI[e.kondisi], e.tahunMasuk, e.sumber].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{NAMA_STATUS[e.status]}</Badge>
                    {kelola && e.status !== 'dihapus' && e.status !== 'dipinjam' && (
                      <>
                        <button className="text-xs font-medium text-muh-600 hover:underline" onClick={() => setModal({ ubah: e })}>
                          Ubah
                        </button>
                        {e.status === 'tersedia' ? (
                          <button
                            className="text-xs font-medium text-muh-600 hover:underline"
                            onClick={() => void ubahStatus(e, 'hilang', `Tandai ${e.id} sebagai hilang?`)}
                          >
                            Tandai hilang
                          </button>
                        ) : (
                          <button
                            className="text-xs font-medium text-muh-600 hover:underline"
                            onClick={() => void ubahStatus(e, 'tersedia', `${e.id} ditemukan dan tersedia kembali?`)}
                          >
                            Ditemukan
                          </button>
                        )}
                        <button
                          className="text-xs font-medium text-red-700 hover:underline"
                          onClick={() => void ubahStatus(e, 'dihapus', `Keluarkan ${e.id} dari koleksi? Riwayatnya tetap tersimpan.`)}
                        >
                          Keluarkan
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {eks.some((e) => e.status === 'dihapus') && (
            <label className="flex items-center gap-2 border-t border-border px-4 py-3 text-xs text-muted">
              <input type="checkbox" checked={semua} onChange={(e) => setSemua(e.target.checked)} />
              Tampilkan eksemplar yang sudah dikeluarkan
            </label>
          )}
        </div>
      )}

      {modal === 'tambah' && <ModalTambah buku={b} onTutup={() => setModal(null)} />}
      {modal && modal !== 'tambah' && <ModalUbah eks={modal.ubah} onTutup={() => setModal(null)} />}
    </div>
  )
}

function ModalTambah({ buku, onTutup }: { buku: Buku; onTutup: () => void }) {
  const { profil } = useAuth()
  const [jumlah, setJumlah] = useState('1')
  const [rak, setRak] = useState('')
  const [kondisi, setKondisi] = useState<KondisiBuku>('baik')
  const [tahun, setTahun] = useState(String(new Date().getFullYear()))
  const [sumber, setSumber] = useState('')
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)

  async function simpan() {
    const n = Number(jumlah)
    if (!Number.isInteger(n) || n < 1 || n > MAKS_EKSEMPLAR_SEKALI) return setGalat(`Jumlah 1 sampai ${MAKS_EKSEMPLAR_SEKALI}.`)
    const th = tahun.trim() ? Number(tahun) : undefined
    if (th !== undefined && (!Number.isInteger(th) || th < 1900 || th > 2100)) return setGalat('Tahun masuk tidak valid.')
    setProses(true)
    try {
      await tambahEksemplar(buku, { jumlah: n, rak: rak.trim() || undefined, kondisi, tahunMasuk: th, sumber: sumber.trim() || undefined })
      void catat(profil, `tambah ${n} eksemplar`, 'perpus_buku', buku.id)
      onTutup()
    } catch (e) {
      setGalat(e instanceof Error && e.message.startsWith('Jumlah') ? e.message : 'Gagal menambah eksemplar.')
      setProses(false)
    }
  }

  return (
    <Modal judul="Tambah eksemplar" onTutup={onTutup}>
      <div className="space-y-4">
        {galat && <Notice tipe="error">{galat}</Notice>}
        <Field label="Jumlah" hint="Kode label dibuat otomatis dan berurutan.">
          <input className={inputCls} inputMode="numeric" value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
        </Field>
        <Field label="Rak / lokasi">
          <input className={inputCls} value={rak} onChange={(e) => setRak(e.target.value)} />
        </Field>
        <Field label="Kondisi">
          <select className={inputCls} value={kondisi} onChange={(e) => setKondisi(e.target.value as KondisiBuku)}>
            {Object.entries(NAMA_KONDISI).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tahun masuk">
            <input className={inputCls} inputMode="numeric" value={tahun} onChange={(e) => setTahun(e.target.value)} />
          </Field>
          <Field label="Sumber">
            <input className={inputCls} value={sumber} onChange={(e) => setSumber(e.target.value)} />
          </Field>
        </div>
        <div className="flex gap-3">
          <button className={btnPrimary} disabled={proses} onClick={() => void simpan()}>
            {proses ? 'Menyimpan…' : 'Simpan'}
          </button>
          <button className={btnGhost} onClick={onTutup}>
            Batal
          </button>
        </div>
      </div>
    </Modal>
  )
}

function ModalUbah({ eks, onTutup }: { eks: Eksemplar; onTutup: () => void }) {
  const { profil } = useAuth()
  const [rak, setRak] = useState(eks.rak ?? '')
  const [kondisi, setKondisi] = useState<KondisiBuku>(eks.kondisi)
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)

  async function simpan() {
    setProses(true)
    try {
      await ubahDataEksemplar(eks.id, { rak: rak.trim(), kondisi })
      void catat(profil, 'ubah eksemplar', 'perpus_eksemplar', eks.id)
      onTutup()
    } catch {
      setGalat('Gagal menyimpan.')
      setProses(false)
    }
  }

  return (
    <Modal judul={`Ubah ${eks.id}`} onTutup={onTutup}>
      <div className="space-y-4">
        {galat && <Notice tipe="error">{galat}</Notice>}
        <Field label="Rak / lokasi">
          <input className={inputCls} value={rak} onChange={(e) => setRak(e.target.value)} />
        </Field>
        <Field label="Kondisi">
          <select className={inputCls} value={kondisi} onChange={(e) => setKondisi(e.target.value as KondisiBuku)}>
            {Object.entries(NAMA_KONDISI).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex gap-3">
          <button className={btnPrimary} disabled={proses} onClick={() => void simpan()}>
            {proses ? 'Menyimpan…' : 'Simpan'}
          </button>
          <button className={btnGhost} onClick={onTutup}>
            Batal
          </button>
        </div>
      </div>
    </Modal>
  )
}
