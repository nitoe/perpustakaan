import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import type { Eksemplar, OpnameItem, OpnameSesi } from './tipe'

export async function buatSesiOpname(nama: string, petugasNama: string): Promise<string> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Belum masuk.')
  const n = nama.trim() || `Opname ${new Date().toLocaleDateString('id-ID')}`
  const ref = await addDoc(collection(db, 'perpus_opname'), {
    nama: n,
    status: 'berjalan',
    petugasUid: uid,
    petugasNama,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function selesaiSesiOpname(id: string): Promise<void> {
  await updateDoc(doc(db, 'perpus_opname', id), {
    status: 'selesai',
    selesaiAt: serverTimestamp(),
  })
}

export async function daftarSesiOpname(batas = 30): Promise<OpnameSesi[]> {
  const snap = await getDocs(query(collection(db, 'perpus_opname'), limit(batas)))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as unknown as OpnameSesi)
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
}

export async function daftarItemOpname(sesiId: string, batas = 2000): Promise<OpnameItem[]> {
  const snap = await getDocs(
    query(collection(db, 'perpus_opname_item'), where('sesiId', '==', sesiId), limit(batas)),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as OpnameItem)
}

/** Catat satu pindai. Jika kode belum ada di sistem, tetap dicatat (temuan di luar katalog). */
export async function catatPindaiOpname(sesiId: string, eks: Eksemplar | null, kode: string): Promise<string> {
  const ref = await addDoc(collection(db, 'perpus_opname_item'), {
    sesiId,
    eksemplarId: kode.trim().toUpperCase(),
    ...(eks
      ? { bukuId: eks.bukuId, judul: eks.judul, statusSistem: eks.status }
      : {}),
    ditemukan: true,
    waktu: serverTimestamp(),
  })
  return ref.id
}
