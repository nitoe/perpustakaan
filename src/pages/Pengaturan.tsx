import { useEffect, useState, type FormEvent } from 'react'
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { auth, db } from '../lib/firebase'
import { catat } from '../lib/data'
import { ambilAturanConfig, simpanAturanConfig } from '../lib/aturan'
import { NAMA_PERAN } from '../lib/peran'
import { KELAS_DDC } from '../lib/ddc'
import type { Aturan } from '../lib/tipe'
import { ATURAN_BAWAAN } from '../lib/tipe'
import { Badge, Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'

type Tab = 'akun' | 'aturan' | 'klasifikasi' | 'bantuan'

export default function Pengaturan() {
  const { peran } = useAuth()
  const [tab, setTab] = useState<Tab>('akun')

  const tabs: { id: Tab; label: string; hanyaAdmin?: boolean }[] = [
    { id: 'akun', label: 'Akun' },
    { id: 'aturan', label: 'Aturan pinjam', hanyaAdmin: true },
    { id: 'klasifikasi', label: 'Klasifikasi DDC' },
    { id: 'bantuan', label: 'Bantuan input' },
  ]

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader judul="Pengaturan" keterangan="Akun, aturan pinjam, dan referensi klasifikasi." />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs
          .filter((t) => !t.hanyaAdmin || peran === 'admin')
          .map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? btnPrimary : btnGhost}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
      </div>

      {tab === 'akun' && <TabAkun />}
      {tab === 'aturan' && peran === 'admin' && <TabAturan />}
      {tab === 'klasifikasi' && <TabKlasifikasi />}
      {tab === 'bantuan' && <TabBantuan />}
    </div>
  )
}

