# Uji coba fase 1 — Perpustakaan

Tahap 8 rancangan: uji bersama pustakawan dan beberapa guru sebelum peluncuran.
Centang tiap butir; catat yang gagal di bagian akhir.

**Prasyarat sebelum uji**

- [ ] Rules Firestore (blok `perpus_*` + baca `siswa` untuk pustakawan) sudah di-deploy dari repo Penilaian
- [ ] Indeks komposit `perpus_peminjaman` (peminjam.id+status, eksemplarId+status) **Enabled** di Console
- [ ] Minimal satu akun dengan `peranPerpus` = `pustakawan` (atau admin Penilaian)
- [ ] Satu akun guru (tanpa `peranPerpus` khusus) untuk uji menu terbatas
- [ ] Beberapa data siswa aktif di Penilaian (punya field `nisn` bila kartu memakai NISN)
- [ ] Aplikasi di-deploy atau `npm run dev` dengan `.env` yang benar

---

## A. Login & peran

| # | Uji | Hasil |
|---|-----|-------|
| A1 | Masuk dengan admin / pustakawan → menu lengkap (Katalog, Sirkulasi, Kunjungan, Anggota, …) | |
| A2 | Masuk dengan guru → lihat Katalog, Digital, Beranda; **tidak** lihat Sirkulasi/Impor | |
| A3 | Pengaturan → ubah nama → tersimpan; ganti sandi (opsional) | |
| A4 | Akun tanpa akses perpustakaan → pesan tidak punya akses | |

## B. Katalog & eksemplar

| # | Uji | Hasil |
|---|-----|-------|
| B1 | Tambah kategori | |
| B2 | Tambah buku cetak + 2 eksemplar → kode `PRP-…` berurutan | |
| B3 | Cari ISBN (Open Library) mengisi form; data bisa diedit lalu simpan | |
| B4 | Pilih klasifikasi DDC dari daftar (mis. 2X1, 372) | |
| B5 | Ubah buku, tambah eksemplar, tandai hilang / ditemukan / keluarkan | |
| B6 | Cetak label (satu buku / rentang) — preview & print A4 | |
| B7 | Impor CSV 3–5 baris (templat dari menu Impor) | |

## C. Sirkulasi

| # | Uji | Hasil |
|---|-----|-------|
| C1 | Pinjam: NISN siswa → kode eksemplar → status dipinjam, stok −1 | |
| C2 | Siswa sudah di batas maks → ditolak | |
| C3 | Kembali: pindai kode → status tersedia, stok +1 | |
| C4 | Perpanjang (jika masih boleh) | |
| C5 | Daftar aktif + filter terlambat | |
| C6 | Anggota non-siswa: daftar di Anggota → pinjam dengan ID anggota | |

## D. Kunjungan & laporan

| # | Uji | Hasil |
|---|-----|-------|
| D1 | Kunjungan satu orang (NISN) → muncul di daftar hari ini + beranda | |
| D2 | Kunjungan per kelas (muat roster, centang, catat) | |
| D3 | Laporan terlambat / populer / kunjungan + unduh CSV | |

## E. Digital

| # | Uji | Hasil |
|---|-----|-------|
| E1 | Buku jenis digital + tautan https → menu Digital → Buka bacaan | |
| E2 | Tautan tidak valid ditolak di form | |

## F. Aturan & keamanan

| # | Uji | Hasil |
|---|-----|-------|
| F1 | Admin: Pengaturan → ubah aturan pinjam → pinjaman baru mengikuti | |
| F2 | Pustakawan **tidak** bisa ubah aturan (hanya admin) | |
| F3 | Guru tidak bisa menulis katalog / sirkulasi | |

## G. Perangkat nyata (opsional tapi disarankan)

| # | Uji | Hasil |
|---|-----|-------|
| G1 | Pemindai barcode USB: fokus di kolom NISN / PRP → Enter otomatis | |
| G2 | Layar HP: menu bawah / sidebar terbaca, form bisa dipakai | |
| G3 | Printer label: hasil cetak terbaca scanner | |

---

## Catatan kegagalan

| Kode uji | Gejala | Dugaan | Tindakan |
|----------|--------|--------|----------|
| | | | |

## Setelah lulus uji

1. Deploy produksi: `npm run deploy` (dari repo ini).
2. Pastikan domain `perpustakaan.…` dan Authorized domains Auth.
3. Briefing singkat pustakawan (alur pinjam/kembali/kunjungan + impor).
4. Fase 2 (katalog publik, reservasi, usulan, stock opname) menyusul setelah stabil.
