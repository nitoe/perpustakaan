/**
 * Ringkasan Klasifikasi Persepuluhan Dewey (DDC) untuk perpustakaan sekolah Indonesia.
 * Bukan DDC lengkap; cukup membantu mengisi field klasifikasi dan kategori.
 * Notasi Islam 2X0 mengikuti kebiasaan banyak perpustakaan madrasah/sekolah Islam di Indonesia.
 */

export interface KelasDdc {
  kode: string
  nama: string
  /** Subdivisi yang sering dipakai di SD. */
  anak?: { kode: string; nama: string }[]
}

export const KELAS_DDC: KelasDdc[] = [
  {
    kode: '000',
    nama: 'Karya umum',
    anak: [
      { kode: '001', nama: 'Pengetahuan umum' },
      { kode: '030', nama: 'Ensiklopedia' },
      { kode: '070', nama: 'Jurnalistik / media' },
    ],
  },
  {
    kode: '100',
    nama: 'Filsafat & psikologi',
    anak: [
      { kode: '150', nama: 'Psikologi' },
      { kode: '170', nama: 'Etika' },
    ],
  },
  {
    kode: '200',
    nama: 'Agama',
    anak: [
      { kode: '220', nama: 'Alkitab' },
      { kode: '230', nama: 'Kristen' },
      { kode: '2X0', nama: 'Islam (notasi Indonesia)' },
      { kode: '2X1', nama: 'Al-Qur\'an & tafsir' },
      { kode: '2X2', nama: 'Hadis' },
      { kode: '2X3', nama: 'Aqidah' },
      { kode: '2X4', nama: 'Fikih' },
      { kode: '2X5', nama: 'Akhlak & tasawuf' },
      { kode: '2X6', nama: 'Sosial & budaya Islam' },
      { kode: '2X7', nama: 'Dakwah & pendidikan Islam' },
      { kode: '2X9', nama: 'Sejarah Islam / tokoh' },
      { kode: '290', nama: 'Agama lain' },
    ],
  },
  {
    kode: '300',
    nama: 'Ilmu sosial',
    anak: [
      { kode: '320', nama: 'Politik' },
      { kode: '330', nama: 'Ekonomi' },
      { kode: '360', nama: 'Masalah sosial' },
      { kode: '370', nama: 'Pendidikan' },
      { kode: '372', nama: 'Pendidikan dasar' },
      { kode: '390', nama: 'Adat / folklor' },
    ],
  },
  {
    kode: '400',
    nama: 'Bahasa',
    anak: [
      { kode: '410', nama: 'Linguistik' },
      { kode: '420', nama: 'Bahasa Inggris' },
      { kode: '499', nama: 'Bahasa Indonesia / daerah' },
    ],
  },
  {
    kode: '500',
    nama: 'Sains & matematika',
    anak: [
      { kode: '510', nama: 'Matematika' },
      { kode: '520', nama: 'Astronomi' },
      { kode: '530', nama: 'Fisika' },
      { kode: '540', nama: 'Kimia' },
      { kode: '550', nama: 'Ilmu bumi' },
      { kode: '570', nama: 'Biologi' },
      { kode: '580', nama: 'Tumbuhan' },
      { kode: '590', nama: 'Hewan' },
    ],
  },
  {
    kode: '600',
    nama: 'Teknologi / ilmu terapan',
    anak: [
      { kode: '610', nama: 'Kedokteran / kesehatan' },
      { kode: '620', nama: 'Teknik' },
      { kode: '630', nama: 'Pertanian' },
      { kode: '640', nama: 'Kesejahteraan rumah tangga' },
      { kode: '650', nama: 'Manajemen' },
    ],
  },
  {
    kode: '700',
    nama: 'Seni & rekreasi',
    anak: [
      { kode: '720', nama: 'Arsitektur' },
      { kode: '740', nama: 'Gambar / kerajinan' },
      { kode: '750', nama: 'Lukis' },
      { kode: '780', nama: 'Musik' },
      { kode: '790', nama: 'Olahraga / permainan' },
    ],
  },
  {
    kode: '800',
    nama: 'Sastra',
    anak: [
      { kode: '810', nama: 'Sastra Indonesia' },
      { kode: '820', nama: 'Sastra Inggris' },
      { kode: '800.F', nama: 'Fiksi / cerita (umum)' },
    ],
  },
  {
    kode: '900',
    nama: 'Sejarah & geografi',
    anak: [
      { kode: '910', nama: 'Geografi & perjalanan' },
      { kode: '920', nama: 'Biografi' },
      { kode: '959.8', nama: 'Sejarah Indonesia' },
      { kode: '991', nama: 'Sejarah lokal / daerah' },
    ],
  },
]

/** Cari label DDC dari kode (cocokkan kode penuh atau awalan kelas). */
export function labelDdc(kode: string): string | null {
  const k = kode.trim()
  if (!k) return null
  for (const kelas of KELAS_DDC) {
    if (kelas.kode === k) return kelas.nama
    for (const a of kelas.anak ?? []) {
      if (a.kode === k) return a.nama
    }
  }
  const awalan = k.slice(0, 1) + '00'
  const kelas = KELAS_DDC.find((c) => c.kode === awalan)
  return kelas ? `${kelas.nama} (${k})` : null
}
