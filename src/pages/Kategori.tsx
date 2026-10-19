import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { catat, hapusDoc, simpanDoc } from '../lib/data'
import { useKoleksi } from '../lib/useKoleksi'
import type { Buku, Kategori as TKategori } from '../lib/tipe'
import { Field, Modal, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'

export default function Kategori() {
  const { peran, profil } = useAuth()
  const kat = useKoleksi<TKategori>('perpus_kategori')
  const buku = useKoleksi<Buku>('perpus_buku')
  const [modal, setModal] = useState<TKategori | 'baru' | null>(null)
  const [pesan, setPesan] = useState('')

  const hitung = useMemo(() => {
    const m = new Map<string, number>()
    for (const b of buku.data) if (b.kategoriId) m.set(b.kategoriId, (m.get(b.kategoriId) ?? 0) + 1)
    return m
  }, [buku.data])
  const urut = useMemo(() => [...kat.data].sort((a, b) => a.nama.localeCompare(b.nama, 'id')), [kat.data])

  async function hapus(k: TKategori) {
    if ((hitung.get(k.id) ?? 0) > 0) return setPesan('Kategori ini masih dipakai buku. Pindahkan bukunya dulu.')
    if (!window.confirm(`Hapus kategori "${k.nama}"?`)) return
    try {
      await hapusDoc('perpus_kategori', k.id)
      void catat(profil, 'hapus kategori', 'perpus_kategori', k.id)
      setPesan('')
    } catch {
      setPesan('Gagal menghapus kategori.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        judul="Kategori"
        keterangan="Pengelompokan buku, mis. Cerita Anak, Sains, Agama Islam."
        aksi={
          <button className={btnPrimary} onClick={() => setModal('baru')}>
            Tambah kategori
          </button>
        }
      />
      {(pesan || kat.galat) && (
        <div className="mb-4">
          <Notice tipe="error">{pesan || kat.galat}</Notice>
        </div>
      )}
      {kat.loading ? (
        <div className="text-sm text-muted">Memuat…</div>
      ) : urut.length === 0 ? (
        <Notice>Belum ada kategori. Kategori juga dibuat otomatis saat impor CSV.</Notice>
      ) : (
        <ul className="card-soft divide-y divide-border">
          {urut.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <span className="font-medium">{k.nama}</span>
                {k.kode && <span className="ml-2 text-muted">({k.kode})</span>}
                <span className="tabular ml-3 text-muted">{hitung.get(k.id) ?? 0} judul</span>
              </div>
              <div className="flex gap-3">
                <button className="text-xs font-medium text-muh-600 hover:underline" onClick={() => setModal(k)}>
                  Ubah
                </button>
                {peran === 'admin' && (
                  <button className="text-xs font-medium text-red-700 hover:underline" onClick={() => void hapus(k)}>
                    Hapus
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {modal && <FormKategori awal={modal === 'baru' ? null : modal} semua={kat.data} onTutup={() => setModal(null)} />}
    </div>
  )
}

function FormKategori({ awal, semua, onTutup }: { awal: TKategori | null; semua: TKategori[]; onTutup: () => void }) {
  const { profil } = useAuth()
  const [nama, setNama] = useState(awal?.nama ?? '')
  const [kode, setKode] = useState(awal?.kode ?? '')
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)

  async function simpan() {
    const n = nama.trim()
    if (!n) return setGalat('Nama wajib diisi.')
    if (semua.some((k) => k.id !== awal?.id && k.nama.toLowerCase() === n.toLowerCase())) return setGalat('Nama kategori sudah ada.')
    setProses(true)
    try {
      const id = await simpanDoc('perpus_kategori', awal?.id ?? null, { nama: n, kode: kode.trim() })
      void catat(profil, awal ? 'ubah kategori' : 'tambah kategori', 'perpus_kategori', id)
      onTutup()
    } catch {
      setGalat('Gagal menyimpan.')
      setProses(false)
    }
  }

  return (
    <Modal judul={awal ? 'Ubah kategori' : 'Tambah kategori'} onTutup={onTutup}>
      <div className="space-y-4">
        {galat && <Notice tipe="error">{galat}</Notice>}
        <Field label="Nama *">
          <input className={inputCls} value={nama} onChange={(e) => setNama(e.target.value)} autoFocus />
        </Field>
        <Field label="Kode (opsional)" hint="Mis. nomor klasifikasi atau singkatan.">
          <input className={inputCls} value={kode} onChange={(e) => setKode(e.target.value)} />
        </Field>
        <div className="flex gap-3">
          <button className={btnPrimary} disabled={proses} onClick={() => void simpan()}>
            {proses ? 'Menyimpan…' : 'Simpan'}
          </button>
          <button className={btnGhost} onClick={onTutup}>
            Batal
          </button>
        </div>
      </div>
    </Modal>
  )
}
