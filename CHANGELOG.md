# CHANGELOG

## 0.13.3 — Lebar halaman admin (anti ruang kosong)
- Shell lebar di `Layout` mengikuti pola Penilaian: data/tabel hingga `max-w-[1600px]`, form `max-w-2xl`.
- Menghapus `mx-auto max-w-*` sempit di root halaman admin yang membuat konten mengumpul di tengah.
- ANTIREGRESI: lebar dikontrol di Layout, bukan di tiap halaman.


## 0.13.2 — Menu sidebar bisa dilipat
- Judul grup di sidebar dapat diklik untuk menampilkan/menyembunyikan item.
- Preferensi buka/tutup disimpan di localStorage; grup halaman aktif tetap terbuka.

## 0.13.1 — Menu sidebar dikelompokkan
- Sidebar staf dikelompokkan: Koleksi, Layanan, Data & inventaris, Literasi, Sistem.


## 0.13.0 — Jurnal baca
- **Jurnal baca siswa** (`/siswa/jurnal`): catat judul, pengarang (opsional), tanggal, kesan/ringkasan; lihat tanggapan guru.
- **Jurnal baca staf** (`/jurnal`): daftar jurnal (filter kelas), beri/ubah tanggapan.
- Koleksi `perpus_jurnal` + tipe, lib, rules di `firestore.rules.perpustakaan`.
- Menu staf: Jurnal baca. Navigasi siswa: Beranda · Rak baca · Pinjaman · Jurnal.
- Perbaikan: route `/siswa/pinjaman` dipasang di `App.tsx` bila belum ada.

## 0.12.0 — Pinjaman saya (siswa)
- **Pinjaman saya** (`/siswa/pinjaman`): siswa yang sudah login melihat buku cetak yang sedang dipinjam (judul, kode eksemplar, tanggal, status terlambat).
- Menu navigasi area siswa: Beranda · Rak baca · Pinjaman.
- Beranda siswa: pintasan ke rak baca dan pinjaman.
- **Rules:** baca `perpus_peminjaman` untuk dokumen `peminjam.tipe == 'siswa'` agar kueri tanpa Auth berfungsi. Detail di `docs/RULES_SISWA_LOGIN.md`.

## 0.11.0 — Login siswa (NISN)
- **Masuk siswa** (`/siswa/masuk`): pilih kelas → pilih nama (dropdown sesuai kelas) → kata sandi = **NISN**.
- Sesi siswa disimpan di `sessionStorage` (bukan Firebase Auth). Akun Auth siswa belum dibuat.
- Area siswa: `/siswa` (beranda) dan `/siswa/baca` (rak baca digital publik).
- Tautan masuk siswa ditambahkan di halaman masuk staf dan layout publik.
- **Aturan Firestore (wajib):** agar dropdown nama terisi tanpa login staf, blok `siswa` di rules Penilaian harus mengizinkan `list` untuk kueri per kelas. Lihat `docs/RULES_SISWA_LOGIN.md` dan ANTIREGRESI butir 16.

## 0.10.0 — Rak baca siswa
- **Rak baca** (`/publik/baca`): siswa dan orang tua membuka koleksi digital yang ditandai publik, tanpa akun. Tautan lewat `bisaDibacaPublik()` / `tautanAman()`; tidak di-iframe (CSP `'self'`).
- Navigasi katalog publik: Katalog dan Rak baca. Tombol Baca juga tetap di detail publik.

## 0.9.0 — Fase 2 lengkap
- **Reservasi**, **Usulan**, **Stock opname**, **Kartu anggota**, **Katalog publik**.

## 0.8.0 — Katalog publik
## 0.7.1 — Dokumen uji coba
## 0.7.0 — Pengaturan & ISBN lookup
## 0.6.0 — Anggota
## 0.5.0 — Digital
## 0.4.x — Kunjungan & laporan
## 0.3.0 — Sirkulasi
## 0.2.0 — Katalog
## 0.1.0 — Kerangka
