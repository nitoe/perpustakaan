import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { bisaKelola } from '../lib/peran'
import { useKoleksi } from '../lib/useKoleksi'
import type { Buku, Kategori } from '../lib/tipe'
import { Badge, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'
import Sampul from '../components/Sampul'

const HALAMAN = 30
const KEY_MODE = 'perpus_katalog_mode'

type ModeTampil = 'daftar' | 'rak'

interface Filter {
  cari: string
  kategori: string
  jenis: string
  tersedia: boolean
  tanpaSampul: boolean
}

function bacaMode(): ModeTampil {
  try {
    const v = localStorage.getItem(KEY_MODE)
    if (v === 'rak' || v === 'daftar') return v
  } catch {
    /* abaikan */
  }
  return 'daftar'
}

export default function Katalog() {
  const { peran } = useAuth()
  const buku = useKoleksi<Buku>('perpus_buku')
  const kategori = useKoleksi<Kategori>('perpus_kategori')
  const [f, setF] = useState<Filter>({
    cari: '',
    kategori: '',
    jenis: '',
    tersedia: false,
    tanpaSampul: false,
  })
  const [tampil, setTampil] = useState(HALAMAN)
  const [mode, setMode] = useState<ModeTampil>(bacaMode)

  useEffect(() => {
    try {
      localStorage.setItem(KEY_MODE, mode)
    } catch {
      /* abaikan */
    }
  }, [mode])

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
        if (f.tersedia && b.jenis === 'cetak' && (b.eksemplarTersedia ?? 0) < 1) return false
        if (f.tanpaSampul && b.coverId) return false
        if (!q) return true
        return [b.judul, b.pengarang, b.penerbit, b.isbn, b.klasifikasi].some((x) =>
          x?.toLowerCase().includes(q),
        )
      })
      .sort((a, b) => a.judul.localeCompare(b.judul, 'id'))
  }, [buku.data, f])

  const potongan = hasil.slice(0, tampil)
  const tanpaCover = useMemo(() => buku.data.filter((b) => !b.coverId).length, [buku.data])

  return (
    <div className="w-full">
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

      <div className="card-soft mb-4 space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <input
            className={`${inputCls} sm:col-span-2`}
            placeholder="Cari judul, pengarang, penerbit, ISBN…"
            value={f.cari}
            onChange={(e) => ubah({ cari: e.target.value })}
            aria-label="Cari"
          />
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
          <select
            className={inputCls}
            value={f.jenis}
            onChange={(e) => ubah({ jenis: e.target.value })}
            aria-label="Jenis"
          >
            <option value="">Semua jenis</option>
            <option value="cetak">Cetak</option>
            <option value="digital">Digital</option>
            <option value="keduanya">Cetak dan digital</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f.tersedia}
              onChange={(e) => ubah({ tersedia: e.target.checked })}
            />
            Bisa dipinjam/dibaca sekarang
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f.tanpaSampul}
              onChange={(e) => ubah({ tanpaSampul: e.target.checked })}
            />
            Tanpa sampul
            {tanpaCover > 0 && (
              <span className="text-xs text-muted">({tanpaCover} judul)</span>
            )}
          </label>
          <div className="ml-auto flex items-center gap-1 rounded-lg border border-border p-0.5">
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                mode === 'daftar' ? 'bg-muh-800 text-white' : 'text-muted hover:bg-surface-2'
              }`}
              onClick={() => setMode('daftar')}
              aria-pressed={mode === 'daftar'}
            >
              Daftar
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                mode === 'rak' ? 'bg-muh-800 text-white' : 'text-muted hover:bg-surface-2'
              }`}
              onClick={() => setMode('rak')}
              aria-pressed={mode === 'rak'}
            >
              Rak / thumbnail
            </button>
          </div>
        </div>
      </div>

      {buku.loading ? (
        <div className="text-sm text-muted">Memuat katalog…</div>
      ) : hasil.length === 0 ? (
        <Notice>
          {buku.data.length === 0
            ? 'Katalog masih kosong.' +
              (bisaKelola(peran)
                ? ' Tambahkan buku, atau impor dari berkas CSV lewat menu Impor.'
                : '')
            : 'Tidak ada buku yang cocok dengan pencarian.'}
        </Notice>
      ) : (
        <>
          <div className="mb-2 text-xs text-muted">
            {hasil.length} dari {buku.data.length} judul
            {mode === 'rak' ? ' · tampilan rak' : ' · tampilan daftar'}
          </div>

          {mode === 'daftar' ? (
            <ul className="card-soft divide-y divide-border">
              {potongan.map((b) => (
                <li key={b.id}>
                  <Link
                    to={`/katalog/${b.id}`}
                    className="flex items-start gap-3 p-3 hover:bg-surface-2 sm:p-4"
                  >
                    <div className="h-16 w-12 shrink-0 overflow-hidden rounded border border-border bg-surface-2 sm:h-20 sm:w-14">
                      <Sampul
                        id={b.coverId}
                        className="h-full w-full rounded-none border-0"
                        placeholder
                        judul={b.judul}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[#1a1d33]">{b.judul}</div>
                      <div className="mt-0.5 truncate text-sm text-muted">
                        {[b.pengarang, b.penerbit, b.tahun].filter(Boolean).join(' · ') || '—'}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {b.kategoriId && namaKat.get(b.kategoriId) && (
                          <Badge>{namaKat.get(b.kategoriId)}</Badge>
                        )}
                        {b.jenis !== 'cetak' && (
                          <Badge>{b.jenis === 'digital' ? 'Digital' : 'Cetak + digital'}</Badge>
                        )}
                        {!b.coverId && <Badge>Tanpa sampul</Badge>}
                      </div>
                    </div>
                    {b.jenis !== 'digital' && (
                      <div className="tabular shrink-0 text-right text-sm text-muted">
                        <span
                          className={
                            (b.eksemplarTersedia ?? 0) > 0
                              ? 'font-semibold text-[#1a1d33]'
                              : 'font-semibold text-red-700'
                          }
                        >
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
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {potongan.map((b) => (
                <li key={b.id}>
                  <Link
                    to={`/katalog/${b.id}`}
                    className="card-soft group flex h-full flex-col overflow-hidden transition hover:ring-2 hover:ring-muh-300"
                  >
                    <div className="relative aspect-[3/4] w-full bg-surface-2">
                      <Sampul
                        id={b.coverId}
                        className="absolute inset-0 h-full w-full rounded-none border-0"
                        placeholder
                        judul={b.judul}
                      />
                      {!b.coverId && (
                        <span className="absolute right-1.5 top-1.5 rounded bg-amber-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          Tanpa sampul
                        </span>
                      )}
                      {b.jenis !== 'cetak' && (
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-[#313083]/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {b.jenis === 'digital' ? 'Digital' : 'Cetak+dig'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                      <div className="line-clamp-2 text-sm font-medium leading-snug text-[#1a1d33] group-hover:text-muh-800">
                        {b.judul}
                      </div>
                      {b.pengarang && (
                        <div className="truncate text-xs text-muted">{b.pengarang}</div>
                      )}
                      {b.jenis !== 'digital' && (
                        <div className="mt-auto pt-1 text-xs tabular text-muted">
                          <span
                            className={
                              (b.eksemplarTersedia ?? 0) > 0
                                ? 'font-semibold text-[#1a1d33]'
                                : 'font-semibold text-red-700'
                            }
                          >
                            {b.eksemplarTersedia ?? 0}
                          </span>
                          /{b.eksemplarTotal ?? 0} tersedia
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

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
