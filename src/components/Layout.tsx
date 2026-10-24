import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../lib/auth'
import { NAMA_PERAN } from '../lib/peran'
import { menuTerkelompok, menuUntuk } from '../lib/menu'

/** Pintasan di bilah bawah (HP); menu lengkap tetap di sidebar desktop. */
const MENU_BAWAH = ['/', '/katalog', '/sirkulasi', '/kunjungan', '/pengaturan']

/** Pola sama dengan Penilaian: lebar dikontrol di shell Layout, bukan max-w sempit di tiap halaman. */
/** Halaman data/tabel/dashboard — pakai lebar penuh area kerja. */
const HALAMAN_LEBAR = [
  '/',
  '/katalog',
  '/digital',
  '/impor',
  '/label',
  '/kartu',
  '/laporan',
  '/sirkulasi',
  '/kunjungan',
  '/reservasi',
  '/opname',
  '/anggota',
  '/kategori',
  '/usulan',
  '/jurnal',
]

/** Form ringkas — kolom terbaca, tidak melebar sia-sia. */
const HALAMAN_SEMPIT = ['/pengaturan', '/katalog/baru']

const STORAGE_KEY = 'perpus.menu.buka'

function bacaBuka(): Record<string, boolean> {
  try {
    const mentah = localStorage.getItem(STORAGE_KEY)
    if (!mentah) return {}
    const o = JSON.parse(mentah) as Record<string, boolean>
    return o && typeof o === 'object' ? o : {}
  } catch {
    return {}
  }
}

function simpanBuka(v: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
  } catch {
    /* kuota / mode privat */
  }
}

export default function Layout() {
  const { profil, peran } = useAuth()
  const lokasi = useLocation()
  const { atas, grup } = menuTerkelompok(peran)
  const menuBawah = menuUntuk(peran).filter((m) => MENU_BAWAH.includes(m.path))

  /** Grup yang memuat rute aktif selalu dianggap terbuka. */
  const grupAktif = useMemo(() => {
    const path = lokasi.pathname
    for (const g of grup) {
      if (g.items.some((m) => (m.path === '/' ? path === '/' : path === m.path || path.startsWith(m.path + '/')))) {
        return g.id
      }
    }
    return null
  }, [grup, lokasi.pathname])

  const [buka, setBuka] = useState<Record<string, boolean>>(() => bacaBuka())

  useEffect(() => {
    if (grupAktif && buka[grupAktif] === false) {
      setBuka((prev) => {
        const next = { ...prev, [grupAktif]: true }
        simpanBuka(next)
        return next
      })
    }
  }, [grupAktif, buka])

  function toggleGrup(id: string) {
    setBuka((prev) => {
      const sekarang = prev[id] !== false // default terbuka
      const next = { ...prev, [id]: !sekarang }
      simpanBuka(next)
      return next
    })
  }

  function grupTerbuka(id: string): boolean {
    if (id === grupAktif) return true
    return buka[id] !== false // default: terbuka
  }

  const kelasLink = ({ isActive }: { isActive: boolean }) =>
    `flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
      isActive ? 'bg-white/10 text-white' : 'text-muh-200 hover:bg-white/5 hover:text-white'
    }`

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col gap-1 bg-muh-800 p-3 lg:flex print:hidden">
        <div className="mb-3 flex items-center gap-2.5 px-2 py-1">
          <div className="auth-logo-tile auth-logo-tile--light" style={{ height: '2.25rem', width: '2.25rem' }}>
            <img src="/logo-sdm.png" alt="" className="h-8 w-8 object-contain" />
          </div>
          <div className="leading-tight text-white">
            <div className="text-sm font-semibold">Perpustakaan</div>
            <div className="text-xs text-muh-200">SDM 01 Kukusan</div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          {atas.length > 0 && (
            <div className="space-y-0.5">
              {atas.map((m) => (
                <NavLink key={m.path} to={m.path} end={m.path === '/'} className={kelasLink}>
                  {m.label}
                </NavLink>
              ))}
            </div>
          )}

          {grup.map((g) => {
            const terbuka = grupTerbuka(g.id)
            return (
              <div key={g.id}>
                <button
                  type="button"
                  onClick={() => toggleGrup(g.id)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-[0.65rem] font-semibold uppercase tracking-wider text-muh-300/90 hover:bg-white/5 hover:text-muh-100"
                  aria-expanded={terbuka}
                >
                  <span>{g.label}</span>
                  <span className="text-[0.7rem] opacity-80" aria-hidden>
                    {terbuka ? '▾' : '▸'}
                  </span>
                </button>
                {terbuka && (
                  <div className="mt-0.5 space-y-0.5">
                    {g.items.map((m) => (
                      <NavLink key={m.path} to={m.path} end={m.path === '/'} className={kelasLink}>
                        {m.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="border-t border-white/10 pt-3 text-sm">
          <div className="truncate font-medium text-white">{profil?.nama}</div>
          <div className="text-xs text-muh-200">{peran ? NAMA_PERAN[peran] : ''}</div>
          <button onClick={() => void logout()} className="mt-2 text-xs font-medium text-muh-200 hover:text-white">
            Keluar
          </button>
        </div>
      </aside>

      <header className="flex items-center justify-between bg-muh-800 px-4 py-3 lg:hidden print:hidden">
        <div className="flex items-center gap-2.5 text-white">
          <div className="auth-logo-tile auth-logo-tile--light" style={{ height: '2rem', width: '2rem' }}>
            <img src="/logo-sdm.png" alt="" className="h-6 w-6 object-contain" />
          </div>
          <span className="text-sm font-semibold">Perpustakaan</span>
        </div>
        <button onClick={() => void logout()} className="text-xs font-medium text-muh-200">
          Keluar
        </button>
      </header>

      <main className="min-w-0 flex-1 p-4 pb-24 sm:p-5 lg:p-6 lg:pb-6 print:p-0">
        <div
          className={`mx-auto w-full ${
            HALAMAN_SEMPIT.some((p) => lokasi.pathname === p || lokasi.pathname.startsWith(p + '/'))
              || /^\/katalog\/[^/]+\/ubah$/.test(lokasi.pathname)
              ? 'max-w-2xl'
              : HALAMAN_LEBAR.some(
                    (p) => lokasi.pathname === p || (p !== '/' && lokasi.pathname.startsWith(p + '/')),
                  ) || lokasi.pathname === '/'
                ? 'max-w-[1600px]'
                : 'max-w-6xl'
          }`}
        >
          <Outlet />
        </div>
      </main>

      {menuBawah.length > 1 && (
        <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-white lg:hidden print:hidden">
          {menuBawah.map((m) => (
            <NavLink
              key={m.path}
              to={m.path}
              end={m.path === '/'}
              className={({ isActive }) =>
                `flex-1 py-3 text-center text-[0.7rem] font-medium ${isActive ? 'text-muh-600' : 'text-muted'}`
              }
            >
              {m.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
