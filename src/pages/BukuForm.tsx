import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { catat, simpanFoto } from '../lib/data'
import { kecilkanFoto } from '../lib/foto'
import {
  MAKS_EKSEMPLAR_SEKALI,
  buatBuku,
  tautanAman,
  ubahBuku,
  type DataBuku,
} from '../lib/katalog'
import { cariJudul, lookupIsbn, type HasilLookupBuku } from '../lib/bukuApi'
import { KELAS_DDC, labelDdc } from '../lib/ddc'
import { useKoleksi } from '../lib/useKoleksi'
import type { Buku, FormatDigital, JenisKoleksi, KondisiBuku, Kategori } from '../lib/tipe'
import { Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'
import Sampul from '../components/Sampul'

export default function BukuForm() {
  const { id } = useParams<{ id: string }>()
  const buku = useKoleksi<Buku>('perpus_buku')
  const kategori = useKoleksi<Kategori>('perpus_kategori')

  if (id) {
    if (buku.loading) return <div className="text-sm text-muted">Memuat…</div>
    const ada = buku.data.find((b) => b.id === id)
    if (!ada) {
      return (
        <div className="mx-auto max-w-xl">
          <Notice tipe="warn">Buku tidak ditemukan.</Notice>
        </div>
      )
    }
    return <Isi awal={ada} kategori={kategori.data} />
  }
  return <Isi awal={null} kategori={kategori.data} />
}

const JENIS: { nilai: JenisKoleksi; label: string }[] = [
  { nilai: 'cetak', label: 'Buku cetak' },
  { nilai: 'digital', label: 'Koleksi digital' },
  { nilai: 'keduanya', label: 'Cetak dan digital' },
]
const FORMAT: { nilai: FormatDigital; label: string }[] = [
  { nilai: 'pdf', label: 'PDF' },
  { nilai: 'web', label: 'Halaman web' },
  { nilai: 'video', label: 'Video' },
  { nilai: 'audio', label: 'Audio' },
]
const KONDISI: { nilai: KondisiBuku; label: string }[] = [
  { nilai: 'baik', label: 'Baik' },
  { nilai: 'rusak_ringan', label: 'Rusak ringan' },
  { nilai: 'rusak_berat', label: 'Rusak berat' },
]

function Isi({ awal, kategori }: { awal: Buku | null; kategori: Kategori[] }) {
  const { profil } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({
    judul: awal?.judul ?? '',
    pengarang: awal?.pengarang ?? '',
    penerbit: awal?.penerbit ?? '',
    tahun: awal?.tahun ? String(awal.tahun) : '',
    isbn: awal?.isbn ?? '',
    kategoriId: awal?.kategoriId ?? '',
    klasifikasi: awal?.klasifikasi ?? '',
    bahasa: awal?.bahasa ?? '',
    jenjangBaca: awal?.jenjangBaca ?? '',
    sinopsis: awal?.sinopsis ?? '',
    jenis: (awal?.jenis ?? 'cetak') as JenisKoleksi,
    tautanDigital: awal?.tautanDigital ?? '',
    formatDigital: (awal?.formatDigital ?? 'web') as FormatDigital,
    publik: awal?.publik ?? false,
    jumlah: '1',
    rak: '',
    kondisi: 'baik' as KondisiBuku,
    tahunMasuk: String(new Date().getFullYear()),
    sumber: '',
  })
  const [fotoBaru, setFotoBaru] = useState<string | null>(null)
  const [galat, setGalat] = useState('')
  const [info, setInfo] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)
  const [cariApi, setCariApi] = useState(false)
  const [hasilCari, setHasilCari] = useState<HasilLookupBuku[]>([])

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))
  const adaDigital = f.jenis !== 'cetak'
  const adaCetak = f.jenis !== 'digital'

  function terapkanLookup(h: HasilLookupBuku) {
    setF((s) => ({
      ...s,
      judul: h.judul || s.judul,
      pengarang: h.pengarang || s.pengarang,
      penerbit: h.penerbit || s.penerbit,
      tahun: h.tahun ? String(h.tahun) : s.tahun,
      isbn: h.isbn || s.isbn,
      sinopsis: h.sinopsis || s.sinopsis,
      bahasa: h.bahasa || s.bahasa || 'Indonesia',
    }))
    setHasilCari([])
    setInfo('Data dari Open Library diisi. Periksa dan lengkapi jika perlu.')
  }

  async function dariIsbn() {
    setGalat('')
    setInfo('')
    setHasilCari([])
    const isbn = f.isbn.trim()
    if (!isbn) return setGalat('Isi ISBN dulu, lalu tekan Cari ISBN.')
    setCariApi(true)
    try {
      const h = await lookupIsbn(isbn)
      if (!h) setGalat('ISBN tidak ditemukan di Open Library. Isi manual atau coba judul.')
      else terapkanLookup(h)
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal menghubungi Open Library.')
    }
    setCariApi(false)
  }

  async function dariJudul() {
    setGalat('')
    setInfo('')
    const q = f.judul.trim() || f.isbn.trim()
    if (q.length < 2) return setGalat('Isi judul (minimal 2 huruf) untuk mencari.')
    setCariApi(true)
    try {
      const list = await cariJudul(q)
      if (list.length === 0) setGalat('Tidak ada hasil. Coba kata kunci lain atau isi manual.')
      else if (list.length === 1) terapkanLookup(list[0]!)
      else setHasilCari(list)
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal mencari.')
    }
    setCariApi(false)
  }

  async function pilihFoto(file: File | undefined) {
    if (!file) return
    try {
      setFotoBaru(await kecilkanFoto(file))
      setGalat('')
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal memproses gambar.')
    }
  }

  async function simpan(e: FormEvent) {
    e.preventDefault()
    setGalat('')
    const judul = f.judul.trim()
    if (!judul) return setGalat('Judul wajib diisi.')
    if (judul.length > 300) return setGalat('Judul terlalu panjang (maksimal 300 karakter).')
    const tahun = f.tahun.trim() ? Number(f.tahun) : undefined
    if (tahun !== undefined && (!Number.isInteger(tahun) || tahun < 1000 || tahun > 2100))
      return setGalat('Tahun terbit tidak valid.')
    if (awal && f.jenis === 'digital' && (awal.eksemplarTotal ?? 0) > 0)
      return setGalat('Buku ini masih punya eksemplar cetak. Pilih "Cetak dan digital", atau keluarkan eksemplarnya lebih dulu.')
    let tautan: string | undefined
    if (adaDigital) {
      const aman = tautanAman(f.tautanDigital)
      if (!aman) return setGalat('Tautan digital wajib diisi dan harus diawali http:// atau https://.')
      tautan = aman
    }
    let jumlah = 0
    if (!awal && adaCetak) {
      jumlah = Number(f.jumlah)
      if (!Number.isInteger(jumlah) || jumlah < 0 || jumlah > MAKS_EKSEMPLAR_SEKALI)
        return setGalat(`Jumlah eksemplar awal harus 0 sampai ${MAKS_EKSEMPLAR_SEKALI}.`)
    }
    const tahunMasuk = f.tahunMasuk.trim() ? Number(f.tahunMasuk) : undefined
    if (jumlah > 0 && tahunMasuk !== undefined && (!Number.isInteger(tahunMasuk) || tahunMasuk < 1900 || tahunMasuk > 2100))
      return setGalat('Tahun masuk eksemplar tidak valid.')

    setMenyimpan(true)
    try {
      let coverId = awal?.coverId
      if (fotoBaru) coverId = await simpanFoto(fotoBaru)
      const data: DataBuku = {
        judul,
        pengarang: f.pengarang.trim() || undefined,
        penerbit: f.penerbit.trim() || undefined,
        tahun,
        isbn: f.isbn.trim() || undefined,
        kategoriId: f.kategoriId || undefined,
        klasifikasi: f.klasifikasi.trim() || undefined,
        bahasa: f.bahasa.trim() || undefined,
        jenjangBaca: f.jenjangBaca.trim() || undefined,
        sinopsis: f.sinopsis.trim() || undefined,
        coverId,
        jenis: f.jenis,
        tautanDigital: adaDigital ? tautan : undefined,
        formatDigital: adaDigital ? f.formatDigital : undefined,
        publik: f.publik,
      }
      let idBuku: string
      if (awal) {
        await ubahBuku(awal, data)
        idBuku = awal.id
        void catat(profil, 'ubah buku', 'perpus_buku', idBuku)
      } else {
        idBuku = await buatBuku(
          data,
          jumlah > 0
            ? {
                jumlah,
                rak: f.rak.trim() || undefined,
                kondisi: f.kondisi,
                tahunMasuk,
                sumber: f.sumber.trim() || undefined,
              }
            : null,
        )
        void catat(profil, 'tambah buku', 'perpus_buku', idBuku)
      }
      nav(`/katalog/${idBuku}`, { replace: true })
    } catch (err) {
      const kode = (err as { code?: string })?.code
      setGalat(
        kode === 'permission-denied'
          ? 'Anda tidak memiliki izin untuk menyimpan buku.'
          : 'Gagal menyimpan. Periksa koneksi lalu coba lagi.',
      )
      setMenyimpan(false)
    }
  }

  const labelKlas = labelDdc(f.klasifikasi)

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        judul={awal ? 'Ubah buku' : 'Tambah buku'}
        keterangan={awal ? awal.judul : 'Isi data buku, atau cari dulu dari ISBN/judul.'}
      />
      <form onSubmit={(e) => void simpan(e)} className="space-y-5">
        {galat && <Notice tipe="error">{galat}</Notice>}
        {info && <Notice>{info}</Notice>}

        <div className="card-soft space-y-3 p-4">
          <div className="text-sm font-medium">Bantuan isi data</div>
          <p className="text-xs text-muted">
            Data dari Open Library (katalog publik). Judul Indonesia mungkin tidak lengkap — periksa sebelum simpan.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnGhost} disabled={cariApi} onClick={() => void dariIsbn()}>
              {cariApi ? 'Mencari…' : 'Cari ISBN'}
            </button>
            <button type="button" className={btnGhost} disabled={cariApi} onClick={() => void dariJudul()}>
              {cariApi ? 'Mencari…' : 'Cari judul'}
            </button>
          </div>
          {hasilCari.length > 0 && (
            <ul className="max-h-48 overflow-y-auto rounded-lg border border-border">
              {hasilCari.map((h, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-muh-50"
                    onClick={() => terapkanLookup(h)}
                  >
                    <span className="font-medium">{h.judul}</span>
                    <span className="text-xs text-muted">
                      {[h.pengarang, h.tahun, h.isbn].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-soft space-y-4 p-4">
          <Field label="Judul *">
            <input className={inputCls} value={f.judul} onChange={(e) => set('judul', e.target.value)} maxLength={300} autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pengarang">
              <input className={inputCls} value={f.pengarang} onChange={(e) => set('pengarang', e.target.value)} />
            </Field>
            <Field label="Penerbit">
              <input className={inputCls} value={f.penerbit} onChange={(e) => set('penerbit', e.target.value)} />
            </Field>
            <Field label="Tahun terbit">
              <input className={inputCls} inputMode="numeric" value={f.tahun} onChange={(e) => set('tahun', e.target.value)} />
            </Field>
            <Field label="ISBN" hint="Isi lalu tekan Cari ISBN di atas.">
              <input className={inputCls} value={f.isbn} onChange={(e) => set('isbn', e.target.value)} />
            </Field>
            <Field label="Kategori" hint={kategori.length === 0 ? 'Belum ada kategori. Buat dulu di menu Kategori.' : undefined}>
              <select className={inputCls} value={f.kategoriId} onChange={(e) => set('kategoriId', e.target.value)}>
                <option value="">— Tanpa kategori —</option>
                {[...kategori]
                  .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
                  .map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Klasifikasi DDC" hint={labelKlas ? labelKlas : 'Pilih ringkasan atau ketik kode.'}>
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  value={f.klasifikasi}
                  onChange={(e) => set('klasifikasi', e.target.value)}
                  placeholder="mis. 2X1, 372"
                  list="ddc-list"
                />
              </div>
              <datalist id="ddc-list">
                {KELAS_DDC.flatMap((k) => [
                  <option key={k.kode} value={k.kode}>
                    {k.nama}
                  </option>,
                  ...(k.anak ?? []).map((a) => (
                    <option key={a.kode} value={a.kode}>
                      {a.nama}
                    </option>
                  )),
                ])}
              </datalist>
            </Field>
            <Field label="Bahasa">
              <input className={inputCls} value={f.bahasa} onChange={(e) => set('bahasa', e.target.value)} placeholder="Indonesia" />
            </Field>
            <Field label="Jenjang baca">
              <input
                className={inputCls}
                value={f.jenjangBaca}
                onChange={(e) => set('jenjangBaca', e.target.value)}
                placeholder="Kelas 1-2, Kelas 3-4, Kelas 5-6, Guru"
              />
            </Field>
          </div>
          <Field label="Sinopsis">
            <textarea className={inputCls} rows={4} value={f.sinopsis} onChange={(e) => set('sinopsis', e.target.value)} />
          </Field>
        </div>

        <div className="card-soft space-y-4 p-4">
          <Field label="Sampul" hint="Gambar otomatis dikecilkan. Kosongkan bila tidak ada.">
            <input type="file" accept="image/*" onChange={(e) => void pilihFoto(e.target.files?.[0])} className="block w-full text-sm" />
          </Field>
          {fotoBaru ? (
            <img src={fotoBaru} alt="Sampul baru" className="h-40 rounded-lg border border-border object-cover" />
          ) : (
            <Sampul id={awal?.coverId} className="h-40" />
          )}
        </div>

        <div className="card-soft space-y-4 p-4">
          <Field label="Jenis koleksi">
            <select className={inputCls} value={f.jenis} onChange={(e) => set('jenis', e.target.value as JenisKoleksi)}>
              {JENIS.map((j) => (
                <option key={j.nilai} value={j.nilai}>
                  {j.label}
                </option>
              ))}
            </select>
          </Field>
          {adaDigital && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Field label="Tautan bacaan digital *" hint="Google Drive, YouTube, BSE, dll.">
                  <input
                    className={inputCls}
                    value={f.tautanDigital}
                    onChange={(e) => set('tautanDigital', e.target.value)}
                    placeholder="https://"
                    inputMode="url"
                  />
                </Field>
              </div>
              <Field label="Format">
                <select
                  className={inputCls}
                  value={f.formatDigital}
                  onChange={(e) => set('formatDigital', e.target.value as FormatDigital)}
                >
                  {FORMAT.map((x) => (
                    <option key={x.nilai} value={x.nilai}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={f.publik} onChange={(e) => set('publik', e.target.checked)} />
            <span>
              Tampilkan di katalog publik dan rak baca siswa{' '}
              <span className="text-muted">(jangan centang berkas yang masih berhak cipta)</span>
            </span>
          </label>
        </div>

        {!awal && adaCetak && (
          <div className="card-soft space-y-4 p-4">
            <div className="text-sm font-medium">Eksemplar awal</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Jumlah eksemplar" hint={`0 sampai ${MAKS_EKSEMPLAR_SEKALI}. Kode label otomatis PRP-…`}>
                <input className={inputCls} inputMode="numeric" value={f.jumlah} onChange={(e) => set('jumlah', e.target.value)} />
              </Field>
              <Field label="Rak / lokasi">
                <input className={inputCls} value={f.rak} onChange={(e) => set('rak', e.target.value)} placeholder="mis. A-3" />
              </Field>
              <Field label="Kondisi">
                <select className={inputCls} value={f.kondisi} onChange={(e) => set('kondisi', e.target.value as KondisiBuku)}>
                  {KONDISI.map((k) => (
                    <option key={k.nilai} value={k.nilai}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tahun masuk">
                <input className={inputCls} inputMode="numeric" value={f.tahunMasuk} onChange={(e) => set('tahunMasuk', e.target.value)} />
              </Field>
              <Field label="Sumber (BOS, hibah, dll.)">
                <input className={inputCls} value={f.sumber} onChange={(e) => set('sumber', e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button type="submit" className={btnPrimary} disabled={menyimpan}>
            {menyimpan ? 'Menyimpan…' : 'Simpan'}
          </button>
          <Link to={awal ? `/katalog/${awal.id}` : '/katalog'} className={btnGhost}>
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
