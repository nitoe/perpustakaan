import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { bisaDibacaPublik } from '../../lib/katalog'
import type { Buku, FormatDigital } from '../../lib/tipe'
import { Badge, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../../components/ui'
import Sampul from '../../components/Sampul'
import { useSiswa } from '../../context/SiswaContext'

const HALAMAN = 24

const NAMA_FORMAT: Record<FormatDigital, string> = {
  pdf: 'PDF',
  video: 'Video',
  audio: 'Audio',
  web: 'Halaman web',
}

/** Rak baca untuk siswa yang sudah login (koleksi publik yang boleh dibaca). */
export default function SiswaRakBaca() {
  const { sesi } = useSiswa()
  const [data, setData] = useState<Buku[]>([])
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState('')
  const [cari, setCari] = useState('')
  const [format, setFormat] = useState('')
  const [jenjang, setJenjang] = useState('')
  const [tampil, setTampil] = useState(HALAMAN)

  useEffect(() => {
    const q = query(collection(db, 'perpus_buku'), where('publik', '==', true))
    return onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as Buku))
        setGalat('')
        setLoading(false)
      },
      (e) => {
        setGalat(
          e.code === 'permission-denied'
            ? 'Rak baca belum tersedia. Hubungi petugas perpustakaan.'
            : 'Gagal memuat rak baca.',
        )
        setLoading(false)
      },
    )
  }, [])

  const siap = useMemo(() => data.filter((b) => bisaDibacaPublik(b)), [data])

  const daftarJenjang = useMemo(() => {
    const s = new Set<string>()
    for (const b of siap) if (b.jenjangBaca) s.add(b.jenjangBaca)
    return [...s].sort((a, b) => a.localeCompare(b, 'id'))
  }, [siap])

  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return siap
      .filter((b) => {
        if (format && b.formatDigital !== format) return false
        if (jenjang && b.jenjangBaca !== jenjang) return false
        if (!q) return true
        return [b.judul, b.pengarang, b.jenjangBaca].some((x) => x?.toLowerCase().includes(q))
      })
      .sort((a, b) => a.judul.localeCompare(b.judul, 'id'))
  }, [siap, cari, format, jenjang])

  const reset = (p: { cari?: string; format?: string; jenjang?: string }) => {
    if (p.cari !== undefined) setCari(p.cari)
    if (p.format !== undefined) setFormat(p.format)
    if (p.jenjang !== undefined) setJenjang(p.jenjang)
    setTampil(HALAMAN)
  }

  return (
    <div>
      <PageHeader
        judul="Rak baca"
        keterangan={
          sesi
            ? `Halo ${sesi.nama}. Bacaan digital yang ditandai publik. Buku terbuka di tab baru.`
            : 'Bacaan digital sekolah.'
        }
      />

      {galat && (
        <div className="mb-4">
          <Notice tipe="error">{galat}</Notice>
        </div>
      )}

      <div className="card-soft mb-4 grid gap-3 p-4 sm:grid-cols-2">
        <input
          className={`${inputCls} sm:col-span-2`}
          placeholder="Cari judul atau pengarang…"
          value={cari}
          onChange={(e) => reset({ cari: e.target.value })}
          aria-label="Cari bacaan"
        />
        <select className={inputCls} value={format} onChange={(e) => reset({ format: e.target.value })} aria-label="Format">
          <option value="">Semua format</option>
          {(Object.keys(NAMA_FORMAT) as FormatDigital[]).map((k) => (
            <option key={k} value={k}>
              {NAMA_FORMAT[k]}
            </option>
          ))}
        </select>
        <select className={inputCls} value={jenjang} onChange={(e) => reset({ jenjang: e.target.value })} aria-label="Jenjang">
          <option value="">Semua jenjang</option>
          {daftarJenjang.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-muted">Memuat…</div>
      ) : siap.length === 0 ? (
        <Notice>
          Belum ada bacaan digital yang boleh dibuka. Petugas perlu menandai buku digital sebagai publik dan mengisi
          tautan http/https.
        </Notice>
      ) : hasil.length === 0 ? (
        <Notice>Tidak ada bacaan yang cocok.</Notice>
      ) : (
        <>
          <div className="mb-2 text-xs text-muted">{hasil.length} bacaan</div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {hasil.slice(0, tampil).map((b) => (
              <KartuBaca key={b.id} buku={b} />
            ))}
          </ul>
          {hasil.length > tampil && (
            <div className="mt-4 text-center">
              <button type="button" className={btnGhost} onClick={() => setTampil((n) => n + HALAMAN)}>
                Tampilkan lebih banyak
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function KartuBaca({ buku: b }: { buku: Buku }) {
  const url = bisaDibacaPublik(b)
  const format = b.formatDigital ? NAMA_FORMAT[b.formatDigital] : null
  if (!url) return null

  return (
    <li className="card-soft flex gap-3 p-3">
      <Sampul id={b.coverId} className="h-24 w-16 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="font-medium text-[#1a1d33]">{b.judul}</div>
        <div className="mt-0.5 truncate text-sm text-muted">{b.pengarang || '—'}</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {format && <Badge>{format}</Badge>}
          {b.jenjangBaca && <Badge>{b.jenjangBaca}</Badge>}
        </div>
        <div className="mt-2.5">
          <a href={url} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
            Baca
          </a>
        </div>
      </div>
    </li>
  )
}
