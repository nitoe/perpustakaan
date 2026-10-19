import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export const AWALAN_KODE = 'PRP-'

/** 123 -> PRP-000123 */
export function kodeEksemplar(nomor: number): string {
  return AWALAN_KODE + String(nomor).padStart(6, '0')
}

/** PRP-000123 -> 123 (null bila bentuknya lain). */
export function nomorDariKode(kode: string): number | null {
  const m = /^PRP-(\d{1,9})$/.exec(kode.trim().toUpperCase())
  return m ? Number(m[1]) : null
}

/**
 * Memesan `jumlah` nomor berurutan dari penghitung perpus_config/penomoran dan mengembalikan nomor pertama.
 * Memakai transaksi, jadi dua pustakawan yang menambah buku bersamaan tidak mendapat kode yang sama.
 * Nomor yang sudah dipesan tidak dikembalikan bila penulisan berikutnya gagal (ada celah, tidak masalah).
 */
export async function pesanNomor(jumlah: number): Promise<number> {
  if (!Number.isInteger(jumlah) || jumlah < 1) throw new Error('Jumlah nomor tidak valid.')
  const ref = doc(db, 'perpus_config', 'penomoran')
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const terakhir = snap.exists() ? Number(snap.data().terakhir) || 0 : 0
    tx.set(ref, { terakhir: terakhir + jumlah, updatedAt: serverTimestamp() })
    return terakhir + 1
  })
}
