import { useEffect, useState } from 'react'
import { ambilFoto } from '../lib/data'

/** Menampilkan sampul buku dari perpus_foto (dimuat sekali, lalu di-cache). */
export default function Sampul({ id, className = '' }: { id?: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    if (!id) return
    let batal = false
    ambilFoto(id)
      .then((d) => {
        if (!batal) setSrc(d)
      })
      .catch(() => {
        if (!batal) setSrc(null)
      })
    return () => {
      batal = true
    }
  }, [id])
  if (!id || !src) return null
  return <img src={src} alt="Sampul buku" className={`rounded-lg border border-border object-cover ${className}`} />
}
