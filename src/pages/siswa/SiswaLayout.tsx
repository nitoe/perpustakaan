import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useSiswa } from '../../context/SiswaContext'
import { keluarModePratinjau } from '../../lib/siswaAuth'

function kelasNav({ isActive }: { isActive: boolean }) {
  return `rounded-full px-4 py-2 text-sm font-medium transition-all ${
    isActive
      ? 'bg-muh-600 text-white shadow-sm'
      : 'text-muh-700 hover:bg-muh-50 hover:text-muh-800'
  }`
}

/** Layout area siswa — ringan, hangat, dan lebih “anak”. */
export default function SiswaLayout() {
  const { sesi, loading, keluar } = useSiswa()
  const navigate = useNavigate()

  if (loading) return <div className="p-8 text-sm text-muted">Memuat…</div>
  if (!sesi) return <Navigate to="/siswa/masuk" replace />

  function keluarDariPratinjau() {
    keluarModePratinjau()
    keluar()
    navigate('/')
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f8f7ff]">
      {sesi.preview && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-sm text-amber-900">
          <span className="font-medium">Mode pratinjau admin</span>
          {' — '}
          Tampilan ini hanya untuk melihat antarmuka siswa.
          <button
            type="button"
            onClick={keluarDariPratinjau}
            className="ml-3 rounded-full bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
          >
            Kembali ke Admin
          </button>
        </div>
      )}

      <header className="border-b border-border/60 bg-white/90 backdrop-blur-sm px-4 py-3.5 shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link to="/siswa" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muh-50 shadow-sm">
              <img src="/logo-sdm.png" alt="" className="h-7 w-7 object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold text-muh-800">Perpustakaan Siswa</div>
              <div className="text-xs text-muted">
                {sesi.nama}
                {!sesi.preview && ` · Kelas ${sesi.kelas}`}
              </div>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-1.5" aria-label="Siswa">
            <NavLink to="/siswa" end className={kelasNav}>
              Beranda
            </NavLink>
            <NavLink to="/siswa/baca" className={kelasNav}>
              Rak Baca
            </NavLink>
            <NavLink to="/siswa/pinjaman" className={kelasNav}>
              Pinjaman
            </NavLink>
            <NavLink to="/siswa/jurnal" className={kelasNav}>
              Jurnal
            </NavLink>
            {!sesi.preview && (
              <button
                type="button"
                onClick={() => keluar()}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted hover:bg-red-50 hover:text-red-700"
              >
                Keluar
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-border/50 bg-white px-4 py-5 text-center text-xs text-muted">
        Bacaan digital sekolah · Buku cetak dipinjam di perpustakaan
      </footer>
    </div>
  )
}
