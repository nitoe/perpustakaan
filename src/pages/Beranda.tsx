import { useEffect, useState } from 'react'
import { collection, getCountFromServer, getDocs, query, where, type Timestamp } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import { NAMA_PERAN } from '../lib/peran'
import { Badge, Notice, PageHeader, StatStrip } from '../components/ui'

interface Ringkasan {
  judul: number
  eksemplar: number
  dipinjam: number
  terlambat: number
}

export default function Beranda() {
  const { profil, peran } = useAuth()
  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    if (!peran) return
    let batal = false
    void (async () => {
      try {
        // Hemat kuota: jumlah koleksi dihitung di server (bukan membaca semua dokumen).
        const [judul, eksemplar, aktif] = await Promise.all([
          getCountFromServer(collection(db, 'perpus_buku')),
          getCountFromServer(collection(db, 'perpus_eksemplar')),
          getDocs(query(collection(db, 'perpus_peminjaman'), where('status', '==', 'dipinjam'))),
        ])
        if (batal) return
        const sekarang = Date.now()
        const terlambat = aktif.docs.filter((d) => {
          const t = d.data().jatuhTempo as Timestamp | undefined
          return t ? t.toMillis() < sekarang : false
        }).length
        setRingkasan({
          judul: judul.data().count,
          eksemplar: eksemplar.data().count,
          dipinjam: aktif.size,
          terlambat,
        })
        setGalat('')
      } catch (e) {
        if (batal) return
        const kode = (e as { code?: string })?.code
        setGalat(kode === 'permission-denied' ? 'Anda tidak memiliki akses ke data perpustakaan.' : 'Gagal memuat ringkasan.')
      }
    })()
    return () => {
      batal = true
    }
  }, [peran])

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader judul={`Selamat datang, ${profil?.nama ?? ''}`} keterangan="Perpustakaan SD Muhammadiyah 01 Kukusan" />
      {peran ? (
        <>
          {galat && (
            <div className="mb-4">
              <Notice tipe="error">{galat}</Notice>
            </div>
          )}
          <StatStrip
            items={[
              { label: 'Judul buku', nilai: ringkasan?.judul ?? '—' },
              { label: 'Eksemplar', nilai: ringkasan?.eksemplar ?? '—' },
              { label: 'Sedang dipinjam', nilai: ringkasan?.dipinjam ?? '—' },
              { label: 'Terlambat', nilai: ringkasan?.terlambat ?? '—' },
            ]}
          />
          <div className="card-soft p-4">
            <div className="text-sm text-muted">Peran Anda</div>
            <div className="mt-1">
              <Badge>{NAMA_PERAN[peran]}</Badge>
            </div>
          </div>
          <div className="mt-4">
            <Notice>Sirkulasi (pinjam/kembali/perpanjang) sudah tersedia. Kunjungan dan laporan sedang disiapkan.</Notice>
          </div>
        </>
      ) : (
        <Notice tipe="warn">Akun Anda belum memiliki akses ke aplikasi perpustakaan. Hubungi administrator.</Notice>
      )}
    </div>
  )
}
