import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { catat, hapusDoc, simpanDoc } from '../lib/data'
import { useKoleksi } from '../lib/useKoleksi'
import type { Anggota as TAnggota } from '../lib/tipe'
import { Badge, Field, Modal, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'

const NAMA_JENIS: Record<TAnggota['jenis'], string> = {
  guru: 'Guru',
  karyawan: 'Karyawan',
  kelas: 'Kelas (pojok baca)',
}

export default function Anggota() {
  const { peran, profil } = useAuth()
  const kol = useKoleksi<TAnggota>('perpus_anggota')
  const [modal, setModal] = useState<TAnggota | 'baru' | null>(null)
  const [pesan, setPesan] = useState('')
  const [ok, setOk] = useState('')
  const [cari, setCari] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [tampilNonaktif, setTampilNonaktif] = useState(false)

  const urut = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return [...kol.data]
      .filter((a) => {
        if (!tampilNonaktif && a.aktif === false) return false
        if (filterJenis && a.jenis !== filterJenis) return false
        if (!q) return true
        return a.nama.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)
      })
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
  }, [kol.data, cari, filterJenis, tampilNonaktif])

  async function setAktif(a: TAnggota, aktif: boolean) {
    setPesan('')
    setOk('')
    try {
      await simpanDoc('perpus_anggota', a.id, { aktif })
      void catat(profil, aktif ? 'aktifkan anggota' : 'nonaktifkan anggota', 'perpus_anggota', a.id)
      setOk(aktif ? `${a.nama} diaktifkan kembali.` : `${a.nama} dinonaktifkan (tidak bisa meminjam).`)
    } catch {
      setPesan('Gagal mengubah status anggota.')
    }
  }

  async function hapus(a: TAnggota) {
    if (!window.confirm(`Hapus anggota "${a.nama}"? Riwayat pinjaman tetap ada; ID ini tidak bisa dipakai lagi.`)) return
    setPesan('')
    setOk('')
    try {
      await hapusDoc('perpus_anggota', a.id)
      void catat(profil, 'hapus anggota', 'perpus_anggota', a.id)
      setOk(`Anggota ${a.nama} dihapus.`)
    } catch {
      setPesan('Gagal menghapus anggota.')
    }
  }

  return (
    <div className="w-full">
      <PageHeader
        judul="Anggota"
        keterangan="Peminjam non-siswa: guru, karyawan, atau kelas (pojok baca). Siswa tetap dari data Penilaian (NISN)."
        aksi={
          <button type="button" className={btnPrimary} onClick={() => setModal('baru')}>
            Tambah anggota
          </button>
        }
      />

      {(pesan || kol.galat) && (
        <div className="mb-4">
          <Notice tipe="error">{pesan || kol.galat}</Notice>
        </div>
      )}
      {ok && (
        <div className="mb-4">
          <Notice>{ok}</Notice>
        </div>
      )}

      <div className="card-soft mb-4 grid gap-3 p-4 sm:grid-cols-2">
        <input
          className={inputCls}
          placeholder="Cari nama atau ID…"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          aria-label="Cari"
        />
        <select
          className={inputCls}
          value={filterJenis}
          onChange={(e) => setFilterJenis(e.target.value)}
          aria-label="Jenis"
        >
          <option value="">Semua jenis</option>
          {(Object.keys(NAMA_JENIS) as TAnggota['jenis'][]).map((j) => (
            <option key={j} value={j}>
              {NAMA_JENIS[j]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={tampilNonaktif} onChange={(e) => setTampilNonaktif(e.target.checked)} />
          Tampilkan yang nonaktif
        </label>
      </div>

      {kol.loading ? (
        <div className="text-sm text-muted">Memuat…</div>
      ) : urut.length === 0 ? (
        <Notice>
          {kol.data.length === 0
            ? 'Belum ada anggota. Tambahkan guru atau karyawan yang boleh meminjam buku.'
            : 'Tidak ada anggota yang cocok dengan filter.'}
        </Notice>
      ) : (
        <ul className="card-soft divide-y divide-border">
          {urut.map((a) => (
            <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <div className="font-medium">
                  {a.nama}
                  {a.aktif === false && (
                    <span className="ml-2">
                      <Badge>Nonaktif</Badge>
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-muted">
                  {NAMA_JENIS[a.jenis]}
                  {' · '}
                  <span className="font-mono text-xs" title="ID untuk sirkulasi">
                    {a.id}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" className="text-xs font-medium text-muh-600 hover:underline" onClick={() => setModal(a)}>
                  Ubah
                </button>
                {a.aktif === false ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-muh-600 hover:underline"
                    onClick={() => void setAktif(a, true)}
                  >
                    Aktifkan
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-xs font-medium text-muh-600 hover:underline"
                    onClick={() => void setAktif(a, false)}
                  >
                    Nonaktifkan
                  </button>
                )}
                {peran === 'admin' && (
                  <button type="button" className="text-xs font-medium text-red-700 hover:underline" onClick={() => void hapus(a)}>
                    Hapus
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <Notice>
          Di menu Sirkulasi, pilih tab <strong>Anggota</strong> lalu masukkan ID (teks mono di atas). Siswa tidak
          didaftarkan di sini — mereka dilayani lewat NISN dari data Penilaian.
        </Notice>
      </div>

      {modal && (
        <FormAnggota
          awal={modal === 'baru' ? null : modal}
          semua={kol.data}
          onTutup={() => setModal(null)}
          onSukses={(msg) => {
            setOk(msg)
            setPesan('')
            setModal(null)
          }}
        />
      )}
    </div>
  )
}

function FormAnggota({
  awal,
  semua,
  onTutup,
  onSukses,
}: {
  awal: TAnggota | null
  semua: TAnggota[]
  onTutup: () => void
  onSukses: (msg: string) => void
}) {
  const { profil } = useAuth()
  const [nama, setNama] = useState(awal?.nama ?? '')
  const [jenis, setJenis] = useState<TAnggota['jenis']>(awal?.jenis ?? 'guru')
  const [aktif, setAktif] = useState(awal?.aktif !== false)
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)

  async function simpan() {
    const n = nama.trim()
    if (!n) return setGalat('Nama wajib diisi.')
    if (n.length > 120) return setGalat('Nama terlalu panjang.')
    if (
      semua.some(
        (a) => a.id !== awal?.id && a.nama.toLowerCase() === n.toLowerCase() && a.jenis === jenis && a.aktif !== false,
      )
    ) {
      return setGalat('Nama anggota dengan jenis yang sama sudah ada.')
    }
    setProses(true)
    try {
      const id = await simpanDoc('perpus_anggota', awal?.id ?? null, {
        nama: n,
        jenis,
        aktif,
      })
      void catat(profil, awal ? 'ubah anggota' : 'tambah anggota', 'perpus_anggota', id)
      onSukses(awal ? `Anggota ${n} diperbarui.` : `Anggota ${n} ditambahkan. ID: ${id}`)
    } catch {
      setGalat('Gagal menyimpan.')
      setProses(false)
    }
  }

  return (
    <Modal judul={awal ? 'Ubah anggota' : 'Tambah anggota'} onTutup={onTutup}>
      <div className="space-y-4">
        {galat && <Notice tipe="error">{galat}</Notice>}
        {awal && (
          <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
            ID (untuk sirkulasi): <span className="font-mono text-[#1a1d33]">{awal.id}</span>
          </div>
        )}
        <Field label="Nama *">
          <input className={inputCls} value={nama} onChange={(e) => setNama(e.target.value)} autoFocus />
        </Field>
        <Field label="Jenis">
          <select className={inputCls} value={jenis} onChange={(e) => setJenis(e.target.value as TAnggota['jenis'])}>
            {(Object.keys(NAMA_JENIS) as TAnggota['jenis'][]).map((j) => (
              <option key={j} value={j}>
                {NAMA_JENIS[j]}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} />
          Aktif (boleh meminjam)
        </label>
        <div className="flex gap-3">
          <button type="button" className={btnPrimary} disabled={proses} onClick={() => void simpan()}>
            {proses ? 'Menyimpan…' : 'Simpan'}
          </button>
          <button type="button" className={btnGhost} onClick={onTutup}>
            Batal
          </button>
        </div>
      </div>
    </Modal>
  )
}
