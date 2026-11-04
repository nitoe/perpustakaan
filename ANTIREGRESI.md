# ANTIREGRESI (tambahan 0.14.27)

27. **Sampul: katalog dulu, AI cadangan.** Tombol sampul wajib mencoba `cariSampulBuku` (Open Library / Google Books) sebelum `generateBukuSampulAi`. Jangan langsung AI jika ISBN/judul bisa dicari. Gambar dari URL harus dicek ukuran minimum agar placeholder OL tidak tersimpan.
28. **CSP report-only.** `connect-src` perlu `https://covers.openlibrary.org` dan `https://*.cloudfunctions.net` agar fetch sampul / callable tidak dilaporkan berlebihan; tetap report-only sampai diuji ketat.
