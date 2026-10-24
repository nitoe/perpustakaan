# CHANGELOG

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
- **Reservasi**: antrian buku (siswa/anggota), status antrian → siap → diambil / batal.
- **Usulan**: guru/staf ajukan judul; pustakawan setujui/tolak.
- **Stock opname**: sesi inventarisasi, pindai kode eksemplar, daftar hasil.
- **Kartu anggota**: cetak kartu per kelas (nama, kelas, NISN).
- **Katalog publik** (`/publik`): tanpa login, hanya `publik == true`.
- Rules: `perpus_reservasi`, `perpus_usulan`, `perpus_opname`, `perpus_opname_item`; `perpus_foto` baca publik.

## 0.8.0 — Katalog publik
## 0.7.1 — Dokumen uji coba
## 0.7.0 — Pengaturan & ISBN lookup
## 0.6.0 — Anggota
## 0.5.0 — Digital
## 0.4.x — Kunjungan & laporan
## 0.3.0 — Sirkulasi
## 0.2.0 — Katalog
## 0.1.0 — Kerangka
