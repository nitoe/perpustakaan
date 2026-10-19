import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Beranda from './pages/Beranda'
import Katalog from './pages/Katalog'
import BukuDetail from './pages/BukuDetail'
import BukuForm from './pages/BukuForm'
import Kategori from './pages/Kategori'
import Impor from './pages/Impor'
import Label from './pages/Label'
import Sirkulasi from './pages/Sirkulasi'
import Kunjungan from './pages/Kunjungan'
import Laporan from './pages/Laporan'
import Digital from './pages/Digital'
import Anggota from './pages/Anggota'
import Pengaturan from './pages/Pengaturan'
import Penjaga from './pages/Penjaga'

function Wajib({ children }: { children: ReactNode }) {
  const { user, profil, loading } = useAuth()
  if (loading) return <div className="p-8 text-sm text-muted">Memuat…</div>
  if (!user || !profil) return <Navigate to="/masuk" replace />
  return children
}

function PenjagaLaporan({ children }: { children: ReactNode }) {
  const { peran } = useAuth()
  if (!peran || !['admin', 'pustakawan', 'pimpinan'].includes(peran)) {
    return (
      <div className="mx-auto max-w-xl">
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
          Halaman laporan hanya untuk admin, pustakawan, dan pimpinan.
        </p>
      </div>
    )
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/masuk" element={<Login />} />
      <Route
        element={
          <Wajib>
            <Layout />
          </Wajib>
        }
      >
        <Route index element={<Beranda />} />
        <Route path="katalog" element={<Katalog />} />
        <Route path="katalog/baru" element={<Penjaga><BukuForm /></Penjaga>} />
        <Route path="katalog/:id" element={<BukuDetail />} />
        <Route path="katalog/:id/ubah" element={<Penjaga><BukuForm /></Penjaga>} />
        <Route path="kategori" element={<Penjaga><Kategori /></Penjaga>} />
        <Route path="impor" element={<Penjaga><Impor /></Penjaga>} />
        <Route path="label" element={<Penjaga><Label /></Penjaga>} />
        <Route path="sirkulasi" element={<Penjaga><Sirkulasi /></Penjaga>} />
        <Route path="kunjungan" element={<Penjaga><Kunjungan /></Penjaga>} />
        <Route path="laporan" element={<PenjagaLaporan><Laporan /></PenjagaLaporan>} />
        <Route path="digital" element={<Digital />} />
        <Route path="anggota" element={<Penjaga><Anggota /></Penjaga>} />
        <Route path="pengaturan" element={<Pengaturan />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
