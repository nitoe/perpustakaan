import { useEffect, useState } from 'react'
import { useSiswa } from '../../context/SiswaContext'
import { formatTanggal, pinjamanAktifPeminjam, terlambat } from '../../lib/sirkulasi'
import type { Peminjaman } from '../../lib/tipe'
import { Notice } from '../../components/ui'

/** Daftar pinjaman aktif siswa — tampilan visual. */
export default function SiswaPinjaman() {
  const { sesi } = useSiswa()
  const [list, setList] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    if (!sesi?.nisn || sesi.preview) {
      setLoading(false)
      return
    }
    let batal = false
    setLoading(true)
    setGalat('')
    void pinjamanAktifPeminjam(sesi.nisn)
      .then((rows) => {
        if (!batal) setList(rows)
      })
      .catch((e) => {
        if (batal) return
        const kode = (e as { code?: string })?.code
        setGalat(
          kode === 'permission-denied'
            ? 'Belum bisa menampilkan pinjaman. Admin perlu menyesuaikan aturan Firestore (lihat docs/RULES_SISWA_LOGIN.md).'
            : 'Gagal memuat pinjaman.',
        )
        setList([])
      })
      .finally(() => {
        if (!batal) setLoading(false)
      })
    return () => {
      batal = true
    }
  }, [sesi?.nisn, sesi?.preview])

  if (!sesi) return null

  if (sesi.preview) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-muh-800">Pinjaman Saya</h1>
        <Notice>Mode pratinjau — data pinjaman tidak ditampilkan.</Notice>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-muh-800 sm:text-3xl">Pinjaman Saya</h1>
        <p className="mt-1 text-sm text-muted">
          Buku cetak yang sedang kamu pinjam. Pengembalian dilakukan di perpustakaan sekolah.
        </p>
      </div>

      {galat && <Notice tipe="error">{galat}</Notice>}

      {loading ? (
        <div className="text-sm text-muted">Memuat pinjaman…</div>
      ) : list.length === 0 && !galat ? (
        <div className="card-soft p-6 text-center">
          <p className="text-muted">Tidak ada buku yang sedang dipinjam.</p>
          <p className="mt-1 text-sm text-muted">
            Silakan pinjam di perpustakaan sekolah dengan kartu anggota.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((p) => {
            const telat = terlambat(p)
            return (
              <li
                key={p.id}
                className={`card-soft overflow-hidden p-0 ${telat ? 'ring-1 ring-red-200' : ''}`}
              >
                <div className={`px-4 py-3 ${telat ? 'bg-red-50' : 'bg-muh-50/40'}`}>
                  <div className="font-medium text-[#1a1d33]">{p.judul}</div>
                  <div className="mt-1 text-xs text-muted">Kode: {p.eksemplarId}</div>
                </div>
                <div className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-muted">Tanggal pinjam</div>
                    <div>{formatTanggal(p.tglPinjam)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Jatuh tempo</div>
                    <div className={telat ? 'font-medium text-red-600' : ''}>
                      {formatTanggal(p.jatuhTempo)}
                      {telat && ' (terlambat)'}
                    </div>
                  </div>
                </div>
                {p.jumlahPerpanjang > 0 && (
                  <div className="border-t border-border px-4 py-2 text-xs text-muted">
                    Diperpanjang {p.jumlahPerpanjang}×
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Notice>
        Perpanjang atau kembalikan buku hanya melalui pustakawan di sekolah. Halaman ini hanya menampilkan status.
      </Notice>
    </div>
  )
}
