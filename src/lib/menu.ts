import type { PeranPerpus } from '../types/user'

export interface MenuItem {
  path: string
  label: string
  untuk: PeranPerpus[]
  aktif: boolean
}

const SEMUA: PeranPerpus[] = ['admin', 'pustakawan', 'pimpinan', 'guru']
const KELOLA: PeranPerpus[] = ['admin', 'pustakawan']

export const MENU: MenuItem[] = [
  { path: '/', label: 'Beranda', untuk: SEMUA, aktif: true },
  { path: '/katalog', label: 'Katalog', untuk: SEMUA, aktif: true },
  { path: '/digital', label: 'Digital', untuk: SEMUA, aktif: true },
  { path: '/kategori', label: 'Kategori', untuk: KELOLA, aktif: true },
  { path: '/anggota', label: 'Anggota', untuk: KELOLA, aktif: true },
  { path: '/impor', label: 'Impor', untuk: KELOLA, aktif: true },
  { path: '/label', label: 'Label', untuk: KELOLA, aktif: true },
  { path: '/kartu', label: 'Kartu', untuk: KELOLA, aktif: true },
  { path: '/sirkulasi', label: 'Sirkulasi', untuk: KELOLA, aktif: true },
  { path: '/reservasi', label: 'Reservasi', untuk: KELOLA, aktif: true },
  { path: '/kunjungan', label: 'Kunjungan', untuk: KELOLA, aktif: true },
  { path: '/opname', label: 'Opname', untuk: KELOLA, aktif: true },
  { path: '/usulan', label: 'Usulan', untuk: SEMUA, aktif: true },
  { path: '/laporan', label: 'Laporan', untuk: ['admin', 'pustakawan', 'pimpinan'], aktif: true },
  { path: '/pengaturan', label: 'Pengaturan', untuk: SEMUA, aktif: true },
]

export function menuUntuk(peran: PeranPerpus | null): MenuItem[] {
  if (!peran) return []
  return MENU.filter((m) => m.aktif && m.untuk.includes(peran))
}
