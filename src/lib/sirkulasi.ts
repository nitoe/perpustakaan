import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import type { Anggota, Aturan, Eksemplar, KondisiBuku, Peminjam, Peminjaman } from './tipe'
import { ATURAN_BAWAAN } from './tipe'

/** Data dasar siswa dari koleksi `siswa` (Penilaian). ID dokumen = NIPD; kartu anggota memakai NISN. */
export interface SiswaDasar {
  id: string
  nama: string
  kelas?: string
  nisn?: string
  nipd?: string
  aktif?: boolean
}

export async function ambilAturan(): Promise<Aturan> {
  const snap = await getDoc(doc(db, 'perpus_config', 'aturan'))
  if (!snap.exists()) return { ...ATURAN_BAWAAN }
  const d = snap.data()
  return {
    lamaPinjamHari: typeof d.lamaPinjamHari === 'number' ? d.lamaPinjamHari : ATURAN_BAWAAN.lamaPinjamHari,
    maksSiswa: typeof d.maksSiswa === 'number' ? d.maksSiswa : ATURAN_BAWAAN.maksSiswa,
    maksAnggota: typeof d.maksAnggota === 'number' ? d.maksAnggota : ATURAN_BAWAAN.maksAnggota,
    maksPerpanjang: typeof d.maksPerpanjang === 'number' ? d.maksPerpanjang : ATURAN_BAWAAN.maksPerpanjang,
  }
}

/**
 * Cari siswa lewat NISN (kartu anggota). Bila tidak ketemu, coba ID dokumen (NIPD)
 * supaya masih bisa dilayani jika petugas mengetik nomor induk.
 */
export async function cariSiswa(kode: string): Promise<SiswaDasar | null> {
  const k = kode.trim()
  if (!k) return null
  const byNisn = await getDocs(query(collection(db, 'siswa'), where('nisn', '==', k), limit(2)))
  if (!byNisn.empty) {
    const d = byNisn.docs[0]!
    return { id: d.id, ...(d.data() as Omit<SiswaDasar, 'id'>) }
  }
  const byId = await getDoc(doc(db, 'siswa', k))
  if (byId.exists()) return { id: byId.id, ...(byId.data() as Omit<SiswaDasar, 'id'>) }
  return null
}

export async function cariAnggota(id: string): Promise<Anggota | null> {
  const snap = await getDoc(doc(db, 'perpus_anggota', id.trim()))
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<Anggota, 'id'>) }
}

export async function ambilEksemplar(kode: string): Promise<Eksemplar | null> {
  const snap = await getDoc(doc(db, 'perpus_eksemplar', kode.trim().toUpperCase()))
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<Eksemplar, 'id'>) }
}

/** Peminjaman aktif satu peminjam (peminjam.id = NISN untuk siswa, atau ID anggota). */
export async function pinjamanAktifPeminjam(peminjamId: string): Promise<Peminjaman[]> {
  const snap = await getDocs(
    query(
      collection(db, 'perpus_peminjaman'),
      where('peminjam.id', '==', peminjamId),
      where('status', '==', 'dipinjam'),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as Peminjaman)
}

/** Semua pinjaman aktif (untuk daftar / terlambat). Batas 300 agar hemat kuota. */
export async function daftarPinjamanAktif(batas = 300): Promise<Peminjaman[]> {
  const snap = await getDocs(
    query(collection(db, 'perpus_peminjaman'), where('status', '==', 'dipinjam'), limit(batas)),
  )
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as unknown as Peminjaman)
    .sort((a, b) => a.jatuhTempo.toMillis() - b.jatuhTempo.toMillis())
}

/** ID yang disimpan di peminjaman: NISN bila ada, selain itu ID dokumen siswa (NIPD). */
export function idPeminjamSiswa(s: SiswaDasar): string {
  return (s.nisn && s.nisn.trim()) || s.id
}

function kePeminjamSiswa(s: SiswaDasar): Peminjam {
  return {
    tipe: 'siswa',
    id: idPeminjamSiswa(s),
    nama: s.nama,
    kelas: s.kelas,
  }
}

function kePeminjamAnggota(a: Anggota): Peminjam {
  return { tipe: 'anggota', id: a.id, nama: a.nama }
}

function tambahHari(dari: Date, hari: number): Date {
  const t = new Date(dari)
  t.setHours(23, 59, 59, 999)
  t.setDate(t.getDate() + hari)
  return t
}

export interface HasilPinjam {
  peminjamanId: string
  jatuhTempo: Date
}

/**
 * Pinjam satu eksemplar. Satu writeBatch: peminjaman + status eksemplar + penghitung buku.
 * Rules memeriksa status tersedia → dipinjam lewat getAfter().
 */
