import { useEffect, useState } from 'react'
import { useSiswa } from '../../context/SiswaContext'
import { formatTanggal, pinjamanAktifPeminjam, terlambat } from '../../lib/sirkulasi'
import type { Peminjaman } from '../../lib/tipe'
import { Badge, Notice, PageHeader } from '../../components/ui'

/** Daftar pinjaman aktif siswa yang sedang login (buku cetak lewat sirkulasi). */
export default function SiswaPinjaman() {
  const { sesi } = useSiswa()
  const [list, setList] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    if (!sesi?.nisn) {
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
  }, [sesi?.nisn])

  if (!sesi) return null

  return (
    <div>
      <PageHeader
        judul="Pinjaman saya"
        keterangan="Buku cetak yang sedang Anda pinjam. Pengembalian dilakukan di perpustakaan sekolah."
      />

      {galat && (
        <div className="mb-4">
          <Notice tipe="error">{galat}</Notice>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted">Memuat…</div>
      ) : list.length === 0 && !galat ? (
        <Notice>Tidak ada buku yang sedang dipinjam. Silakan pinjam di perpustakaan sekolah dengan kartu anggota.</Notice>
      ) : list.length > 0 ? (
        <ul className="space-y-3">
          {list.map((p) => {
            const telat = terlambat(p)
            return (
              <li key={p.id} className="card-soft p-4">
                <div className="font-medium text-[#1a1d33]">{p.judul}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted">
                  <span>Kode: {p.eksemplarId}</span>
                  <span>·</span>
                  <span>Pinjam: {formatTanggal(p.tglPinjam)}</span>
                  <span>·</span>
                  <span className={telat ? 'font-medium text-red-600' : ''}>
                    Jatuh tempo: {formatTanggal(p.jatuhTempo)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {telat ? <Badge>Terlambat</Badge> : <Badge>Dipinjam</Badge>}
                  {p.jumlahPerpanjang > 0 && <Badge>Diperpanjang {p.jumlahPerpanjang}×</Badge>}
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}

      <div className="mt-4">
        <Notice>
          Perpanjang atau kembalikan buku hanya melalui pustakawan di sekolah. Halaman ini hanya menampilkan status.
        </Notice>
      </div>
    </div>
  )
}
