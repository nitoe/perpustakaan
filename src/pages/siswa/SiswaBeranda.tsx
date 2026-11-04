import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { bisaDibacaPublik } from '../../lib/katalog'
import type { Buku } from '../../lib/tipe'
import { useSiswa } from '../../context/SiswaContext'
import Sampul from '../../components/Sampul'

const JUMLAH_BARU = 7
const JUMLAH_FAVORIT = 7

type FavoritItem = { buku: Buku; pembaca: number }

/** Kartu sampul vertikal — tanpa slide horizontal. */
function KartuBuku({ b, sub }: { b: Buku; sub?: string }) {
  return (
    <Link to={`/siswa/baca/${b.id}`} className="group flex flex-col" title={b.judul}>
      <div className="aspect-[2/3] overflow-hidden rounded-2xl bg-muh-50 shadow-sm ring-1 ring-black/5 transition group-hover:shadow-md group-hover:ring-muh-200">
        <Sampul id={b.coverId} className="h-full w-full object-cover" placeholder judul={b.judul} />
      </div>
      <div className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-[#1a1d33] group-hover:text-muh-600">
        {b.judul}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </Link>
  )
}

/** Beranda siswa — aksi cepat, 7 buku terbaru, favorit (paling banyak dibaca). */
export default function SiswaBeranda() {
  const { sesi } = useSiswa()
  const [baru, setBaru] = useState<Buku[]>([])
  const [loadingBaru, setLoadingBaru] = useState(true)
  const [favorit, setFavorit] = useState<FavoritItem[]>([])
  const [loadingFavorit, setLoadingFavorit] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'perpus_buku'),
      where('publik', '==', true),
      orderBy('createdAt', 'desc'),
      limit(JUMLAH_BARU),
    )
    return onSnapshot(
      q,
      (snap) => {
        const daftar = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as unknown as Buku)
          .filter((b) => bisaDibacaPublik(b))
          .slice(0, JUMLAH_BARU)
        setBaru(daftar)
        setLoadingBaru(false)
      },
      () => setLoadingBaru(false),
    )
  }, [])

  // Buku favorit: dihitung dari berapa siswa yang pernah membuka/menyimpan progress baca.
  useEffect(() => {
    let batal = false
    void (async () => {
      try {
        const snap = await getDocs(collection(db, 'perpus_progress'))
        if (batal) return
        const hitung = new Map<string, number>()
        for (const d of snap.docs) {
          const bukuId = d.data().bukuId
          if (typeof bukuId !== 'string' || !bukuId) continue
          hitung.set(bukuId, (hitung.get(bukuId) || 0) + 1)
        }
        const teratas = [...hitung.entries()]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, JUMLAH_FAVORIT * 3) // ambil lebih banyak, saring yang masih publik

        const hasil: FavoritItem[] = []
        for (const [bukuId, pembaca] of teratas) {
          if (hasil.length >= JUMLAH_FAVORIT) break
          try {
            const bs = await getDoc(doc(db, 'perpus_buku', bukuId))
            if (!bs.exists()) continue
            const buku = { id: bs.id, ...bs.data() } as unknown as Buku
            if (!bisaDibacaPublik(buku)) continue
            hasil.push({ buku, pembaca })
          } catch {
            /* dokumen tidak bisa dibaca / hilang */
          }
        }
        if (!batal) setFavorit(hasil)
      } catch {
        if (!batal) setFavorit([])
      } finally {
        if (!batal) setLoadingFavorit(false)
      }
    })()
    return () => {
      batal = true
    }
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/siswa/baca"
          className="group card-soft flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="aspect-[2.4/1] overflow-hidden bg-muh-50">
            <img
              src="/siswa/rak-baca.png"
              alt=""
              className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
              draggable={false}
            />
          </div>
          <div className="p-5">
            <div className="text-lg font-semibold text-muh-800 group-hover:text-muh-600">Rak Baca</div>
            <p className="mt-1 text-sm leading-relaxed text-muted">Semua bacaan digital sekolah.</p>
          </div>
        </Link>

        <Link
          to="/siswa/katalog"
          className="group card-soft flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="aspect-[2.4/1] overflow-hidden bg-sky-50">
            <img
              src="/siswa/katalog-pinjam.png"
              alt=""
              className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
              draggable={false}
            />
          </div>
          <div className="p-5">
            <div className="text-lg font-semibold text-muh-800 group-hover:text-muh-600">Katalog Pinjam</div>
            <p className="mt-1 text-sm leading-relaxed text-muted">Lihat buku cetak di perpustakaan sebelum meminjam.</p>
          </div>
        </Link>

        <Link
          to="/siswa/pinjaman"
          className="group card-soft flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="aspect-[2.4/1] overflow-hidden bg-amber-50">
            <img
              src="/siswa/pinjaman-saya.png"
              alt=""
              className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
              draggable={false}
            />
          </div>
          <div className="p-5">
            <div className="text-lg font-semibold text-muh-800 group-hover:text-muh-600">Pinjaman Saya</div>
            <p className="mt-1 text-sm leading-relaxed text-muted">Lihat buku cetak yang sedang kamu pinjam.</p>
          </div>
        </Link>

        <Link
          to="/siswa/jurnal"
          className="group card-soft flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="aspect-[2.4/1] overflow-hidden bg-emerald-50">
            <img
              src="/siswa/jurnal-baca.png"
              alt=""
              className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
              draggable={false}
            />
          </div>
          <div className="p-5">
            <div className="text-lg font-semibold text-muh-800 group-hover:text-muh-600">Jurnal Baca</div>
            <p className="mt-1 text-sm leading-relaxed text-muted">Catat kesan dan bacaanmu.</p>
          </div>
        </Link>
      </div>

      <section>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-muh-800">Baru Saja</h2>
            <p className="text-xs text-muted">Tujuh bacaan digital terbaru</p>
          </div>
          <Link to="/siswa/baca" className="shrink-0 text-sm font-medium text-muh-600 hover:underline">
            Lihat semua di Rak Baca
          </Link>
        </div>
        {loadingBaru ? (
          <div className="text-sm text-muted">Memuat…</div>
        ) : baru.length === 0 ? (
          <p className="text-sm text-muted">Belum ada bacaan digital publik. Cek Rak Baca nanti.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {baru.map((b) => (
              <KartuBuku key={b.id} b={b} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-muh-800">Favorit Siswa</h2>
            <p className="text-xs text-muted">Paling banyak dibaca berdasarkan progress baca</p>
          </div>
          <Link to="/siswa/baca" className="shrink-0 text-sm font-medium text-muh-600 hover:underline">
            Rak Baca
          </Link>
        </div>
        {loadingFavorit ? (
          <div className="text-sm text-muted">Memuat…</div>
        ) : favorit.length === 0 ? (
          <p className="rounded-2xl border border-border/70 bg-white px-5 py-4 text-sm text-muted">
            Belum ada data favorit. Setelah siswa mulai membaca di Rak Baca, buku yang paling sering dibuka akan muncul di
            sini.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {favorit.map(({ buku, pembaca }) => (
              <KartuBuku
                key={buku.id}
                b={buku}
                sub={pembaca === 1 ? '1 pembaca' : `${pembaca} pembaca`}
              />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-border/70 bg-white px-5 py-4 text-sm text-muted">
        Koleksi digital lengkap ada di <Link to="/siswa/baca" className="font-medium text-muh-600 hover:underline">Rak Baca</Link>
        . Meminjam atau mengembalikan buku cetak dilakukan di perpustakaan sekolah.
      </div>
    </div>
  )
}