export async function pinjam(args: {
  eksemplar: Eksemplar
  peminjam: Peminjam
  aturan: Aturan
  aktifSekarang: number
  catatan?: string
}): Promise<HasilPinjam> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Belum masuk.')
  const { eksemplar: e, peminjam, aturan, aktifSekarang, catatan } = args

  if (e.status !== 'tersedia') throw new Error(`Eksemplar ${e.id} tidak tersedia (status: ${e.status}).`)
  const maks = peminjam.tipe === 'siswa' ? aturan.maksSiswa : aturan.maksAnggota
  if (aktifSekarang >= maks) {
    throw new Error(
      peminjam.tipe === 'siswa'
        ? `Siswa ini sudah meminjam ${aktifSekarang} buku (batas ${maks}).`
        : `Anggota ini sudah meminjam ${aktifSekarang} buku (batas ${maks}).`,
    )
  }

  const sekarang = new Date()
  const jatuh = tambahHari(sekarang, aturan.lamaPinjamHari)
  const pinjamRef = doc(collection(db, 'perpus_peminjaman'))
  const batch = writeBatch(db)
  batch.set(pinjamRef, {
    eksemplarId: e.id,
    bukuId: e.bukuId,
    judul: e.judul,
    peminjam,
    tglPinjam: Timestamp.fromDate(sekarang),
    jatuhTempo: Timestamp.fromDate(jatuh),
    status: 'dipinjam',
    jumlahPerpanjang: 0,
    petugasUid: uid,
    ...(catatan?.trim() ? { catatan: catatan.trim() } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  batch.update(doc(db, 'perpus_eksemplar', e.id), {
    status: 'dipinjam',
    updatedAt: serverTimestamp(),
  })
  batch.update(doc(db, 'perpus_buku', e.bukuId), {
    eksemplarTersedia: increment(-1),
    updatedAt: serverTimestamp(),
  })
  await batch.commit()
  return { peminjamanId: pinjamRef.id, jatuhTempo: jatuh }
}

/**
 * Kembalikan buku. Satu writeBatch: status dikembalikan + eksemplar tersedia/hilang + penghitung.
 */
export async function kembalikan(args: {
  pinjam: Peminjaman
  kondisiKembali?: KondisiBuku
  hilang?: boolean
  catatan?: string
}): Promise<void> {
  const { pinjam: p, kondisiKembali, hilang, catatan } = args
  if (p.status !== 'dipinjam') throw new Error('Peminjaman ini sudah dikembalikan.')

  const statusEks = hilang ? 'hilang' : 'tersedia'
  const batch = writeBatch(db)
  batch.update(doc(db, 'perpus_peminjaman', p.id), {
    status: 'dikembalikan',
    tglKembali: Timestamp.fromDate(new Date()),
    ...(kondisiKembali ? { kondisiKembali } : {}),
    ...(catatan?.trim() ? { catatan: catatan.trim() } : {}),
    updatedAt: serverTimestamp(),
  })
  batch.update(doc(db, 'perpus_eksemplar', p.eksemplarId), {
    status: statusEks,
    ...(kondisiKembali ? { kondisi: kondisiKembali } : {}),
    updatedAt: serverTimestamp(),
  })
  if (!hilang) {
    batch.update(doc(db, 'perpus_buku', p.bukuId), {
      eksemplarTersedia: increment(1),
      updatedAt: serverTimestamp(),
    })
  }
  await batch.commit()
}

/** Perpanjang jatuh tempo. Tidak mengubah eksemplar. */
export async function perpanjang(p: Peminjaman, aturan: Aturan): Promise<Date> {
  if (p.status !== 'dipinjam') throw new Error('Hanya pinjaman aktif yang bisa diperpanjang.')
  if (p.jumlahPerpanjang >= aturan.maksPerpanjang) {
    throw new Error(`Sudah diperpanjang ${p.jumlahPerpanjang} kali (batas ${aturan.maksPerpanjang}).`)
  }
  const dasar = p.jatuhTempo.toDate()
  const baru = tambahHari(dasar > new Date() ? dasar : new Date(), aturan.lamaPinjamHari)
  await updateDoc(doc(db, 'perpus_peminjaman', p.id), {
    jatuhTempo: Timestamp.fromDate(baru),
    jumlahPerpanjang: p.jumlahPerpanjang + 1,
    updatedAt: serverTimestamp(),
  })
  return baru
}

export function formatTanggal(t: Timestamp | Date | undefined): string {
  if (!t) return '—'
  const d = t instanceof Date ? t : t.toDate()
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function terlambat(p: Peminjaman, sekarang = Date.now()): boolean {
  return p.status === 'dipinjam' && p.jatuhTempo.toMillis() < sekarang
}

export { kePeminjamSiswa, kePeminjamAnggota }
