import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { collection, doc, getDocs, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import { catat } from '../lib/data'
import { ambilAturanConfig, simpanAturanConfig } from '../lib/aturan'
import { NAMA_PERAN } from '../lib/peran'
import { KELAS_DDC } from '../lib/ddc'
import type { Aturan } from '../lib/tipe'
import { ATURAN_BAWAAN } from '../lib/tipe'
import type { AppUser, PeranPerpus } from '../types/user'
import { Badge, Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'

type Tab = 'akun' | 'peran' | 'aturan' | 'klasifikasi' | 'bantuan'

const ROLE_GURU = ['guru', 'guru_tahsin_tahfizh', 'guru_akademik']

/** Opsi yang boleh diset admin lewat UI (bukan role Penilaian). */
const OPSI_PERAN: { value: '' | PeranPerpus; label: string }[] = [
  { value: '', label: 'Default (Guru / Karyawan)' },
  { value: 'pustakawan', label: 'Pustakawan' },
  { value: 'pimpinan', label: 'Pimpinan' },
  { value: 'guru', label: 'Guru / Karyawan (eksplisit)' },
]

export default function Pengaturan() {
  const { peran } = useAuth()
  const [tab, setTab] = useState<Tab>('akun')

  const tabs: { id: Tab; label: string; hanyaAdmin?: boolean }[] = [
    { id: 'akun', label: 'Akun' },
    { id: 'peran', label: 'Peran staf', hanyaAdmin: true },
    { id: 'aturan', label: 'Aturan pinjam', hanyaAdmin: true },
    { id: 'klasifikasi', label: 'Klasifikasi DDC' },
    { id: 'bantuan', label: 'Bantuan input' },
  ]

  return (
    <div className="w-full">
      <PageHeader judul="Pengaturan" keterangan="Akun, peran staf, aturan pinjam, dan referensi klasifikasi." />

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
      {tab === 'peran' && peran === 'admin' && <TabPeranStaf />}
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
          <p className="mt-1 text-xs text-muted">
            Admin dapat mengubah peran staf lewat tab <strong>Peran staf</strong> di Pengaturan.
          </p>
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

/** Daftar staf yang relevan untuk peran perpustakaan (guru + yang sudah punya peranPerpus). */
function TabPeranStaf() {
  const { profil, user } = useAuth()
  const [daftar, setDaftar] = useState<AppUser[]>([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState('')
  const [ok, setOk] = useState('')
  const [cari, setCari] = useState('')
  const [prosesUid, setProsesUid] = useState<string | null>(null)

  async function muat() {
    setMemuat(true)
    setGalat('')
    try {
      const snap = await getDocs(collection(db, 'users'))
      const list: AppUser[] = []
      snap.forEach((s) => {
        const d = s.data()
        const role = (d.role as string) || ''
        const peranPerpus = d.peranPerpus as PeranPerpus | undefined
        // Tampilkan: admin Penilaian, semua jenis guru, atau yang sudah punya peranPerpus
        if (
          role === 'admin' ||
          ROLE_GURU.includes(role) ||
          (peranPerpus && ['admin', 'pustakawan', 'pimpinan', 'guru'].includes(peranPerpus))
        ) {
          list.push({
            uid: s.id,
            email: (d.email as string) || '',
            nama: (d.nama as string) || '',
            gelar: (d.gelar as string) || undefined,
            role,
            peranPerpus,
            aktif: typeof d.aktif === 'boolean' ? d.aktif : undefined,
          })
        }
      })
      list.sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
      setDaftar(list)
    } catch {
      setGalat('Gagal memuat daftar pengguna. Pastikan Anda login sebagai admin Penilaian.')
    }
    setMemuat(false)
  }

  useEffect(() => {
    void muat()
  }, [])

  const terfilter = useMemo(() => {
    const q = cari.trim().toLowerCase()
    if (!q) return daftar
    return daftar.filter(
      (u) =>
        u.nama.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q),
    )
  }, [daftar, cari])

  async function setPeran(u: AppUser, nilai: '' | PeranPerpus) {
    if (u.role === 'admin' && nilai !== '') {
      // Admin Penilaian selalu admin perpustakaan; field tidak diperlukan
      setOk('Akun admin Penilaian otomatis menjadi Admin Perpustakaan. Field peranPerpus tidak diubah.')
      return
    }
    setProsesUid(u.uid)
    setGalat('')
    setOk('')
    try {
      const ref = doc(db, 'users', u.uid)
      if (nilai === '') {
        await updateDoc(ref, {
          peranPerpus: deleteField(),
          updatedAt: serverTimestamp(),
        })
      } else {
        await updateDoc(ref, {
          peranPerpus: nilai,
          updatedAt: serverTimestamp(),
        })
      }
      void catat(profil, `ubah peranPerpus → ${nilai || 'default'}`, 'users', u.uid)
      setDaftar((prev) =>
        prev.map((x) =>
          x.uid === u.uid
            ? { ...x, peranPerpus: nilai === '' ? undefined : nilai }
            : x,
        ),
      )
      setOk(
        nilai === 'pustakawan'
          ? `${u.nama} sekarang Pustakawan (akses kelola hampir sama dengan admin).`
          : nilai === ''
            ? `Peran ${u.nama} dikembalikan ke default (Guru / Karyawan).`
            : `Peran ${u.nama} diubah menjadi ${NAMA_PERAN[nilai]}.`,
      )
    } catch {
      setGalat('Gagal menyimpan peran. Hanya admin Penilaian yang boleh mengubah.')
    }
    setProsesUid(null)
  }

  function labelPeranEfektif(u: AppUser): string {
    if (u.role === 'admin') return NAMA_PERAN.admin
    if (u.peranPerpus && NAMA_PERAN[u.peranPerpus]) return NAMA_PERAN[u.peranPerpus]
    if (u.role && ROLE_GURU.includes(u.role)) return NAMA_PERAN.guru
    return '—'
  }

  return (
    <div className="space-y-4">
      <Notice>
        Ubah status guru/karyawan menjadi <strong>Pustakawan</strong> agar mereka dapat mengelola katalog, sirkulasi,
        izin siswa, impor, label, dll. (hampir sama dengan admin). <strong>Pimpinan</strong> hanya melihat laporan.
        Admin Penilaian otomatis menjadi Admin Perpustakaan.
      </Notice>

      {galat && <Notice tipe="error">{galat}</Notice>}
      {ok && <Notice>{ok}</Notice>}

      <div className="card-soft p-4">
        <input
          className={inputCls}
          placeholder="Cari nama atau email…"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          aria-label="Cari staf"
        />
      </div>

      {memuat ? (
        <div className="text-sm text-muted">Memuat daftar staf…</div>
      ) : terfilter.length === 0 ? (
        <Notice>Tidak ada staf yang cocok.</Notice>
      ) : (
        <ul className="card-soft divide-y divide-border">
          {terfilter.map((u) => {
            const isAdminPenilaian = u.role === 'admin'
            const current = u.peranPerpus ?? ''
            const isSaya = u.uid === user?.uid
            return (
              <li key={u.uid} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">
                    {u.nama}
                    {u.gelar ? ` ${u.gelar}` : ''}
                    {isSaya && <span className="ml-2 text-xs text-muted">(Anda)</span>}
                    {u.aktif === false && (
                      <span className="ml-2">
                        <Badge>Nonaktif</Badge>
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-muted">
                    {u.email || '—'}
                    {u.role ? ` · role: ${u.role}` : ''}
                  </div>
                  <div className="mt-1">
                    <Badge>{labelPeranEfektif(u)}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isAdminPenilaian ? (
                    <span className="text-xs text-muted">Otomatis admin</span>
                  ) : (
                    <select
                      className={inputCls}
                      style={{ minWidth: '11rem' }}
                      value={current}
                      disabled={prosesUid === u.uid}
                      onChange={(e) => void setPeran(u, e.target.value as '' | PeranPerpus)}
                      aria-label={`Peran ${u.nama}`}
                    >
                      {OPSI_PERAN.map((o) => (
                        <option key={o.value || 'default'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-xs text-muted">
        Perubahan berlaku segera setelah pengguna memuat ulang halaman atau login ulang. Rules Firestore tetap
        menegakkan izin; tampilan menu mengikuti peran efektif.
      </p>
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
