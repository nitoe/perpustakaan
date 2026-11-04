import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { catat } from '../lib/data'
import { useKoleksi } from '../lib/useKoleksi'
import {
  ambilAturan,
  ambilEksemplar,
  daftarPinjamanAktif,
  daftarRiwayatKembali,
  formatTanggal,
  kembalikan,
  kePeminjamAnggota,
  kePeminjamSiswa,
  perpanjang,
  pinjam,
  pinjamanAktifEksemplar,
  pinjamanAktifPeminjam,
  terlambat,
  type SiswaDasar,
} from '../lib/sirkulasi'
import type { Anggota, Aturan, Eksemplar, KondisiBuku, Peminjam, Peminjaman } from '../lib/tipe'
import PilihSiswaAktif from '../components/PilihSiswaAktif'
import CariEksemplar from '../components/CariEksemplar'
import { Badge, Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'

type Mode = 'pinjam' | 'kembali' | 'daftar' | 'riwayat'

const NAMA_KONDISI: Record<KondisiBuku, string> = {
  baik: 'Baik',
  rusak_ringan: 'Rusak ringan',
  rusak_berat: 'Rusak berat',
}

export default function Sirkulasi() {
  const { profil } = useAuth()
  const [mode, setMode] = useState<Mode>('daftar')
  const [aturan, setAturan] = useState<Aturan | null>(null)
  const [galat, setGalat] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    void ambilAturan()
      .then(setAturan)
      .catch(() => setAturan(null))
  }, [])

  return (
    <div className="w-full">
      <PageHeader
        judul="Sirkulasi"
        keterangan="Semua buku yang sedang dipinjam tampil di sini. Untuk pinjam baru, pilih siswa atau anggota lalu cari eksemplar."
      />

      <div className="mb-4 flex gap-2">
        {(
          [
            ['daftar', 'Semua pinjaman'],
            ['riwayat', 'Riwayat kembali'],
            ['pinjam', 'Pinjam baru'],
            ['kembali', 'Kembalikan'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={mode === k ? btnPrimary : btnGhost}
            onClick={() => {
              setMode(k)
              setGalat('')
              setOk('')
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {aturan && (
        <div className="mb-4 text-xs text-muted">
          Aturan: pinjam {aturan.lamaPinjamHari} hari · siswa maks {aturan.maksSiswa} buku · anggota maks{' '}
          {aturan.maksAnggota} · perpanjang {aturan.maksPerpanjang}×
        </div>
      )}

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

      {mode === 'pinjam' && (
        <ModePinjam
          aturan={aturan}
          onGalat={setGalat}
          onOk={setOk}
          onLog={(t, id) => void catat(profil, t, 'perpus_peminjaman', id)}
        />
      )}
      {mode === 'kembali' && (
        <ModeKembali
          aturan={aturan}
          onGalat={setGalat}
          onOk={setOk}
          onLog={(t, id) => void catat(profil, t, 'perpus_peminjaman', id)}
        />
      )}
      {mode === 'daftar' && (
        <ModeDaftar
          aturan={aturan}
          onGalat={setGalat}
          onOk={setOk}
          onLog={(t, id) => void catat(profil, t, 'perpus_peminjaman', id)}
        />
      )}
      {mode === 'riwayat' && <ModeRiwayat onGalat={setGalat} />}
    </div>
  )
}

function ModePinjam({
  aturan,
  onGalat,
  onOk,
  onLog,
}: {
  aturan: Aturan | null
  onGalat: (s: string) => void
  onOk: (s: string) => void
  onLog: (tindakan: string, id: string) => void
}) {
  const anggotaList = useKoleksi<Anggota>('perpus_anggota')
  const [tipe, setTipe] = useState<'siswa' | 'anggota'>('siswa')
  const [anggotaId, setAnggotaId] = useState('')
  const [peminjam, setPeminjam] = useState<Peminjam | null>(null)
  const [infoSiswa, setInfoSiswa] = useState<SiswaDasar | null>(null)
  const [infoAnggota, setInfoAnggota] = useState<Anggota | null>(null)
  const [aktif, setAktif] = useState<Peminjaman[]>([])
  const [kodeEks, setKodeEks] = useState('')
  const [proses, setProses] = useState(false)

  const anggotaAktif = anggotaList.data
    .filter((a) => a.aktif !== false)
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))

  async function pilihSiswa(s: SiswaDasar | null) {
    onGalat('')
    onOk('')
    setPeminjam(null)
    setInfoSiswa(null)
    setInfoAnggota(null)
    setAktif([])
    if (!s) return
    try {
      const p = kePeminjamSiswa(s)
      setInfoSiswa(s)
      setPeminjam(p)
      setAktif(await pinjamanAktifPeminjam(p.id))
    } catch (e) {
      const kode = (e as { code?: string })?.code
      onGalat(kode === 'permission-denied' ? 'Anda tidak memiliki akses.' : 'Gagal memuat data peminjam.')
    }
  }

  async function pilihAnggota(id: string) {
    onGalat('')
    onOk('')
    setAnggotaId(id)
    setPeminjam(null)
    setInfoSiswa(null)
    setInfoAnggota(null)
    setAktif([])
    if (!id) return
    const a = anggotaAktif.find((x) => x.id === id)
    if (!a) {
      onGalat('Anggota tidak ditemukan.')
      return
    }
    try {
      const p = kePeminjamAnggota(a)
      setInfoAnggota(a)
      setPeminjam(p)
      setAktif(await pinjamanAktifPeminjam(p.id))
    } catch (e) {
      const kode = (e as { code?: string })?.code
      onGalat(kode === 'permission-denied' ? 'Anda tidak memiliki akses.' : 'Gagal memuat data anggota.')
    }
  }

  async function lakukanPinjam() {
    if (!peminjam || !aturan) return
    onGalat('')
    onOk('')
    const kode = kodeEks.trim().toUpperCase()
    if (!kode) {
      onGalat('Isi atau pindai kode eksemplar (mis. PRP-000123).')
      return
    }
    setProses(true)
    try {
      const e = await ambilEksemplar(kode)
      if (!e) throw new Error(`Eksemplar ${kode} tidak ditemukan.`)
      if (e.status === 'dihapus') throw new Error(`Eksemplar ${kode} sudah dikeluarkan dari koleksi.`)
      const hasil = await pinjam({
        eksemplar: e,
        peminjam,
        aturan,
        aktifSekarang: aktif.length,
      })
      onLog('pinjam', hasil.peminjamanId)
      onOk(`Berhasil dipinjamkan: ${e.judul} (${e.id}). Jatuh tempo ${formatTanggal(hasil.jatuhTempo)}.`)
      setKodeEks('')
      setAktif(await pinjamanAktifPeminjam(peminjam.id))
    } catch (err) {
      onGalat(err instanceof Error ? err.message : 'Gagal meminjamkan.')
    }
    setProses(false)
  }

  return (
    <div className="space-y-4">
      <div className="card-soft space-y-4 p-4">
        <div className="flex gap-2">
          <button
            type="button"
            className={tipe === 'siswa' ? btnPrimary : btnGhost}
            onClick={() => {
              setTipe('siswa')
              setPeminjam(null)
              setInfoSiswa(null)
              setInfoAnggota(null)
              setAktif([])
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
              setPeminjam(null)
              setInfoSiswa(null)
              setInfoAnggota(null)
              setAktif([])
            }}
          >
            Anggota
          </button>
        </div>

        {tipe === 'siswa' ? (
          <PilihSiswaAktif nilai={infoSiswa} onPilih={(s) => void pilihSiswa(s)} />
        ) : (
          <Field label="Nama anggota" hint="Guru, karyawan, atau kelas yang sudah didaftarkan di menu Anggota.">
            <select
              className={inputCls}
              value={anggotaId}
              onChange={(e) => void pilihAnggota(e.target.value)}
            >
              <option value="">— Pilih anggota —</option>
              {anggotaAktif.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama}
                </option>
              ))}
            </select>
          </Field>
        )}

        {peminjam && (
          <div className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
            <div className="font-semibold">{peminjam.nama}</div>
            <div className="text-muted">
              {peminjam.tipe === 'siswa'
                ? `NISN ${infoSiswa?.nisn || peminjam.id}${peminjam.kelas ? ` · Kelas ${peminjam.kelas}` : ''}`
                : `Anggota · ${infoAnggota?.jenis ?? '—'}`}
            </div>
            <div className="mt-1 tabular text-muted">
              Sedang meminjam: {aktif.length}
              {aturan ? ` / ${peminjam.tipe === 'siswa' ? aturan.maksSiswa : aturan.maksAnggota}` : ''}
            </div>
          </div>
        )}

        {peminjam && (
          <>
            <CariEksemplar
              nilai={kodeEks}
              onPilih={setKodeEks}
              disabled={proses}
              status="tersedia"
              placeholder="PRP-… atau judul buku"
            />
            <button type="button" className={btnPrimary} disabled={proses || !aturan || !kodeEks.trim()} onClick={() => void lakukanPinjam()}>
              {proses ? 'Memproses…' : 'Pinjamkan'}
            </button>
          </>
        )}
      </div>

      {aktif.length > 0 && (
        <DaftarPinjaman
          judul="Pinjaman aktif peminjam ini"
          data={aktif}
          aturan={aturan}
          onPerpanjang={async (p) => {
            if (!aturan) return
            try {
              const baru = await perpanjang(p, aturan)
              onLog('perpanjang', p.id)
              onOk(`Diperpanjang sampai ${formatTanggal(baru)}.`)
              if (peminjam) setAktif(await pinjamanAktifPeminjam(peminjam.id))
            } catch (err) {
              onGalat(err instanceof Error ? err.message : 'Gagal memperpanjang.')
            }
          }}
          onKembali={async (p) => {
            try {
              await kembalikan({ pinjam: p })
              onLog('kembali', p.id)
              onOk(`Dikembalikan: ${p.judul} (${p.eksemplarId}).`)
              if (peminjam) setAktif(await pinjamanAktifPeminjam(peminjam.id))
            } catch (err) {
              onGalat(err instanceof Error ? err.message : 'Gagal mengembalikan.')
            }
          }}
        />
      )}
    </div>
  )
}

