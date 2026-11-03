import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { bisaDibacaPublik } from '../../lib/katalog'
import type { Buku, FormatDigital } from '../../lib/tipe'
import { Notice, inputCls } from '../../components/ui'
import Sampul from '../../components/Sampul'
import { useSiswa } from '../../context/SiswaContext'

const NAMA_FORMAT: Record<FormatDigital, string> = {
  pdf: 'PDF',
  video: 'Video',
  audio: 'Audio',
  web: 'Halaman web',
}

/** Rak baca untuk siswa — tampilan visual (carousel sampul) terinspirasi Let's Read. */
export default function SiswaRakBaca() {
  const { sesi } = useSiswa()
  const [data, setData] = useState<Buku[]>([])
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState('')
  const [cari, setCari] = useState('')
  const [format, setFormat] = useState('')
  const [jenjang, setJenjang] = useState('')

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

  // Kelompokkan untuk tampilan carousel (bila tidak sedang mencari)
  const kelompok = useMemo(() => {
    if (cari.trim() || format || jenjang) return null
    const map = new Map<string, Buku[]>()
    for (const b of siap) {
      const k = b.jenjangBaca || 'Lainnya'
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(b)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'id'))
  }, [siap, cari, format, jenjang])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-muh-800 sm:text-3xl">Rak Baca</h1>
        <p className="mt-1 text-sm text-muted">
          {sesi?.preview
            ? 'Mode pratinjau · Bacaan digital sekolah'
            : sesi
              ? `Halo ${sesi.nama.split(' ')[0]}. Pilih cerita yang ingin kamu baca.`
              : 'Bacaan digital sekolah.'}
        </p>
      </div>

      {galat && <Notice tipe="error">{galat}</Notice>}

      {/* Filter ringkas */}
      <div className="card-soft grid gap-3 p-4 sm:grid-cols-3">
        <input
          className={inputCls}
          placeholder="Cari judul atau pengarang…"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          aria-label="Cari bacaan"
        />
        <select
          className={inputCls}
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          aria-label="Format"
        >
          <option value="">Semua format</option>
          {(Object.keys(NAMA_FORMAT) as FormatDigital[]).map((k) => (
            <option key={k} value={k}>
              {NAMA_FORMAT[k]}
            </option>
          ))}
        </select>
        <select
          className={inputCls}
          value={jenjang}
          onChange={(e) => setJenjang(e.target.value)}
          aria-label="Jenjang"
        >
          <option value="">Semua jenjang</option>
          {daftarJenjang.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-muted">Memuat rak baca…</div>
      ) : siap.length === 0 ? (
        <Notice>
          Belum ada bacaan digital yang boleh dibuka. Petugas perlu menandai buku digital sebagai publik dan mengisi
          tautan http/https.
        </Notice>
      ) : hasil.length === 0 ? (
        <Notice>Tidak ada bacaan yang cocok dengan pencarian.</Notice>
      ) : kelompok ? (
        // Tampilan carousel per jenjang
        <div className="space-y-8">
          {kelompok.map(([nama, daftar]) => (
            <section key={nama}>
              <h2 className="mb-3 text-lg font-semibold text-muh-800">{nama}</h2>
              <CarouselBuku daftar={daftar} />
            </section>
          ))}
        </div>
      ) : (
        // Hasil pencarian / filter
        <div>
          <div className="mb-3 text-sm text-muted">{hasil.length} bacaan ditemukan</div>
          <CarouselBuku daftar={hasil} />
        </div>
      )}
    </div>
  )
}

function CarouselBuku({ daftar }: { daftar: Buku[] }) {
  return (
    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
      {daftar.map((b) => (
        <KartuSampul key={b.id} buku={b} />
      ))}
    </div>
  )
}

function KartuSampul({ buku: b }: { buku: Buku }) {
  if (!bisaDibacaPublik(b)) return null

  return (
    <Link
      to={`/siswa/baca/${b.id}`}
      className="group w-36 shrink-0 sm:w-40"
      title={b.judul}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muh-50 shadow-sm transition group-hover:shadow-md">
        <Sampul id={b.coverId} className="h-full w-full object-cover" />
        {!b.coverId && (
          <div className="absolute inset-0 flex items-center justify-center p-2 text-center text-xs font-medium text-muh-700">
            {b.judul}
          </div>
        )}
      </div>
      <div className="mt-2 line-clamp-2 text-sm font-medium text-[#1a1d33] group-hover:text-muh-600">
        {b.judul}
      </div>
      {b.pengarang && (
        <div className="mt-0.5 truncate text-xs text-muted">{b.pengarang}</div>
      )}
    </Link>
  )
}
