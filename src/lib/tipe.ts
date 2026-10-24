import type { Timestamp } from 'firebase/firestore'

/** Bentuk dokumen koleksi perpus_*. Lihat docs/DATA_MODEL.md. */

export type JenisKoleksi = 'cetak' | 'digital' | 'keduanya'
export type FormatDigital = 'pdf' | 'video' | 'audio' | 'web'

export interface Kategori {
  id: string
  kode: string
  nama: string
}

export interface Buku {
  id: string
  judul: string
  pengarang?: string
  penerbit?: string
  tahun?: number
  isbn?: string
  kategoriId?: string
  klasifikasi?: string
  bahasa?: string
  jenjangBaca?: string
  sinopsis?: string
  coverId?: string
  jenis: JenisKoleksi
  tautanDigital?: string
  formatDigital?: FormatDigital
  /** true = boleh tampil di katalog publik. Berkas berhak cipta jangan dipublikkan. */
  publik?: boolean
  eksemplarTotal?: number
  eksemplarTersedia?: number
}

export type StatusEksemplar = 'tersedia' | 'dipinjam' | 'hilang' | 'dihapus'
export type KondisiBuku = 'baik' | 'rusak_ringan' | 'rusak_berat'

/** ID dokumen = kode eksemplar di label, mis. PRP-000123. */
export interface Eksemplar {
  id: string
  bukuId: string
  judul: string
  rak?: string
  kondisi: KondisiBuku
  status: StatusEksemplar
  tahunMasuk?: number
  sumber?: string
}

export interface Peminjam {
  tipe: 'siswa' | 'anggota'
  id: string
  nama: string
  kelas?: string
}

export interface Anggota {
  id: string
  nama: string
  jenis: 'guru' | 'karyawan' | 'kelas'
  aktif?: boolean
}

export interface Peminjaman {
  id: string
  eksemplarId: string
  bukuId: string
  judul: string
  peminjam: Peminjam
  tglPinjam: Timestamp
  jatuhTempo: Timestamp
  tglKembali?: Timestamp
  status: 'dipinjam' | 'dikembalikan'
  jumlahPerpanjang: number
  kondisiKembali?: KondisiBuku
  petugasUid: string
  catatan?: string
}

export type Pengunjung = Peminjam

export interface Kunjungan {
  id: string
  tanggal: string
  waktu: Timestamp
  pengunjung: Pengunjung
  keperluan?: string
  petugasUid?: string
}

/** Reservasi buku (antrian saat stok habis atau dipesan dulu). */
export type StatusReservasi = 'antrian' | 'siap' | 'diambil' | 'batal'

export interface Reservasi {
  id: string
  bukuId: string
  judul: string
  pemesan: Peminjam
  status: StatusReservasi
  petugasUid: string
  catatan?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

/** Usulan pengadaan dari guru / staf. */
export type StatusUsulan = 'diajukan' | 'disetujui' | 'ditolak' | 'dibatalkan'

export interface Usulan {
  id: string
  judul: string
  pengarang?: string
  penerbit?: string
  isbn?: string
  alasan?: string
  pengusulUid: string
  pengusulNama: string
  status: StatusUsulan
  catatanAdmin?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

/** Sesi stock opname (inventarisasi). */
export type StatusOpname = 'berjalan' | 'selesai'

export interface OpnameSesi {
  id: string
  nama: string
  status: StatusOpname
  petugasUid: string
  petugasNama: string
  createdAt?: Timestamp
  selesaiAt?: Timestamp
}

/** Satu baris hasil pindai dalam sesi opname. */
export interface OpnameItem {
  id: string
  sesiId: string
  eksemplarId: string
  bukuId?: string
  judul?: string
  statusSistem?: StatusEksemplar
  ditemukan: boolean
  catatan?: string
  waktu?: Timestamp
}

/** Entri jurnal baca / literasi siswa. */
export interface JurnalBaca {
  id: string
  siswaId: string
  siswaNama: string
  kelas: string
  judul: string
  pengarang?: string
  bukuId?: string
  /** Kesan / ringkasan singkat siswa. */
  catatan: string
  /** YYYY-MM-DD zona lokal. */
  tanggalBaca: string
  tanggapanGuru?: string
  guruUid?: string
  guruNama?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Aturan {
  lamaPinjamHari: number
  maksSiswa: number
  maksAnggota: number
  maksPerpanjang: number
}

export const ATURAN_BAWAAN: Aturan = {
  lamaPinjamHari: 7,
  maksSiswa: 2,
  maksAnggota: 5,
  maksPerpanjang: 1,
}

export const KEPERLUAN_KUNJUNGAN = ['Baca di tempat', 'Pinjam / kembalikan', 'Belajar / tugas', 'Lainnya'] as const
