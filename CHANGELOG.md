# CHANGELOG

## 0.14.36 — Ilustrasi kartu beranda siswa
- Kartu Rak Baca, Katalog Pinjam, Pinjaman Saya, dan Jurnal Baca memakai ilustrasi (bukan gradien polos).
- Aset di `public/siswa/*.png`.

## 0.14.35 — Swipe halaman di smartphone
- Geser kiri/kanan di area bacaan PDF untuk pindah halaman (HP/tablet).
- Ambang 56px horizontal dan lebih dominan dari vertikal agar tidak bentrok dengan scroll zoom.

## 0.14.34 — Perbaikan buka PDF di smartphone
- Error `getOrInsertComputed is not a function` di HP: pdfjs-dist v6 memakai API Map yang belum ada di banyak browser mobile.
- Polyfill: `Map.getOrInsertComputed`, `Map.getOrInsert`, `Promise.withResolvers`, `Promise.try`.
- Pembaca PDF memakai **build legacy** (`pdfjs-dist/legacy/build/...`) yang lebih kompatibel.
