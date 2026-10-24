import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getCountFromServer, getDocs, query, where, type Timestamp } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import { NAMA_PERAN, bisaKelola } from '../lib/peran'
import { tanggalHariIni } from '../lib/kunjungan'
import { Badge, Notice, PageHeader, StatStrip, btnGhost } from '../components/ui'

interface Ringkasan {
  judul: number
  eksemplar: number
  dipinjam: number
  terlambat: number
  kunjunganHariIni: number
}

export default function Beranda() {
  const { profil, peran } = useAuth()
  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null)
  const [galat, setGalat] = useState('')
  const kelola = bisaKelola(peran)

  useEffect(() => {
    if (!peran) return
    let batal = false
    void (async () => {
      try {
        const hari = tanggalHariIni()
        const [judul, eksemplar, aktif, kunjungan] = await Promise.all([
          getCountFromServer(collection(db, 'perpus_buku')),
          getCountFromServer(collection(db, 'perpus_eksemplar')),
          getDocs(query(collection(db, 'perpus_peminjaman'), where('status', '==', 'dipinjam'))),
          getCountFromServer(query(collection(db, 'perpus_kunjungan'), where('tanggal', '==', hari))),
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
          kunjunganHariIni: kunjungan.data().count,
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
    <div className="w-full">
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
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="card-soft p-4">
              <div className="text-sm text-muted">Kunjungan hari ini</div>
              <div className="tabular mt-0.5 text-xl font-semibold">{ringkasan?.kunjunganHariIni ?? '—'}</div>
            </div>
            <div className="card-soft p-4">
              <div className="text-sm text-muted">Peran Anda</div>
              <div className="mt-1">
                <Badge>{NAMA_PERAN[peran]}</Badge>
              </div>
            </div>
          </div>
          {kelola && (
            <div className="mb-4 flex flex-wrap gap-2">
              <Link to="/sirkulasi" className={btnGhost}>
                Sirkulasi
              </Link>
              <Link to="/kunjungan" className={btnGhost}>
                Catat kunjungan
              </Link>
              <Link to="/laporan" className={btnGhost}>
                Laporan
              </Link>
            </div>
          )}
          {(peran === 'pimpinan' || peran === 'admin' || peran === 'pustakawan') && !kelola && (
            <div className="mb-4">
              <Link to="/laporan" className={btnGhost}>
                Lihat laporan
              </Link>
            </div>
          )}
        </>
      ) : (
        <Notice tipe="warn">Akun Anda belum memiliki akses ke aplikasi perpustakaan. Hubungi administrator.</Notice>
      )}
    </div>
  )
}
