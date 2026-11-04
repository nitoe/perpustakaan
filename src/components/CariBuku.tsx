import { useEffect, useMemo, useRef, useState } from 'react'
import { useKoleksi } from '../lib/useKoleksi'
import type { Buku } from '../lib/tipe'
import { Field, inputCls } from './ui'

/**
 * Pencarian hidup buku untuk reservasi: ketik judul atau pengarang,
 * daftar menyempit. Klik untuk memilih.
 */
export default function CariBuku({
  nilaiId,
  onPilih,
  disabled,
}: {
  nilaiId: string
  onPilih: (buku: Buku | null) => void
  disabled?: boolean
}) {
  const kol = useKoleksi<Buku>('perpus_buku')
  const [teks, setTeks] = useState('')
  const [buka, setBuka] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const terpilih = useMemo(
    () => kol.data.find((b) => b.id === nilaiId) ?? null,
    [kol.data, nilaiId],
  )

  useEffect(() => {
    if (terpilih && !buka) setTeks(terpilih.judul)
  }, [terpilih, buka])

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
      .filter((b) => b.jenis !== 'digital')
      .filter((b) => {
        return (
          b.judul.toLowerCase().includes(q) ||
          (b.pengarang?.toLowerCase().includes(q) ?? false) ||
          (b.isbn?.toLowerCase().includes(q) ?? false)
        )
      })
      .slice(0, 20)
  }, [kol.data, teks])

  function pilih(b: Buku) {
    setTeks(b.judul)
    onPilih(b)
    setBuka(false)
  }

  return (
    <div ref={ref} className="relative">
      <Field label="Buku" hint="Ketik judul, pengarang, atau ISBN. Daftar menyempit otomatis.">
        <input
          className={inputCls}
          value={teks}
          disabled={disabled}
          placeholder="Judul, pengarang, atau ISBN…"
          onChange={(e) => {
            const v = e.target.value
            setTeks(v)
            setBuka(true)
            if (!v.trim()) onPilih(null)
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
            <li className="px-3 py-2 text-sm text-muted">Memuat buku…</li>
          ) : cocok.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">Tidak ada buku yang cocok.</li>
          ) : (
            cocok.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muh-50"
                  onClick={() => pilih(b)}
                >
                  <span className="min-w-0">
                    <span className="font-medium">{b.judul}</span>
                    {b.pengarang && <span className="ml-2 text-muted">· {b.pengarang}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {b.eksemplarTersedia ?? 0} tersedia
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      {terpilih && !buka && (
        <div className="mt-1 text-xs text-muted">
          Dipilih: {terpilih.judul} ({terpilih.eksemplarTersedia ?? 0} tersedia)
        </div>
      )}
    </div>
  )
}
