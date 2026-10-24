import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { kodeEksemplar, pesanNomor } from './penomoran'
import type { Buku, Eksemplar, KondisiBuku, StatusEksemplar } from './tipe'

/** Hanya tautan http/https yang boleh dibuka (menolak javascript:, data:, dll). */
export function tautanAman(u?: string | null): string | null {
  if (!u) return null
  try {
    const x = new URL(u.trim())
    return x.protocol === 'https:' || x.protocol === 'http:' ? x.toString() : null
  } catch {
    return null
  }
}

/** Bacaan untuk siswa/orang tua: publik, bukan cetak saja, dan tautan http/https. */
export function bisaDibacaPublik(b: Pick<Buku, 'publik' | 'jenis' | 'tautanDigital'>): string | null {
  if (!b.publik || b.jenis === 'cetak') return null
  return tautanAman(b.tautanDigital)
}

export type DataBuku = Omit<Buku, 'id' | 'eksemplarTotal' | 'eksemplarTersedia'>

export interface DataEksemplarBaru {
  jumlah: number
  rak?: string
  kondisi: KondisiBuku
  tahunMasuk?: number
  sumber?: string
}

export const MAKS_EKSEMPLAR_SEKALI = 100

/** Membuang field kosong ('' atau undefined). */
export function bersihkan<T extends Record<string, unknown>>(o: T): Record<string, unknown> {
  const h: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === '' || v === null) continue
    h[k] = v
  }
  return h
}

/** Untuk ubah data: field yang dikosongkan dihapus dari dokumen. */
function untukUbah(o: Record<string, unknown>): Record<string, unknown> {
  const h: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(o)) h[k] = v === undefined || v === '' || v === null ? deleteField() : v
  return h
}

function dokEksemplar(bukuId: string, judul: string, e: DataEksemplarBaru) {
  return {
    ...bersihkan({ rak: e.rak, tahunMasuk: e.tahunMasuk, sumber: e.sumber }),
    bukuId,
    judul,
    kondisi: e.kondisi,
    status: 'tersedia',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

/** Buku baru + eksemplarnya dalam satu batch. Mengembalikan ID buku. */
export async function buatBuku(data: DataBuku, e: DataEksemplarBaru | null): Promise<string> {
  const jumlah = e?.jumlah ?? 0
  const bukuRef = doc(collection(db, 'perpus_buku'))
  const awal = jumlah > 0 ? await pesanNomor(jumlah) : 0
  const batch = writeBatch(db)
  batch.set(bukuRef, {
    ...bersihkan(data),
    eksemplarTotal: jumlah,
    eksemplarTersedia: jumlah,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  for (let i = 0; i < jumlah; i++) {
    batch.set(doc(db, 'perpus_eksemplar', kodeEksemplar(awal + i)), dokEksemplar(bukuRef.id, data.judul, e!))
  }
  await batch.commit()
  return bukuRef.id
}

/** Ubah data buku. Bila judul berubah, salinan judul di eksemplar ikut diperbarui. */
export async function ubahBuku(awal: Buku, data: DataBuku): Promise<void> {
  await updateDoc(doc(db, 'perpus_buku', awal.id), { ...untukUbah(data as unknown as Record<string, unknown>), updatedAt: serverTimestamp() })
  if (data.judul !== awal.judul) {
    const snap = await getDocs(query(collection(db, 'perpus_eksemplar'), where('bukuId', '==', awal.id)))
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db)
      snap.docs.slice(i, i + 400).forEach((d) => batch.update(d.ref, { judul: data.judul, updatedAt: serverTimestamp() }))
      await batch.commit()
    }
  }
}

/** Menambah eksemplar pada buku yang sudah ada (penghitung buku ikut naik dalam batch yang sama). */
export async function tambahEksemplar(buku: Buku, e: DataEksemplarBaru): Promise<void> {
  if (e.jumlah < 1 || e.jumlah > MAKS_EKSEMPLAR_SEKALI) throw new Error(`Jumlah eksemplar 1 sampai ${MAKS_EKSEMPLAR_SEKALI}.`)
  const awal = await pesanNomor(e.jumlah)
  const batch = writeBatch(db)
  for (let i = 0; i < e.jumlah; i++) {
    batch.set(doc(db, 'perpus_eksemplar', kodeEksemplar(awal + i)), dokEksemplar(buku.id, buku.judul, e))
  }
  batch.update(doc(db, 'perpus_buku', buku.id), {
    eksemplarTotal: increment(e.jumlah),
    eksemplarTersedia: increment(e.jumlah),
    jenis: buku.jenis === 'digital' ? 'keduanya' : buku.jenis,
    updatedAt: serverTimestamp(),
  })
  await batch.commit()
}

export async function ubahDataEksemplar(id: string, data: { rak?: string; kondisi: KondisiBuku }) {
  await updateDoc(doc(db, 'perpus_eksemplar', id), {
    rak: data.rak ? data.rak : deleteField(),
    kondisi: data.kondisi,
    updatedAt: serverTimestamp(),
  })
}

const PERALIHAN: Record<string, StatusEksemplar[]> = {
  tersedia: ['hilang', 'dihapus'],
  hilang: ['tersedia', 'dihapus'],
}

/**
 * Ubah status eksemplar di luar sirkulasi (hilang, ditemukan, dikeluarkan dari koleksi).
 * eksemplarTotal = eksemplar yang belum dikeluarkan; eksemplarTersedia = yang berstatus tersedia.
 * Eksemplar yang sedang dipinjam tidak boleh diubah di sini (selesaikan lewat sirkulasi).
 */
export async function ubahStatusEksemplar(e: Eksemplar, baru: StatusEksemplar): Promise<void> {
  if (e.status === 'dipinjam') throw new Error('Buku ini sedang dipinjam. Selesaikan pengembalian lebih dulu.')
  if (!PERALIHAN[e.status]?.includes(baru)) throw new Error('Perubahan status ini tidak diizinkan.')
  const dTotal = baru === 'dihapus' ? -1 : 0
  const dTersedia = (e.status === 'tersedia' ? -1 : 0) + (baru === 'tersedia' ? 1 : 0)
  const batch = writeBatch(db)
  batch.update(doc(db, 'perpus_eksemplar', e.id), { status: baru, updatedAt: serverTimestamp() })
  if (dTotal !== 0 || dTersedia !== 0) {
    batch.update(doc(db, 'perpus_buku', e.bukuId), {
      ...(dTotal !== 0 ? { eksemplarTotal: increment(dTotal) } : {}),
      ...(dTersedia !== 0 ? { eksemplarTersedia: increment(dTersedia) } : {}),
      updatedAt: serverTimestamp(),
    })
  }
  await batch.commit()
}

/** Hapus buku hanya bila tidak punya eksemplar sama sekali (admin; riwayat tidak boleh yatim). */
export async function hapusBuku(id: string): Promise<void> {
  const ada = await getDocs(query(collection(db, 'perpus_eksemplar'), where('bukuId', '==', id), limit(1)))
  if (!ada.empty) throw new Error('Buku ini masih punya catatan eksemplar sehingga tidak bisa dihapus (riwayatnya tetap tersimpan).')
  await deleteDoc(doc(db, 'perpus_buku', id))
}
