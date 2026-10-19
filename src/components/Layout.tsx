import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../lib/auth'
import { NAMA_PERAN } from '../lib/peran'
import { menuUntuk } from '../lib/menu'

/** Pintasan di bilah bawah (HP); menu lengkap tetap di sidebar desktop. */
const MENU_BAWAH = ['/', '/katalog', '/sirkulasi', '/kunjungan', '/pengaturan']

export default function Layout() {
  const { profil, peran } = useAuth()
  const menu = menuUntuk(peran)
  const menuBawah = menu.filter((m) => MENU_BAWAH.includes(m.path))

  const kelasLink = ({ isActive }: { isActive: boolean }) =>
    `flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
      isActive ? 'bg-white/10 text-white' : 'text-muh-200 hover:bg-white/5 hover:text-white'
    }`

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col bg-muh-800 p-4 lg:flex print:hidden">
        <div className="mb-6 flex items-center gap-3">
          <div className="auth-logo-tile">
            <img src="/logo-sdm.png" alt="" className="h-8 w-8 object-contain" />
          </div>
          <div className="leading-tight text-white">
            <div className="text-sm font-semibold">Perpustakaan</div>
            <div className="text-xs text-muh-200">SDM 01 Kukusan</div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {menu.map((m) => (
            <NavLink key={m.path} to={m.path} end={m.path === '/'} className={kelasLink}>
              {m.label}
            </NavLink>
          ))}
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

      <main className="min-w-0 flex-1 p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8 print:p-0">
        <Outlet />
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
