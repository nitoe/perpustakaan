import type { FormatDigital, JenisKoleksi, Buku } from './tipe'
import { MAKS_EKSEMPLAR_SEKALI, tautanAman, type DataBuku } from './katalog'

/** Kolom templat impor (urutan tetap). Nama kolom dibaca tanpa membedakan huruf besar/kecil, spasi, dan garis bawah. */
export const KOLOM_TEMPLAT = [
  'judul',
  'pengarang',
  'penerbit',
  'tahun',
  'isbn',
  'kategori',
  'klasifikasi',
  'bahasa',
  'jenjang_baca',
  'jenis',
  'tautan_digital',
  'format_digital',
  'jumlah_eksemplar',
  'rak',
  'tahun_masuk',
  'sumber',
  'sinopsis',
]

export const CONTOH_TEMPLAT: string[][] = [
  ['Laskar Pelangi', 'Andrea Hirata', 'Bentang Pustaka', '2005', '9789793062792', 'Novel', '', 'Indonesia', 'Kelas 5-6', 'cetak', '', '', '3', 'A-1', '2024', 'BOS', 'Kisah sepuluh anak di Belitung.'],
  ['Buku Siswa Bahasa Indonesia Kelas 5', 'Kemendikbudristek', '', '2022', '', 'Buku Pelajaran', '', 'Indonesia', 'Kelas 5', 'digital', 'https://buku.kemdikbud.go.id/', 'web', '', '', '', '', ''],
]