function ModeKembali({
  aturan,
  onGalat,
  onOk,
  onLog,
}: {
  aturan: Aturan | null
  onGalat: (s: string) => void
  onOk: (s: string) => void
  onLog: (tindakan: string, id: string) => void
}) {
  const [kode, setKode] = useState('')
  const [ketemu, setKetemu] = useState<Peminjaman | null>(null)
  const [eks, setEks] = useState<Eksemplar | null>(null)
  const [kondisi, setKondisi] = useState<KondisiBuku>('baik')
  const [proses, setProses] = useState(false)
  const [data, setData] = useState<Peminjaman[]>([])
  const [memuat, setMemuat] = useState(true)
  const [hanyaTerlambat, setHanyaTerlambat] = useState(false)

  const muatDaftar = useCallback(async () => {
    setMemuat(true)
    try {
      setData(await daftarPinjamanAktif())
    } catch (e) {
      const kodeErr = (e as { code?: string })?.code
      onGalat(kodeErr === 'permission-denied' ? 'Anda tidak memiliki akses.' : 'Gagal memuat daftar pinjaman.')
    }
    setMemuat(false)
  }, [onGalat])

  useEffect(() => {
    void muatDaftar()
  }, [muatDaftar])

  function pilihDariDaftar(p: Peminjaman) {
    onGalat('')
    onOk('')
    setKetemu(p)
    setEks(null)
    setKode(p.eksemplarId)
    setKondisi('baik')
  }

  async function cari() {
    onGalat('')
    onOk('')
    setKetemu(null)
    setEks(null)
    const k = kode.trim().toUpperCase()
    if (!k) return
    try {
      const e = await ambilEksemplar(k)
      if (!e) {
        onGalat(`Eksemplar ${k} tidak ditemukan.`)
        return
      }
      setEks(e)
      if (e.status !== 'dipinjam') {
        onGalat(`Eksemplar ${k} berstatus ${e.status}, bukan dipinjam.`)
        return
      }
      const p = await pinjamanAktifEksemplar(k)
      if (!p) {
        onGalat(`Tidak ada catatan pinjaman aktif untuk ${k}.`)
        return
      }
      setKetemu(p)
      setKondisi(e.kondisi)
    } catch (err) {
      const kodeErr = (err as { code?: string })?.code
      onGalat(kodeErr === 'permission-denied' ? 'Anda tidak memiliki akses.' : 'Gagal mencari peminjaman.')
    }
  }

  async function lakukanKembali(hilang = false) {
    if (!ketemu) return
    setProses(true)
    onGalat('')
    try {
      await kembalikan({ pinjam: ketemu, kondisiKembali: kondisi, hilang })
      onLog(hilang ? 'kembali-hilang' : 'kembali', ketemu.id)
      onOk(
        hilang
          ? `Dicatat hilang: ${ketemu.judul} (${ketemu.eksemplarId}).`
          : `Dikembalikan: ${ketemu.judul} (${ketemu.eksemplarId}).`,
      )
      setKetemu(null)
      setEks(null)
      setKode('')
      await muatDaftar()
    } catch (err) {
      onGalat(err instanceof Error ? err.message : 'Gagal mengembalikan.')
    }
    setProses(false)
  }

  const tampil = hanyaTerlambat ? data.filter((p) => terlambat(p)) : data

  return (
    <div className="space-y-4">
      <div className="card-soft space-y-4 p-4">
        <div className="text-sm text-muted">
          Scan/cari kode eksemplar, atau pilih dari daftar pinjaman di bawah. Setelah dipilih, atur kondisi lalu kembalikan.
        </div>
        <CariEksemplar
          nilai={kode}
          onPilih={setKode}
          status="dipinjam"
          placeholder="PRP-… atau judul yang dipinjam"
        />
        <button type="button" className={btnGhost} onClick={() => void cari()} disabled={!kode.trim()}>
          Cari
        </button>

        {ketemu && (
          <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-3 text-sm">
            <div className="font-semibold">{ketemu.judul}</div>
            <div className="text-muted">
              {ketemu.eksemplarId} · {ketemu.peminjam.nama}
              {ketemu.peminjam.kelas ? ` (${ketemu.peminjam.kelas})` : ''} · jatuh tempo{' '}
              {formatTanggal(ketemu.jatuhTempo)}
              {terlambat(ketemu) && (
                <>
                  {' '}
                  <Badge>Terlambat</Badge>
                </>
              )}
            </div>
            <Field label="Kondisi saat kembali">
              <select className={inputCls} value={kondisi} onChange={(e) => setKondisi(e.target.value as KondisiBuku)}>
                {Object.entries(NAMA_KONDISI).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnPrimary} disabled={proses} onClick={() => void lakukanKembali(false)}>
                {proses ? 'Memproses…' : 'Kembalikan'}
              </button>
              <button
                type="button"
                className={btnGhost}
                disabled={proses}
                onClick={() => {
                  if (window.confirm(`Tandai ${ketemu.eksemplarId} hilang (tidak dikembalikan)?`)) void lakukanKembali(true)
                }}
              >
                Tandai hilang
              </button>
              {aturan && ketemu.jumlahPerpanjang < aturan.maksPerpanjang && (
                <button
                  type="button"
                  className={btnGhost}
                  disabled={proses}
                  onClick={async () => {
                    try {
                      const baru = await perpanjang(ketemu, aturan)
                      onLog('perpanjang', ketemu.id)
                      onOk(`Diperpanjang sampai ${formatTanggal(baru)}.`)
                      const p = await pinjamanAktifEksemplar(ketemu.eksemplarId)
                      if (p) setKetemu(p)
                      await muatDaftar()
                    } catch (err) {
                      onGalat(err instanceof Error ? err.message : 'Gagal memperpanjang.')
                    }
                  }}
                >
                  Perpanjang
                </button>
              )}
              <button
                type="button"
                className={btnGhost}
                disabled={proses}
                onClick={() => {
                  setKetemu(null)
                  setEks(null)
                  setKode('')
                }}
              >
                Batal pilih
              </button>
            </div>
            {eks && <div className="text-xs text-muted">Status eksemplar saat ini: {eks.status}</div>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hanyaTerlambat} onChange={(e) => setHanyaTerlambat(e.target.checked)} />
          Hanya terlambat
        </label>
        <button type="button" className={btnGhost} onClick={() => void muatDaftar()} disabled={memuat}>
          {memuat ? 'Memuat…' : 'Muat ulang'}
        </button>
        <span className="text-xs text-muted">{tampil.length} pinjaman</span>
      </div>

      {memuat && data.length === 0 ? (
        <div className="card-soft p-4 text-sm text-muted">Memuat daftar pinjaman…</div>
      ) : tampil.length === 0 ? (
        <div className="card-soft p-4 text-sm text-muted">
          {hanyaTerlambat ? 'Tidak ada pinjaman terlambat.' : 'Belum ada pinjaman aktif.'}
        </div>
      ) : (
        <div className="card-soft">
          <div className="border-b border-border px-4 py-3 font-semibold">
            {hanyaTerlambat ? 'Pinjaman terlambat' : 'Pinjaman aktif'} — klik baris untuk mengembalikan
          </div>
          <ul className="divide-y divide-border">
            {tampil.map((p) => {
              const telat = terlambat(p)
              const dipilih = ketemu?.id === p.id
              return (
                <li
                  key={p.id}
                  className={`flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm ${
                    dipilih ? 'bg-muh-50 ring-1 ring-inset ring-muh-200' : 'hover:bg-surface-2'
                  }`}
                >
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => pilihDariDaftar(p)}>
                    <div className="font-medium">{p.judul}</div>
                    <div className="text-muted">
                      <span className="font-mono">{p.eksemplarId}</span>
                      {' · '}
                      {p.peminjam.nama}
                      {p.peminjam.tipe === 'siswa' && p.peminjam.kelas ? ` (${p.peminjam.kelas})` : ''}
                      {p.peminjam.tipe === 'siswa' ? ` · NISN ${p.peminjam.id}` : ''}
                    </div>
                    <div className="mt-0.5 text-xs text-muted">
                      Pinjam {formatTanggal(p.tglPinjam)} · jatuh tempo {formatTanggal(p.jatuhTempo)}
                      {telat && ' (terlambat)'}
                      {p.jumlahPerpanjang > 0 && ` · diperpanjang ${p.jumlahPerpanjang}×`}
                    </div>
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {telat && <Badge>Terlambat</Badge>}
                    <button
                      type="button"
                      className="text-xs font-medium text-muh-600 hover:underline"
                      onClick={() => pilihDariDaftar(p)}
                    >
                      {dipilih ? 'Dipilih' : 'Pilih'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function ModeDaftar({
  aturan,
  onGalat,
  onOk,
  onLog,
}: {
  aturan: Aturan | null
  onGalat: (s: string) => void
  onOk: (s: string) => void
  onLog: (tindakan: string, id: string) => void
}) {
  const [data, setData] = useState<Peminjaman[]>([])
  const [memuat, setMemuat] = useState(true)
  const [hanyaTerlambat, setHanyaTerlambat] = useState(false)

  const muat = useCallback(async () => {
    setMemuat(true)
    onGalat('')
    try {
      setData(await daftarPinjamanAktif())
    } catch (e) {
      const kode = (e as { code?: string })?.code
      onGalat(kode === 'permission-denied' ? 'Anda tidak memiliki akses.' : 'Gagal memuat daftar pinjaman.')
    }
    setMemuat(false)
  }, [onGalat])

  useEffect(() => {
    void muat()
  }, [muat])

  const tampil = hanyaTerlambat ? data.filter((p) => terlambat(p)) : data

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hanyaTerlambat} onChange={(e) => setHanyaTerlambat(e.target.checked)} />
          Hanya terlambat
        </label>
        <button type="button" className={btnGhost} onClick={() => void muat()} disabled={memuat}>
          {memuat ? 'Memuat…' : 'Muat ulang'}
        </button>
        <span className="text-xs text-muted">{tampil.length} pinjaman</span>
      </div>
      <DaftarPinjaman
        judul={hanyaTerlambat ? 'Pinjaman terlambat' : 'Pinjaman aktif'}
        data={tampil}
        aturan={aturan}
        onPerpanjang={async (p) => {
          if (!aturan) return
          try {
            const baru = await perpanjang(p, aturan)
            onLog('perpanjang', p.id)
            onOk(`Diperpanjang sampai ${formatTanggal(baru)}.`)
            await muat()
          } catch (err) {
            onGalat(err instanceof Error ? err.message : 'Gagal memperpanjang.')
          }
        }}
        onKembali={async (p) => {
          try {
            await kembalikan({ pinjam: p })
            onLog('kembali', p.id)
            onOk(`Dikembalikan: ${p.judul} (${p.eksemplarId}).`)
            await muat()
          } catch (err) {
            onGalat(err instanceof Error ? err.message : 'Gagal mengembalikan.')
          }
        }}
      />
    </div>
  )
}

function ModeRiwayat({ onGalat }: { onGalat: (s: string) => void }) {
  const [data, setData] = useState<Peminjaman[]>([])
  const [memuat, setMemuat] = useState(true)

  const muat = useCallback(async () => {
    setMemuat(true)
    try {
      setData(await daftarRiwayatKembali())
    } catch (e) {
      const kode = (e as { code?: string })?.code
      onGalat(kode === 'permission-denied' ? 'Anda tidak memiliki akses.' : 'Gagal memuat riwayat.')
    }
    setMemuat(false)
  }, [onGalat])

  useEffect(() => {
    void muat()
  }, [muat])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button type="button" className={btnGhost} onClick={() => void muat()} disabled={memuat}>
          {memuat ? 'Memuat…' : 'Muat ulang'}
        </button>
        <span className="text-xs text-muted">{data.length} pengembalian</span>
      </div>
      {data.length === 0 ? (
        <div className="card-soft p-4 text-sm text-muted">Belum ada riwayat pengembalian.</div>
      ) : (
        <div className="card-soft">
          <div className="border-b border-border px-4 py-3 font-semibold">Riwayat pengembalian</div>
          <ul className="divide-y divide-border">
            {data.map((p) => (
              <li key={p.id} className="px-4 py-3 text-sm">
                <div className="font-medium">{p.judul}</div>
                <div className="text-muted">
                  <span className="font-mono">{p.eksemplarId}</span>
                  {' · '}
                  {p.peminjam.nama}
                  {p.peminjam.kelas ? ` (${p.peminjam.kelas})` : ''}
                  {p.peminjam.tipe === 'siswa' ? ` · NISN ${p.peminjam.id}` : ''}
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  Pinjam {formatTanggal(p.tglPinjam)} · kembali {formatTanggal(p.tglKembali)}
                  {p.kondisiKembali && ` · kondisi ${p.kondisiKembali}`}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function DaftarPinjaman({
  judul,
  data,
  aturan,
  onPerpanjang,
  onKembali,
}: {
  judul: string
  data: Peminjaman[]
  aturan: Aturan | null
  onPerpanjang: (p: Peminjaman) => Promise<void>
  onKembali: (p: Peminjaman) => Promise<void>
}) {
  if (data.length === 0) {
    return <div className="card-soft p-4 text-sm text-muted">Belum ada pinjaman pada daftar ini.</div>
  }
  return (
    <div className="card-soft">
      <div className="border-b border-border px-4 py-3 font-semibold">{judul}</div>
      <ul className="divide-y divide-border">
        {data.map((p) => {
          const telat = terlambat(p)
          return (
            <li key={p.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <div className="font-medium">{p.judul}</div>
                <div className="text-muted">
                  <span className="font-mono">{p.eksemplarId}</span>
                  {' · '}
                  {p.peminjam.nama}
                  {p.peminjam.tipe === 'siswa' && p.peminjam.kelas ? ` (${p.peminjam.kelas})` : ''}
                  {p.peminjam.tipe === 'siswa' ? ` · NISN ${p.peminjam.id}` : ''}
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  Pinjam {formatTanggal(p.tglPinjam)} · jatuh tempo {formatTanggal(p.jatuhTempo)}
                  {telat && ' (terlambat)'}
                  {p.jumlahPerpanjang > 0 && ` · diperpanjang ${p.jumlahPerpanjang}×`}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {aturan && p.jumlahPerpanjang < aturan.maksPerpanjang && (
                  <button type="button" className="text-xs font-medium text-muh-600 hover:underline" onClick={() => void onPerpanjang(p)}>
                    Perpanjang
                  </button>
                )}
                <button type="button" className="text-xs font-medium text-muh-600 hover:underline" onClick={() => void onKembali(p)}>
                  Kembalikan
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
