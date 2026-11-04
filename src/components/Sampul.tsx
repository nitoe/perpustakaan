import { useEffect, useState } from 'react'
import { ambilFoto } from '../lib/data'

type Props = {
  id?: string
  className?: string
  /** Tampilkan kotak placeholder bila belum ada sampul (berguna di daftar/rak). */
  placeholder?: boolean
  /** Teks alternatif / inisial di placeholder. */
  judul?: string
}

/** Menampilkan sampul buku dari perpus_foto (dimuat sekali, lalu di-cache). */
export default function Sampul({ id, className = '', placeholder = false, judul }: Props) {
  const [src, setSrc] = useState<string | null>(null)
  const [selesai, setSelesai] = useState(!id)

  useEffect(() => {
    if (!id) {
      setSrc(null)
      setSelesai(true)
      return
    }
    let batal = false
    setSelesai(false)
    ambilFoto(id)
      .then((d) => {
        if (!batal) {
          setSrc(d)
          setSelesai(true)
        }
      })
      .catch(() => {
        if (!batal) {
          setSrc(null)
          setSelesai(true)
        }
      })
    return () => {
      batal = true
    }
  }, [id])

  if (id && src) {
    return (
      <img
        src={src}
        alt={judul ? `Sampul ${judul}` : 'Sampul buku'}
        className={`rounded-lg border border-border object-cover ${className}`}
      />
    )
  }

  if (!placeholder) return null

  const inisial = (judul || '?').trim().slice(0, 1).toUpperCase() || '?'

  return (
    <div
      className={`flex items-center justify-center rounded-lg border border-dashed border-border bg-surface-2 text-muted ${className}`}
      aria-label={judul ? `Belum ada sampul: ${judul}` : 'Belum ada sampul'}
      title="Belum ada sampul"
    >
      {!selesai && id ? (
        <span className="text-[10px] opacity-60">…</span>
      ) : (
        <span className="select-none text-lg font-semibold opacity-40 sm:text-2xl">{inisial}</span>
      )}
    </div>
  )
}
