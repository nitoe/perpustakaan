# CHANGELOG

## 0.14.26 — Tab Kembalikan dilengkapi daftar pinjaman aktif
- Tab **Kembalikan** di Sirkulasi sekarang menampilkan daftar semua pinjaman aktif (bisa filter hanya terlambat).
- Pustakawan bisa **klik baris** di daftar untuk memilih buku yang akan dikembalikan, lalu atur kondisi / tandai hilang / perpanjang.
- Cara scan barcode tetap ada (cari kode eksemplar).
- Setelah pengembalian atau perpanjang berhasil, daftar otomatis dimuat ulang.
- Tidak mengubah logika `kembalikan` / rules; hanya UX tab Kembalikan.

## 0.14.25 — Halaman login gaya portal-orangtua
- Halaman masuk staf (`/masuk`) dan siswa (`/siswa/masuk`) diubah menjadi dua kolom dengan hero bergambar latar perpustakaan (ilustrasi pojok baca Islami).
- Narasi, pills, dan kutipan disesuaikan untuk konteks perpustakaan digital sekolah.
- Tab Siswa / Staf di kedua halaman agar mudah berpindah.
- Login siswa tetap: pilih kelas → nama (hanya yang sudah diaktifkan pustakawan di `perpus_izin_siswa`) → NISN sebagai kata sandi.
- Tombol tampilkan/sembunyikan kata sandi / NISN.
- Gambar latar: `public/hero-perpustakaan.png`.
- Tidak ada perubahan logika autentikasi atau rules.
