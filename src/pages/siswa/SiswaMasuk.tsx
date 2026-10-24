import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useSiswa } from '../../context/SiswaContext'
import { DAFTAR_KELAS, muatSiswaKelas } from '../../lib/siswaAuth'
import type { SiswaDasar } from '../../lib/sirkulasi'

function pesanGalat(e: unknown): string {
  const kode = (e as { code?: string })?.code ?? ''
  if (kode === 'permission-denied') {
    return 'Belum bisa memuat daftar siswa. Hubungi admin agar aturan Firestore mengizinkan baca daftar siswa untuk login.'
  }
  if (kode.includes('network')) return 'Tidak ada koneksi internet.'
  return e instanceof Error ? e.message : 'Gagal masuk.'
}

/** Login siswa: pilih kelas → pilih nama → NISN sebagai kata sandi. */
export default function SiswaMasuk() {
  const { sesi, loading, masuk } = useSiswa()
  const [kelas, setKelas] = useState('')
  const [daftar, setDaftar] = useState<SiswaDasar[]>([])
  const [siswaId, setSiswaId] = useState('')
  const [nisn, setNisn] = useState('')
  const [galat, setGalat] = useState('')
  const [muatDaftar, setMuatDaftar] = useState(false)
  const [proses, setProses] = useState(false)

  useEffect(() => {
    if (!kelas) {
      setDaftar([])
      setSiswaId('')
      return
    }
    let batal = false
    setMuatDaftar(true)
    setGalat('')
    setSiswaId('')
    void muatSiswaKelas(kelas)
      .then((list) => {
        if (!batal) {
          setDaftar(list)
          if (list.length === 0) setGalat(`Tidak ada siswa aktif di kelas ${kelas}.`)
        }
      })
      .catch((e) => {
        if (!batal) {
          setDaftar([])
          setGalat(pesanGalat(e))
        }
      })
      .finally(() => {
        if (!batal) setMuatDaftar(false)
      })
    return () => {
      batal = true
    }
  }, [kelas])

  if (!loading && sesi) return <Navigate to="/siswa" replace />

  async function kirim(e: FormEvent) {
    e.preventDefault()
    setGalat('')
    const pilih = daftar.find((s) => s.id === siswaId)
    if (!pilih) {
      setGalat('Pilih nama siswa terlebih dahulu.')
      return
    }
    setProses(true)
    try {
      await masuk(pilih, nisn)
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
          <h1 className="auth-display">Masuk Siswa</h1>
          <p className="mt-3 max-w-sm text-sm text-muh-200">
            Pilih kelas dan nama, lalu masukkan NISN sebagai kata sandi untuk membuka rak baca pribadi.
          </p>
        </div>
        <div />
      </div>
      <div className="auth-form-panel">
        <form onSubmit={kirim} className="auth-form-card space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Masuk siswa</h2>
            <p className="mt-1 text-sm text-muted">Kata sandi = NISN pada kartu anggota / rapor.</p>
          </div>
          {galat && <div className="auth-alert auth-alert--error">{galat}</div>}

          <div className="auth-field">
            <label htmlFor="kelas">Kelas</label>
            <select
              id="kelas"
              required
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              autoComplete="off"
            >
              <option value="">— Pilih kelas —</option>
              {DAFTAR_KELAS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div className="auth-field">
            <label htmlFor="nama">Nama siswa</label>
            <select
              id="nama"
              required
              value={siswaId}
              onChange={(e) => setSiswaId(e.target.value)}
              disabled={!kelas || muatDaftar}
              autoComplete="off"
            >
              <option value="">
                {muatDaftar ? 'Memuat…' : !kelas ? 'Pilih kelas dulu' : '— Pilih nama —'}
              </option>
              {daftar.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="auth-field">
            <label htmlFor="nisn">NISN (kata sandi)</label>
            <input
              id="nisn"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              required
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              placeholder="Masukkan NISN"
            />
          </div>

          <button type="submit" className="auth-btn-primary" disabled={proses || !siswaId}>
            {proses ? 'Memeriksa…' : 'Masuk'}
          </button>

          <p className="text-center text-sm text-muted">
            Tanpa login:{' '}
            <Link to="/publik/baca" className="font-medium text-muh-600 hover:underline">
              rak baca publik
            </Link>
            {' · '}
            <Link to="/masuk" className="font-medium text-muh-600 hover:underline">
              masuk staf
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
