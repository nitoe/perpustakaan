# CHANGELOG

## 0.14.32 — Katalog pinjam buku cetak untuk siswa
- Menu **Katalog Pinjam** di area siswa: daftar buku jenis `cetak` / `keduanya` (cari, filter kategori, hanya tersedia, pagination 50).
- Detail buku: metadata, ketersediaan, sinopsis; petunjuk pinjam di loket (bukan baca digital).
- Beranda siswa: kartu pintasan Katalog Pinjam.
- **Rules:** baca `perpus_buku` untuk jenis cetak/keduanya tanpa Auth; baca `perpus_kategori` publik untuk filter.
- Deploy rules wajib dari file lengkap (repo SDM01Penilaian / firestore.rules bersama).
