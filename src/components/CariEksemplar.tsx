import { useEffect, useMemo, useRef, useState } from 'react'
import { useKoleksi } from '../lib/useKoleksi'
import { pinjamanAktifEksemplar } from '../lib/sirkulasi'
import type { Eksemplar, Peminjaman } from '../lib/tipe'
import { Field, inputCls } from './ui'

/**
 * Pencarian hidup kode eksemplar: ketik sebagian kode (PRP-…) atau judul.
 * Daftar menyempit ke yang cocok.
 * Untuk pinjam: yang tersedia + yang sedang dipinjam (dengan info peminjam & rak).
 * Untuk kembali: hanya yang dipinjam.
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
  const [infoPinjam, setInfoPinjam] = useState<Record<string, Peminjaman | null>>({})
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
        if (e.status === 'dihapus') return false
        if (status === 'tersedia' && e.status !== 'tersedia' && e.status !== 'dipinjam') return false
        if (status === 'dipinjam' && e.status !== 'dipinjam') return false
        return e.id.toLowerCase().includes(q) || (e.judul || '').toLowerCase().includes(q)
      })
      .slice(0, 20)
  }, [kol.data, teks, status])

  useEffect(() => {
    const perlu = cocok.filter((e) => e.status === 'dipinjam' && !(e.id in infoPinjam))
    if (perlu.length === 0) return
    void (async () => {
      const baru: Record<string, Peminjaman | null> = {}
      for (const e of perlu.slice(0, 5)) {
        try {
          baru[e.id] = await pinjamanAktifEksemplar(e.id)
        } catch {
          baru[e.id] = null
        }
      }
      setInfoPinjam((prev) => ({ ...prev, ...baru }))
    })()
  }, [cocok, infoPinjam])

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
            ? 'Ketik sebagian kode atau judul. Yang tersedia bisa dipilih. Yang sedang dipinjam menampilkan nama peminjam dan rak.'
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
            if (e.key === 'Enter' && cocok.length === 1 && cocok[0]!.status === 'tersedia') {
              e.preventDefault()
              pilih(cocok[0]!)
            }
            if (e.key === 'Escape') setBuka(false)
          }}
          autoComplete="off"
        />
      </Field>
      {buka && teks.trim() && (
        <ul className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
          {kol.loading ? (
            <li className="px-3 py-2 text-sm text-muted">Memuat eksemplar…</li>
          ) : cocok.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">Tidak ada yang cocok.</li>
          ) : (
            cocok.map((e) => {
              const p = infoPinjam[e.id]
              const bisaPilih = e.status === 'tersedia' || status === 'dipinjam'
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    disabled={!bisaPilih}
                    className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm ${
                      bisaPilih ? 'hover:bg-muh-50' : 'cursor-default opacity-90'
                    }`}
                    onClick={() => bisaPilih && pilih(e)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0">
                        <span className="font-mono font-medium">{e.id}</span>
                        <span className="ml-2 text-[#1a1d33]">{e.judul}</span>
                      </span>
                      <span
                        className={`shrink-0 text-xs font-medium ${
                          e.status === 'tersedia' ? 'text-green-700' : 'text-amber-700'
                        }`}
                      >
                        {e.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted">
                      {e.rak ? `Rak: ${e.rak}` : 'Rak: —'}
                      {e.status === 'dipinjam' && p && (
                        <>
                          {' · '}Dipinjam oleh {p.peminjam.nama}
                          {p.peminjam.kelas ? ` (${p.peminjam.kelas})` : ''}
                        </>
                      )}
                      {e.status === 'dipinjam' && !p && ' · memuat info peminjam…'}
                    </div>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
