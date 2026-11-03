# CHANGELOG

## 0.14.5 — Perbaikan bug mode pratinjau “Lihat tampilan siswa”
- **Bug:** Tombol “Lihat tampilan siswa” mengarah ke halaman login siswa, bukan dashboard pratinjau. Setelah itu sulit kembali ke admin.
- **Penyebab:** `SiswaContext` hanya membaca `sessionStorage` sekali saat mount. Menyimpan sesi pratinjau lalu `navigate('/siswa')` tidak memperbarui state context, sehingga `SiswaLayout` menganggap belum login dan mengarahkan ke `/siswa/masuk`.
- **Perbaikan:** Tambah `masukPratinjau()` dan `keluarPratinjau()` di `SiswaContext` yang memperbarui state sekaligus `sessionStorage`. Tombol di Beranda dan banner “Kembali ke Admin” memakai fungsi context.
- ANTIREGRESI: mode pratinjau harus selalu lewat fungsi context agar state dan storage sinkron.

## 0.14.4 — Penyesuaian UI area siswa (lebih hangat & lega)
- Header siswa: logo lebih besar, nav lebih nyaman, latar `#f8f7ff`.
- Kartu aksi Beranda: hover lift halus, gradient lebih lembut, spacing lebih lega.
- Carousel “Baru Saja” dan Rak Baca: sampul `rounded-2xl` + ring halus.
- Halaman detail bacaan: sampul lebih besar, tombol “Baca Sekarang” lebih menonjol, spacing lebih nyaman.
- Tipografi judul lebih rapat (`tracking-tight`).
- Tidak ada perubahan logika data atau keamanan.

## 0.14.3 — Halaman Pinjaman & Jurnal lebih visual + “Baru Saja” di Beranda
- **Pinjaman saya**: kartu visual dengan status terlambat menonjol; mode pratinjau menampilkan pesan tanpa data.
- **Jurnal baca**: daftar entry lebih rapi, form tulis lebih nyaman, mode pratinjau tidak menampilkan form/data.
- **Beranda siswa**: bagian “Baru Saja” (carousel sampul bacaan digital publik terbaru, maksimal 12). Mengarah ke halaman detail bacaan.
- Kueri “Baru Saja” memakai `where('publik','==',true)` + `orderBy('createdAt','desc')` + `limit(12)` lalu disaring `bisaDibacaPublik()`.
- ANTIREGRESI: mode pratinjau tidak boleh menulis atau menampilkan data pribadi siswa; indeks mungkin diperlukan untuk kueri beranda.

## 0.14.2 — Halaman detail bacaan siswa yang lebih indah
- Halaman baru `/siswa/baca/:id` (`SiswaBacaDetail`): sampul besar, judul, pengarang, sinopsis, dan tombol “Baca Sekarang” yang menonjol.
- Kartu di Rak Baca sekarang mengarah ke halaman detail (bukan langsung ke tautan luar).
- Tautan bacaan tetap aman lewat `bisaDibacaPublik()` dan dibuka di tab baru.
- ANTIREGRESI: route `baca/:id` dideklarasikan setelah `baca` agar tidak bentrok; halaman detail hanya menampilkan buku yang lolos `bisaDibacaPublik()`.

## 0.14.1 — Rak Baca siswa bergaya carousel sampul
- Rak Baca (`/siswa/baca`) diubah dari grid kartu teks menjadi **carousel horizontal sampul buku** (inspirasi Let's Read).
- Bila tidak sedang mencari/filter: buku dikelompokkan per jenjang baca, masing-masing dalam carousel.
- Kartu sampul besar (aspect 2/3), judul di bawah, hover shadow.
- Filter tetap ada di atas (lebih ringkas).
- ANTIREGRESI: tetap hanya buku `publik == true` + `bisaDibacaPublik()`; tautan tetap lewat fungsi aman.

## 0.14.0 — Mode pratinjau tampilan siswa + layout siswa lebih visual
- **Mode pratinjau** (admin/pustakawan): tombol “Lihat tampilan siswa” di Beranda staf. Membuka area `/siswa` dengan sesi pratinjau (`preview: true`) tanpa perlu NISN.
- Banner kuning + tombol “Kembali ke Admin” saat mode pratinjau aktif.
- Layout siswa diperbarui: header putih ringan, navigasi pill, lebar `max-w-6xl`, latar `#fafbff`.
- Beranda siswa: kartu visual besar (Rak Baca, Pinjaman, Jurnal) menggantikan daftar tombol biasa.
- ANTIREGRESI: butir baru tentang mode pratinjau (tidak boleh menulis data sebagai siswa sungguhan).

## 0.13.3 — Lebar halaman admin (anti ruang kosong)
- Shell lebar di `Layout` mengikuti pola Penilaian: data/tabel hingga `max-w-[1600px]`, form `max-w-2xl`.
- Menghapus `mx-auto max-w-*` sempit di root halaman admin yang membuat konten mengumpul di tengah.
- ANTIREGRESI: lebar dikontrol di Layout, bukan di tiap halaman.

## 0.13.2 — Menu sidebar bisa dilipat
- Judul grup di sidebar dapat diklik untuk menampilkan/menyembunyikan item.
- Preferensi buka/tutup disimpan di localStorage; grup halaman aktif tetap terbuka.

## 0.13.1 — Menu sidebar dikelompokkan
- Sidebar staf dikelompokkan: Koleksi, Layanan, Data & inventaris, Literasi, Sistem.

## 0.13.0 — Jurnal baca
- **Jurnal baca siswa** (`/siswa/jurnal`): catat judul, pengarang (opsional), tanggal, kesan/ringkasan; lihat tanggapan guru.
- **Jurnal baca staf** (`/jurnal`): daftar jurnal (filter kelas), beri/ubah tanggapan.
- Koleksi `perpus_jurnal` + tipe, lib, rules di `firestore.rules.perpustakaan`.
- Menu staf: Jurnal baca. Navigasi siswa: Beranda · Rak baca · Pinjaman · Jurnal.
- Perbaikan: route `/siswa/pinjaman` dipasang di `App.tsx` bila belum ada.

## 0.12.0 — Pinjaman saya (siswa)
- **Pinjaman saya** (`/siswa/pinjaman`): siswa yang sudah login melihat buku cetak yang sedang dipinjam (judul, kode eksemplar, tanggal, status terlambat).
- Menu navigasi area siswa: Beranda · Rak baca · Pinjaman.
- Beranda siswa: pintasan ke rak baca dan pinjaman.
- **Rules:** baca `perpus_peminjaman` untuk dokumen `peminjam.tipe == 'siswa'` agar kueri tanpa Auth berfungsi. Detail di `docs/RULES_SISWA_LOGIN.md`.

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
- **Reservasi**, **Usulan**, **Stock opname**, **Kartu anggota**, **Katalog publik**.

## 0.8.0 — Katalog publik
## 0.7.1 — Dokumen uji coba
## 0.7.0 — Pengaturan & ISBN lookup
## 0.6.0 — Anggota
## 0.5.0 — Digital
## 0.4.x — Kunjungan & laporan
## 0.3.0 — Sirkulasi
## 0.2.0 — Katalog
## 0.1.0 — Kerangka
