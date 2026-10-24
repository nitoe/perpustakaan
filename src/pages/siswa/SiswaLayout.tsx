import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'
import { useSiswa } from '../../context/SiswaContext'

function kelasNav({ isActive }: { isActive: boolean }) {
  return `text-xs font-medium ${isActive ? 'text-white underline underline-offset-4' : 'text-muh-200 hover:text-white'}`
}

/** Layout area siswa setelah login (sesi sessionStorage). */
export default function SiswaLayout() {
  const { sesi, loading, keluar } = useSiswa()

  if (loading) return <div className="p-8 text-sm text-muted">Memuat…</div>
  if (!sesi) return <Navigate to="/siswa/masuk" replace />

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-muh-800 px-4 py-3 text-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <Link to="/siswa" className="flex items-center gap-2.5">
            <div className="auth-logo-tile auth-logo-tile--light" style={{ height: '2rem', width: '2rem' }}>
              <img src="/logo-sdm.png" alt="" className="h-6 w-6 object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Perpustakaan Siswa</div>
              <div className="text-xs text-muh-200">
                {sesi.nama} · Kelas {sesi.kelas}
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-3" aria-label="Siswa">
            <NavLink to="/siswa" end className={kelasNav}>
              Beranda
            </NavLink>
            <NavLink to="/siswa/baca" className={kelasNav}>
              Rak baca
            </NavLink>
            <button
              type="button"
              onClick={() => keluar()}
              className="text-xs font-medium text-muh-200 hover:text-white"
            >
              Keluar
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
      <footer className="border-t border-border px-4 py-3 text-center text-xs text-muted">
        Login siswa memakai NISN. Buku cetak tetap dipinjam di perpustakaan sekolah.
      </footer>
    </div>
  )
}
