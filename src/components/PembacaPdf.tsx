import { useEffect, useRef, useState } from 'react'
import { muatPdf, renderHalamanKeDataUrl, type PdfDokumen } from '../lib/pdf'
import { bacaProgress, simpanProgress } from '../lib/progressBaca'

interface Props {
  url: string
  judul: string
  nisn: string
  bukuId: string
  onTutup: () => void
}

/** Pembaca PDF modal. Tanpa tombol unduh/cetak. */
export default function PembacaPdf({ url, judul, nisn, bukuId, onTutup }: Props) {
  const [pdf, setPdf] = useState<PdfDokumen | null>(null)
  const [halaman, setHalaman] = useState(1)
  const [total, setTotal] = useState(0)
  const [gambar, setGambar] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState('')
  const [zoom, setZoom] = useState(1)
  const [siapSimpan, setSiapSimpan] = useState(false)
  const wadah = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let batal = false
    setLoading(true)
    setGalat('')
    setSiapSimpan(false)
    void (async () => {
      try {
        const doc = await muatPdf(url)
        if (batal) return
        setPdf(doc)
        const t = doc.numPages
        setTotal(t)
        const awal = await bacaProgress(nisn, bukuId)
        const aman = Math.min(Math.max(1, awal), t)
        setHalaman(aman)
        // Tunda sebentar agar setHalaman selesai sebelum mulai menyimpan.
        setTimeout(() => {
          if (!batal) setSiapSimpan(true)
        }, 0)
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
    if (!siapSimpan || halaman < 1 || total < 1) return
    void simpanProgress(nisn, bukuId, halaman, total, judul)
  }, [siapSimpan, halaman, total, nisn, bukuId, judul])

  function sebelumnya() {
    setHalaman((h) => Math.max(1, h - 1))
  }
  function berikutnya() {
    setHalaman((h) => Math.min(total, h + 1))
  }

  async function layarPenuh() {
    const el = wadah.current
    if (!el) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await el.requestFullscreen()
    } catch {
      /* browser menolak fullscreen */
    }
  }

  return (
    <div ref={wadah} className="fixed inset-0 z-50 flex flex-col bg-black/90 text-white">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0 truncate text-sm font-medium">{judul}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70">{total > 0 ? `${halaman} / ${total}` : '…'}</span>
          <button
            type="button"
            onClick={onTutup}
            className="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
          >
            Tutup
          </button>
        </div>
      </header>

      <div className="relative flex-1 overflow-auto p-4">
        <div className="flex min-h-full min-w-full items-start justify-center">
          {loading && <div className="text-sm text-white/80">Memuat bacaan…</div>}
          {galat && <div className="text-sm text-red-300">{galat}</div>}
          {gambar && !galat && (
            <img
              src={gambar}
              alt={`Halaman ${halaman}`}
              className="rounded shadow-lg"
              style={{
                // 100% = pas di layar (maks 42rem). Slider 50–200 mengubah lebar relatif itu.
                width: `min(${Math.round(zoom * 100)}%, ${Math.round(zoom * 42)}rem)`,
                maxWidth: 'none',
                height: 'auto',
              }}
              draggable={false}
            />
          )}
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={sebelumnya}
          disabled={halaman <= 1 || loading}
          className="rounded-full bg-white/10 px-4 py-2 text-sm disabled:opacity-40 hover:bg-white/20"
        >
          Sebelumnya
        </button>
        <button
          type="button"
          onClick={berikutnya}
          disabled={halaman >= total || loading}
          className="rounded-full bg-white/10 px-4 py-2 text-sm disabled:opacity-40 hover:bg-white/20"
        >
          Berikutnya
        </button>
        <span className="mx-1 h-5 w-px bg-white/20" />
        <label className="flex items-center gap-2 text-xs text-white/70">
          <span>Zoom</span>
          <input
            type="range"
            min={50}
            max={200}
            step={5}
            value={Math.round(zoom * 100)}
            onChange={(e) => setZoom(Number(e.target.value) / 100)}
            className="w-28 accent-white"
            aria-label="Zoom"
          />
          <span className="min-w-[2.5rem] text-right">{Math.round(zoom * 100)}%</span>
        </label>
        <button
          type="button"
          onClick={() => void layarPenuh()}
          className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
        >
          Layar penuh
        </button>
      </footer>
    </div>
  )
}
