import { Link } from 'react-router-dom'
import { useSiswa } from '../../context/SiswaContext'
import { Notice, PageHeader, btnPrimary } from '../../components/ui'

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
          Selamat datang di perpustakaan digital sekolah. Buka rak baca untuk membaca koleksi digital
          yang disediakan pustakawan.
        </p>
        <Link to="/siswa/baca" className={btnPrimary}>
          Buka rak baca
        </Link>
      </div>

      <div className="mt-4">
        <Notice>
          Fitur pinjaman saya, reservasi, dan jurnal baca akan ditambahkan bertahap. Untuk meminjam buku
          cetak, datang ke perpustakaan sekolah dengan kartu anggota.
        </Notice>
      </div>
    </div>
  )
}
