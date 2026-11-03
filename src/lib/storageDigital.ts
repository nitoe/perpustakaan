import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

/** Unggah berkas PDF ke Storage. Mengembalikan URL unduhan. */
export async function unggahPdf(file: File, uid: string): Promise<string> {
  if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Berkas harus berformat PDF.')
  }
  if (file.size > 40 * 1024 * 1024) {
    throw new Error('Ukuran PDF maksimal 40 MB.')
  }
  const nama = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const path = `perpus_digital/${uid}/${nama}`
  const r = ref(storage, path)
  await uploadBytes(r, file, { contentType: 'application/pdf' })
  return getDownloadURL(r)
}
