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
  /** true = boleh tampil di katalog publik (fase 2). Berkas berhak cipta jangan dipublikkan. */
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

/**
 * Siswa: id = NISN (dari field nisn di koleksi `siswa`; fallback NIPD = ID dokumen).
 * Anggota non-siswa: id dari `perpus_anggota`.
 */
export interface Peminjam {
  tipe: 'siswa' | 'anggota'
  id: string
  nama: string
  kelas?: string
}

export interface Anggota {
  id: string
  nama: string
  /** guru, karyawan, atau 'kelas' untuk pojok baca kelas (fase 3). */
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

/** Dokumen perpus_config/aturan. Nilai bawaan dipakai bila dokumen belum dibuat. */
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
