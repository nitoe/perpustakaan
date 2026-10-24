import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { bisaDibacaPublik } from '../../lib/katalog'
import type { Buku } from '../../lib/tipe'
import { Badge, Notice, PageHeader, btnGhost, btnPrimary } from '../../components/ui'
import Sampul from '../../components/Sampul'

const NAMA_FORMAT: Record<string, string> = {
  pdf: 'PDF',
  web: 'halaman web',
  video: 'video',
  audio: 'audio',
}

export default function PublikDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const [b, setB] = useState<Buku | null>(null)
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    if (!id) return
    let batal = false
    void (async () => {
      try {
        const snap = await getDoc(doc(db, 'perpus_buku', id))
        if (batal) return
        if (!snap.exists()) {
          setGalat('Buku tidak ditemukan.')
          setB(null)
        } else {
          const data = { id: snap.id, ...snap.data() } as unknown as Buku
          if (!data.publik) {
            setGalat('Buku ini tidak ditampilkan di katalog publik.')
            setB(null)
          } else {
            setB(data)
            setGalat('')
          }
        }
      } catch {
        if (!batal) setGalat('Gagal memuat data buku.')
      }
      if (!batal) setLoading(false)
    })()
    return () => {
      batal = true
    }
  }, [id])

  if (loading) return <div className="text-sm text-muted">Memuat…</div>

  if (!b) {
    return (
      <div className="space-y-3">
        <Notice tipe="warn">{galat || 'Buku tidak tersedia.'}</Notice>
        <Link to="/publik" className={btnGhost}>
          Kembali ke katalog
        </Link>
      </div>
    )
  }

  const bacaan = bisaDibacaPublik(b)

  return (
    <div>
      <PageHeader
        judul={b.judul}
        keterangan={[b.pengarang, b.penerbit, b.tahun].filter(Boolean).join(' · ')}
        aksi={
          <Link to="/publik" className={btnGhost}>
            ← Katalog
          </Link>
        }
      />

      <div className="card-soft flex flex-col gap-4 p-4 sm:flex-row">
        <Sampul id={b.coverId} className="h-48 w-auto shrink-0 self-start" />
        <div className="min-w-0 flex-1 space-y-3 text-sm">
          <div className="flex flex-wrap gap-1.5">
            {b.jenis !== 'cetak' && <Badge>Digital</Badge>}
            {b.jenis !== 'digital' && <Badge>Cetak</Badge>}
            {b.jenjangBaca && <Badge>{b.jenjangBaca}</Badge>}
            {b.klasifikasi && <Badge>DDC {b.klasifikasi}</Badge>}
          </div>
          {b.sinopsis && <p className="whitespace-pre-line text-[#2b2f4a]">{b.sinopsis}</p>}
          {b.jenis !== 'digital' && (
            <p className="text-muted">
              Ketersediaan cetak:{' '}
              <span className="font-semibold text-[#1a1d33]">{b.eksemplarTersedia ?? 0}</span> dari{' '}
              {b.eksemplarTotal ?? 0} eksemplar
            </p>
          )}
          {b.jenis !== 'cetak' &&
            (bacaan ? (
              <a href={bacaan} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
                Buka bacaan ({NAMA_FORMAT[b.formatDigital ?? 'web'] ?? 'tautan'})
              </a>
            ) : (
              <Notice tipe="warn">Tautan digital belum tersedia.</Notice>
            ))}
          <Notice>
            Untuk meminjam buku cetak, datang ke perpustakaan sekolah dengan kartu anggota (NISN).
          </Notice>
        </div>
      </div>
    </div>
  )
}
