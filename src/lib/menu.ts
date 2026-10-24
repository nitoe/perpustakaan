import type { PeranPerpus } from '../types/user'

export interface MenuItem {
  path: string
  label: string
  untuk: PeranPerpus[]
  aktif: boolean
  /** Id grup untuk sidebar; item tanpa grup tampil di atas. */
  grup?: string
}

export interface MenuGrup {
  id: string
  label: string
}

const SEMUA: PeranPerpus[] = ['admin', 'pustakawan', 'pimpinan', 'guru']
const KELOLA: PeranPerpus[] = ['admin', 'pustakawan']
const LAPORAN: PeranPerpus[] = ['admin', 'pustakawan', 'pimpinan']

/** Urutan dan label bagian di sidebar. */
export const MENU_GRUP: MenuGrup[] = [
  { id: 'koleksi', label: 'Koleksi' },
  { id: 'layanan', label: 'Layanan' },
  { id: 'data', label: 'Data & inventaris' },
  { id: 'literasi', label: 'Literasi' },
  { id: 'sistem', label: 'Sistem' },
]

export const MENU: MenuItem[] = [
  { path: '/', label: 'Beranda', untuk: SEMUA, aktif: true },

  { path: '/katalog', label: 'Katalog', untuk: SEMUA, aktif: true, grup: 'koleksi' },
  { path: '/digital', label: 'Digital', untuk: SEMUA, aktif: true, grup: 'koleksi' },
  { path: '/kategori', label: 'Kategori', untuk: KELOLA, aktif: true, grup: 'koleksi' },

  { path: '/sirkulasi', label: 'Sirkulasi', untuk: KELOLA, aktif: true, grup: 'layanan' },
  { path: '/reservasi', label: 'Reservasi', untuk: KELOLA, aktif: true, grup: 'layanan' },
  { path: '/kunjungan', label: 'Kunjungan', untuk: KELOLA, aktif: true, grup: 'layanan' },
  { path: '/anggota', label: 'Anggota', untuk: KELOLA, aktif: true, grup: 'layanan' },

  { path: '/impor', label: 'Impor', untuk: KELOLA, aktif: true, grup: 'data' },
  { path: '/label', label: 'Label', untuk: KELOLA, aktif: true, grup: 'data' },
  { path: '/kartu', label: 'Kartu', untuk: KELOLA, aktif: true, grup: 'data' },
  { path: '/opname', label: 'Opname', untuk: KELOLA, aktif: true, grup: 'data' },

  { path: '/usulan', label: 'Usulan', untuk: SEMUA, aktif: true, grup: 'literasi' },
  { path: '/jurnal', label: 'Jurnal baca', untuk: SEMUA, aktif: true, grup: 'literasi' },

  { path: '/laporan', label: 'Laporan', untuk: LAPORAN, aktif: true, grup: 'sistem' },
  { path: '/pengaturan', label: 'Pengaturan', untuk: SEMUA, aktif: true, grup: 'sistem' },
]

export function menuUntuk(peran: PeranPerpus | null): MenuItem[] {
  if (!peran) return []
  return MENU.filter((m) => m.aktif && m.untuk.includes(peran))
}

/** Menu terkelompok untuk sidebar; grup kosong dilewati. */
export function menuTerkelompok(peran: PeranPerpus | null): {
  atas: MenuItem[]
  grup: { id: string; label: string; items: MenuItem[] }[]
} {
  const semua = menuUntuk(peran)
  const atas = semua.filter((m) => !m.grup)
  const grup = MENU_GRUP.map((g) => ({
    id: g.id,
    label: g.label,
    items: semua.filter((m) => m.grup === g.id),
  })).filter((g) => g.items.length > 0)
  return { atas, grup }
}
