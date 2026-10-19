import type { PeranPerpus } from '../types/user'

export interface MenuItem {
  path: string
  label: string
  /** Peran yang boleh melihat menu ini. */
  untuk: PeranPerpus[]
  /** false = modul belum dibuat, tidak ditampilkan di menu. Ubah jadi true saat halamannya jadi. */
  aktif: boolean
}

const SEMUA: PeranPerpus[] = ['admin', 'pustakawan', 'pimpinan', 'guru']
const KELOLA: PeranPerpus[] = ['admin', 'pustakawan']

export const MENU: MenuItem[] = [
  { path: '/', label: 'Beranda', untuk: SEMUA, aktif: true },
  { path: '/katalog', label: 'Katalog', untuk: SEMUA, aktif: false },
  { path: '/digital', label: 'Digital', untuk: SEMUA, aktif: false },
  { path: '/sirkulasi', label: 'Sirkulasi', untuk: KELOLA, aktif: false },
  { path: '/kunjungan', label: 'Kunjungan', untuk: KELOLA, aktif: false },
  { path: '/anggota', label: 'Anggota', untuk: KELOLA, aktif: false },
  { path: '/laporan', label: 'Laporan', untuk: ['admin', 'pustakawan', 'pimpinan'], aktif: false },
]

export function menuUntuk(peran: PeranPerpus | null): MenuItem[] {
  if (!peran) return []
  return MENU.filter((m) => m.aktif && m.untuk.includes(peran))
}