const ALIAS: Record<string, string> = {
  tautan: 'tautandigital',
  link: 'tautandigital',
  format: 'formatdigital',
  jumlah: 'jumlaheksemplar',
  eksemplar: 'jumlaheksemplar',
  jenjang: 'jenjangbaca',
  tahunterbit: 'tahun',
  pengarang: 'pengarang',
  penulis: 'pengarang',
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
export const normTeks = (s: string | undefined) => (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
export const normIsbn = (s: string | undefined) => (s ?? '').toLowerCase().replace(/[^0-9x]/g, '')
export const kunciJudul = (judul: string, pengarang?: string) => `${normTeks(judul)}|${normTeks(pengarang)}`

export interface BarisImpor {
  no: number
  buku: DataBuku
  kategoriNama?: string
  jumlah: number
  rak?: string
  tahunMasuk?: number
  sumber?: string
  galat: string[]
  duplikat: string
}

export interface HasilBaca {
  baris: BarisImpor[]
  galatUmum: string
}

const JENIS_VALID: JenisKoleksi[] = ['cetak', 'digital', 'keduanya']
const FORMAT_VALID: FormatDigital[] = ['pdf', 'video', 'audio', 'web']

function angka(s: string): number | null {
  const t = s.trim()
  if (!t) return null
  return /^\d+$/.test(t) ? Number(t) : NaN
}

/** Mengubah hasil parseCsv menjadi baris impor yang sudah divalidasi. */
export function bacaBaris(tabel: string[][], katalog: Buku[]): HasilBaca {
  if (tabel.length < 2) return { baris: [], galatUmum: 'Berkas kosong atau hanya berisi judul kolom.' }
  const kepala = tabel[0]!.map((h) => {
    const n = norm(h)
    return ALIAS[n] ?? n
  })
  if (!kepala.includes('judul')) return { baris: [], galatUmum: 'Kolom "judul" tidak ditemukan. Gunakan templat dari tombol Unduh templat.' }
  const idx = (k: string) => kepala.indexOf(k)
  const ambil = (r: string[], k: string) => {
    const i = idx(k)
    return i >= 0 ? (r[i] ?? '').trim() : ''
  }

  const adaIsbn = new Set(katalog.map((b) => normIsbn(b.isbn)).filter(Boolean))
  const adaJudul = new Set(katalog.map((b) => kunciJudul(b.judul, b.pengarang)))
  const lihatIsbn = new Set<string>()
  const lihatJudul = new Set<string>()

  const baris: BarisImpor[] = tabel.slice(1).map((r, i) => {
    const galat: string[] = []
    const judul = ambil(r, 'judul')
    if (!judul) galat.push('judul kosong')
    if (judul.length > 300) galat.push('judul lebih dari 300 karakter')

    const tahunStr = ambil(r, 'tahun')
    const tahun = angka(tahunStr)
    if (tahun !== null && (!Number.isInteger(tahun) || tahun < 1000 || tahun > 2100)) galat.push('tahun terbit tidak valid')

    const tautanMentah = ambil(r, 'tautandigital')
    const tautan = tautanMentah ? tautanAman(tautanMentah) : null
    if (tautanMentah && !tautan) galat.push('tautan harus diawali http:// atau https://')

    const jumlahStr = ambil(r, 'jumlaheksemplar')
    const jumlahAngka = angka(jumlahStr)
    if (jumlahAngka !== null && (!Number.isInteger(jumlahAngka) || jumlahAngka > MAKS_EKSEMPLAR_SEKALI))
      galat.push(`jumlah eksemplar harus 0 sampai ${MAKS_EKSEMPLAR_SEKALI}`)

    let jenis = norm(ambil(r, 'jenis')) as JenisKoleksi | ''
    if (jenis && !JENIS_VALID.includes(jenis)) {
      galat.push('jenis harus cetak, digital, atau keduanya')
      jenis = ''
    }
    const jumlahDiberi = jumlahAngka !== null && !Number.isNaN(jumlahAngka) ? jumlahAngka : null
    if (!jenis) jenis = tautan ? (jumlahDiberi && jumlahDiberi > 0 ? 'keduanya' : 'digital') : 'cetak'
    if (jenis !== 'cetak' && !tautan && !tautanMentah) galat.push('jenis digital/keduanya wajib punya tautan_digital')

    let jumlah = jumlahDiberi ?? (jenis === 'digital' ? 0 : 1)
    if (jenis === 'digital') jumlah = 0
    if (Number.isNaN(jumlahAngka)) jumlah = 0

    const tm = angka(ambil(r, 'tahunmasuk'))
    if (tm !== null && (!Number.isInteger(tm) || tm < 1900 || tm > 2100)) galat.push('tahun masuk tidak valid')

    const fm = norm(ambil(r, 'formatdigital')) as FormatDigital | ''
    let format: FormatDigital | undefined
    if (jenis !== 'cetak') {
      if (fm && !FORMAT_VALID.includes(fm)) galat.push('format_digital harus pdf, video, audio, atau web')
      format = fm && FORMAT_VALID.includes(fm) ? fm : tautan?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'web'
    }

    const pengarang = ambil(r, 'pengarang')
    const isbn = ambil(r, 'isbn')
    const isbnN = normIsbn(isbn)
    const kj = kunciJudul(judul, pengarang)
    let duplikat = ''
    if (isbnN && adaIsbn.has(isbnN)) duplikat = 'ISBN sudah ada di katalog'
    else if (judul && adaJudul.has(kj)) duplikat = 'judul dan pengarang sudah ada di katalog'
    else if (isbnN && lihatIsbn.has(isbnN)) duplikat = 'ISBN muncul dua kali di berkas'
    else if (judul && lihatJudul.has(kj)) duplikat = 'judul dan pengarang muncul dua kali di berkas'
    if (isbnN) lihatIsbn.add(isbnN)
    if (judul) lihatJudul.add(kj)

    const buku: DataBuku = {
      judul,
      pengarang: pengarang || undefined,
      penerbit: ambil(r, 'penerbit') || undefined,
      tahun: tahun !== null && !Number.isNaN(tahun) ? tahun : undefined,
      isbn: isbn || undefined,
      klasifikasi: ambil(r, 'klasifikasi') || undefined,
      bahasa: ambil(r, 'bahasa') || undefined,
      jenjangBaca: ambil(r, 'jenjangbaca') || undefined,
      sinopsis: ambil(r, 'sinopsis') || undefined,
      jenis: (jenis || 'cetak') as JenisKoleksi,
      tautanDigital: jenis !== 'cetak' ? (tautan ?? undefined) : undefined,
      formatDigital: format,
      publik: false,
    }
    return {
      no: i + 2,
      buku,
      kategoriNama: ambil(r, 'kategori') || undefined,
      jumlah,
      rak: ambil(r, 'rak') || undefined,
      tahunMasuk: tm !== null && !Number.isNaN(tm) ? tm : undefined,
      sumber: ambil(r, 'sumber') || undefined,
      galat,
      duplikat,
    }
  })
  return { baris, galatUmum: '' }
}
