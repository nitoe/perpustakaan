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
import type { StatusUsulan, Usulan } from './tipe'

export async function ajukanUsulan(args: {
  judul: string
  pengarang?: string
  penerbit?: string
  isbn?: string
  alasan?: string
  pengusulNama: string
}): Promise<string> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Belum masuk.')
  const judul = args.judul.trim()
  if (!judul) throw new Error('Judul wajib diisi.')
  const ref = await addDoc(collection(db, 'perpus_usulan'), {
    judul,
    ...(args.pengarang?.trim() ? { pengarang: args.pengarang.trim() } : {}),
    ...(args.penerbit?.trim() ? { penerbit: args.penerbit.trim() } : {}),
    ...(args.isbn?.trim() ? { isbn: args.isbn.trim() } : {}),
    ...(args.alasan?.trim() ? { alasan: args.alasan.trim() } : {}),
    pengusulUid: uid,
    pengusulNama: args.pengusulNama,
    status: 'diajukan' as StatusUsulan,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function putuskanUsulan(
  id: string,
  status: 'disetujui' | 'ditolak',
  catatanAdmin?: string,
): Promise<void> {
  await updateDoc(doc(db, 'perpus_usulan', id), {
    status,
    ...(catatanAdmin?.trim() ? { catatanAdmin: catatanAdmin.trim() } : {}),
    updatedAt: serverTimestamp(),
  })
}

export async function batalkanUsulanSendiri(id: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'perpus_usulan', id), {
    status: 'dibatalkan',
    updatedAt: serverTimestamp(),
  })
  void uid
}

export async function daftarUsulan(status?: StatusUsulan, batas = 150): Promise<Usulan[]> {
  const q = status
    ? query(collection(db, 'perpus_usulan'), where('status', '==', status), limit(batas))
    : query(collection(db, 'perpus_usulan'), limit(batas))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as unknown as Usulan)
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
}
