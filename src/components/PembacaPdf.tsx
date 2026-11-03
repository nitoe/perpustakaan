import { useEffect, useState } from 'react'
import { muatPdf, renderHalamanKeDataUrl, type PdfDokumen } from '../lib/pdf'
import { bacaProgress, simpanProgress } from '../lib/progressBaca'

interface Props {
  url: string
  judul: string
  nisn: string
  bukuId: string
  onTutup: () => void
}

/** Pembaca PDF modal (fullscreen). Tanpa tombol unduh/cetak. */
export default function PembacaPdf({ url, judul, nisn, bukuId, onTutup }: Props) {
  const [pdf, setPdf] = useState<PdfDokumen | null>(null)
  const [halaman, setHalaman] = useState(1)
  const [total, setTotal] = useState(0)
  const [gambar, setGambar] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    let batal = false
    setLoading(true)
    setGalat('')
    void (async () => {
      try {
        const doc = await muatPdf(url)
        if (batal) return
        setPdf(doc)
        const t = doc.numPages
        setTotal(t)
        const awal = Math.min(bacaProgress(nisn, bukuId), t)
        setHalaman(awal)
      } catch (e) {
        if (!batal) setGalat(e instanceof Error ? e.message : 'Gagal membuka PDF.')
      }
      if (!batal) setLoading(false)
    })()
    return () => {
      batal = true
    }
  }, [url, nisn, bukuId])

  useEffect(() => {
    if (!pdf || halaman < 1) return
    let batal = false
    void (async () => {
      try {
        const data = await renderHalamanKeDataUrl(pdf, halaman, 1.4)
        if (!batal) setGambar(data)
      } catch {
        if (!batal) setGalat('Gagal menampilkan halaman.')
      }
    })()
    return () => {
      batal = true
    }
  }, [pdf, halaman])

  useEffect(() => {
    if (halaman >= 1) simpanProgress(nisn, bukuId, halaman)
  }, [halaman, nisn, bukuId])

  function sebelumnya() {
    setHalaman((h) => Math.max(1, h - 1))
  }
  function berikutnya() {
    setHalaman((h) => Math.min(total, h + 1))
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/85 text-white">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0 truncate text-sm font-medium">{judul}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70">
            {total > 0 ? `${halaman} / ${total}` : '…'}
          </span>
          <button
            type="button"
            onClick={onTutup}
            className="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
          >
            Tutup
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-auto p-4">
        {loading && <div className="text-sm text-white/80">Memuat bacaan…</div>}
        {galat && <div className="text-sm text-red-300">{galat}</div>}
        {gambar && !galat && (
          <img
            src={gambar}
            alt={`Halaman ${halaman}`}
            className="max-h-full max-w-full rounded shadow-lg"
            draggable={false}
          />
        )}
      </div>

      <footer className="flex items-center justify-center gap-3 border-t border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={sebelumnya}
          disabled={halaman <= 1 || loading}
          className="rounded-full bg-white/10 px-5 py-2 text-sm disabled:opacity-40 hover:bg-white/20"
        >
          Sebelumnya
        </button>
        <button
          type="button"
          onClick={berikutnya}
          disabled={halaman >= total || loading}
          className="rounded-full bg-white/10 px-5 py-2 text-sm disabled:opacity-40 hover:bg-white/20"
        >
          Berikutnya
        </button>
      </footer>
    </div>
  )
}
