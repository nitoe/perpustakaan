import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginWithEmail } from '../lib/auth'

function pesanGalat(e: unknown): string {
  const kode = (e as { code?: string })?.code ?? ''
  if (kode.includes('invalid-credential') || kode.includes('wrong-password') || kode.includes('user-not-found')) {
    return 'Email atau kata sandi salah.'
  }
  if (kode.includes('too-many-requests')) return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.'
  if (kode.includes('network')) return 'Tidak ada koneksi internet.'
  return e instanceof Error ? e.message : 'Gagal masuk.'
}

export default function Login() {
  const { user, profil, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [sandi, setSandi] = useState('')
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)

  if (!loading && user && profil) return <Navigate to="/" replace />

  async function kirim(e: FormEvent) {
    e.preventDefault()
    setGalat('')
    setProses(true)
    try {
      await loginWithEmail(email, sandi)
    } catch (err) {
      setGalat(pesanGalat(err))
    } finally {
      setProses(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-brand hidden flex-col justify-between p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="auth-logo-tile">
            <img src="/logo-sdm.png" alt="" className="h-9 w-9 object-contain" />
          </div>
          <span className="text-sm font-semibold">SD Muhammadiyah 01 Kukusan</span>
        </div>
        <div>
          <h1 className="auth-display">Perpustakaan Digital</h1>
          <p className="mt-3 max-w-sm text-sm text-muh-200">
            Katalog buku, koleksi digital, dan peminjaman perpustakaan sekolah.
          </p>
        </div>
        <div />
      </div>
      <div className="auth-form-panel">
        <form onSubmit={kirim} className="auth-form-card space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Masuk</h2>
            <p className="mt-1 text-sm text-muted">Gunakan akun yang sama dengan aplikasi Penilaian.</p>
          </div>
          {galat && <div className="auth-alert auth-alert--error">{galat}</div>}
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="auth-field">
            <label htmlFor="sandi">Kata sandi</label>
            <input id="sandi" type="password" autoComplete="current-password" required value={sandi} onChange={(e) => setSandi(e.target.value)} />
          </div>
          <button type="submit" className="auth-btn-primary" disabled={proses}>
            {proses ? 'Memeriksa…' : 'Masuk'}
          </button>
          <p className="text-center text-sm text-muted">
            Siswa / orang tua:{' '}
            <Link to="/publik" className="font-medium text-muh-600 hover:underline">
              buka katalog publik
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
