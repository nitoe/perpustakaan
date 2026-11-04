import { useEffect, useMemo, useRef, useState } from 'react'
import { useKoleksi } from '../lib/useKoleksi'
import type { Eksemplar } from '../lib/tipe'
import { Field, inputCls } from './ui'

/**
 * Pencarian hidup kode eksemplar: ketik sebagian kode (PRP-…) atau judul.
 * Daftar menyempit ke yang cocok. Hanya status tersedia yang ditampilkan
 * (untuk pinjam). Untuk kembali, filter status dipinjam.
 */
export default function CariEksemplar({
  nilai,
  onPilih,
  disabled,
  status = 'tersedia',
  placeholder = 'Ketik kode atau judul…',
}: {
  nilai: string
  onPilih: (kode: string) => void
  disabled?: boolean
  status?: 'tersedia' | 'dipinjam' | 'semua'
  placeholder?: string
}) {
  const kol = useKoleksi<Eksemplar>('perpus_eksemplar')
  const [teks, setTeks] = useState(nilai)
  const [buka, setBuka] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTeks(nilai)
  }, [nilai])

  useEffect(() => {
    function tutup(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setBuka(false)
    }
    document.addEventListener('mousedown', tutup)
    return () => document.removeEventListener('mousedown', tutup)
  }, [])

  const cocok = useMemo(() => {
    const q = teks.trim().toLowerCase()
    if (!q) return []
    return kol.data
      .filter((e) => {
        if (status === 'tersedia' && e.status !== 'tersedia') return false
        if (status === 'dipinjam' && e.status !== 'dipinjam') return false
        if (e.status === 'dihapus') return false
        return e.id.toLowerCase().includes(q) || (e.judul || '').toLowerCase().includes(q)
      })
      .slice(0, 20)
  }, [kol.data, teks, status])

  function pilih(e: Eksemplar) {
    setTeks(e.id)
    onPilih(e.id)
    setBuka(false)
  }

  return (
    <div ref={ref} className="relative">
      <Field
        label={status === 'dipinjam' ? 'Kode / judul yang dipinjam' : 'Kode atau judul buku'}
        hint={
          status === 'tersedia'
            ? 'Ketik sebagian kode (PRP-…) atau judul. Hanya yang tersedia yang muncul.'
            : 'Ketik sebagian kode atau judul buku yang sedang dipinjam.'
        }
      >
        <input
          className={`${inputCls} font-mono`}
          value={teks}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            const v = e.target.value
            setTeks(v)
            onPilih(v.trim().toUpperCase())
            setBuka(true)
          }}
          onFocus={() => setBuka(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && cocok.length === 1) {
              e.preventDefault()
              pilih(cocok[0]!)
            }
            if (e.key === 'Escape') setBuka(false)
          }}
          autoComplete="off"
        />
      </Field>
      {buka && teks.trim() && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
          {kol.loading ? (
            <li className="px-3 py-2 text-sm text-muted">Memuat eksemplar…</li>
          ) : cocok.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">Tidak ada yang cocok.</li>
          ) : (
            cocok.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muh-50"
                  onClick={() => pilih(e)}
                >
                  <span className="min-w-0">
                    <span className="font-mono font-medium">{e.id}</span>
                    <span className="ml-2 text-[#1a1d33]">{e.judul}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{e.status}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
