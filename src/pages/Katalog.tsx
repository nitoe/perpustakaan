import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { bisaKelola } from '../lib/peran'
import { useKoleksi } from '../lib/useKoleksi'
import type { Buku, Kategori } from '../lib/tipe'
import { Badge, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'

const HALAMAN = 30

interface Filter {
  cari: string
  kategori: string
  jenis: string
  tersedia: boolean
}

export default function Katalog() {
  const { peran } = useAuth()
  const buku = useKoleksi<Buku>('perpus_buku')
  const kategori = useKoleksi<Kategori>('perpus_kategori')
  const [f, setF] = useState<Filter>({ cari: '', kategori: '', jenis: '', tersedia: false })
  const [tampil, setTampil] = useState(HALAMAN)

  const ubah = (p: Partial<Filter>) => {
    setF((s) => ({ ...s, ...p }))
    setTampil(HALAMAN)
  }

  const namaKat = useMemo(() => new Map(kategori.data.map((k) => [k.id, k.nama])), [kategori.data])

  const hasil = useMemo(() => {
    const q = f.cari.trim().toLowerCase()
    return buku.data
      .filter((b) => {
        if (f.kategori && b.kategoriId !== f.kategori) return false
        if (f.jenis && b.jenis !== f.jenis) return false
        // Bisa dipakai sekarang: ada bacaan digital, atau minimal satu eksemplar cetak tersedia.
        if (f.tersedia && b.jenis === 'cetak' && (b.eksemplarTersedia ?? 0) < 1) return false
        if (!q) return true
        return [b.judul, b.pengarang, b.penerbit, b.isbn, b.klasifikasi].some((x) => x?.toLowerCase().includes(q))
      })
      .sort((a, b) => a.judul.localeCompare(b.judul, 'id'))
  }, [buku.data, f])

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        judul="Katalog"
        keterangan="Cari buku cetak dan koleksi digital perpustakaan."
        aksi={
          bisaKelola(peran) && (
            <Link to="/katalog/baru" className={btnPrimary}>
              Tambah buku
            </Link>
          )
        }
      />

      {(buku.galat || kategori.galat) && (
        <div className="mb-4">
          <Notice tipe="error">{buku.galat || kategori.galat}</Notice>
        </div>
      )}

      <div className="card-soft mb-4 grid gap-3 p-4 sm:grid-cols-4">
        <input
          className={`${inputCls} sm:col-span-2`}
          placeholder="Cari judul, pengarang, penerbit, ISBN…"
          value={f.cari}
          onChange={(e) => ubah({ cari: e.target.value })}
          aria-label="Cari"
        />
        <select className={inputCls} value={f.kategori} onChange={(e) => ubah({ kategori: e.target.value })} aria-label="Kategori">
          <option value="">Semua kategori</option>
          {[...kategori.data].sort((a, b) => a.nama.localeCompare(b.nama, 'id')).map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>
        <select className={inputCls} value={f.jenis} onChange={(e) => ubah({ jenis: e.target.value })} aria-label="Jenis">
          <option value="">Semua jenis</option>
          <option value="cetak">Cetak</option>
          <option value="digital">Digital</option>
          <option value="keduanya">Cetak dan digital</option>
        </select>
        <label className="flex items-center gap-2 text-sm sm:col-span-4">
          <input type="checkbox" checked={f.tersedia} onChange={(e) => ubah({ tersedia: e.target.checked })} />
          Hanya yang bisa dipinjam/dibaca sekarang
        </label>
      </div>

      {buku.loading ? (
        <div className="text-sm text-muted">Memuat katalog…</div>
      ) : hasil.length === 0 ? (
        <Notice>
          {buku.data.length === 0
            ? 'Katalog masih kosong.' + (bisaKelola(peran) ? ' Tambahkan buku, atau impor dari berkas CSV lewat menu Impor.' : '')
            : 'Tidak ada buku yang cocok dengan pencarian.'}
        </Notice>
      ) : (
        <>
          <div className="mb-2 text-xs text-muted">
            {hasil.length} dari {buku.data.length} judul
          </div>
          <ul className="card-soft divide-y divide-border">
            {hasil.slice(0, tampil).map((b) => (
              <li key={b.id}>
                <Link to={`/katalog/${b.id}`} className="flex items-start justify-between gap-3 p-4 hover:bg-surface-2">
                  <div className="min-w-0">
                    <div className="font-medium text-[#1a1d33]">{b.judul}</div>
                    <div className="mt-0.5 truncate text-sm text-muted">
                      {[b.pengarang, b.penerbit, b.tahun].filter(Boolean).join(' · ') || '—'}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {b.kategoriId && namaKat.get(b.kategoriId) && <Badge>{namaKat.get(b.kategoriId)}</Badge>}
                      {b.jenis !== 'cetak' && <Badge>{b.jenis === 'digital' ? 'Digital' : 'Cetak + digital'}</Badge>}
                    </div>
                  </div>
                  {b.jenis !== 'digital' && (
                    <div className="tabular shrink-0 text-right text-sm text-muted">
                      <span className={(b.eksemplarTersedia ?? 0) > 0 ? 'font-semibold text-[#1a1d33]' : 'font-semibold text-red-700'}>
                        {b.eksemplarTersedia ?? 0}
                      </span>{' '}
                      dari {b.eksemplarTotal ?? 0}
                      <div className="text-xs">tersedia</div>
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {hasil.length > tampil && (
            <div className="mt-4 text-center">
              <button className={btnGhost} onClick={() => setTampil((n) => n + HALAMAN)}>
                Tampilkan lebih banyak
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
