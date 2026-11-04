# ANTIREGRESI (tambahan 0.14.32)

31. **Katalog pinjam siswa.** Kueri siswa memakai `where('jenis','in',['cetak','keduanya'])` agar selaras rules. Jangan `getDocs` seluruh `perpus_buku` tanpa filter — dokumen digital non-publik tidak boleh terbaca oleh klien tanpa Auth. Rules: staf ATAU publik ATAU jenis cetak/keduanya.
32. **Kategori publik baca.** `perpus_kategori` boleh dibaca siapa saja (hanya nama/kode filter). Jangan menaruh data sensitif di koleksi ini.
