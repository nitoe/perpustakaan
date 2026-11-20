# CHANGELOG

## 0.14.38 — Admin dapat mengangkat guru menjadi pustakawan
- Tab baru **Peran staf** di Pengaturan (hanya admin Penilaian).
- Admin dapat mengubah field `peranPerpus` pada akun guru/karyawan menjadi **Pustakawan** (akses kelola hampir sama dengan admin: katalog, sirkulasi, izin siswa, impor, label, dll.), **Pimpinan**, atau mengembalikan ke default (Guru).
- Daftar staf diambil dari koleksi `users` (filter role guru / yang sudah punya peranPerpus).
- Tidak ada perubahan Firestore rules: admin sudah boleh menulis `peranPerpus`; pemilik akun tetap tidak boleh mengubahnya sendiri.
- Catatan di tab Akun diperbarui: peran diubah lewat tab Peran staf, bukan lewat Console.

## 0.14.37 — Sambutan login tampil di smartphone
- Panel hero (kutipan, slogan, ilustrasi) di halaman `/masuk` dan `/siswa/masuk` tetap ditampilkan di atas form pada layar ≤900px.
- Sebelumnya `.auth-hero { display: none }` di mobile sehingga hanya form login yang terlihat.

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

## 0.14.33 — Riwayat pengembalian + info peminjam & rak
- Tab baru **Riwayat kembali** di Sirkulasi: daftar buku yang sudah dikembalikan (judul, kode, peminjam, tanggal pinjam & kembali, kondisi).
- Saat mencari buku untuk dipinjam: eksemplar yang sedang dipinjam tetap muncul, dengan info **nama + kelas peminjam** dan **rak**.
- Yang tersedia tetap bisa dipilih; yang dipinjam hanya untuk informasi.
- Fungsi baru `daftarRiwayatKembali` di `src/lib/sirkulasi.ts`.
- Tidak ada perubahan rules. Jika query riwayat gagal karena indeks, buat indeks `status == dikembalikan` di Firebase Console.

## 0.14.32 — Sirkulasi: daftar pinjaman tampil langsung
- Tab default “Semua pinjaman”.
