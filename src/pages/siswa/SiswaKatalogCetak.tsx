import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Buku, Kategori } from '../../lib/tipe'
import { Notice, btnGhost, btnPrimary, inputCls } from '../../components/ui'
import Sampul from '../../components/Sampul'
import { useSiswa } from '../../context/SiswaContext'

const PER_HALAMAN = 50

/** Katalog buku cetak — siswa melihat koleksi yang bisa dipinjam di perpustakaan. */
export default function SiswaKatalogCetak() {
  const { sesi } = useSiswa()
  const [data, setData] = useState<Buku[]>([])
  const [kategori, setKategori] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState('')
  const [cari, setCari] = useState('')
  const [katId, setKatId] = useState('')
  const [hanyaTersedia, setHanyaTersedia] = useState(false)
  const [halaman, setHalaman] = useState(1)

  useEffect(() => {
    const q = query(collection(db, 'perpus_buku'), where('jenis', 'in', ['cetak', 'keduanya']))
    return onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as Buku))
        setGalat('')
        setLoading(false)
      },
      () => {
        setGalat(
          'Belum bisa memuat katalog cetak. Admin perlu memperbarui aturan Firestore (baca buku jenis cetak untuk siswa).',
        )
        setLoading(false)
      },
    )
  }, [])

  useEffect(() => {
    return onSnapshot(
      collection(db, 'perpus_kategori'),
      (snap) => setKategori(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as Kategori)),
      () => setKategori([]),
    )
  }, [])

  const namaKat = useMemo(() => new Map(kategori.map((k) => [k.id, k.nama])), [kategori])

  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return data
      .filter((b) => {
        if (katId && b.kategoriId !== katId) return false
        if (hanyaTersedia && (b.eksemplarTersedia ?? 0) < 1) return false
        if (!q) return true
        return [b.judul, b.pengarang, b.penerbit, b.isbn, b.klasifikasi, b.jenjangBaca].some((x) =>
          x?.toLowerCase().includes(q),
        )
      })
      .sort((a, b) => a.judul.localeCompare(b.judul, 'id'))
  }, [data, cari, katId, hanyaTersedia])

  const totalHalaman = Math.max(1, Math.ceil(hasil.length / PER_HALAMAN))
  const halamanAman = Math.min(halaman, totalHalaman)
  const potongan = useMemo(() => {
    const mulai = (halamanAman - 1) * PER_HALAMAN
    return hasil.slice(mulai, mulai + PER_HALAMAN)
  }, [hasil, halamanAman])

  useEffect(() => {
    setHalaman(1)
  }, [cari, katId, hanyaTersedia])

  useEffect(() => {
    if (halaman !== halamanAman) setHalaman(halamanAman)
  }, [halaman, halamanAman])

  const nomorHalaman = useMemo(() => {
    const total = totalHalaman
    const aktif = halamanAman
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const set = new Set([1, total, aktif, aktif - 1, aktif + 1, aktif - 2, aktif + 2])
    const list = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
    const out: (number | '…')[] = []
    for (let i = 0; i < list.length; i++) {
      if (i > 0 && list[i]! - list[i - 1]! > 1) out.push('…')
      out.push(list[i]!)
    }
    return out
  }, [totalHalaman, halamanAman])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-muh-800 sm:text-3xl">Katalog Pinjam</h1>
        <p className="mt-1.5 text-sm text-muted">
          {sesi?.preview
            ? 'Mode pratinjau · Buku cetak di perpustakaan sekolah'
            : 'Lihat buku cetak yang bisa dipinjam di perpustakaan. Baca detailnya dulu, lalu pinjam di loket.'}
        </p>
      </div>

      {galat && <Notice tipe="error">{galat}</Notice>}

      <div className="card-soft grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <input
          className={inputCls}
          placeholder="Cari judul, pengarang, ISBN…"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          aria-label="Cari buku"
        />
        <select
          className={inputCls}
          value={katId}
          onChange={(e) => setKatId(e.target.value)}
          aria-label="Kategori"
        >
          <option value="">Semua kategori</option>
          {[...kategori]
            .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
            .map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-muh-800">
          <input
            type="checkbox"
            checked={hanyaTersedia}
            onChange={(e) => setHanyaTersedia(e.target.checked)}
          />
          Hanya yang tersedia dipinjam
        </label>
      </div>

      {loading ? (
        <div className="text-sm text-muted">Memuat katalog…</div>
      ) : hasil.length === 0 ? (
        <Notice>
          {data.length === 0
            ? 'Belum ada buku cetak di katalog.'
            : 'Tidak ada buku yang cocok dengan pencarian.'}
        </Notice>
      ) : (
        <>
          <div className="text-xs text-muted">
            {hasil.length} judul
            {hasil.length > 0 && (
              <>
                {' '}
                · halaman {halamanAman} dari {totalHalaman} (
                {(halamanAman - 1) * PER_HALAMAN + 1}–{Math.min(halamanAman * PER_HALAMAN, hasil.length)})
              </>
            )}
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {potongan.map((b) => {
              const tersedia = b.eksemplarTersedia ?? 0
              const total = b.eksemplarTotal ?? 0
              return (
                <li key={b.id}>
                  <Link
                    to={`/siswa/katalog/${b.id}`}
                    className="card-soft group flex gap-3 p-3 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muh-50">
                      <Sampul
                        id={b.coverId}
                        className="h-full w-full rounded-none border-0"
                        placeholder
                        judul={b.judul}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-semibold leading-snug text-[#1a1d33] group-hover:text-muh-700">
                        {b.judul}
                      </div>
                      {b.pengarang && (
                        <div className="mt-0.5 truncate text-xs text-muted">{b.pengarang}</div>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                        {b.kategoriId && namaKat.get(b.kategoriId) && (
                          <span className="rounded-full bg-muh-50 px-2 py-0.5 text-muh-700">
                            {namaKat.get(b.kategoriId)}
                          </span>
                        )}
                        <span
                          className={
                            tersedia > 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700'
                          }
                        >
                          {tersedia > 0 ? `${tersedia} tersedia` : 'Sedang dipinjam semua'}
                        </span>
                        {total > 0 && <span className="text-muted">· {total} eksemplar</span>}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>

          {totalHalaman > 1 && (
            <nav
              className="flex flex-wrap items-center justify-center gap-1.5"
              aria-label="Navigasi halaman katalog"
            >
              <button
                type="button"
                className={btnGhost}
                disabled={halamanAman <= 1}
                onClick={() => setHalaman((h) => Math.max(1, h - 1))}
              >
                Sebelumnya
              </button>
              {nomorHalaman.map((n, i) =>
                n === '…' ? (
                  <span key={`e${i}`} className="px-1 text-sm text-muted">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    className={n === halamanAman ? btnPrimary : `${btnGhost} min-w-9 tabular`}
                    aria-current={n === halamanAman ? 'page' : undefined}
                    onClick={() => setHalaman(n)}
                  >
                    {n}
                  </button>
                ),
              )}
              <button
                type="button"
                className={btnGhost}
                disabled={halamanAman >= totalHalaman}
                onClick={() => setHalaman((h) => Math.min(totalHalaman, h + 1))}
              >
                Berikutnya
              </button>
            </nav>
          )}
        </>
      )}

      <p className="rounded-2xl border border-border/70 bg-white px-5 py-4 text-sm text-muted">
        Meminjam dan mengembalikan buku cetak dilakukan di meja sirkulasi perpustakaan sekolah (bawa kartu anggota /
        identitas).
      </p>
    </div>
  )
}
