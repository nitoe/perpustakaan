import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { catat } from '../lib/data'
import { useKoleksi } from '../lib/useKoleksi'
import { cariSiswa, kePeminjamSiswa, cariAnggota, kePeminjamAnggota } from '../lib/sirkulasi'
import { buatReservasi, daftarReservasiAktif, ubahStatusReservasi } from '../lib/reservasi'
import type { Buku, Reservasi as TReservasi } from '../lib/tipe'
import { Badge, Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'

const NAMA_STATUS: Record<TReservasi['status'], string> = {
  antrian: 'Antrian',
  siap: 'Siap diambil',
  diambil: 'Sudah diambil',
  batal: 'Dibatalkan',
}

export default function Reservasi() {
  const { profil } = useAuth()
  const buku = useKoleksi<Buku>('perpus_buku')
  const [list, setList] = useState<TReservasi[]>([])
  const [galat, setGalat] = useState('')
  const [ok, setOk] = useState('')
  const [memuat, setMemuat] = useState(true)

  const [bukuId, setBukuId] = useState('')
  const [cariBuku, setCariBuku] = useState('')
  const [tipe, setTipe] = useState<'siswa' | 'anggota'>('siswa')
  const [kodePemesan, setKodePemesan] = useState('')
  const [proses, setProses] = useState(false)

  const muat = useCallback(async () => {
    setMemuat(true)
    try {
      setList(await daftarReservasiAktif())
      setGalat('')
    } catch (e) {
      const kode = (e as { code?: string })?.code
      setGalat(kode === 'permission-denied' ? 'Tidak ada akses.' : 'Gagal memuat reservasi.')
    }
    setMemuat(false)
  }, [])

  useEffect(() => {
    void muat()
  }, [muat])

  const opsiBuku = buku.data
    .filter((b) => b.jenis !== 'digital')
    .filter((b) => {
      const q = cariBuku.trim().toLowerCase()
      if (!q) return true
      return b.judul.toLowerCase().includes(q) || (b.pengarang?.toLowerCase().includes(q) ?? false)
    })
    .slice(0, 40)

  async function simpan() {
    setGalat('')
    setOk('')
    const b = buku.data.find((x) => x.id === bukuId)
    if (!b) return setGalat('Pilih buku.')
    setProses(true)
    try {
      let pemesan
      if (tipe === 'siswa') {
        const s = await cariSiswa(kodePemesan.trim())
        if (!s) throw new Error('Siswa tidak ditemukan.')
        pemesan = kePeminjamSiswa(s)
      } else {
        const a = await cariAnggota(kodePemesan.trim())
        if (!a) throw new Error('Anggota tidak ditemukan.')
        pemesan = kePeminjamAnggota(a)
      }
      const id = await buatReservasi({ bukuId: b.id, judul: b.judul, pemesan })
      void catat(profil, 'reservasi', 'perpus_reservasi', id)
      setOk(`Reservasi dicatat: ${b.judul} untuk ${pemesan.nama}.`)
      setKodePemesan('')
      await muat()
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Gagal membuat reservasi.')
    }
    setProses(false)
  }

  async function setStatus(r: TReservasi, status: TReservasi['status']) {
    try {
      await ubahStatusReservasi(r.id, status)
      void catat(profil, `reservasi ${status}`, 'perpus_reservasi', r.id)
      await muat()
    } catch {
      setGalat('Gagal mengubah status.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader judul="Reservasi" keterangan="Antrian buku yang sedang dipinjam atau dipesan untuk diambil." />
      {galat && (
        <div className="mb-4">
          <Notice tipe="error">{galat}</Notice>
        </div>
      )}
      {ok && (
        <div className="mb-4">
          <Notice>{ok}</Notice>
        </div>
      )}

      <div className="card-soft mb-4 space-y-3 p-4">
        <Field label="Cari buku">
          <input className={inputCls} value={cariBuku} onChange={(e) => setCariBuku(e.target.value)} placeholder="Judul…" />
        </Field>
        <Field label="Buku">
          <select className={inputCls} value={bukuId} onChange={(e) => setBukuId(e.target.value)}>
            <option value="">— Pilih —</option>
            {opsiBuku.map((b) => (
              <option key={b.id} value={b.id}>
                {b.judul} ({b.eksemplarTersedia ?? 0} tersedia)
              </option>
            ))}
          </select>
        </Field>
        <div className="flex gap-2">
          <button type="button" className={tipe === 'siswa' ? btnPrimary : btnGhost} onClick={() => setTipe('siswa')}>
            Siswa
          </button>
          <button type="button" className={tipe === 'anggota' ? btnPrimary : btnGhost} onClick={() => setTipe('anggota')}>
            Anggota
          </button>
        </div>
        <Field label={tipe === 'siswa' ? 'NISN' : 'ID anggota'}>
          <input className={inputCls} value={kodePemesan} onChange={(e) => setKodePemesan(e.target.value)} />
        </Field>
        <button type="button" className={btnPrimary} disabled={proses || !bukuId || !kodePemesan.trim()} onClick={() => void simpan()}>
          {proses ? 'Menyimpan…' : 'Catat reservasi'}
        </button>
      </div>

      <div className="card-soft">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="font-semibold">Antrian aktif</div>
          <button type="button" className={btnGhost} disabled={memuat} onClick={() => void muat()}>
            {memuat ? '…' : 'Muat ulang'}
          </button>
        </div>
        {list.length === 0 ? (
          <div className="p-4 text-sm text-muted">Tidak ada reservasi aktif.</div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <div className="font-medium">{r.judul}</div>
                  <div className="text-muted">
                    {r.pemesan.nama}
                    {r.pemesan.kelas ? ` · ${r.pemesan.kelas}` : ''}
                    {r.pemesan.tipe === 'siswa' ? ` · NISN ${r.pemesan.id}` : ''}
                  </div>
                  <div className="mt-1">
                    <Badge>{NAMA_STATUS[r.status]}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.status === 'antrian' && (
                    <button type="button" className="text-xs font-medium text-muh-600 hover:underline" onClick={() => void setStatus(r, 'siap')}>
                      Tandai siap
                    </button>
                  )}
                  {(r.status === 'antrian' || r.status === 'siap') && (
                    <>
                      <button type="button" className="text-xs font-medium text-muh-600 hover:underline" onClick={() => void setStatus(r, 'diambil')}>
                        Sudah diambil
                      </button>
                      <button type="button" className="text-xs font-medium text-red-700 hover:underline" onClick={() => void setStatus(r, 'batal')}>
                        Batalkan
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
