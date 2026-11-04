import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { catat } from '../lib/data'
import {
  aktifkanBanyak,
  aktifkanSiswa,
  daftarSemuaIzin,
  nonaktifkanSiswa,
} from '../lib/izinSiswa'
import { DAFTAR_KELAS, muatSemuaSiswaKelas } from '../lib/siswaAuth'
import type { SiswaDasar } from '../lib/sirkulasi'
import type { IzinSiswa } from '../lib/tipe'
import { Badge, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'

type Baris = SiswaDasar & { izin?: IzinSiswa }

export default function IzinSiswa() {
  const { profil } = useAuth()
  const [kelas, setKelas] = useState('')
  const [daftar, setDaftar] = useState<Baris[]>([])
  const [izinMap, setIzinMap] = useState<Map<string, IzinSiswa>>(new Map())
  const [muat, setMuat] = useState(false)
  const [prosesId, setProsesId] = useState<string | null>(null)
  const [prosesBatch, setProsesBatch] = useState(false)
  const [pesan, setPesan] = useState('')
  const [ok, setOk] = useState('')
  const [cari, setCari] = useState('')
  const [hanyaBelum, setHanyaBelum] = useState(false)

  const muatIzin = useCallback(async () => {
    try {
      const semua = await daftarSemuaIzin()
      setIzinMap(new Map(semua.map((i) => [i.id, i])))
    } catch {
      setPesan('Gagal memuat data izin. Periksa aturan Firestore untuk perpus_izin_siswa.')
    }
  }, [])

  useEffect(() => {
    void muatIzin()
  }, [muatIzin])

  useEffect(() => {
    if (!kelas) {
      setDaftar([])
      return
    }
    let batal = false
    setMuat(true)
    setPesan('')
    void muatSemuaSiswaKelas(kelas)
      .then((list) => {
        if (batal) return
        setDaftar(
          list.map((s) => ({
            ...s,
            izin: izinMap.get(s.id),
          })),
        )
      })
      .catch((e) => {
        if (batal) return
        const kode = (e as { code?: string })?.code ?? ''
        setPesan(
          kode === 'permission-denied'
            ? 'Tidak bisa membaca daftar siswa. Pastikan rules koleksi siswa mengizinkan baca untuk pustakawan.'
            : e instanceof Error
              ? e.message
              : 'Gagal memuat siswa.',
        )
        setDaftar([])
      })
      .finally(() => {
        if (!batal) setMuat(false)
      })
    return () => {
      batal = true
    }
  }, [kelas, izinMap])

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return daftar
      .filter((s) => {
        const aktif = s.izin?.aktif === true
        if (hanyaBelum && aktif) return false
        if (!q) return true
        return (
          s.nama.toLowerCase().includes(q) ||
          (s.nisn || '').toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
  }, [daftar, cari, hanyaBelum])

  const jumlahAktif = useMemo(
    () => daftar.filter((s) => s.izin?.aktif === true).length,
    [daftar],
  )

  async function aktifkanSatu(s: SiswaDasar) {
    setPesan('')
    setOk('')
    setProsesId(s.id)
    try {
      await aktifkanSiswa(s)
      void catat(profil, 'aktifkan izin siswa', 'perpus_izin_siswa', s.id)
      await muatIzin()
      setOk(`${s.nama} diaktifkan. Sekarang bisa masuk di /siswa/masuk.`)
    } catch (e) {
      setPesan(e instanceof Error ? e.message : 'Gagal mengaktifkan.')
    } finally {
      setProsesId(null)
    }
  }

  async function nonaktifkanSatu(s: SiswaDasar) {
    setPesan('')
    setOk('')
    setProsesId(s.id)
    try {
      await nonaktifkanSiswa(s.id)
      void catat(profil, 'nonaktifkan izin siswa', 'perpus_izin_siswa', s.id)
      await muatIzin()
      setOk(`${s.nama} dinonaktifkan (tidak bisa login area siswa).`)
    } catch (e) {
      setPesan(e instanceof Error ? e.message : 'Gagal menonaktifkan.')
    } finally {
      setProsesId(null)
    }
  }

  async function aktifkanKelas() {
    const belum = daftar.filter((s) => s.izin?.aktif !== true)
    if (belum.length === 0) {
      setOk('Semua siswa di kelas ini sudah aktif.')
      return
    }
    if (
      !window.confirm(
        `Aktifkan ${belum.length} siswa di kelas ${kelas} yang belum punya izin? Mereka akan bisa login dengan NISN.`,
      )
    ) {
      return
    }
    setPesan('')
    setOk('')
    setProsesBatch(true)
    try {
      const n = await aktifkanBanyak(belum)
      void catat(profil, 'aktifkan izin siswa batch', 'perpus_izin_siswa', kelas)
      await muatIzin()
      setOk(`${n} siswa di kelas ${kelas} diaktifkan.`)
    } catch (e) {
      setPesan(e instanceof Error ? e.message : 'Gagal mengaktifkan batch.')
    } finally {
      setProsesBatch(false)
    }
  }

  return (
    <div className="w-full">
      <PageHeader
        judul="Izin siswa"
        keterangan="Aktifkan siswa dari data Penilaian agar bisa masuk area /siswa (rak baca, pinjaman, jurnal). Status sekolah (aktif di Penilaian) tidak diubah."
        aksi={
          kelas ? (
            <button
              type="button"
              className={btnPrimary}
              disabled={prosesBatch || muat || daftar.length === 0}
              onClick={() => void aktifkanKelas()}
            >
              {prosesBatch ? 'Mengaktifkan…' : `Aktifkan semua di ${kelas}`}
            </button>
          ) : undefined
        }
      />

      {(pesan || ok) && (
        <div className="mb-4 space-y-2">
          {pesan && <Notice tipe="error">{pesan}</Notice>}
          {ok && <Notice>{ok}</Notice>}
        </div>
      )}

      <div className="card-soft mb-4 grid gap-3 p-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-[0.8125rem] font-medium text-[#2b2f4a]">Kelas</span>
          <select
            className={inputCls}
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
          >
            <option value="">— Pilih kelas —</option>
            {DAFTAR_KELAS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[0.8125rem] font-medium text-[#2b2f4a]">Cari nama / NISN</span>
          <input
            className={inputCls}
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Ketik untuk filter…"
            disabled={!kelas}
          />
        </label>
        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hanyaBelum}
              onChange={(e) => setHanyaBelum(e.target.checked)}
              disabled={!kelas}
            />
            Hanya yang belum aktif
          </label>
          {kelas && (
            <p className="text-xs text-muted">
              {muat
                ? 'Memuat…'
                : `${jumlahAktif} dari ${daftar.length} sudah aktif di perpustakaan`}
            </p>
          )}
        </div>
      </div>

      {!kelas && (
        <Notice tipe="info">
          Pilih kelas untuk menampilkan daftar siswa dari data Penilaian. Aktifkan satu per satu atau seluruh kelas untuk uji coba.
        </Notice>
      )}

      {kelas && !muat && tampil.length === 0 && (
        <Notice tipe="warn">
          Tidak ada siswa yang cocok. Pastikan data siswa di Penilaian sudah terisi untuk kelas {kelas}.
        </Notice>
      )}

      {tampil.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs text-muted">
              <tr>
                <th className="px-3 py-2.5 font-medium">Nama</th>
                <th className="px-3 py-2.5 font-medium">NISN</th>
                <th className="px-3 py-2.5 font-medium">ID (NIPD)</th>
                <th className="px-3 py-2.5 font-medium">Status izin</th>
                <th className="px-3 py-2.5 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tampil.map((s) => {
                const aktif = s.izin?.aktif === true
                const sibuk = prosesId === s.id
                return (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
                    <td className="px-3 py-2.5 font-medium text-[#1a1d33]">{s.nama}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{s.nisn || '—'}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted">{s.id}</td>
                    <td className="px-3 py-2.5">
                      {aktif ? (
                        <Badge>Aktif</Badge>
                      ) : s.izin ? (
                        <span className="text-xs text-amber-700">Nonaktif</span>
                      ) : (
                        <span className="text-xs text-muted">Belum diizinkan</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {aktif ? (
                        <button
                          type="button"
                          className={btnGhost}
                          disabled={sibuk}
                          onClick={() => void nonaktifkanSatu(s)}
                        >
                          {sibuk ? '…' : 'Nonaktifkan'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={btnPrimary}
                          disabled={sibuk}
                          onClick={() => void aktifkanSatu(s)}
                        >
                          {sibuk ? '…' : 'Aktifkan'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
