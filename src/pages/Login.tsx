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
  const [tampilSandi, setTampilSandi] = useState(false)

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
      <aside className="auth-hero">
        <div className="auth-hero-inner">
          <div className="auth-brand-row">
            <div className="auth-logo-tile">
              <img src="/logo-sdm.png" alt="" className="h-9 w-9 object-contain" />
            </div>
            <div>
              <div className="auth-brand-name">Perpustakaan Digital</div>
              <div className="auth-brand-tag">Membaca, memahami, tumbuh bersama</div>
            </div>
          </div>

          <p className="auth-hero-kicker">Untuk staf · SD Muhammadiyah 01 Kukusan</p>
          <h1 className="auth-hero-title">Setiap buku yang dibaca adalah jendela menuju ilmu dan kebaikan.</h1>
          <p className="auth-hero-desc">
            Katalog, sirkulasi, dan koleksi digital perpustakaan sekolah dalam satu tempat yang nyaman.
          </p>

          <div className="auth-hero-pills">
            <div className="auth-hero-pill">
              <strong>Katalog lengkap</strong>
              <span>Buku cetak & digital</span>
            </div>
            <div className="auth-hero-pill">
              <strong>Sirkulasi mudah</strong>
              <span>Pinjam, kembali, perpanjang</span>
            </div>
            <div className="auth-hero-pill">
              <strong>Akun yang sama</strong>
              <span>Dengan aplikasi Penilaian</span>
            </div>
          </div>

          <div className="auth-hero-quote">
            “Barangsiapa menempuh jalan untuk mencari ilmu, maka Allah akan mudahkan baginya jalan menuju surga.”
            <cite>— HR. Muslim</cite>
          </div>
        </div>
      </aside>

      <main className="auth-panel">
        <div className="auth-panel-card">
          <div className="auth-mobile-brand">
            <div className="auth-logo-tile auth-logo-tile--light">
              <img src="/logo-sdm.png" alt="" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <strong>Perpustakaan Digital</strong>
              <span>SD Muhammadiyah 01 Kukusan</span>
            </div>
          </div>

          <div className="auth-tabs">
            <Link to="/siswa/masuk" className="auth-tab">Siswa</Link>
            <button type="button" className="auth-tab auth-tab--active">Staf</button>
          </div>

          <h2 className="auth-panel-title">Assalamu'alaikum wr. wb.</h2>
          <p className="auth-panel-sub">Masuk dengan akun yang sama dengan aplikasi Penilaian.</p>

          {galat && <div className="auth-alert auth-alert--error">{galat}</div>}

          <form onSubmit={kirim} className="space-y-4">
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@sdmuhammadiyah01kks.sch.id"
              />
            </div>
            <div className="auth-field">
              <label htmlFor="sandi">Kata sandi</label>
              <div className="auth-password-wrap">
                <input
                  id="sandi"
                  type={tampilSandi ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={sandi}
                  onChange={(e) => setSandi(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-toggle-visibility"
                  onClick={() => setTampilSandi((v) => !v)}
                  aria-label={tampilSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {tampilSandi ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
            </div>
            <button type="submit" className="auth-btn-primary" disabled={proses}>
              {proses ? 'Memeriksa…' : 'Masuk'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            Siswa:{' '}
            <Link to="/siswa/masuk" className="font-medium text-muh-600 hover:underline">
              masuk dengan kelas & NISN
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
