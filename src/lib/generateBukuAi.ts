import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from './firebase'

const REGION = 'asia-southeast2'

export interface MetaBukuAi {
  judul: string
  pengarang?: string
  penerbit?: string
  tahun?: number
  isbn?: string
  sinopsis?: string
  bahasa?: string
  jenjangBaca?: string
  sumber: 'gemini'
}

function pesan(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = String((err as { message: unknown }).message || '')
    if (m && m !== 'internal') return m
  }
  return 'Gagal menghubungi layanan AI.'
}

/**
 * Generate metadata buku dari judul (opsional ISBN) lewat Cloud Function.
 * API key hanya di server (secret GEMINI_API_KEY).
 */
export async function generateBukuMetaAi(input: {
  judul: string
  isbn?: string
}): Promise<MetaBukuAi> {
  const panggil = httpsCallable<{ judul: string; isbn?: string }, MetaBukuAi>(
    getFunctions(app, REGION),
    'generateBukuMetaAi',
  )
  try {
    const res = await panggil(input)
    return res.data
  } catch (e) {
    throw new Error(pesan(e))
  }
}

/**
 * Generate gambar sampul dari judul (+ pengarang opsional).
 * Mengembalikan data URL; simpan lewat simpanFoto() seperti unggah manual.
 */
export async function generateBukuSampulAi(input: {
  judul: string
  pengarang?: string
}): Promise<string> {
  const panggil = httpsCallable<{ judul: string; pengarang?: string }, { dataUrl: string }>(
    getFunctions(app, REGION),
    'generateBukuSampulAi',
  )
  try {
    const res = await panggil(input)
    const url = res.data?.dataUrl
    if (!url || !url.startsWith('data:image/')) {
      throw new Error('Sampul AI tidak valid.')
    }
    return url
  } catch (e) {
    throw new Error(pesan(e))
  }
}