function TabAkun() {
  const { user, profil, peran, refreshProfil } = useAuth()
  const [nama, setNama] = useState(profil?.nama ?? '')
  const [gelar, setGelar] = useState(profil?.gelar ?? '')
  const [sandiLama, setSandiLama] = useState('')
  const [sandiBaru, setSandiBaru] = useState('')
  const [sandiBaru2, setSandiBaru2] = useState('')
  const [pesan, setPesan] = useState('')
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)

  useEffect(() => {
    setNama(profil?.nama ?? '')
    setGelar(profil?.gelar ?? '')
  }, [profil])

  async function simpanProfil(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    const n = nama.trim()
    if (!n) return setGalat('Nama wajib diisi.')
    setProses(true)
    setGalat('')
    setPesan('')
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        nama: n,
        gelar: gelar.trim() || null,
        updatedAt: serverTimestamp(),
      })
      await refreshProfil?.()
      setPesan('Nama disimpan.')
    } catch {
      setGalat('Gagal menyimpan. Hanya nama dan gelar yang boleh diubah sendiri.')
    }
    setProses(false)
  }

  async function gantiSandi(e: FormEvent) {
    e.preventDefault()
    if (!user?.email) return
    if (sandiBaru.length < 6) return setGalat('Sandi baru minimal 6 karakter.')
    if (sandiBaru !== sandiBaru2) return setGalat('Konfirmasi sandi tidak sama.')
    setProses(true)
    setGalat('')
    setPesan('')
    try {
      const kred = EmailAuthProvider.credential(user.email, sandiLama)
      await reauthenticateWithCredential(user, kred)
      await updatePassword(user, sandiBaru)
      setSandiLama('')
      setSandiBaru('')
      setSandiBaru2('')
      setPesan('Sandi berhasil diubah.')
    } catch (err) {
      const kode = (err as { code?: string })?.code
      setGalat(
        kode === 'auth/wrong-password' || kode === 'auth/invalid-credential'
          ? 'Sandi lama salah.'
          : kode === 'auth/requires-recent-login'
            ? 'Silakan keluar lalu masuk lagi, kemudian ganti sandi.'
            : 'Gagal mengubah sandi.',
      )
    }
    setProses(false)
  }

  return (
    <div className="space-y-4">
      {galat && <Notice tipe="error">{galat}</Notice>}
      {pesan && <Notice>{pesan}</Notice>}

      <div className="card-soft space-y-3 p-4 text-sm">
        <div>
          <span className="text-muted">Email</span>
          <div className="font-medium">{profil?.email || user?.email || '—'}</div>
        </div>
        <div>
          <span className="text-muted">Peran perpustakaan</span>
          <div className="mt-1">{peran ? <Badge>{NAMA_PERAN[peran]}</Badge> : '—'}</div>
          <p className="mt-1 text-xs text-muted">Peran hanya bisa diubah admin lewat Firestore (field peranPerpus).</p>
        </div>
      </div>

      <form onSubmit={(e) => void simpanProfil(e)} className="card-soft space-y-4 p-4">
        <div className="font-medium">Profil</div>
        <Field label="Nama tampilan">
          <input className={inputCls} value={nama} onChange={(e) => setNama(e.target.value)} />
        </Field>
        <Field label="Gelar (opsional)">
          <input className={inputCls} value={gelar} onChange={(e) => setGelar(e.target.value)} placeholder="S.Pd." />
        </Field>
        <button type="submit" className={btnPrimary} disabled={proses}>
          Simpan nama
        </button>
      </form>

      <form onSubmit={(e) => void gantiSandi(e)} className="card-soft space-y-4 p-4">
        <div className="font-medium">Ganti sandi</div>
        <Field label="Sandi lama">
          <input
            type="password"
            className={inputCls}
            value={sandiLama}
            onChange={(e) => setSandiLama(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
        <Field label="Sandi baru">
          <input
            type="password"
            className={inputCls}
            value={sandiBaru}
            onChange={(e) => setSandiBaru(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Ulangi sandi baru">
          <input
            type="password"
            className={inputCls}
            value={sandiBaru2}
            onChange={(e) => setSandiBaru2(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        <button type="submit" className={btnPrimary} disabled={proses || !sandiLama || !sandiBaru}>
          Ubah sandi
        </button>
      </form>
    </div>
  )
}

function TabAturan() {
  const { profil } = useAuth()
  const [a, setA] = useState<Aturan>({ ...ATURAN_BAWAAN })
  const [memuat, setMemuat] = useState(true)
  const [proses, setProses] = useState(false)
  const [galat, setGalat] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    void ambilAturanConfig()
      .then(setA)
      .catch(() => setGalat('Gagal memuat aturan.'))
      .finally(() => setMemuat(false))
  }, [])

  async function simpan(e: FormEvent) {
    e.preventDefault()
    setProses(true)
    setGalat('')
    setOk('')
    try {
      await simpanAturanConfig(a)
      void catat(profil, 'ubah aturan pinjam', 'perpus_config', 'aturan')
      setOk('Aturan disimpan. Berlaku untuk pinjaman baru.')
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Gagal menyimpan (hanya admin).')
    }
    setProses(false)
  }

  if (memuat) return <div className="text-sm text-muted">Memuat…</div>

  return (
    <form onSubmit={(e) => void simpan(e)} className="card-soft space-y-4 p-4">
      {galat && <Notice tipe="error">{galat}</Notice>}
      {ok && <Notice>{ok}</Notice>}
      <p className="text-sm text-muted">Hanya admin yang bisa mengubah. Tidak ada denda di fase 1.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Lama pinjam (hari)">
          <input
            className={inputCls}
            inputMode="numeric"
            value={a.lamaPinjamHari}
            onChange={(e) => setA((s) => ({ ...s, lamaPinjamHari: Number(e.target.value) || 0 }))}
          />
        </Field>
        <Field label="Maks perpanjang (kali)">
          <input
            className={inputCls}
            inputMode="numeric"
            value={a.maksPerpanjang}
            onChange={(e) => setA((s) => ({ ...s, maksPerpanjang: Number(e.target.value) || 0 }))}
          />
        </Field>
        <Field label="Maks buku per siswa">
          <input
            className={inputCls}
            inputMode="numeric"
            value={a.maksSiswa}
            onChange={(e) => setA((s) => ({ ...s, maksSiswa: Number(e.target.value) || 0 }))}
          />
        </Field>
        <Field label="Maks buku per anggota">
          <input
            className={inputCls}
            inputMode="numeric"
            value={a.maksAnggota}
            onChange={(e) => setA((s) => ({ ...s, maksAnggota: Number(e.target.value) || 0 }))}
          />
        </Field>
      </div>
      <button type="submit" className={btnPrimary} disabled={proses}>
        {proses ? 'Menyimpan…' : 'Simpan aturan'}
      </button>
    </form>
  )
}

function TabKlasifikasi() {
  return (
    <div className="space-y-4">
      <Notice>
        Perpustakaan sekolah di Indonesia umumnya memakai <strong>Klasifikasi Persepuluhan Dewey (DDC)</strong>. Notasi{' '}
        <strong>2X0–2X9</strong> sering dipakai untuk koleksi Islam (adaptasi lokal). Isi field Klasifikasi di form buku dengan
        kode di bawah, atau pilih dari daftar di form tambah buku.
      </Notice>
      <ul className="card-soft divide-y divide-border">
        {KELAS_DDC.map((k) => (
          <li key={k.kode} className="px-4 py-3 text-sm">
            <div className="font-medium">
              <span className="font-mono text-muh-700">{k.kode}</span> — {k.nama}
            </div>
            {k.anak && k.anak.length > 0 && (
              <ul className="mt-1.5 space-y-0.5 pl-2 text-muted">
                {k.anak.map((a) => (
                  <li key={a.kode}>
                    <span className="font-mono">{a.kode}</span> {a.nama}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function TabBantuan() {
  return (
    <div className="space-y-4 text-sm">
      <div className="card-soft space-y-2 p-4">
        <div className="font-medium">Isi otomatis dari ISBN / judul</div>
        <p className="text-muted">
          Di form <strong>Tambah / ubah buku</strong>, gunakan tombol <strong>Cari ISBN</strong> atau{' '}
          <strong>Cari judul</strong>. Data diambil dari Open Library (gratis, tanpa kunci API). Judul berbahasa Indonesia
          sering kurang lengkap — selalu periksa dan lengkapi manual.
        </p>
      </div>
      <div className="card-soft space-y-2 p-4">
        <div className="font-medium">Foto sampul & AI</div>
        <p className="text-muted">
          Unggah sampul tetap tersedia (dikompres di peramban). <strong>AI membaca sampul/ISBN dari foto</strong> belum
          diaktifkan di fase ini: butuh layanan vision terpisah dan biaya/kuota. Langkah praktis sekarang: ketik atau pindai
          ISBN → isi otomatis metadata → unggah foto sampul sendiri.
        </p>
      </div>
      <div className="card-soft space-y-2 p-4">
        <div className="font-medium">Impor banyak buku</div>
        <p className="text-muted">
          Untuk data awal dalam jumlah besar, pakai menu <strong>Impor</strong> (CSV dari Excel). Template disediakan di
          halaman itu.
        </p>
      </div>
    </div>
  )
}
