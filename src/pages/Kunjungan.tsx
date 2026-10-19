import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { catat } from '../lib/data'
import { cariSiswa } from '../lib/sirkulasi'
import {
  catatKunjungan,
  catatKunjunganBanyak,
  daftarKunjunganTanggal,
  pengunjungDariSiswa,
  rekapPerKelas,
  siswaPerKelas,
  tanggalHariIni,
} from '../lib/kunjungan'
import { KEPERLUAN_KUNJUNGAN, type Kunjungan } from '../lib/tipe'
import { Badge, Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'

type Mode = 'pindai' | 'kelas'

export default function Kunjungan() {
  const { profil } = useAuth()
  const [mode, setMode] = useState<Mode>('pindai')
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
    <div className="mx-auto max-w-3xl">
      <PageHeader
        judul="Kunjungan"
        keterangan="Catat siapa yang berkunjung ke perpustakaan (pindai NISN atau per kelas)."
      />

      <div className="mb-4 flex gap-2">
        <button type="button" className={mode === 'pindai' ? btnPrimary : btnGhost} onClick={() => setMode('pindai')}>
          Pindai / ketik
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

        {mode === 'pindai' ? (
          <ModePindai
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

function ModePindai({
  keperluan,
  onGalat,
  onOk,
}: {
  keperluan: string
  onGalat: (s: string) => void
  onOk: (msg: string, id: string) => void
}) {
  const [kode, setKode] = useState('')
  const [proses, setProses] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  async function simpan() {
    onGalat('')
    const k = kode.trim()
    if (!k) return
    setProses(true)
    try {
      const s = await cariSiswa(k)
      if (!s) throw new Error(`Siswa dengan NISN/NIPD "${k}" tidak ditemukan.`)
      if (s.aktif === false) throw new Error(`Siswa ${s.nama} berstatus tidak aktif.`)
      const id = await catatKunjungan(pengunjungDariSiswa(s), keperluan)
      onOk(`Tercatat: ${s.nama}${s.kelas ? ` (${s.kelas})` : ''}.`, id)
      setKode('')
      ref.current?.focus()
    } catch (err) {
      onGalat(err instanceof Error ? err.message : 'Gagal mencatat kunjungan.')
    }
    setProses(false)
  }

  return (
    <>
      <Field label="NISN (atau NIPD)" hint="Pindai kartu anggota di pintu, lalu Enter.">
        <input
          ref={ref}
          className={inputCls}
          value={kode}
          autoFocus
          disabled={proses}
          onChange={(e) => setKode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void simpan()
            }
          }}
          placeholder="NISN"
        />
      </Field>
      <button type="button" className={btnPrimary} disabled={proses || !kode.trim()} onClick={() => void simpan()}>
        {proses ? 'Mencatat…' : 'Catat kunjungan'}
      </button>
    </>
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
  const [daftar, setDaftar] = useState<{ id: string; nama: string; kelas?: string; nisn?: string; pilih: boolean }[]>([])
  const [proses, setProses] = useState(false)

  async function muatKelas() {
    onGalat('')
    const k = kelas.trim().toUpperCase()
    if (!k) return
    setProses(true)
    try {
      const siswa = await siswaPerKelas(k)
      if (siswa.length === 0) {
        onGalat(`Tidak ada siswa aktif di kelas ${k}.`)
        setDaftar([])
      } else {
        setDaftar(siswa.map((s) => ({ id: s.id, nama: s.nama, kelas: s.kelas, nisn: s.nisn, pilih: true })))
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
      onOk(`${n} kunjungan kelas ${kelas.trim().toUpperCase()} dicatat.`)
      setDaftar([])
    } catch (err) {
      onGalat(err instanceof Error ? err.message : 'Gagal mencatat kunjungan kelas.')
    }
    setProses(false)
  }

  const terpilih = daftar.filter((d) => d.pilih).length

  return (
    <div className="space-y-3">
      <Field label="Kelas" hint="Contoh: 3A, 5B (sesuai penamaan di Penilaian).">
        <div className="flex gap-2">
          <input
            className={inputCls}
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void muatKelas()
              }
            }}
            placeholder="3A"
          />
          <button type="button" className={btnGhost} disabled={proses || !kelas.trim()} onClick={() => void muatKelas()}>
            Muat
          </button>
        </div>
      </Field>
      {daftar.length > 0 && (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">
              {terpilih} / {daftar.length} dipilih
            </span>
            <button
              type="button"
              className="text-xs font-medium text-muh-600 hover:underline"
              onClick={() =>
                setDaftar((d) => d.map((x) => ({ ...x, pilih: terpilih < d.length })))
              }
            >
              {terpilih < daftar.length ? 'Pilih semua' : 'Hapus centang'}
            </button>
          </div>
          <ul className="max-h-56 overflow-y-auto rounded-lg border border-border">
            {daftar.map((s, i) => (
              <li key={s.id} className="flex items-center gap-2 border-b border-border px-3 py-2 text-sm last:border-0">
                <input
                  type="checkbox"
                  checked={s.pilih}
                  onChange={(e) =>
                    setDaftar((d) => d.map((x, j) => (j === i ? { ...x, pilih: e.target.checked } : x)))
                  }
                />
                <span>{s.nama}</span>
              </li>
            ))}
          </ul>
          <button type="button" className={btnPrimary} disabled={proses || terpilih === 0} onClick={() => void simpan()}>
            {proses ? 'Mencatat…' : `Catat ${terpilih} kunjungan`}
          </button>
        </>
      )}
    </div>
  )
}
