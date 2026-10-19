import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { catat } from '../lib/data'
import { cariSiswa, type SiswaDasar } from '../lib/sirkulasi'
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
    <div className="mx-auto max-w-3xl">
      <PageHeader
        judul="Kunjungan"
        keterangan="Catat pengunjung: NISN, nama, dan kelas saling terisi otomatis."
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

/**
 * Satu pengunjung: isi salah satu dari NISN / nama / kelas — yang lain menyesuaikan.
 * - NISN (atau NIPD) → nama & kelas otomatis
 * - Kelas dimuat dulu → ketik nama hanya menampilkan siswa kelas itu
 * - Pilih dari daftar saran → NISN, nama, kelas terisi
 */
function ModeSatu({
  keperluan,
  onGalat,
  onOk,
}: {
  keperluan: string
  onGalat: (s: string) => void
  onOk: (msg: string, id: string) => void
}) {
  const [nisn, setNisn] = useState('')
  const [nama, setNama] = useState('')
  const [kelas, setKelas] = useState('')
  const [siswa, setSiswa] = useState<SiswaDasar | null>(null)
  const [roster, setRoster] = useState<SiswaDasar[]>([])
  const [proses, setProses] = useState(false)
  const [cariNisn, setCariNisn] = useState(false)
  const [muatRoster, setMuatRoster] = useState(false)
  const refNisn = useRef<HTMLInputElement>(null)

  function isiDariSiswa(s: SiswaDasar) {
    setSiswa(s)
    setNisn((s.nisn && s.nisn.trim()) || s.id)
    setNama(s.nama)
    setKelas(s.kelas ?? '')
  }

  function kosongkan() {
    setSiswa(null)
    setNisn('')
    setNama('')
    setKelas('')
  }

  async function lookupNisn(kode?: string) {
    const k = (kode ?? nisn).trim()
    if (!k) return
    onGalat('')
    setCariNisn(true)
    try {
      const s = await cariSiswa(k)
      if (!s) {
        setSiswa(null)
        setNama('')
        setKelas('')
        onGalat(`Siswa dengan NISN/NIPD "${k}" tidak ditemukan.`)
        return
      }
      if (s.aktif === false) {
        setSiswa(null)
        onGalat(`Siswa ${s.nama} berstatus tidak aktif.`)
        return
      }
      isiDariSiswa(s)
    } catch (e) {
      const kodeErr = (e as { code?: string })?.code
      onGalat(kodeErr === 'permission-denied' ? 'Anda tidak memiliki akses ke data siswa.' : 'Gagal mencari siswa.')
    }
    setCariNisn(false)
  }

  async function muatKelas() {
    const k = kelas.trim().toUpperCase()
    if (!k) {
      setRoster([])
      return
    }
    onGalat('')
    setMuatRoster(true)
    try {
      const list = await siswaPerKelas(k)
      setRoster(list)
      setKelas(k)
      if (list.length === 0) onGalat(`Tidak ada siswa aktif di kelas ${k}.`)
      // Jika siswa terpilih bukan dari kelas ini, jangan paksa ganti — biarkan petugas yang putuskan.
    } catch (e) {
      const kode = (e as { code?: string })?.code
      onGalat(kode === 'permission-denied' ? 'Anda tidak memiliki akses ke data siswa.' : 'Gagal memuat kelas.')
      setRoster([])
    }
    setMuatRoster(false)
  }

  const saranNama = useMemo(() => {
    const q = nama.trim().toLowerCase()
    if (!q || roster.length === 0) return []
    // Jangan tampilkan saran jika nama sudah tepat satu siswa yang sama.
    if (siswa && siswa.nama.toLowerCase() === q) return []
    return roster
      .filter((s) => s.nama.toLowerCase().includes(q))
      .slice(0, 12)
  }, [nama, roster, siswa])

  async function simpan() {
    onGalat('')
    let target = siswa
    if (!target && nisn.trim()) {
      setProses(true)
      try {
        const s = await cariSiswa(nisn.trim())
        if (!s) throw new Error(`Siswa dengan NISN/NIPD "${nisn.trim()}" tidak ditemukan.`)
        if (s.aktif === false) throw new Error(`Siswa ${s.nama} berstatus tidak aktif.`)
        target = s
        isiDariSiswa(s)
      } catch (err) {
        onGalat(err instanceof Error ? err.message : 'Gagal mencari siswa.')
        setProses(false)
        return
      }
    }
    if (!target) {
      onGalat('Pilih siswa dulu: isi NISN lalu Enter, atau pilih kelas lalu ketik/pilih nama.')
      return
    }
    setProses(true)
    try {
      const id = await catatKunjungan(pengunjungDariSiswa(target), keperluan)
      onOk(`Tercatat: ${target.nama}${target.kelas ? ` (${target.kelas})` : ''} · NISN ${(target.nisn && target.nisn.trim()) || target.id}.`, id)
      kosongkan()
      refNisn.current?.focus()
    } catch (err) {
      onGalat(err instanceof Error ? err.message : 'Gagal mencatat kunjungan.')
    }
    setProses(false)
  }

  return (
    <div className="space-y-3">
      <Field label="NISN" hint="Pindai kartu atau ketik, lalu Enter — nama dan kelas terisi otomatis.">
        <input
          ref={refNisn}
          className={inputCls}
          value={nisn}
          autoFocus
          disabled={proses || cariNisn}
          placeholder="NISN / NIPD"
          onChange={(e) => {
            setNisn(e.target.value)
            setSiswa(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void lookupNisn()
            }
          }}
          onBlur={() => {
            if (nisn.trim() && !siswa) void lookupNisn()
          }}
        />
      </Field>

      <Field
        label="Kelas (opsional)"
        hint="Isi lalu Muat agar pencarian nama hanya dari kelas itu. Boleh dikosongkan jika pakai NISN."
      >
        <div className="flex gap-2">
          <input
            className={inputCls}
            value={kelas}
            disabled={proses}
            placeholder="3A"
            onChange={(e) => {
              setKelas(e.target.value)
              setRoster([])
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void muatKelas()
              }
            }}
          />
          <button type="button" className={btnGhost} disabled={proses || muatRoster || !kelas.trim()} onClick={() => void muatKelas()}>
            {muatRoster ? '…' : 'Muat'}
          </button>
        </div>
        {roster.length > 0 && (
          <span className="mt-1 block text-xs text-muted">{roster.length} siswa di kelas {kelas.trim().toUpperCase()}</span>
        )}
      </Field>

      <Field
        label="Nama"
        hint={
          roster.length > 0
            ? 'Ketik sebagian nama — saran hanya dari kelas yang dimuat.'
            : 'Muat kelas dulu untuk saran nama, atau isi NISN agar nama terisi otomatis.'
        }
      >
        <input
          className={inputCls}
          value={nama}
          disabled={proses}
          placeholder="Nama siswa"
          onChange={(e) => {
            setNama(e.target.value)
            // Jika user mengedit nama, anggap pilihan belum dikunci.
            if (siswa && e.target.value.trim() !== siswa.nama) setSiswa(null)
          }}
        />
        {saranNama.length > 0 && (
          <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-white shadow-sm">
            {saranNama.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muh-50"
                  onClick={() => {
                    isiDariSiswa(s)
                    onGalat('')
                  }}
                >
                  <span className="font-medium">{s.nama}</span>
                  <span className="text-xs text-muted">
                    {(s.nisn && s.nisn.trim()) || s.id}
                    {s.kelas ? ` · ${s.kelas}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Field>

      {siswa && (
        <div className="rounded-lg border border-muh-200 bg-muh-50 px-3 py-2 text-sm">
          <span className="font-medium">{siswa.nama}</span>
          <span className="text-muted">
            {siswa.kelas ? ` · ${siswa.kelas}` : ''}
            {' · NISN '}
            {(siswa.nisn && siswa.nisn.trim()) || siswa.id}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnPrimary}
          disabled={proses || cariNisn || (!siswa && !nisn.trim())}
          onClick={() => void simpan()}
        >
          {proses ? 'Mencatat…' : 'Catat kunjungan'}
        </button>
        {(siswa || nisn || nama) && (
          <button type="button" className={btnGhost} disabled={proses} onClick={kosongkan}>
            Reset
          </button>
        )}
      </div>
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
        setDaftar(
          siswa.map((s) => ({
            id: s.id,
            nama: s.nama,
            kelas: s.kelas,
            nisn: s.nisn,
            pilih: true,
          })),
        )
        setKelas(k)
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
      onOk(`${n} kunjungan kelas ${kelas.trim().toUpperCase()} dicatat.`)
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
