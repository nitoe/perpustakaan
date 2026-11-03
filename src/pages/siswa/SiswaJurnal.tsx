import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useSiswa } from '../../context/SiswaContext'
import {
  buatJurnal,
  daftarJurnalSiswa,
  formatTanggalJurnal,
  tanggalHariIni,
} from '../../lib/jurnal'
import type { JurnalBaca } from '../../lib/tipe'
import { Notice, inputCls } from '../../components/ui'

/** Jurnal baca siswa — tampilan visual. */
export default function SiswaJurnal() {
  const { sesi } = useSiswa()
  const [list, setList] = useState<JurnalBaca[]>([])
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState('')
  const [ok, setOk] = useState('')
  const [judul, setJudul] = useState('')
  const [pengarang, setPengarang] = useState('')
  const [catatan, setCatatan] = useState('')
  const [tanggalBaca, setTanggalBaca] = useState(tanggalHariIni())
  const [proses, setProses] = useState(false)
  const [formBuka, setFormBuka] = useState(false)

  const muat = useCallback(async () => {
    if (!sesi?.nisn || sesi.preview) {
      setLoading(false)
      return
    }
    setLoading(true)
    setGalat('')
    try {
      setList(await daftarJurnalSiswa(sesi.nisn))
    } catch (e) {
      const kode = (e as { code?: string })?.code
      setGalat(
        kode === 'permission-denied'
          ? 'Belum bisa memuat jurnal. Admin perlu menambahkan aturan perpus_jurnal (lihat docs/RULES_SISWA_LOGIN.md).'
          : kode === 'failed-precondition'
            ? 'Indeks Firestore belum siap. Tunggu beberapa menit atau buat indeks dari tautan di konsol browser.'
            : 'Gagal memuat jurnal.',
      )
      setList([])
    }
    setLoading(false)
  }, [sesi?.nisn, sesi?.preview])

  useEffect(() => {
    void muat()
  }, [muat])

  if (!sesi) return null

  if (sesi.preview) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-muh-800">Jurnal Baca</h1>
        <Notice>Mode pratinjau — form dan data jurnal tidak tersedia.</Notice>
      </div>
    )
  }

  const siswa = sesi

  async function kirim(e: FormEvent) {
    e.preventDefault()
    setProses(true)
    setGalat('')
    setOk('')
    try {
      await buatJurnal({
        siswaId: siswa.nisn,
        siswaNama: siswa.nama,
        kelas: siswa.kelas,
        judul,
        pengarang,
        catatan,
        tanggalBaca,
      })
      setOk('Jurnal tersimpan.')
      setJudul('')
      setPengarang('')
      setCatatan('')
      setTanggalBaca(tanggalHariIni())
      setFormBuka(false)
      await muat()
    } catch (err) {
      const kode = (err as { code?: string })?.code
      setGalat(
        kode === 'permission-denied'
          ? 'Belum diizinkan menulis jurnal. Periksa aturan Firestore perpus_jurnal.'
          : err instanceof Error
            ? err.message
            : 'Gagal menyimpan.',
      )
    }
    setProses(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-muh-800 sm:text-3xl">Jurnal Baca</h1>
          <p className="mt-1 text-sm text-muted">
            Catat buku yang sudah dibaca dan kesan singkat. Guru dapat memberi tanggapan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormBuka((v) => !v)}
          className="rounded-full bg-muh-600 px-5 py-2 text-sm font-semibold text-white hover:bg-muh-700"
        >
          {formBuka ? 'Tutup' : 'Tulis Jurnal'}
        </button>
      </div>

      {galat && <Notice tipe="error">{galat}</Notice>}
      {ok && <Notice>{ok}</Notice>}

      {formBuka && (
        <form onSubmit={kirim} className="card-soft space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2b2f4a]">Judul buku</label>
            <input
              className={inputCls}
              required
              maxLength={300}
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Judul yang dibaca"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2b2f4a]">
              Pengarang <span className="font-normal text-muted">(opsional)</span>
            </label>
            <input
              className={inputCls}
              maxLength={120}
              value={pengarang}
              onChange={(e) => setPengarang(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2b2f4a]">Tanggal baca</label>
            <input
              className={inputCls}
              type="date"
              required
              value={tanggalBaca}
              onChange={(e) => setTanggalBaca(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2b2f4a]">
              Kesan / ringkasan
            </label>
            <textarea
              className={`${inputCls} min-h-[110px]`}
              required
              maxLength={2000}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Apa yang kamu pelajari atau sukai dari buku ini?"
            />
          </div>
          <button
            type="submit"
            disabled={proses}
            className="rounded-full bg-muh-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-muh-700 disabled:opacity-60"
          >
            {proses ? 'Menyimpan…' : 'Simpan Jurnal'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-muted">Memuat jurnal…</div>
      ) : list.length === 0 ? (
        <div className="card-soft p-6 text-center text-muted">
          Belum ada jurnal. Tekan “Tulis Jurnal” setelah selesai membaca.
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map((j) => (
            <li key={j.id} className="card-soft overflow-hidden">
              <div className="border-b border-border/70 bg-muh-50/30 px-4 py-3">
                <div className="font-medium text-[#1a1d33]">{j.judul}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                  {j.pengarang && <span>{j.pengarang}</span>}
                  <span>·</span>
                  <span>{formatTanggalJurnal(j.tanggalBaca)}</span>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#2b2f4a]">
                  {j.catatan}
                </p>
                {j.tanggapanGuru ? (
                  <div className="mt-4 rounded-xl border border-muh-100 bg-muh-50/60 px-3.5 py-3">
                    <div className="mb-1 text-xs font-medium text-muh-700">
                      Tanggapan guru{j.guruNama ? ` · ${j.guruNama}` : ''}
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-[#2b2f4a]">{j.tanggapanGuru}</p>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-muted">Belum ada tanggapan guru.</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
