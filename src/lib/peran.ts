import type { AppUser, PeranPerpus } from '../types/user'

const PERAN_VALID: PeranPerpus[] = ['admin', 'pustakawan', 'pimpinan', 'guru']
const ROLE_GURU = ['guru', 'guru_tahsin_tahfizh', 'guru_akademik']

export const NAMA_PERAN: Record<PeranPerpus, string> = {
  admin: 'Admin Perpustakaan',
  pustakawan: 'Pustakawan',
  pimpinan: 'Pimpinan',
  guru: 'Guru / Karyawan',
}

/**
 * Peran efektif di aplikasi perpustakaan. Aturannya HARUS sama dengan fungsi `peranPerpus()`
 * di firestore.rules.perpustakaan: admin Penilaian = admin perpustakaan; selain itu field
 * `peranPerpus` pada users/{uid}; bila kosong, semua jenis guru = 'guru'. Selain itu: tidak punya akses.
 * Ini hanya untuk tampilan. Penegakan akses yang sebenarnya ada di Firestore rules.
 */
export function peranDari(profil: AppUser | null): PeranPerpus | null {
  if (!profil || profil.aktif === false) return null
  if (profil.role === 'admin') return 'admin'
  // Bila field ada tetapi isinya tidak dikenal, rules menolak akses; tampilan ikut menolak.
  if (profil.peranPerpus) return PERAN_VALID.includes(profil.peranPerpus) ? profil.peranPerpus : null
  if (profil.role && ROLE_GURU.includes(profil.role)) return 'guru'
  return null
}
