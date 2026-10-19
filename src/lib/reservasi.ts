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
import type { Peminjam, Reservasi, StatusReservasi } from './tipe'

export async function buatReservasi(args: {
  bukuId: string
  judul: string
  pemesan: Peminjam
  catatan?: string
}): Promise<string> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Belum masuk.')
  const ref = await addDoc(collection(db, 'perpus_reservasi'), {
    bukuId: args.bukuId,
    judul: args.judul,
    pemesan: args.pemesan,
    status: 'antrian' as StatusReservasi,
    petugasUid: uid,
    ...(args.catatan?.trim() ? { catatan: args.catatan.trim() } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function ubahStatusReservasi(id: string, status: StatusReservasi, catatan?: string): Promise<void> {
  await updateDoc(doc(db, 'perpus_reservasi', id), {
    status,
    ...(catatan !== undefined ? { catatan: catatan || null } : {}),
    updatedAt: serverTimestamp(),
  })
}

export async function daftarReservasiAktif(batas = 200): Promise<Reservasi[]> {
  const snap = await getDocs(
    query(collection(db, 'perpus_reservasi'), where('status', 'in', ['antrian', 'siap']), limit(batas)),
  )
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as unknown as Reservasi)
    .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0))
}

export async function reservasiPerBuku(bukuId: string): Promise<Reservasi[]> {
  const snap = await getDocs(
    query(
      collection(db, 'perpus_reservasi'),
      where('bukuId', '==', bukuId),
      where('status', 'in', ['antrian', 'siap']),
      limit(50),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as Reservasi)
}
