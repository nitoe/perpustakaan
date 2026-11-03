import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

const PREFIX = 'perpus_progress_'

function kunciLokal(nisn: string, bukuId: string) {
  return `${PREFIX}${nisn}_${bukuId}`
}

function idDokumen(nisn: string, bukuId: string) {
  return `${nisn}_${bukuId}`.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function halamanSah(n: unknown): number | null {
  const h = Number(n)
  return Number.isInteger(h) && h >= 1 ? h : null
}

/** Baca progress: Firestore dulu, lalu localStorage. */
export async function bacaProgress(nisn: string, bukuId: string): Promise<number> {
  try {
    const ref = doc(db, 'perpus_progress', idDokumen(nisn, bukuId))
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const h = halamanSah(snap.data().halaman)
      if (h) {
        try {
          localStorage.setItem(kunciLokal(nisn, bukuId), String(h))
        } catch {
          /* abaikan */
        }
        return h
      }
    }
  } catch {
    /* fallback ke lokal */
  }
  try {
    const raw = localStorage.getItem(kunciLokal(nisn, bukuId))
    const n = halamanSah(raw)
    return n ?? 1
  } catch {
    return 1
  }
}

/** Simpan progress ke localStorage dan Firestore. */
export async function simpanProgress(
  nisn: string,
  bukuId: string,
  halaman: number,
  totalHalaman?: number,
  judul?: string,
) {
  if (halaman < 1) return
  try {
    localStorage.setItem(kunciLokal(nisn, bukuId), String(halaman))
  } catch {
    /* kuota / mode privat */
  }
  // Mode pratinjau tidak menulis ke Firestore.
  if (nisn === '0000000000' || nisn === 'tamu') return
  try {
    const data: Record<string, unknown> = {
      siswaId: nisn,
      bukuId,
      halaman,
      updatedAt: serverTimestamp(),
    }
    if (totalHalaman && totalHalaman >= 1) data.totalHalaman = totalHalaman
    if (judul) data.judul = judul.slice(0, 300)
    await setDoc(doc(db, 'perpus_progress', idDokumen(nisn, bukuId)), data, { merge: true })
  } catch {
    /* gagal tulis remote tidak mengganggu baca */
  }
}
