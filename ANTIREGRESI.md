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
