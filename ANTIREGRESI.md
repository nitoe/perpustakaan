# ANTIREGRESI

Aturan agar perbaikan tidak rusak lagi. Tambahkan di bawah; jangan menghapus entri lama.

1. **Rules tidak di-deploy dari repo ini.** Satu project Firebase hanya punya satu `firestore.rules` (milik repo SDM01Penilaian, yang juga memuat aturan Sarpras). Men-deploy rules dari sini akan menimpa aturan aplikasi lain. `firebase.json` repo ini sengaja hanya berisi `hosting`.
2. **Peran dicek di rules, bukan di tampilan.** `peranDari()` (src/lib/peran.ts) hanya mengatur menu. Bila logika peran diubah, ubah juga `peranPerpus()` di `firestore.rules.perpustakaan`.
3. **Pemilik akun tidak boleh mengubah `peranPerpus`.** Aturan `users` di Penilaian membatasi pemilik ke `nama`, `gelar`, `updatedAt`. Jangan melonggarkan.
4. **Tampilan mengikuti DESIGN.md Penilaian.** Satu warna merek `#313083`, tanpa gradient, font Inter dari `public/fonts`, tanpa CDN (CSP hanya `'self'`).
5. **Menu modul baru:** tambahkan di `src/lib/menu.ts` dan ubah `aktif` menjadi `true` hanya saat halamannya selesai.
6. **Pinjam dan kembali harus satu `writeBatch`** (peminjaman + status eksemplar + penghitung buku). Rules memeriksa status eksemplar lewat `getAfter()`; jangan memecahnya menjadi beberapa tulis terpisah.
7. **ID eksemplar = kode di label.** Jangan mengganti ID dokumen `perpus_eksemplar`; label yang sudah dicetak akan tidak terbaca.
8. **Jangan membaca seluruh `perpus_peminjaman`.** Koleksinya terus bertambah. Selalu pakai kueri (status, peminjam, rentang tanggal) atau `getCountFromServer`.
9. **Berkas berhak cipta tidak boleh bertanda `publik`.**
10. **Kode eksemplar hanya dari `pesanNomor()`** (src/lib/penomoran.ts, transaksi atas `perpus_config/penomoran`). Jangan membuat kode dengan menghitung dokumen atau memakai tanggal: dua petugas bersamaan bisa menimpa eksemplar yang sama. Penghitung tidak boleh turun (dijaga rules).
11. **Tautan yang dibuka dari data harus lewat `tautanAman()`** (src/lib/katalog.ts): hanya http/https. Jangan memasang `href` dari data pengguna secara langsung.
12. **Penghitung buku (`eksemplarTotal`, `eksemplarTersedia`) hanya diubah dalam batch yang sama dengan eksemplarnya** (`increment`), lewat fungsi di src/lib/katalog.ts. Arti: total = eksemplar yang belum dikeluarkan; tersedia = berstatus `tersedia`.
13. **Barcode label dibuat src/lib/code128.ts** (Code 128 set B) dan sudah diuji terbaca. Jangan mengubah tabel polanya; bila diubah, uji ulang dengan pembaca barcode.
14. **Impor CSV: judul yang sama dilewati sebagai duplikat.** Bila impor terhenti di tengah, mengulang dengan berkas yang sama aman (yang sudah masuk dilewati).
15. **Rak baca siswa (`/publik/baca`) hanya buku `publik == true` yang lolos `bisaDibacaPublik()`.** Kueri wajib `where('publik','==',true)`. Jangan memasang `href` mentah dari data dan jangan iframe situs luar (CSP hanya `'self'`). Berkas berhak cipta tetap tidak boleh `publik` (butir 9). Route `baca` harus dideklarasikan sebelum `:id` agar tidak tertelan sebagai id buku.
