import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { Aturan } from './tipe'
import { ATURAN_BAWAAN } from './tipe'

export async function ambilAturanConfig(): Promise<Aturan> {
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

/** Hanya admin (rules: write perpus_config = perpusAdmin, kecuali penomoran). */
export async function simpanAturanConfig(a: Aturan): Promise<void> {
  if (!Number.isInteger(a.lamaPinjamHari) || a.lamaPinjamHari < 1 || a.lamaPinjamHari > 365) {
    throw new Error('Lama pinjam harus 1–365 hari.')
  }
  if (!Number.isInteger(a.maksSiswa) || a.maksSiswa < 1 || a.maksSiswa > 50) {
    throw new Error('Maks pinjaman siswa harus 1–50.')
  }
  if (!Number.isInteger(a.maksAnggota) || a.maksAnggota < 1 || a.maksAnggota > 50) {
    throw new Error('Maks pinjaman anggota harus 1–50.')
  }
  if (!Number.isInteger(a.maksPerpanjang) || a.maksPerpanjang < 0 || a.maksPerpanjang > 10) {
    throw new Error('Maks perpanjang harus 0–10.')
  }
  await setDoc(
    doc(db, 'perpus_config', 'aturan'),
    {
      lamaPinjamHari: a.lamaPinjamHari,
      maksSiswa: a.maksSiswa,
      maksAnggota: a.maksAnggota,
      maksPerpanjang: a.maksPerpanjang,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
