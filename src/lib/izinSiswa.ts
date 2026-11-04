import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from './firebase'
import type { SiswaDasar } from './sirkulasi'
import type { IzinSiswa } from './tipe'

/** Baca status izin satu siswa (tanpa auth — dipakai saat login). */
export async function bacaIzinSiswa(siswaId: string): Promise<IzinSiswa | null> {
  if (!isFirebaseConfigured || !siswaId.trim()) return null
  const snap = await getDoc(doc(db, 'perpus_izin_siswa', siswaId.trim()))
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<IzinSiswa, 'id'>) }
}

/** true bila dokumen izin ada dan aktif. */
export async function siswaIzinAktif(siswaId: string): Promise<boolean> {
  const izin = await bacaIzinSiswa(siswaId)
  return !!izin && izin.aktif !== false
}

/**
 * Daftar ID siswa yang sudah diaktifkan di perpustakaan (aktif: true).
 * Dipakai untuk filter dropdown login dan halaman aktivasi.
 */
export async function daftarIdIzinAktif(): Promise<Set<string>> {
  if (!isFirebaseConfigured) return new Set()
  const snap = await getDocs(
    query(collection(db, 'perpus_izin_siswa'), where('aktif', '==', true)),
  )
  return new Set(snap.docs.map((d) => d.id))
}

/** Semua dokumen izin (aktif & nonaktif) — untuk halaman admin. */
export async function daftarSemuaIzin(): Promise<IzinSiswa[]> {
  if (!isFirebaseConfigured) return []
  const snap = await getDocs(collection(db, 'perpus_izin_siswa'))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<IzinSiswa, 'id'>) }))
}

/** Aktifkan satu siswa (buat/update dokumen izin). */
export async function aktifkanSiswa(
  siswa: Pick<SiswaDasar, 'id' | 'nama' | 'kelas' | 'nisn'>,
  catatan?: string,
): Promise<void> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Belum masuk sebagai staf.')
  const id = siswa.id.trim()
  if (!id) throw new Error('ID siswa kosong.')
  await setDoc(
    doc(db, 'perpus_izin_siswa', id),
    {
      aktif: true,
      nama: siswa.nama || '',
      kelas: (siswa.kelas || '').toUpperCase(),
      nisn: (siswa.nisn || '').trim(),
      diaktifkanOleh: uid,
      diaktifkanAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(catatan?.trim() ? { catatan: catatan.trim().slice(0, 200) } : {}),
    },
    { merge: true },
  )
}

/** Nonaktifkan (tetap simpan dokumen agar riwayat terlihat). */
export async function nonaktifkanSiswa(siswaId: string): Promise<void> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Belum masuk sebagai staf.')
  const id = siswaId.trim()
  if (!id) throw new Error('ID siswa kosong.')
  await setDoc(
    doc(db, 'perpus_izin_siswa', id),
    {
      aktif: false,
      dinonaktifkanOleh: uid,
      dinonaktifkanAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

/**
 * Aktifkan banyak siswa sekaligus (maks. ~400 per batch).
 * Berguna untuk uji coba satu kelas.
 */
export async function aktifkanBanyak(
  daftar: Pick<SiswaDasar, 'id' | 'nama' | 'kelas' | 'nisn'>[],
): Promise<number> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Belum masuk sebagai staf.')
  if (daftar.length === 0) return 0
  let total = 0
  const chunk = 400
  for (let i = 0; i < daftar.length; i += chunk) {
    const batch = writeBatch(db)
    const potong = daftar.slice(i, i + chunk)
    for (const s of potong) {
      const id = s.id.trim()
      if (!id) continue
      batch.set(
        doc(db, 'perpus_izin_siswa', id),
        {
          aktif: true,
          nama: s.nama || '',
          kelas: (s.kelas || '').toUpperCase(),
          nisn: (s.nisn || '').trim(),
          diaktifkanOleh: uid,
          diaktifkanAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      total += 1
    }
    await batch.commit()
  }
  return total
}
