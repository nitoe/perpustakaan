/**
 * Peran di aplikasi perpustakaan. Kelak ditambah 'siswa' saat akun siswa dibuat
 * (lihat docs/RANCANGAN.md bagian 3); tambahkan juga di firestore.rules.perpustakaan.
 */
export type PeranPerpus = 'admin' | 'pustakawan' | 'pimpinan' | 'guru'

/** Profil di koleksi `users/{uid}` (dibagi dengan aplikasi Penilaian dan Sarpras). */
export interface AppUser {
  uid: string
  email: string
  nama: string
  gelar?: string
  /** Peran di Penilaian: admin, guru, guru_tahsin_tahfizh, guru_akademik, orangtua, dll. */
  role?: string
  /** Peran khusus aplikasi perpustakaan. Hanya admin yang boleh mengisinya. */
  peranPerpus?: PeranPerpus
  aktif?: boolean
}
