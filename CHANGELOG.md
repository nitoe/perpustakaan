# CHANGELOG

## 0.8.0 — Katalog publik (fase 2)
- Halaman `/publik` tanpa login: cari buku yang ditandai `publik`, detail, buka tautan digital, lihat ketersediaan cetak.
- Login: tautan ke katalog publik untuk siswa/orang tua.
- Rules: `perpus_foto` boleh dibaca siapa saja (sampul di katalog publik). `perpus_buku` tetap hanya item `publik == true` untuk non-staf.
- Kueri publik wajib `where('publik','==',true)`.

## 0.7.1 — Dokumen uji coba fase 1
- `docs/UJI_COBA.md`, README & DEPLOY diperbarui.

## 0.7.0 — Pengaturan & bantuan input buku
- Pengaturan: profil, sandi, aturan pinjam (admin), DDC, bantuan.
- Form buku: Cari ISBN/judul Open Library; datalist DDC + 2X0–2X9.

## 0.6.0 — Anggota

## 0.5.0 — Koleksi digital

## 0.4.1 — Kunjungan NISN/nama/kelas

## 0.4.0 — Kunjungan, laporan, beranda

## 0.3.0 — Sirkulasi

## 0.2.0 — Katalog, eksemplar, impor, label

## 0.1.0 — Kerangka aplikasi
