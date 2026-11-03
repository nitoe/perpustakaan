import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { bisaDibacaPublik } from '../../lib/katalog'
import type { Buku } from '../../lib/tipe'
import { Notice } from '../../components/ui'
import Sampul from '../../components/Sampul'
import PembacaPdf from '../../components/PembacaPdf'
import { useSiswa } from '../../context/SiswaContext'
import { bacaProgress } from '../../lib/progressBaca'

const NAMA_FORMAT: Record<string, string> = {
  pdf: 'PDF',
  video: 'Video',
  audio: 'Audio',
  web: 'Halaman web',
}

/** Halaman detail bacaan siswa — lebih hangat dan lega. */
export default function SiswaBacaDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const { sesi } = useSiswa()
  const [b, setB] = useState<Buku | null>(null)
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState('')
  const [bukaPembaca, setBukaPembaca] = useState(false)
  const [progress, setProgress] = useState(1)

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
          if (!bisaDibacaPublik(data)) {
            setGalat('Bacaan ini belum tersedia untuk dibaca.')
            setB(null)
          } else {
            setB(data)
            setGalat('')
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

  useEffect(() => {
    if (!b || !sesi?.nisn) return
    const adalahPdf = b.formatDigital === 'pdf' || (b.tautanDigital ?? '').toLowerCase().includes('.pdf')
    if (!adalahPdf) return
    let batal = false
    void bacaProgress(sesi.nisn, b.id).then((h) => {
      if (!batal) setProgress(h)
    })
    return () => {
      batal = true
    }
  }, [b, sesi?.nisn])

  if (loading) {
    return <div className="py-16 text-center text-sm text-muted">Memuat bacaan…</div>
  }

  if (!b) {
    return (
      <div className="space-y-4">
        <Notice tipe="warn">{galat || 'Bacaan tidak tersedia.'}</Notice>
        <Link to="/siswa/baca" className="inline-flex text-sm font-medium text-muh-600 hover:underline">
          ← Kembali ke Rak Baca
        </Link>
      </div>
    )
  }

  const url = bisaDibacaPublik(b)!
  const adalahPdf = b.formatDigital === 'pdf' || url.toLowerCase().includes('.pdf')
  const nisn = sesi?.nisn ?? 'tamu'

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/siswa/baca"
        className="mb-8 inline-flex items-center text-sm font-medium text-muh-600 hover:underline"
      >
        ← Rak Baca
      </Link>

      <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-start">
        <div className="w-52 shrink-0 sm:w-60">
          <div className="aspect-[2/3] overflow-hidden rounded-3xl bg-muh-50 shadow-lg ring-1 ring-black/5">
            <Sampul id={b.coverId} className="h-full w-full object-cover" />
            {!b.coverId && (
              <div className="flex h-full items-center justify-center p-4 text-center text-sm font-medium text-muh-700">
                {b.judul}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-muh-800 sm:text-3xl">{b.judul}</h1>
          {b.pengarang && (
            <p className="mt-2 text-base text-muted">oleh {b.pengarang}</p>
          )}

          <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
            {b.jenjangBaca && (
              <span className="rounded-full bg-muh-50 px-3.5 py-1 text-xs font-medium text-muh-700">
                {b.jenjangBaca}
              </span>
            )}
            {b.formatDigital && (
              <span className="rounded-full bg-muh-50 px-3.5 py-1 text-xs font-medium text-muh-700">
                {NAMA_FORMAT[b.formatDigital] ?? b.formatDigital}
              </span>
            )}
          </div>

          {b.sinopsis && (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-[#2b2f4a]">
              {b.sinopsis}
            </p>
          )}

          <div className="mt-8">
            {adalahPdf ? (
              <>
                <button
                  type="button"
                  onClick={() => setBukaPembaca(true)}
                  className="inline-flex items-center justify-center rounded-full bg-muh-600 px-10 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-muh-700 hover:shadow"
                >
                  {progress > 1 ? `Lanjutkan dari halaman ${progress}` : 'Baca Sekarang'}
                </button>
                <p className="mt-3 text-xs text-muted">
                  Bacaan dibuka di dalam aplikasi. Progress disimpan di perangkat dan disinkronkan ke server.
                </p>
              </>
            ) : (
              <>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-muh-600 px-10 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-muh-700 hover:shadow"
                >
                  Baca Sekarang
                </a>
                <p className="mt-3 text-xs text-muted">
                  Bacaan akan terbuka di tab baru.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {bukaPembaca && adalahPdf && (
        <PembacaPdf
          url={url}
          judul={b.judul}
          nisn={nisn}
          bukuId={b.id}
          onTutup={() => {
            setBukaPembaca(false)
            void bacaProgress(nisn, b.id).then(setProgress)
          }}
        />
      )}
    </div>
  )
}
