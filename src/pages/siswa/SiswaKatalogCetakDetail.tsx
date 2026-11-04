import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Buku, Kategori } from '../../lib/tipe'
import { Notice } from '../../components/ui'
import Sampul from '../../components/Sampul'

/** Detail buku cetak untuk siswa — informasi saja, pinjam di perpustakaan. */
export default function SiswaKatalogCetakDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const [b, setB] = useState<Buku | null>(null)
  const [namaKat, setNamaKat] = useState('')
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    if (!id) return
    let batal = false
    void (async () => {
      try {
        const snap = await getDoc(doc(db, 'perpus_buku', id))
        if (batal) return
        if (!snap.exists()) {
          setGalat('Buku tidak ditemukan.')
          setB(null)
        } else {
          const data = { id: snap.id, ...snap.data() } as unknown as Buku
          const jenis = data.jenis || 'cetak'
          if (jenis !== 'cetak' && jenis !== 'keduanya') {
            setGalat('Buku ini bukan koleksi cetak yang dapat dilihat di katalog pinjam.')
            setB(null)
          } else {
            setB(data)
            setGalat('')
            if (data.kategoriId) {
              try {
                const k = await getDoc(doc(db, 'perpus_kategori', data.kategoriId))
                if (!batal && k.exists()) setNamaKat(String((k.data() as Kategori).nama || ''))
              } catch {
                /* abaikan */
              }
            }
          }
        }
      } catch {
        if (!batal) setGalat('Gagal memuat data buku.')
      }
      if (!batal) setLoading(false)
    })()
    return () => {
      batal = true
    }
  }, [id])

  if (loading) {
    return <div className="py-16 text-center text-sm text-muted">Memuat…</div>
  }

  if (!b) {
    return (
      <div className="space-y-4">
        <Notice tipe="warn">{galat || 'Buku tidak tersedia.'}</Notice>
        <Link to="/siswa/katalog" className="text-sm font-medium text-muh-600 hover:underline">
          ← Kembali ke katalog pinjam
        </Link>
      </div>
    )
  }

  const tersedia = b.eksemplarTersedia ?? 0
  const total = b.eksemplarTotal ?? 0

  return (
    <div className="space-y-6">
      <Link to="/siswa/katalog" className="text-sm font-medium text-muh-600 hover:underline">
        ← Kembali ke katalog pinjam
      </Link>

      <div className="card-soft flex flex-col gap-6 p-5 sm:flex-row">
        <div className="mx-auto h-56 w-40 shrink-0 overflow-hidden rounded-xl border border-border bg-muh-50 shadow-sm sm:mx-0">
          <Sampul id={b.coverId} className="h-full w-full rounded-none border-0" placeholder judul={b.judul} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <h1 className="text-xl font-semibold tracking-tight text-muh-800 sm:text-2xl">{b.judul}</h1>
          <dl className="grid gap-1.5 text-sm sm:grid-cols-[8rem_1fr]">
            {b.pengarang && (
              <>
                <dt className="text-muted">Pengarang</dt>
                <dd>{b.pengarang}</dd>
              </>
            )}
            {b.penerbit && (
              <>
                <dt className="text-muted">Penerbit</dt>
                <dd>
                  {b.penerbit}
                  {b.tahun ? ` · ${b.tahun}` : ''}
                </dd>
              </>
            )}
            {namaKat && (
              <>
                <dt className="text-muted">Kategori</dt>
                <dd>{namaKat}</dd>
              </>
            )}
            {b.klasifikasi && (
              <>
                <dt className="text-muted">Klasifikasi</dt>
                <dd className="font-mono text-xs">{b.klasifikasi}</dd>
              </>
            )}
            {b.jenjangBaca && (
              <>
                <dt className="text-muted">Jenjang</dt>
                <dd>{b.jenjangBaca}</dd>
              </>
            )}
            {b.isbn && (
              <>
                <dt className="text-muted">ISBN</dt>
                <dd className="font-mono text-xs">{b.isbn}</dd>
              </>
            )}
            <dt className="text-muted">Ketersediaan</dt>
            <dd>
              <span className={tersedia > 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700'}>
                {tersedia > 0 ? `${tersedia} eksemplar tersedia` : 'Sedang tidak tersedia'}
              </span>
              {total > 0 && <span className="text-muted"> dari {total} di koleksi</span>}
            </dd>
          </dl>

          {b.sinopsis && (
            <div>
              <div className="text-sm font-medium text-muh-800">Sinopsis</div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted">{b.sinopsis}</p>
            </div>
          )}

          <div className="rounded-xl border border-muh-100 bg-muh-50/80 px-4 py-3 text-sm text-muh-800">
            <strong>Cara pinjam:</strong> datang ke perpustakaan sekolah, sebutkan judul buku ini kepada petugas.
            Pengembalian juga di meja sirkulasi.
            {b.jenis === 'keduanya' && (
              <span className="mt-1 block text-muted">
                Buku ini juga punya versi digital — cek menu <Link to="/siswa/baca" className="font-medium text-muh-600 hover:underline">Rak Baca</Link> jika tautan publik tersedia.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
