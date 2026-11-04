import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { catat } from '../lib/data'
import { useKoleksi } from '../lib/useKoleksi'
import { kePeminjamAnggota, kePeminjamSiswa, type SiswaDasar } from '../lib/sirkulasi'
import { buatReservasi, daftarReservasiAktif, ubahStatusReservasi } from '../lib/reservasi'
import type { Anggota, Buku, Reservasi as TReservasi } from '../lib/tipe'
import PilihSiswaAktif from '../components/PilihSiswaAktif'
import CariBuku from '../components/CariBuku'
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
  const anggotaList = useKoleksi<Anggota>('perpus_anggota')
  const [list, setList] = useState<TReservasi[]>([])
  const [galat, setGalat] = useState('')
  const [ok, setOk] = useState('')
  const [memuat, setMemuat] = useState(true)

  const [bukuId, setBukuId] = useState('')
  const [tipe, setTipe] = useState<'siswa' | 'anggota'>('siswa')
  const [siswaTerpilih, setSiswaTerpilih] = useState<SiswaDasar | null>(null)
  const [anggotaId, setAnggotaId] = useState('')
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

  const anggotaAktif = anggotaList.data
    .filter((a) => a.aktif !== false)
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))

  async function simpan() {
    setGalat('')
    setOk('')
    const b = buku.data.find((x) => x.id === bukuId)
    if (!b) return setGalat('Pilih buku.')
    setProses(true)
    try {
      let pemesan
      if (tipe === 'siswa') {
        if (!siswaTerpilih) throw new Error('Pilih siswa dari dropdown.')
        pemesan = kePeminjamSiswa(siswaTerpilih)
      } else {
        const a = anggotaAktif.find((x) => x.id === anggotaId)
        if (!a) throw new Error('Pilih anggota dari dropdown.')
        pemesan = kePeminjamAnggota(a)
      }
      const id = await buatReservasi({ bukuId: b.id, judul: b.judul, pemesan })
      void catat(profil, 'reservasi', 'perpus_reservasi', id)
      setOk(`Reservasi dicatat: ${b.judul} untuk ${pemesan.nama}.`)
      setSiswaTerpilih(null)
      setAnggotaId('')
      setBukuId('')
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

  const bisaSimpan = bukuId && (tipe === 'siswa' ? !!siswaTerpilih : !!anggotaId)

  return (
    <div className="w-full">
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
        <CariBuku
          nilaiId={bukuId}
          onPilih={(b) => setBukuId(b?.id ?? '')}
          disabled={proses}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className={tipe === 'siswa' ? btnPrimary : btnGhost}
            onClick={() => {
              setTipe('siswa')
              setSiswaTerpilih(null)
              setAnggotaId('')
            }}
          >
            Siswa
          </button>
          <button
            type="button"
            className={tipe === 'anggota' ? btnPrimary : btnGhost}
            onClick={() => {
              setTipe('anggota')
              setSiswaTerpilih(null)
            }}
          >
            Anggota
          </button>
        </div>
        {tipe === 'siswa' ? (
          <PilihSiswaAktif nilai={siswaTerpilih} onPilih={setSiswaTerpilih} />
        ) : (
          <Field label="Nama anggota">
            <select className={inputCls} value={anggotaId} onChange={(e) => setAnggotaId(e.target.value)}>
              <option value="">— Pilih anggota —</option>
              {anggotaAktif.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama}
                </option>
              ))}
            </select>
          </Field>
        )}
        <button type="button" className={btnPrimary} disabled={proses || !bisaSimpan} onClick={() => void simpan()}>
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
