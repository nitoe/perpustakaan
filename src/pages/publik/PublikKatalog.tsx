import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Buku } from '../../lib/tipe'
import { Badge, Notice, PageHeader, btnPrimary, inputCls } from '../../components/ui'

const HALAMAN = 24

export default function PublikKatalog() {
  const [data, setData] = useState<Buku[]>([])
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState('')
  const [cari, setCari] = useState('')
  const [jenis, setJenis] = useState('')
  const [tampil, setTampil] = useState(HALAMAN)

  useEffect(() => {
    // Wajib where publik==true agar rules mengizinkan baca tanpa login.
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
            ? 'Katalog publik belum tersedia. Hubungi petugas perpustakaan.'
            : 'Gagal memuat katalog.',
        )
        setLoading(false)
      },
    )
  }, [])

  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return data
      .filter((b) => {
        if (jenis === 'digital' && b.jenis === 'cetak') return false
        if (jenis === 'cetak' && b.jenis === 'digital') return false
        if (!q) return true
        return [b.judul, b.pengarang, b.penerbit, b.jenjangBaca].some((x) => x?.toLowerCase().includes(q))
      })
      .sort((a, b) => a.judul.localeCompare(b.judul, 'id'))
  }, [data, cari, jenis])

  return (
    <div>
      <PageHeader
        judul="Cari buku"
        keterangan="Katalog terbuka untuk siswa dan orang tua. Bacaan digital ada di Rak baca. Peminjaman cetak tetap di perpustakaan sekolah."
        aksi={
          <Link to="/publik/baca" className={btnPrimary}>
            Rak baca
          </Link>
        }
      />

      {galat && (
        <div className="mb-4">
          <Notice tipe="error">{galat}</Notice>
        </div>
      )}

      <div className="card-soft mb-4 grid gap-3 p-4 sm:grid-cols-3">
        <input
          className={`${inputCls} sm:col-span-2`}
          placeholder="Cari judul, pengarang…"
          value={cari}
          onChange={(e) => {
            setCari(e.target.value)
            setTampil(HALAMAN)
          }}
          aria-label="Cari"
        />
        <select
          className={inputCls}
          value={jenis}
          onChange={(e) => {
            setJenis(e.target.value)
            setTampil(HALAMAN)
          }}
          aria-label="Jenis"
        >
          <option value="">Semua jenis</option>
          <option value="cetak">Ada cetak</option>
          <option value="digital">Ada digital</option>
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-muted">Memuat…</div>
      ) : hasil.length === 0 ? (
        <Notice>
          {data.length === 0
            ? 'Belum ada koleksi yang ditandai publik.'
            : 'Tidak ada judul yang cocok.'}
        </Notice>
      ) : (
        <>
          <div className="mb-2 text-xs text-muted">{hasil.length} judul</div>
          <ul className="card-soft divide-y divide-border">
            {hasil.slice(0, tampil).map((b) => (
              <li key={b.id}>
                <Link to={`/publik/${b.id}`} className="flex items-start justify-between gap-3 p-4 hover:bg-surface-2">
                  <div className="min-w-0">
                    <div className="font-medium text-[#1a1d33]">{b.judul}</div>
                    <div className="mt-0.5 truncate text-sm text-muted">
                      {[b.pengarang, b.tahun].filter(Boolean).join(' · ') || '—'}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {b.jenis !== 'cetak' && <Badge>Digital</Badge>}
                      {b.jenis !== 'digital' && <Badge>Cetak</Badge>}
                      {b.jenjangBaca && <Badge>{b.jenjangBaca}</Badge>}
                    </div>
                  </div>
                  {b.jenis !== 'digital' && (
                    <div className="tabular shrink-0 text-right text-sm text-muted">
                      <span
                        className={
                          (b.eksemplarTersedia ?? 0) > 0 ? 'font-semibold text-[#1a1d33]' : 'font-semibold text-red-700'
                        }
                      >
                        {b.eksemplarTersedia ?? 0}
                      </span>{' '}
                      tersedia
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {hasil.length > tampil && (
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm font-medium text-muh-600 hover:underline"
                onClick={() => setTampil((n) => n + HALAMAN)}
              >
                Tampilkan lebih banyak
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
