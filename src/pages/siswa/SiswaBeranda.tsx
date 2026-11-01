import { Link } from 'react-router-dom'
import { useSiswa } from '../../context/SiswaContext'

export default function SiswaBeranda() {
  const { sesi } = useSiswa()
  if (!sesi) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-muh-800 sm:text-3xl">
          Halo, {sesi.nama.split(' ')[0]}!
        </h1>
        <p className="mt-1 text-muted">
          {sesi.preview ? 'Mode pratinjau tampilan siswa' : `Kelas ${sesi.kelas}`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/siswa/baca"
          className="group card-soft flex flex-col overflow-hidden transition hover:shadow-md"
        >
          <div className="h-28 bg-gradient-to-br from-muh-100 to-muh-50" />
          <div className="p-4">
            <div className="text-lg font-semibold text-muh-800 group-hover:text-muh-600">Rak Baca</div>
            <p className="mt-1 text-sm text-muted">Baca cerita dan buku digital sekolah.</p>
          </div>
        </Link>

        <Link
          to="/siswa/pinjaman"
          className="group card-soft flex flex-col overflow-hidden transition hover:shadow-md"
        >
          <div className="h-28 bg-gradient-to-br from-amber-100 to-amber-50" />
          <div className="p-4">
            <div className="text-lg font-semibold text-muh-800 group-hover:text-muh-600">Pinjaman Saya</div>
            <p className="mt-1 text-sm text-muted">Lihat buku cetak yang sedang kamu pinjam.</p>
          </div>
        </Link>

        <Link
          to="/siswa/jurnal"
          className="group card-soft flex flex-col overflow-hidden transition hover:shadow-md"
        >
          <div className="h-28 bg-gradient-to-br from-emerald-100 to-emerald-50" />
          <div className="p-4">
            <div className="text-lg font-semibold text-muh-800 group-hover:text-muh-600">Jurnal Baca</div>
            <p className="mt-1 text-sm text-muted">Catat kesan dan bacaanmu.</p>
          </div>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted">
        Meminjam atau mengembalikan buku cetak dilakukan di perpustakaan sekolah.
      </div>
    </div>
  )
}
