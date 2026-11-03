const PREFIX = 'perpus_progress_'

function kunci(nisn: string, bukuId: string) {
  return `${PREFIX}${nisn}_${bukuId}`
}

export function bacaProgress(nisn: string, bukuId: string): number {
  try {
    const raw = localStorage.getItem(kunci(nisn, bukuId))
    const n = raw ? Number(raw) : 1
    return Number.isInteger(n) && n >= 1 ? n : 1
  } catch {
    return 1
  }
}

export function simpanProgress(nisn: string, bukuId: string, halaman: number) {
  try {
    if (halaman >= 1) localStorage.setItem(kunci(nisn, bukuId), String(halaman))
  } catch {
    /* kuota / mode privat */
  }
}
