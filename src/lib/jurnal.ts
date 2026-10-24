import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  where,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import type { JurnalBaca } from './tipe'

/** YYYY-MM-DD di zona lokal. */
export function tanggalHariIni(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function formatTanggalJurnal(t: string | Timestamp | undefined): string {
  if (!t) return '—'
  if (typeof t === 'string') {
    const [y, m, d] = t.split('-').map(Number)
    if (!y || !m || !d) return t
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }
  return t.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Jurnal satu siswa (kueri wajib filter siswaId). */
export async function daftarJurnalSiswa(siswaId: string, batas = 50): Promise<JurnalBaca[]> {
  const snap = await getDocs(
    query(
      collection(db, 'perpus_jurnal'),
      where('siswaId', '==', siswaId),
      orderBy('tanggalBaca', 'desc'),
      limit(batas),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as JurnalBaca)
}

/** Daftar untuk staf: filter kelas opsional. */
export async function daftarJurnalStaf(opts?: {
  kelas?: string
  batas?: number
}): Promise<JurnalBaca[]> {
  const batas = opts?.batas ?? 100
  const kelas = opts?.kelas?.trim().toUpperCase()
  const q = kelas
    ? query(
        collection(db, 'perpus_jurnal'),
        where('kelas', '==', kelas),
        orderBy('tanggalBaca', 'desc'),
        limit(batas),
      )
    : query(collection(db, 'perpus_jurnal'), orderBy('tanggalBaca', 'desc'), limit(batas))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as JurnalBaca)
}

export async function buatJurnal(args: {
  siswaId: string
  siswaNama: string
  kelas: string
  judul: string
  pengarang?: string
  bukuId?: string
  catatan: string
  tanggalBaca?: string
}): Promise<string> {
  const judul = args.judul.trim()
  const catatan = args.catatan.trim()
  if (!judul) throw new Error('Judul buku wajib diisi.')
  if (judul.length > 300) throw new Error('Judul terlalu panjang.')
  if (!catatan) throw new Error('Tulis sedikit kesan atau ringkasan bacaan.')
  if (catatan.length > 2000) throw new Error('Catatan maksimal 2000 karakter.')

  const data: Record<string, unknown> = {
    siswaId: args.siswaId,
    siswaNama: args.siswaNama.trim(),
    kelas: (args.kelas || '').trim().toUpperCase(),
    judul,
    catatan,
    tanggalBaca: args.tanggalBaca?.trim() || tanggalHariIni(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  if (args.pengarang?.trim()) data.pengarang = args.pengarang.trim()
  if (args.bukuId?.trim()) data.bukuId = args.bukuId.trim()

  const ref = await addDoc(collection(db, 'perpus_jurnal'), data)
  return ref.id
}

/** Staf: isi atau ubah tanggapan guru. */
export async function tanggapiJurnal(
  id: string,
  tanggapan: string,
  guru: { uid: string; nama: string },
): Promise<void> {
  const t = tanggapan.trim()
  if (!t) throw new Error('Tanggapan tidak boleh kosong.')
  if (t.length > 2000) throw new Error('Tanggapan maksimal 2000 karakter.')
  if (!auth.currentUser) throw new Error('Belum masuk sebagai staf.')

  await updateDoc(doc(db, 'perpus_jurnal', id), {
    tanggapanGuru: t,
    guruUid: guru.uid,
    guruNama: guru.nama,
    updatedAt: serverTimestamp(),
  })
}
