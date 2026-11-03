# CHANGELOG

## 0.14.18 — Buku Storage otomatis ditandai publik
- Buku yang diunggah PDF ke Storage tidak muncul di Rak Baca / Baru Saja bila centang “publik” tidak dicentang.
- Setelah unggah PDF berhasil, form otomatis mencentang publik dan menampilkan pengingat.
- Checkbox publik dibuat lebih menonjol (kotak berlatar).
- Syarat tampil tetap: `publik == true`, jenis bukan `cetak`, dan tautan http/https.

## 0.14.17 — Slider zoom yang lebih halus
- Tombol − / + diganti **slider** (50%–200%, langkah 5%).
- Skala dihitung relatif terhadap ukuran pas layar (100% = pas, bukan langsung 125% sangat besar).
- Di atas 125% sekarang ikut membesar secara bertahap.
- Area scroll tetap bisa digeser untuk melihat halaman utuh.

## 0.14.16 — Zoom tidak memotong halaman
- Zoom 125%+ memotong bagian atas karena `transform: scale()` tidak memperbesar area scroll.
- Zoom sekarang mengubah lebar layout gambar (`width` sesuai persentase). Area baca bisa digeser ke atas dan ke samping untuk melihat halaman utuh.
- Zoom 100% tetap pas di layar.

## 0.14.15 — Zoom pembaca benar-benar membesarkan
- Zoom sebelumnya tidak terlihat karena gambar dibatasi `max-h-full max-w-full`.
- Zoom sekarang memakai CSS `transform: scale()` dan mengizinkan gambar melebihi layar (bisa digeser).
- Render halaman tetap di skala dasar; zoom instan tanpa menunggu render ulang.
- Fullscreen dan progress tetap seperti 0.14.14.

## 0.14.14 — Zoom, layar penuh, dan perbaikan progress baca
- **Bug progress:** saat modal dibuka, kode menyimpan halaman 1 sebelum progress tersimpan selesai dibaca, sehingga “lanjutkan” selalu kembali ke halaman awal.
- **Perbaikan:** flag `siapSimpan` — progress baru ditulis setelah halaman awal dari server/lokal diterapkan.
- **Zoom:** tombol − / + (75%–250%) di pembaca modal. Halaman di-render ulang sesuai skala.
- **Layar penuh:** tombol “Layar penuh” memakai Fullscreen API browser.
- ANTIREGRESI: jangan menyimpan progress sebelum halaman awal dimuat.

## 0.14.13 — Sampul dari berkas lokal + CORS Storage
- **Sampul otomatis** sekarang dibuat dari berkas PDF yang baru dipilih (ArrayBuffer), bukan dengan mengambil ulang URL Storage. Menghindari error CORS saat membuat cover.
- Tombol “Buat sampul dari halaman 1” aktif setelah berkas dipilih (sebelum atau sesudah unggah selesai).
- Ditambahkan `storage-cors.json` agar pembaca modal bisa memuat PDF dari Storage.
- ANTIREGRESI: pembaca modal tetap membutuhkan CORS di bucket Storage.

## 0.14.12 — Area unggah PDF lebih jelas
- Kotak “Unggah PDF ke Storage” di form buku diganti dari input file bawaan menjadi area unggah yang lebih menonjol (border dashed tebal, latar lembut, label klik besar).
- Input file disembunyikan (`sr-only`); pengguna mengklik area untuk memilih berkas.
- Status “Mengunggah…” dan indikasi tautan sudah terisi ditampilkan.
- Tidak ada perubahan logika unggah.

## 0.14.11 — Sinkronisasi progress baca ke Firestore
- Koleksi baru `perpus_progress`. ID dokumen: `{siswaId}_{bukuId}`.
- Progress halaman terakhir dibaca dari Firestore (fallback localStorage).
- Saat berpindah halaman, progress disimpan ke localStorage dan Firestore (`setDoc` merge).
- Mode pratinjau (`nisn` dummy) tidak menulis ke Firestore.
- **Rules lengkap** diperbarui di `firestore.rules.perpustakaan` (tambah match `perpus_progress`).
- Siswa tanpa Firebase Auth tetap bisa menulis (validasi field ketat, sama pola jurnal).
- ANTIREGRESI: jangan tulis progress saat pratinjau; rules membatasi field dan ukuran.

## 0.14.10 — Perbaikan tipe RenderParameters pdf.js
- Error `tsc` saat deploy: properti `canvas` wajib di `page.render()` pada pdfjs-dist terbaru.
- `renderHalamanKeDataUrl` sekarang mengirim `{ canvas, canvasContext, viewport }`.
- Tidak ada perubahan perilaku.

## 0.14.9 — Pembaca PDF modal + unggah ke Storage + progress
- **Unggah PDF** ke Firebase Storage dari form Tambah/Ubah Buku (maks. 40 MB). Tautan otomatis terisi.
- **Sampul otomatis** dari halaman 1 PDF (tombol “Buat sampul dari halaman 1”).
- **Pembaca modal** (fullscreen) untuk format PDF: navigasi Sebelumnya/Berikutnya, indikator halaman, tanpa tombol unduh/cetak.
- Progress halaman terakhir disimpan di `localStorage` per NISN + buku. Tombol menjadi “Lanjutkan dari halaman N”.
- Format non-PDF tetap dibuka di tab baru.
- **Catatan instalasi:** jalankan `npm install pdfjs-dist` sebelum build.
- **Storage rules:** pastikan staf boleh tulis ke `perpus_digital/{uid}/**` dan baca publik diizinkan untuk berkas yang dipublikkan.
- ANTIREGRESI: reader hanya untuk PDF yang lolos `bisaDibacaPublik()`; progress tidak ditulis ke Firestore di tahap ini.

## 0.14.8 — Lebar penuh untuk form buku dan Pengaturan
- Halaman `/katalog/baru`, `/katalog/:id/ubah`, dan `/pengaturan` sekarang memakai `max-w-[1600px]` (lebar penuh area kerja), sama seperti halaman data lain.
- Menghapus pembatasan `max-w-2xl` / `max-w-4xl` yang membuat form kecil di tengah saat zoom atau layar lebar.
- Tidak ada lagi daftar `HALAMAN_SEMPIT`.
- ANTIREGRESI: lebar dikontrol hanya di `Layout.tsx`.

## 0.14.7 — Lebar halaman Pengaturan + perbaikan tombol “Kembali ke Admin”
- Halaman **Pengaturan** tidak lagi `max-w-2xl`. Sekarang mengikuti lebar penuh area kerja (`max-w-[1600px]`), sama seperti halaman data lain.
- **Bug “Kembali ke Admin”:** setelah sesi pratinjau dihapus, layout langsung re-render dan mengarahkan ke `/siswa/masuk` sebelum navigasi ke dashboard admin selesai.
- **Perbaikan:** tambah flag `sedangKeluar` agar redirect ke login tidak terjadi saat keluar pratinjau. Storage dan state dibersihkan, lalu `navigate('/', { replace: true })`.
- ANTIREGRESI: tombol kembali pratinjau tidak boleh memicu redirect ke login siswa.

## 0.14.6 — Lebar halaman tambah/ubah buku
- Halaman `/katalog/baru` dan `/katalog/:id/ubah` tidak lagi dipaksa `max-w-2xl`.
- Sekarang memakai `max-w-4xl` agar tidak terlihat kecil di tengah saat zoom atau layar lebar, sekaligus tetap nyaman dibaca.
- Pengaturan tetap `max-w-2xl`.
- ANTIREGRESI: lebar form buku dikontrol di `Layout` (bukan `max-w` di halaman).

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
