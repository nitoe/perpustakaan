import { useState } from 'react'
import { siswaPerKelas } from '../lib/kunjungan'
import { idPeminjamSiswa, type SiswaDasar } from '../lib/sirkulasi'
import { Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'

/** Cetak kartu anggota sederhana (NISN + nama + kelas) per kelas — siap print A4. */
export default function Kartu() {
  const [kelas, setKelas] = useState('')
  const [daftar, setDaftar] = useState<SiswaDasar[]>([])
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)

  async function muat() {
    setGalat('')
    setProses(true)
    try {
      const list = await siswaPerKelas(kelas)
      if (list.length === 0) setGalat(`Tidak ada siswa aktif di kelas ${kelas.trim().toUpperCase()}.`)
      setDaftar(list)
    } catch (e) {
      const kode = (e as { code?: string })?.code
      setGalat(kode === 'permission-denied' ? 'Tidak ada akses data siswa.' : 'Gagal memuat siswa.')
      setDaftar([])
    }
    setProses(false)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        judul="Kartu anggota"
        keterangan="Cetak kartu sederhana per kelas (nama, kelas, NISN). Tempel atau laminating sesuai kebutuhan."
        aksi={
          daftar.length > 0 && (
            <button type="button" className={btnPrimary} onClick={() => window.print()}>
              Cetak
            </button>
          )
        }
      />

      <div className="card-soft mb-4 space-y-3 p-4 print:hidden">
        {galat && <Notice tipe="error">{galat}</Notice>}
        <Field label="Kelas" hint="Contoh: 3A">
          <div className="flex gap-2">
            <input
              className={inputCls}
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void muat()
                }
              }}
            />
            <button type="button" className={btnGhost} disabled={proses || !kelas.trim()} onClick={() => void muat()}>
              Muat
            </button>
          </div>
        </Field>
      </div>

      {daftar.length > 0 && (
        <div className="grid grid-cols-2 gap-3 print:grid-cols-2 sm:grid-cols-3">
          {daftar.map((s) => {
            const nisn = idPeminjamSiswa(s)
            return (
              <div
                key={s.id}
                className="break-inside-avoid rounded-lg border-2 border-[#313083] bg-white p-3 text-center"
              >
                <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#313083]">
                  Kartu Anggota Perpustakaan
                </div>
                <div className="mt-0.5 text-[0.6rem] text-muted">SD Muhammadiyah 01 Kukusan</div>
                <div className="mt-2 text-sm font-semibold leading-tight">{s.nama}</div>
                <div className="text-xs text-muted">Kelas {s.kelas ?? kelas.trim().toUpperCase()}</div>
                <div className="mt-2 font-mono text-base font-bold tracking-wider">{nisn}</div>
                <div className="mt-1 text-[0.6rem] text-muted">NISN · tunjukkan saat meminjam</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
