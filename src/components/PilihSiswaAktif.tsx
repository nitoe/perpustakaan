import { useEffect, useState } from 'react'
import { DAFTAR_KELAS, muatSiswaKelas } from '../lib/siswaAuth'
import type { SiswaDasar } from '../lib/sirkulasi'
import { Field, inputCls } from './ui'

/**
 * Pilih siswa yang sudah diaktifkan pustakawan (perpus_izin_siswa.aktif === true).
 * Dropdown kelas → dropdown nama. Dipakai di Sirkulasi, Reservasi, Kunjungan.
 */
export default function PilihSiswaAktif({
  nilai,
  onPilih,
  disabled,
}: {
  nilai?: SiswaDasar | null
  onPilih: (s: SiswaDasar | null) => void
  disabled?: boolean
}) {
  const [kelas, setKelas] = useState(nilai?.kelas ?? '')
  const [daftar, setDaftar] = useState<SiswaDasar[]>([])
  const [muat, setMuat] = useState(false)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    if (!kelas) {
      setDaftar([])
      return
    }
    let batal = false
    setMuat(true)
    setGalat('')
    void muatSiswaKelas(kelas)
      .then((list) => {
        if (batal) return
        setDaftar(list)
        if (list.length === 0) {
          setGalat(`Tidak ada siswa aktif di kelas ${kelas}. Aktifkan dulu di menu Izin siswa.`)
        }
      })
      .catch((e) => {
        if (batal) return
        const kode = (e as { code?: string })?.code
        setGalat(
          kode === 'permission-denied'
            ? 'Tidak bisa membaca daftar siswa.'
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
  }, [kelas])

  const idTerpilih = nilai?.id ?? ''

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Kelas" hint="Hanya siswa yang sudah diaktifkan di menu Izin siswa.">
        <select
          className={inputCls}
          value={kelas}
          disabled={disabled}
          onChange={(e) => {
            const k = e.target.value
            setKelas(k)
            onPilih(null)
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
      <Field label="Nama siswa">
        <select
          className={inputCls}
          value={idTerpilih}
          disabled={disabled || !kelas || muat}
          onChange={(e) => {
            const id = e.target.value
            const s = daftar.find((x) => x.id === id) ?? null
            onPilih(s)
          }}
        >
          <option value="">
            {muat ? 'Memuat…' : !kelas ? 'Pilih kelas dulu' : daftar.length === 0 ? 'Tidak ada siswa' : '— Pilih nama —'}
          </option>
          {daftar.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama}
              {s.nisn ? ` · ${s.nisn}` : ''}
            </option>
          ))}
        </select>
        {galat && <span className="mt-1 block text-xs text-amber-700">{galat}</span>}
      </Field>
    </div>
  )
}
