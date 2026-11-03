/**
 * Pembantu PDF (pdfjs-dist).
 * Worker di-bundle lewat Vite agar mematuhi CSP 'self'.
 * Pasang dulu: npm install pdfjs-dist
 */
import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export type PdfDokumen = pdfjs.PDFDocumentProxy

export async function muatPdf(url: string): Promise<PdfDokumen> {
  const task = pdfjs.getDocument({ url, withCredentials: false })
  return task.promise
}

export async function muatPdfDariBytes(data: ArrayBuffer): Promise<PdfDokumen> {
  const task = pdfjs.getDocument({ data })
  return task.promise
}

/** Render satu halaman ke data URL (untuk sampul atau tampilan). */
export async function renderHalamanKeDataUrl(
  pdf: PdfDokumen,
  nomorHalaman: number,
  skala = 1.2,
): Promise<string> {
  const page = await pdf.getPage(nomorHalaman)
  const viewport = page.getViewport({ scale: skala })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas tidak tersedia.')
  // pdfjs-dist versi terbaru mensyaratkan properti `canvas` di RenderParameters.
  await page.render({ canvas, canvasContext: ctx, viewport }).promise
  return canvas.toDataURL('image/jpeg', 0.82)
}

/** Buat sampul dari halaman 1 PDF (dari URL — butuh CORS). */
export async function buatSampulDariPdf(url: string): Promise<string> {
  const pdf = await muatPdf(url)
  return renderHalamanKeDataUrl(pdf, 1, 0.8)
}

/** Buat sampul dari berkas PDF lokal (tanpa CORS). */
export async function buatSampulDariFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const pdf = await muatPdfDariBytes(buf)
  return renderHalamanKeDataUrl(pdf, 1, 0.8)
}

export function jumlahHalaman(pdf: PdfDokumen): number {
  return pdf.numPages
}
