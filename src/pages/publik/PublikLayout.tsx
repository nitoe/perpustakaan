import { Link, Outlet } from 'react-router-dom'

/** Layout ringan untuk pengunjung tanpa akun (siswa/orang tua). */
export default function PublikLayout() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-muh-800 px-4 py-3 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <Link to="/publik" className="flex items-center gap-2.5">
            <div className="auth-logo-tile auth-logo-tile--light" style={{ height: '2rem', width: '2rem' }}>
              <img src="/logo-sdm.png" alt="" className="h-6 w-6 object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Katalog Perpustakaan</div>
              <div className="text-xs text-muh-200">SD Muhammadiyah 01 Kukusan</div>
            </div>
          </Link>
          <Link to="/masuk" className="text-xs font-medium text-muh-200 hover:text-white">
            Masuk staf
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
      <footer className="border-t border-border px-4 py-3 text-center text-xs text-muted">
        Hanya menampilkan koleksi yang ditandai publik. Untuk meminjam, datang ke perpustakaan sekolah.
      </footer>
    </div>
  )
}
