# CHANGELOG

## 0.6.0 — Anggota
- Modul Anggota: daftar, tambah, ubah, nonaktifkan/aktifkan; hapus khusus admin.
- Jenis: guru, karyawan, kelas (pojok baca). ID dokumen dipakai di Sirkulasi (tab Anggota).
- Siswa tidak didaftarkan di sini — tetap lewat NISN dari Penilaian.

## 0.5.0 — Koleksi digital
- Halaman Digital: daftar buku `jenis` digital/keduanya, filter format (PDF/video/audio/web) dan kategori, tombol Buka bacaan (http/https saja).
- Menu Digital diaktifkan untuk semua peran staf.

## 0.4.1 — Kunjungan: NISN, nama, kelas saling menyesuaikan
- Formulir satu pengunjung: NISN mengisi nama+kelas; muat kelas lalu ketik nama → saran terbatas kelas itu; pilih saran → ketiga field terisi.
- Mode per kelas: tampil NISN, saring nama di dalam roster.

## 0.4.0 — Kunjungan, laporan, beranda
- Kunjungan: catat per siswa (pindai/ketik NISN) atau per kelas (centang roster); daftar dan rekap kelas hari ini.
- Laporan: pinjaman terlambat (unduh CSV), buku terpopuler, kunjungan per rentang tanggal + per kelas (unduh CSV).
- Beranda: jumlah kunjungan hari ini; pintasan Sirkulasi / Kunjungan / Laporan untuk staf.
- Menu Kunjungan dan Laporan diaktifkan (laporan juga untuk pimpinan).

## 0.3.0 — Sirkulasi
- Pinjam: pindai/ketik NISN (kartu anggota) atau ID anggota, lalu kode eksemplar; cek batas pinjaman dan status tersedia.
- Kembali: pindai kode eksemplar, catat kondisi, opsi tandai hilang.
- Perpanjang sesuai `perpus_config/aturan` (bawaan: 7 hari, siswa 2, anggota 5, perpanjang 1×).
- Daftar pinjaman aktif dan filter terlambat; aksi perpanjang/kembalikan dari daftar.
- Satu `writeBatch` untuk pinjam dan kembali (peminjaman + status eksemplar + penghitung buku), selaras rules.
- Lookup siswa mengutamakan field `nisn`; fallback ID dokumen (NIPD). `peminjam.id` menyimpan NISN bila ada.

## 0.2.0 — Katalog, eksemplar, impor, label
- Katalog: cari/saring (judul, pengarang, kategori, jenis, ketersediaan), tampil bertahap.
- Buku: tambah/ubah, sampul (dikecilkan di peramban), tautan bacaan digital (hanya http/https), halaman detail.
- Eksemplar: kode otomatis berurutan `PRP-000123` (penghitung `perpus_config/penomoran`), tambah, ubah rak/kondisi, tandai hilang/ditemukan, keluarkan dari koleksi; penghitung buku ikut diperbarui dalam batch yang sama.
- Kategori: tambah/ubah/hapus (hapus khusus admin, hanya bila tidak dipakai).
- Impor CSV (templat, pemisah otomatis `;` `,` tab, deteksi duplikat ISBN/judul+pengarang, validasi per baris, kategori baru dibuat otomatis, tulis bertahap).
- Cetak label barcode Code 128 (kode eksemplar) per buku atau per rentang nomor, 2-4 kolom, siap cetak A4.
- Cache lokal Firestore persisten (hemat kuota baca katalog).
- Rules: pustakawan boleh menaikkan penghitung `perpus_config/penomoran` (satu-satunya perubahan; lihat `firestore.rules.perpustakaan`).

## 0.1.0 — Kerangka aplikasi
- Kerangka Vite + React 19 + TypeScript + Tailwind v4, tampilan seragam dengan Penilaian dan Sarpras.
- Login Firebase (akun sama), peran lewat `users/{uid}.peranPerpus`, menu per peran.
- Beranda dengan ringkasan (judul, eksemplar, dipinjam, terlambat); jumlah dihitung di server.
- `firestore.rules.perpustakaan`: aturan koleksi `perpus_*` dan perubahan kecil pada blok `siswa`.
- Dokumen: RANCANGAN, DATA_MODEL, DEPLOY, ANTIREGRESI.
- Modul katalog, koleksi digital, sirkulasi, kunjungan, anggota, dan laporan menyusul.
