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
import Penjaga from './pages/Penjaga'

function Wajib({ children }: { children: ReactNode }) {
  const { user, profil, loading } = useAuth()
  if (loading) return <div className="p-8 text-sm text-muted">Memuat…</div>
  if (!user || !profil) return <Navigate to="/masuk" replace />
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
        {/* Modul menyusul: digital, sirkulasi, kunjungan, anggota, laporan (lihat src/lib/menu.ts) */}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
