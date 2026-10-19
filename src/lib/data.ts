import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import type { AppUser } from '../types/user'

/** Catat perubahan ke perpus_log. Kegagalan mencatat tidak boleh menggagalkan aksi utama. */
export async function catat(profil: AppUser | null, tindakan: string, koleksi: string, refId: string) {
  const uid = auth.currentUser?.uid
  if (!uid) return
  try {
    await addDoc(collection(db, 'perpus_log'), {
      uid,
      nama: profil?.nama ?? '',
      tindakan,
      koleksi,
      refId,
      waktu: serverTimestamp(),
    })
  } catch {
    /* diabaikan */
  }
}

export async function simpanDoc(koleksi: string, id: string | null, data: Record<string, unknown>) {
  if (id) {
    await updateDoc(doc(db, koleksi, id), { ...data, updatedAt: serverTimestamp() })
    return id
  }
  const ref = await addDoc(collection(db, koleksi), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return ref.id
}

export async function hapusDoc(koleksi: string, id: string) {
  await deleteDoc(doc(db, koleksi, id))
}

/** Menyimpan sampul buku (data URL kecil) ke perpus_foto; mengembalikan ID dokumennya. */
export async function simpanFoto(dataUrl: string): Promise<string> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Belum masuk.')
  const ref = await addDoc(collection(db, 'perpus_foto'), {
    data: dataUrl,
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function ambilFoto(id: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'perpus_foto', id))
  return snap.exists() ? ((snap.data().data as string) ?? null) : null
}
