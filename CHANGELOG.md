# CHANGELOG

## 0.14.27 — Cari sampul katalog publik sebelum Generate AI
- Tombol sampul di form buku: **cari cover di Open Library / Google Books dulu**, baru **Generate AI** jika tidak ketemu.
- Label tombol: **Cari sampul / Generate AI**.
- `src/lib/bukuApi.ts`: fungsi `cariSampulBuku` (ISBN → OL covers → Google Books → cari judul).
- `firebase.json`: CSP report-only `connect-src` / `img-src` dilengkapi untuk covers Open Library, Cloud Functions, dan gambar Google.
- Tidak mengubah Cloud Function; kompresi tetap lewat `kecilkanFoto` di browser.

## 0.14.26 — Tab Kembalikan dilengkapi daftar pinjaman aktif
- Tab **Kembalikan** di Sirkulasi menampilkan daftar pinjaman aktif + pilih baris untuk pengembalian dengan kondisi.
