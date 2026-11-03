import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { bisaDibacaPublik } from '../../lib/katalog'
import type { Buku } from '../../lib/tipe'
import { useSiswa } from '../../context/SiswaContext'
import Sampul from '../../components/Sampul'

/** Beranda siswa — kartu aksi hangat + “Baru Saja”. */
export default function SiswaBeranda() {
  const { sesi } = useSiswa()
  const [baru, setBaru] = useState<Buku[]>([])
  const [loadingBaru, setLoadingBaru] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'perpus_buku'),
      where('publik', '==', true),
      orderBy('createdAt', 'desc'),
      limit(12),
    )
    return onSnapshot(
      q,
      (snap) => {
        const daftar = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as unknown as Buku)
          .filter((b) => bisaDibacaPublik(b))
        setBaru(daftar)
        setLoadingBaru(false)
      },
      () => setLoadingBaru(false),
    )
  }, [])

  if (!sesi) return null

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-muh-800 sm:text-3xl">
          Halo, {sesi.nama.split(' ')[0]}!
        </h1>
        <p className="mt-1.5 text-muted">
          {sesi.preview ? 'Mode pratinjau tampilan siswa' : `Kelas ${sesi.kelas} · Yuk baca hari ini`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/siswa/baca"
          className="group card-soft flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="h-32 bg-gradient-to-br from-muh-100 via-muh-50 to-white" />
          <div className="p-5">
            <div className="text-lg font-semibold text-muh-800 group-hover:text-muh-600">Rak Baca</div>
            <p className="mt-1 text-sm leading-relaxed text-muted">Baca cerita dan buku digital sekolah.</p>
          </div>
        </Link>

        <Link
          to="/siswa/pinjaman"
          className="group card-soft flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="h-32 bg-gradient-to-br from-amber-100 via-amber-50 to-white" />
          <div className="p-5">
            <div className="text-lg font-semibold text-muh-800 group-hover:text-muh-600">Pinjaman Saya</div>
            <p className="mt-1 text-sm leading-relaxed text-muted">Lihat buku cetak yang sedang kamu pinjam.</p>
          </div>
        </Link>

        <Link
          to="/siswa/jurnal"
          className="group card-soft flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="h-32 bg-gradient-to-br from-emerald-100 via-emerald-50 to-white" />
          <div className="p-5">
            <div className="text-lg font-semibold text-muh-800 group-hover:text-muh-600">Jurnal Baca</div>
            <p className="mt-1 text-sm leading-relaxed text-muted">Catat kesan dan bacaanmu.</p>
          </div>
        </Link>
      </div>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-muh-800">Baru Saja</h2>
          <Link to="/siswa/baca" className="text-sm font-medium text-muh-600 hover:underline">
            Lihat semua
          </Link>
        </div>
        {loadingBaru ? (
          <div className="text-sm text-muted">Memuat…</div>
        ) : baru.length === 0 ? (
          <p className="text-sm text-muted">Belum ada bacaan digital publik.</p>
        ) : (
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
            {baru.map((b) => (
              <Link
                key={b.id}
                to={`/siswa/baca/${b.id}`}
                className="group w-32 shrink-0 sm:w-36"
                title={b.judul}
              >
                <div className="aspect-[2/3] overflow-hidden rounded-2xl bg-muh-50 shadow-sm ring-1 ring-black/5 transition group-hover:shadow-md group-hover:ring-muh-200">
                  <Sampul id={b.coverId} className="h-full w-full object-cover" />
                  {!b.coverId && (
                    <div className="flex h-full items-center justify-center p-2 text-center text-xs font-medium text-muh-700">
                      {b.judul}
                    </div>
                  )}
                </div>
                <div className="mt-2.5 line-clamp-2 text-sm font-medium leading-snug text-[#1a1d33] group-hover:text-muh-600">
                  {b.judul}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-border/70 bg-white px-5 py-4 text-sm text-muted">
        Meminjam atau mengembalikan buku cetak dilakukan di perpustakaan sekolah.
      </div>
    </div>
  )
}
