# CHANGELOG

## 0.1.0 — Kerangka aplikasi
- Kerangka Vite + React 19 + TypeScript + Tailwind v4, tampilan seragam dengan Penilaian dan Sarpras.
- Login Firebase (akun sama), peran lewat `users/{uid}.peranPerpus`, menu per peran.
- Beranda dengan ringkasan (judul, eksemplar, dipinjam, terlambat); jumlah dihitung di server.
- `firestore.rules.perpustakaan`: aturan koleksi `perpus_*` dan perubahan kecil pada blok `siswa`.
- Dokumen: RANCANGAN, DATA_MODEL, DEPLOY, ANTIREGRESI.
- Modul katalog, koleksi digital, sirkulasi, kunjungan, anggota, dan laporan menyusul.
