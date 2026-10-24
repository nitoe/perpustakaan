import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { bisaKelola } from '../lib/peran'
import { tautanAman } from '../lib/katalog'
import { useKoleksi } from '../lib/useKoleksi'
import type { Buku, FormatDigital, Kategori } from '../lib/tipe'
import { Badge, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'
import Sampul from '../components/Sampul'

const HALAMAN = 24

const NAMA_FORMAT: Record<FormatDigital, string> = {
  pdf: 'PDF',
  video: 'Video',
  audio: 'Audio',
  web: 'Halaman web',
}

interface Filter {
  cari: string
  format: string
  kategori: string
  hanyaBisaDibuka: boolean
}

export default function Digital() {
  const { peran } = useAuth()
  const buku = useKoleksi<Buku>('perpus_buku')
  const kategori = useKoleksi<Kategori>('perpus_kategori')
  const [f, setF] = useState<Filter>({
    cari: '',
    format: '',
    kategori: '',
    hanyaBisaDibuka: true,
  })
  const [tampil, setTampil] = useState(HALAMAN)

  const ubah = (p: Partial<Filter>) => {
    setF((s) => ({ ...s, ...p }))
    setTampil(HALAMAN)
  }

  const namaKat = useMemo(() => new Map(kategori.data.map((k) => [k.id, k.nama])), [kategori.data])

  const digital = useMemo(
    () => buku.data.filter((b) => b.jenis === 'digital' || b.jenis === 'keduanya'),
    [buku.data],
  )

  const hasil = useMemo(() => {
    const q = f.cari.trim().toLowerCase()
    return digital
      .filter((b) => {
        if (f.kategori && b.kategoriId !== f.kategori) return false
        if (f.format && b.formatDigital !== f.format) return false
        const url = tautanAman(b.tautanDigital)
        if (f.hanyaBisaDibuka && !url) return false
        if (!q) return true
        return [b.judul, b.pengarang, b.penerbit, b.jenjangBaca].some((x) => x?.toLowerCase().includes(q))
      })
      .sort((a, b) => a.judul.localeCompare(b.judul, 'id'))
  }, [digital, f])

  return (
    <div className="w-full">
      <PageHeader
        judul="Koleksi digital"
        keterangan="E-book, video, audio, dan tautan bacaan. Dibuka di tab baru (tidak diunggah ke server sekolah)."
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
          placeholder="Cari judul, pengarang…"
          value={f.cari}
          onChange={(e) => ubah({ cari: e.target.value })}
          aria-label="Cari"
        />
        <select className={inputCls} value={f.format} onChange={(e) => ubah({ format: e.target.value })} aria-label="Format">
          <option value="">Semua format</option>
          {(Object.keys(NAMA_FORMAT) as FormatDigital[]).map((k) => (
            <option key={k} value={k}>
              {NAMA_FORMAT[k]}
            </option>
          ))}
        </select>
        <select
          className={inputCls}
          value={f.kategori}
          onChange={(e) => ubah({ kategori: e.target.value })}
          aria-label="Kategori"
        >
          <option value="">Semua kategori</option>
          {[...kategori.data]
            .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
            .map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
        </select>
        <label className="flex items-center gap-2 text-sm sm:col-span-4">
          <input
            type="checkbox"
            checked={f.hanyaBisaDibuka}
            onChange={(e) => ubah({ hanyaBisaDibuka: e.target.checked })}
          />
          Hanya yang tautannya bisa dibuka
        </label>
      </div>

      {buku.loading ? (
        <div className="text-sm text-muted">Memuat…</div>
      ) : digital.length === 0 ? (
        <Notice>
          Belum ada koleksi digital.
          {bisaKelola(peran)
            ? ' Tambah buku dengan jenis Digital atau Cetak + digital, lalu isi tautan bacaan.'
            : ''}
        </Notice>
      ) : hasil.length === 0 ? (
        <Notice>Tidak ada item yang cocok dengan filter.</Notice>
      ) : (
        <>
          <div className="mb-2 text-xs text-muted">
            {hasil.length} dari {digital.length} koleksi digital
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {hasil.slice(0, tampil).map((b) => (
              <KartuDigital key={b.id} buku={b} namaKategori={b.kategoriId ? namaKat.get(b.kategoriId) : undefined} />
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

      <div className="mt-6">
        <Notice>
          Berkas tetap di tempat asalnya (BSE Kemendikdasmen, Drive, YouTube, dll.). Aplikasi hanya menyimpan tautan
          http/https. Jangan menandai publik materi yang masih berhak cipta (fase 2).
        </Notice>
      </div>
    </div>
  )
}

function KartuDigital({ buku: b, namaKategori }: { buku: Buku; namaKategori?: string }) {
  const url = tautanAman(b.tautanDigital)
  const format = b.formatDigital ? NAMA_FORMAT[b.formatDigital] : null

  return (
    <li className="card-soft flex gap-3 p-3">
      <Sampul id={b.coverId} className="h-24 w-16 shrink-0 object-cover" />
      <div className="min-w-0 flex-1">
        <Link to={`/katalog/${b.id}`} className="font-medium text-[#1a1d33] hover:underline">
          {b.judul}
        </Link>
        <div className="mt-0.5 truncate text-sm text-muted">
          {[b.pengarang, b.jenjangBaca].filter(Boolean).join(' · ') || '—'}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {format && <Badge>{format}</Badge>}
          {namaKategori && <Badge>{namaKategori}</Badge>}
          {b.jenis === 'keduanya' && <Badge>Juga cetak</Badge>}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
              Buka bacaan
            </a>
          ) : (
            <span className="text-xs text-amber-700">Tautan belum valid</span>
          )}
          <Link to={`/katalog/${b.id}`} className={btnGhost}>
            Detail
          </Link>
        </div>
      </div>
    </li>
  )
}
