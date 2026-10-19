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
  { path: '/katalog', label: 'Katalog', untuk: SEMUA, aktif: true },
  { path: '/digital', label: 'Digital', untuk: SEMUA, aktif: true },
  { path: '/kategori', label: 'Kategori', untuk: KELOLA, aktif: true },
  { path: '/impor', label: 'Impor', untuk: KELOLA, aktif: true },
  { path: '/label', label: 'Label', untuk: KELOLA, aktif: true },
  { path: '/sirkulasi', label: 'Sirkulasi', untuk: KELOLA, aktif: true },
  { path: '/kunjungan', label: 'Kunjungan', untuk: KELOLA, aktif: true },
  { path: '/laporan', label: 'Laporan', untuk: ['admin', 'pustakawan', 'pimpinan'], aktif: true },
  { path: '/anggota', label: 'Anggota', untuk: KELOLA, aktif: false },
]

export function menuUntuk(peran: PeranPerpus | null): MenuItem[] {
  if (!peran) return []
  return MENU.filter((m) => m.aktif && m.untuk.includes(peran))
}
