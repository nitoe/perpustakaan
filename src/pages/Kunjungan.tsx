import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { catat } from '../lib/data'
import {
  catatKunjungan,
  catatKunjunganBanyak,
  daftarKunjunganTanggal,
  pengunjungDariSiswa,
  rekapPerKelas,
  tanggalHariIni,
} from '../lib/kunjungan'
import { DAFTAR_KELAS, muatSiswaKelas } from '../lib/siswaAuth'
import type { SiswaDasar } from '../lib/sirkulasi'
import { KEPERLUAN_KUNJUNGAN, type Kunjungan } from '../lib/tipe'
import PilihSiswaAktif from '../components/PilihSiswaAktif'
import { Badge, Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'

type Mode = 'satu' | 'kelas'

export default function Kunjungan() {
  const { profil } = useAuth()
  const [mode, setMode] = useState<Mode>('satu')
  const [keperluan, setKeperluan] = useState<string>(KEPERLUAN_KUNJUNGAN[0]!)
  const [galat, setGalat] = useState('')
  const [ok, setOk] = useState('')
  const [hariIni, setHariIni] = useState<Kunjungan[]>([])
  const [memuat, setMemuat] = useState(true)

  const muat = useCallback(async () => {
    setMemuat(true)
    try {
      setHariIni(await daftarKunjunganTanggal(tanggalHariIni()))
      setGalat('')
    } catch (e) {
      const kode = (e as { code?: string })?.code
      setGalat(kode === 'permission-denied' ? 'Anda tidak memiliki akses.' : 'Gagal memuat kunjungan hari ini.')
    }
    setMemuat(false)
  }, [])

  useEffect(() => {
    void muat()
  }, [muat])

  const rekap = rekapPerKelas(hariIni)

  return (
    <div className="w-full">
      <PageHeader
        judul="Kunjungan"
        keterangan="Catat pengunjung dari siswa yang sudah diaktifkan. Pilih kelas lalu nama."
      />

      <div className="mb-4 flex gap-2">
        <button type="button" className={mode === 'satu' ? btnPrimary : btnGhost} onClick={() => setMode('satu')}>
          Satu pengunjung
        </button>
        <button type="button" className={mode === 'kelas' ? btnPrimary : btnGhost} onClick={() => setMode('kelas')}>
          Per kelas
        </button>
      </div>

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

      <div className="card-soft mb-4 space-y-4 p-4">
        <Field label="Keperluan">
          <select className={inputCls} value={keperluan} onChange={(e) => setKeperluan(e.target.value)}>
            {KEPERLUAN_KUNJUNGAN.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>

        {mode === 'satu' ? (
          <ModeSatu
            keperluan={keperluan}
            onGalat={setGalat}
            onOk={(msg, id) => {
              setOk(msg)
              if (id) void catat(profil, 'kunjungan', 'perpus_kunjungan', id)
              void muat()
            }}
          />
        ) : (
          <ModeKelas
            keperluan={keperluan}
            onGalat={setGalat}
            onOk={(msg) => {
              setOk(msg)
              void catat(profil, 'kunjungan-kelas', 'perpus_kunjungan', '')
              void muat()
            }}
          />
        )}
      </div>

      <div className="card-soft">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="font-semibold">Hari ini ({tanggalHariIni()})</div>
          <div className="flex items-center gap-3">
            <span className="tabular text-sm text-muted">{hariIni.length} kunjungan</span>
            <button type="button" className={btnGhost} disabled={memuat} onClick={() => void muat()}>
              {memuat ? 'Memuat…' : 'Muat ulang'}
            </button>
          </div>
        </div>
        {rekap.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-border px-4 py-2">
            {rekap.map((r) => (
              <Badge key={r.kelas}>
                {r.kelas}: {r.jumlah}
              </Badge>
            ))}
          </div>
        )}
        {hariIni.length === 0 ? (
          <div className="p-4 text-sm text-muted">Belum ada kunjungan tercatat hari ini.</div>
        ) : (
          <ul className="divide-y divide-border">
            {hariIni.slice(0, 80).map((k) => (
              <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                <div>
                  <span className="font-medium">{k.pengunjung.nama}</span>
                  <span className="text-muted">
                    {k.pengunjung.kelas ? ` · ${k.pengunjung.kelas}` : ''}
                    {k.pengunjung.tipe === 'siswa' ? ` · NISN ${k.pengunjung.id}` : ''}
                  </span>
                </div>
                <div className="text-xs text-muted">
                  {k.waktu.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  {k.keperluan ? ` · ${k.keperluan}` : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ModeSatu({
  keperluan,
  onGalat,
  onOk,
}: {
  keperluan: string
  onGalat: (s: string) => void
  onOk: (msg: string, id: string) => void
}) {
  const [siswa, setSiswa] = useState<SiswaDasar | null>(null)
  const [proses, setProses] = useState(false)

  async function simpan() {
    onGalat('')
    if (!siswa) {
      onGalat('Pilih kelas dan nama siswa dulu.')
      return
    }
    setProses(true)
    try {
      const id = await catatKunjungan(pengunjungDariSiswa(siswa), keperluan)
      onOk(
        `Tercatat: ${siswa.nama}${siswa.kelas ? ` (${siswa.kelas})` : ''} · NISN ${(siswa.nisn && siswa.nisn.trim()) || siswa.id}.`,
        id,
      )
      setSiswa(null)
    } catch (err) {
      onGalat(err instanceof Error ? err.message : 'Gagal mencatat kunjungan.')
    }
    setProses(false)
  }

  return (
    <div className="space-y-3">
      <PilihSiswaAktif nilai={siswa} onPilih={setSiswa} disabled={proses} />
      <button type="button" className={btnPrimary} disabled={proses || !siswa} onClick={() => void simpan()}>
        {proses ? 'Mencatat…' : 'Catat kunjungan'}
      </button>
    </div>
  )
}

function ModeKelas({
  keperluan,
  onGalat,
  onOk,
}: {
  keperluan: string
  onGalat: (s: string) => void
  onOk: (msg: string) => void
}) {
  const [kelas, setKelas] = useState('')
  const [filterNama, setFilterNama] = useState('')
  const [daftar, setDaftar] = useState<{ id: string; nama: string; kelas?: string; nisn?: string; pilih: boolean }[]>([])
  const [proses, setProses] = useState(false)

  async function muatKelas(k: string) {
    onGalat('')
    if (!k) {
      setDaftar([])
      return
    }
    setProses(true)
    try {
      const siswa = await muatSiswaKelas(k)
      if (siswa.length === 0) {
        onGalat(`Tidak ada siswa aktif di kelas ${k}. Aktifkan dulu di menu Izin siswa.`)
        setDaftar([])
      } else {
        setDaftar(
          siswa.map((s) => ({
            id: s.id,
            nama: s.nama,
            kelas: s.kelas,
            nisn: s.nisn,
            pilih: true,
          })),
        )
        setFilterNama('')
      }
    } catch (e) {
      const kode = (e as { code?: string })?.code
      onGalat(kode === 'permission-denied' ? 'Anda tidak memiliki akses ke data siswa.' : 'Gagal memuat siswa.')
    }
    setProses(false)
  }

  async function simpan() {
    const pilih = daftar.filter((d) => d.pilih)
    if (pilih.length === 0) {
      onGalat('Pilih minimal satu siswa.')
      return
    }
    setProses(true)
    onGalat('')
    try {
      const pengunjung = pilih.map((s) =>
        pengunjungDariSiswa({ id: s.id, nama: s.nama, kelas: s.kelas, nisn: s.nisn }),
      )
      const n = await catatKunjunganBanyak(pengunjung, keperluan)
      onOk(`${n} kunjungan kelas ${kelas} dicatat.`)
      setDaftar([])
      setFilterNama('')
    } catch (err) {
      onGalat(err instanceof Error ? err.message : 'Gagal mencatat kunjungan kelas.')
    }
    setProses(false)
  }

  const tampil = useMemo(() => {
    const q = filterNama.trim().toLowerCase()
    if (!q) return daftar
    return daftar.filter((s) => s.nama.toLowerCase().includes(q))
  }, [daftar, filterNama])

  const terpilih = daftar.filter((d) => d.pilih).length

  return (
    <div className="space-y-3">
      <Field label="Kelas" hint="Hanya siswa yang sudah diaktifkan.">
        <select
          className={inputCls}
          value={kelas}
          disabled={proses}
          onChange={(e) => {
            const k = e.target.value
            setKelas(k)
            void muatKelas(k)
          }}
        >
          <option value="">— Pilih kelas —</option>
          {DAFTAR_KELAS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </Field>
      {daftar.length > 0 && (
        <>
          <Field label="Saring nama (opsional)">
            <input
              className={inputCls}
              value={filterNama}
              onChange={(e) => setFilterNama(e.target.value)}
              placeholder="Ketik nama…"
            />
          </Field>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">
              {terpilih} / {daftar.length} dipilih
              {filterNama.trim() ? ` · tampil ${tampil.length}` : ''}
            </span>
            <button
              type="button"
              className="text-xs font-medium text-muh-600 hover:underline"
              onClick={() => setDaftar((d) => d.map((x) => ({ ...x, pilih: terpilih < d.length })))}
            >
              {terpilih < daftar.length ? 'Pilih semua' : 'Hapus centang'}
            </button>
          </div>
          <ul className="max-h-56 overflow-y-auto rounded-lg border border-border">
            {tampil.map((s) => {
              const idx = daftar.findIndex((x) => x.id === s.id)
              return (
                <li key={s.id} className="flex items-center gap-2 border-b border-border px-3 py-2 text-sm last:border-0">
                  <input
                    type="checkbox"
                    checked={s.pilih}
                    onChange={(e) =>
                      setDaftar((d) => d.map((x, j) => (j === idx ? { ...x, pilih: e.target.checked } : x)))
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{s.nama}</span>
                    <span className="text-muted">
                      {' · '}
                      {(s.nisn && s.nisn.trim()) || s.id}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
          <button type="button" className={btnPrimary} disabled={proses || terpilih === 0} onClick={() => void simpan()}>
            {proses ? 'Mencatat…' : `Catat ${terpilih} kunjungan`}
          </button>
        </>
      )}
    </div>
  )
}
