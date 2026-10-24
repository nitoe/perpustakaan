import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buatCsv, unduhTeks } from '../lib/csv'
import { formatTanggal, terlambat } from '../lib/sirkulasi'
import { laporanBukuPopuler, laporanKunjungan, laporanTerlambat, rentangDefault, type BukuPopuler } from '../lib/laporan'
import type { Kunjungan, Peminjaman } from '../lib/tipe'
import { Badge, Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'

type Tab = 'terlambat' | 'populer' | 'kunjungan'

export default function Laporan() {
  const [tab, setTab] = useState<Tab>('terlambat')
  const [galat, setGalat] = useState('')

  return (
    <div className="w-full">
      <PageHeader judul="Laporan" keterangan="Ringkasan pinjaman terlambat, buku terpopuler, dan kunjungan." />

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['terlambat', 'Terlambat'],
            ['populer', 'Buku terpopuler'],
            ['kunjungan', 'Kunjungan'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={tab === k ? btnPrimary : btnGhost}
            onClick={() => {
              setTab(k)
              setGalat('')
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {galat && (
        <div className="mb-4">
          <Notice tipe="error">{galat}</Notice>
        </div>
      )}

      {tab === 'terlambat' && <TabTerlambat onGalat={setGalat} />}
      {tab === 'populer' && <TabPopuler onGalat={setGalat} />}
      {tab === 'kunjungan' && <TabKunjungan onGalat={setGalat} />}
    </div>
  )
}

function TabTerlambat({ onGalat }: { onGalat: (s: string) => void }) {
  const [data, setData] = useState<Peminjaman[] | null>(null)
  const [memuat, setMemuat] = useState(true)

  const muat = useCallback(async () => {
    setMemuat(true)
    try {
      setData(await laporanTerlambat())
      onGalat('')
    } catch (e) {
      const kode = (e as { code?: string })?.code
      onGalat(kode === 'permission-denied' ? 'Anda tidak memiliki akses.' : 'Gagal memuat laporan terlambat.')
    }
    setMemuat(false)
  }, [onGalat])

  useEffect(() => {
    void muat()
  }, [muat])

  function unduh() {
    if (!data) return
    const baris = [
      ['Judul', 'Eksemplar', 'Peminjam', 'Kelas', 'NISN/ID', 'Tgl pinjam', 'Jatuh tempo'],
      ...data.map((p) => [
        p.judul,
        p.eksemplarId,
        p.peminjam.nama,
        p.peminjam.kelas ?? '',
        p.peminjam.id,
        formatTanggal(p.tglPinjam),
        formatTanggal(p.jatuhTempo),
      ]),
    ]
    unduhTeks(`terlambat-${new Date().toISOString().slice(0, 10)}.csv`, buatCsv(baris))
  }

  return (
    <div className="card-soft">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="font-semibold">Pinjaman terlambat</div>
        <div className="flex gap-2">
          <button type="button" className={btnGhost} disabled={memuat} onClick={() => void muat()}>
            {memuat ? 'Memuat…' : 'Muat ulang'}
          </button>
          <button type="button" className={btnGhost} disabled={!data?.length} onClick={unduh}>
            Unduh CSV
          </button>
        </div>
      </div>
      {!data || data.length === 0 ? (
        <div className="p-4 text-sm text-muted">{memuat ? 'Memuat…' : 'Tidak ada pinjaman terlambat.'}</div>
      ) : (
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
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>Tempo {formatTanggal(p.jatuhTempo)}</span>
                {terlambat(p) && <Badge>Terlambat</Badge>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-border px-4 py-3 text-xs text-muted">
        Untuk mengembalikan atau memperpanjang, buka menu <Link to="/sirkulasi" className="text-muh-600 hover:underline">Sirkulasi</Link>.
      </div>
    </div>
  )
}

function TabPopuler({ onGalat }: { onGalat: (s: string) => void }) {
  const [data, setData] = useState<BukuPopuler[] | null>(null)
  const [memuat, setMemuat] = useState(true)

  const muat = useCallback(async () => {
    setMemuat(true)
    try {
      setData(await laporanBukuPopuler())
      onGalat('')
    } catch (e) {
      const kode = (e as { code?: string })?.code
      onGalat(kode === 'permission-denied' ? 'Anda tidak memiliki akses.' : 'Gagal memuat laporan popularitas.')
    }
    setMemuat(false)
  }, [onGalat])

  useEffect(() => {
    void muat()
  }, [muat])

  return (
    <div className="card-soft">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <div className="font-semibold">Buku terpopuler</div>
          <div className="text-xs text-muted">Berdasarkan sampel pinjaman aktif dan yang sudah dikembalikan.</div>
        </div>
        <button type="button" className={btnGhost} disabled={memuat} onClick={() => void muat()}>
          {memuat ? 'Memuat…' : 'Muat ulang'}
        </button>
      </div>
      {!data || data.length === 0 ? (
        <div className="p-4 text-sm text-muted">{memuat ? 'Memuat…' : 'Belum ada data peminjaman.'}</div>
      ) : (
        <ol className="divide-y divide-border">
          {data.map((b, i) => (
            <li key={b.bukuId} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <span className="mr-2 tabular text-muted">{i + 1}.</span>
                <Link to={`/katalog/${b.bukuId}`} className="font-medium text-muh-700 hover:underline">
                  {b.judul}
                </Link>
              </div>
              <span className="tabular shrink-0 text-muted">{b.kali}×</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function TabKunjungan({ onGalat }: { onGalat: (s: string) => void }) {
  const def = rentangDefault(7)
  const [dari, setDari] = useState(def.dari)
  const [sampai, setSampai] = useState(def.sampai)
  const [total, setTotal] = useState(0)
  const [perKelas, setPerKelas] = useState<{ kelas: string; jumlah: number }[]>([])
  const [list, setList] = useState<Kunjungan[]>([])
  const [memuat, setMemuat] = useState(false)

  const muat = useCallback(async () => {
    if (!dari || !sampai || dari > sampai) {
      onGalat('Rentang tanggal tidak valid.')
      return
    }
    setMemuat(true)
    try {
      const h = await laporanKunjungan(dari, sampai)
      setTotal(h.total)
      setPerKelas(h.perKelas)
      setList(h.list)
      onGalat('')
    } catch (e) {
      const kode = (e as { code?: string })?.code
      onGalat(kode === 'permission-denied' ? 'Anda tidak memiliki akses.' : 'Gagal memuat laporan kunjungan.')
    }
    setMemuat(false)
  }, [dari, sampai, onGalat])

  useEffect(() => {
    void muat()
  }, [muat])

  function unduh() {
    const baris = [
      ['Tanggal', 'Waktu', 'Nama', 'Kelas', 'NISN/ID', 'Keperluan'],
      ...list.map((k) => [
        k.tanggal,
        k.waktu.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        k.pengunjung.nama,
        k.pengunjung.kelas ?? '',
        k.pengunjung.id,
        k.keperluan ?? '',
      ]),
    ]
    unduhTeks(`kunjungan-${dari}_${sampai}.csv`, buatCsv(baris))
  }

  return (
    <div className="space-y-4">
      <div className="card-soft grid gap-3 p-4 sm:grid-cols-3">
        <Field label="Dari">
          <input type="date" className={inputCls} value={dari} onChange={(e) => setDari(e.target.value)} />
        </Field>
        <Field label="Sampai">
          <input type="date" className={inputCls} value={sampai} onChange={(e) => setSampai(e.target.value)} />
        </Field>
        <div className="flex items-end gap-2">
          <button type="button" className={btnPrimary} disabled={memuat} onClick={() => void muat()}>
            {memuat ? 'Memuat…' : 'Tampilkan'}
          </button>
          <button type="button" className={btnGhost} disabled={!list.length} onClick={unduh}>
            CSV
          </button>
        </div>
      </div>

      <div className="card-soft p-4">
        <div className="text-sm text-muted">Total kunjungan</div>
        <div className="tabular text-2xl font-semibold">{total}</div>
      </div>

      {perKelas.length > 0 && (
        <div className="card-soft">
          <div className="border-b border-border px-4 py-3 font-semibold">Per kelas</div>
          <ul className="divide-y divide-border">
            {perKelas.map((r) => (
              <li key={r.kelas} className="flex justify-between px-4 py-2.5 text-sm">
                <span>{r.kelas}</span>
                <span className="tabular text-muted">{r.jumlah}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
