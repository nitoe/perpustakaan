import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  doc,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import type { Kunjungan, Pengunjung } from './tipe'
import type { SiswaDasar } from './sirkulasi'
import { idPeminjamSiswa } from './sirkulasi'

/** YYYY-MM-DD di zona lokal perangkat. */
export function tanggalHariIni(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function pengunjungDariSiswa(s: SiswaDasar): Pengunjung {
  return {
    tipe: 'siswa',
    id: idPeminjamSiswa(s),
    nama: s.nama,
    kelas: s.kelas,
  }
}

export async function catatKunjungan(pengunjung: Pengunjung, keperluan?: string): Promise<string> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Belum masuk.')
  const ref = await addDoc(collection(db, 'perpus_kunjungan'), {
    tanggal: tanggalHariIni(),
    waktu: Timestamp.fromDate(new Date()),
    pengunjung,
    ...(keperluan?.trim() ? { keperluan: keperluan.trim() } : {}),
    petugasUid: uid,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

/** Catat kunjungan banyak siswa sekaligus (satu kelas). Maks 100 per batch. */
export async function catatKunjunganBanyak(
  daftar: Pengunjung[],
  keperluan?: string,
): Promise<number> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Belum masuk.')
  if (daftar.length === 0) return 0
  const tanggal = tanggalHariIni()
  const sekarang = Timestamp.fromDate(new Date())
  let n = 0
  for (let i = 0; i < daftar.length; i += 400) {
    const chunk = daftar.slice(i, i + 400)
    const batch = writeBatch(db)
    for (const p of chunk) {
      const ref = doc(collection(db, 'perpus_kunjungan'))
      batch.set(ref, {
        tanggal,
        waktu: sekarang,
        pengunjung: p,
        ...(keperluan?.trim() ? { keperluan: keperluan.trim() } : {}),
        petugasUid: uid,
        createdAt: serverTimestamp(),
      })
    }
    await batch.commit()
    n += chunk.length
  }
  return n
}

export async function daftarKunjunganTanggal(tanggal: string, batas = 500): Promise<Kunjungan[]> {
  const snap = await getDocs(
    query(collection(db, 'perpus_kunjungan'), where('tanggal', '==', tanggal), limit(batas)),
  )
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as unknown as Kunjungan)
    .sort((a, b) => b.waktu.toMillis() - a.waktu.toMillis())
}

export async function daftarKunjunganRentang(dari: string, sampai: string, batas = 1000): Promise<Kunjungan[]> {
  // tanggal string YYYY-MM-DD bisa dibandingkan leksikografis.
  const snap = await getDocs(
    query(
      collection(db, 'perpus_kunjungan'),
      where('tanggal', '>=', dari),
      where('tanggal', '<=', sampai),
      orderBy('tanggal', 'desc'),
      limit(batas),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as Kunjungan)
}

/** Siswa aktif satu kelas (dari koleksi `siswa` Penilaian). */
export async function siswaPerKelas(kelas: string): Promise<SiswaDasar[]> {
  const snap = await getDocs(query(collection(db, 'siswa'), where('kelas', '==', kelas.trim().toUpperCase())))
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<SiswaDasar, 'id'>) }))
    .filter((s) => s.aktif !== false)
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
}

export function rekapPerKelas(list: Kunjungan[]): { kelas: string; jumlah: number }[] {
  const m = new Map<string, number>()
  for (const k of list) {
    const kl = k.pengunjung.kelas?.trim() || '(tanpa kelas)'
    m.set(kl, (m.get(kl) ?? 0) + 1)
  }
  return [...m.entries()]
    .map(([kelas, jumlah]) => ({ kelas, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah || a.kelas.localeCompare(b.kelas, 'id'))
}
