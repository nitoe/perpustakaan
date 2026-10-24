import { Link } from 'react-router-dom'
import { useSiswa } from '../../context/SiswaContext'
import { Notice, PageHeader, btnGhost, btnPrimary } from '../../components/ui'

export default function SiswaBeranda() {
  const { sesi } = useSiswa()
  if (!sesi) return null

  return (
    <div>
      <PageHeader
        judul={`Halo, ${sesi.nama}`}
        keterangan={`Kelas ${sesi.kelas} · NISN ${sesi.nisn}`}
      />

      <div className="card-soft space-y-3 p-4">
        <p className="text-sm text-[#1a1d33]">
          Selamat datang di perpustakaan digital sekolah. Baca koleksi digital atau cek buku cetak yang sedang
          Anda pinjam.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/siswa/baca" className={btnPrimary}>
            Rak baca
          </Link>
          <Link to="/siswa/pinjaman" className={btnGhost}>
            Pinjaman saya
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <Notice>
          Meminjam atau mengembalikan buku cetak dilakukan di perpustakaan sekolah dengan kartu anggota. Reservasi
          dan jurnal baca akan ditambahkan bertahap.
        </Notice>
      </div>
    </div>
  )
}
