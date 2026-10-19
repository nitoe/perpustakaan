# Rancangan Aplikasi Perpustakaan Digital — SD Muhammadiyah 01 Kukusan

Draf 1, Oktober 2026. Disusun setelah memeriksa repo `nitoe/sarpras` (README, RANCANGAN, DEPLOY, ANTIREGRESI, `package.json`, `firestore.rules.sarpras`) dan `nitoe/SDM01Penilaian` (`firestore.rules`). Repo `nitoe/perpustakaan` masih kosong; dokumen ini adalah isi pertamanya.

Status: rancangan belum dikunci. Daftar pertanyaan ada di bagian 12. Setiap pertanyaan sudah diberi jawaban bawaan (rekomendasi), jadi cukup dibalas "ikuti rekomendasi" bila setuju.

## 1. Keputusan utama (ringkas)

| Hal | Keputusan | Alasan singkat |
| --- | --- | --- |
| Frontend | **Tetap Vite + React 19 + TypeScript + Tailwind CSS v4** (versi sama dengan Sarpras) | Komponen, tampilan, dan cara kerja bisa disalin dari Sarpras/Penilaian; tidak perlu server sendiri |
| Data dan login | **Firebase project yang sama** (`sdm01kukusan-2e735`): Authentication + Firestore | Akun guru yang sama, tanpa akun baru; sudah dipakai Penilaian dan Sarpras |
| Koleksi Firestore | Semua berawalan **`perpus_`** | Pola sama dengan `sarpras_`; tidak bentrok dengan data lain |
| Penayangan | **Firebase Hosting (situs ketiga)**; Hostinger hanya untuk DNS | Sama persis dengan `penilaian.` dan `sarpras.`; lihat bagian 6 untuk alternatif Hostinger penuh |
| Alamat | `perpustakaan.sdmuhammadiyah01kks.sch.id` | Usulan; bisa diganti (mis. `perpus.`) |
| Repo | `nitoe/perpustakaan`, alur kerja sama dengan Sarpras | `CHANGELOG.md`, `ANTIREGRESI.md`, `docs/` |
| Aturan Firestore | Ditulis di repo ini sebagai `firestore.rules.perpustakaan`, **ditempel** ke `firestore.rules` milik Penilaian | Satu project hanya punya satu berkas rules; jangan saling menimpa |

Satu hal yang perlu dipahami sejak awal: karena tiga aplikasi memakai satu project Firebase, kuota gratis (Spark) **dipakai bersama**. Perpustakaan tergolong ringan bila dirancang hemat (bagian 5).

## 2. Tujuan dan batasan

Mencatat dan melayani koleksi perpustakaan sekolah: buku cetak (katalog, eksemplar, peminjaman, pengembalian) dan koleksi digital (e-book, video, tautan bacaan), lalu melaporkannya (statistik, buku terlambat, kunjungan).

Bukan: pembukuan keuangan, dan bukan toko buku. Denda tidak ada kecuali diputuskan lain (bagian 12).

## 3. Pengguna dan peran

Mengikuti pola Sarpras: peran dicek di **Firestore security rules**, bukan hanya di tampilan.

| Peran | Siapa | Boleh |
| --- | --- | --- |
| admin | Admin Penilaian (otomatis) | Semua, termasuk kelola pengguna dan pengaturan |
| pustakawan | Petugas/guru pengelola perpustakaan | Kelola koleksi, catat pinjam/kembali, kunjungan, laporan |
| pimpinan | Kepala sekolah, Wakasek | Lihat dashboard dan laporan |
| guru | Semua jenis guru | Cari katalog, baca koleksi digital, lihat pinjaman sendiri; usulan buku (fase 2) |

Peran diberikan lewat field **`peranPerpus`** pada `users/{uid}` (hanya admin yang bisa mengisi; aturan `users` di Penilaian sudah melarang pemilik akun mengubahnya). Bila kosong: admin Penilaian = admin, semua jenis guru = guru.

**Siswa tidak punya akun.** Siswa dilayani lewat kartu anggota (QR/barcode berisi NIS) yang dipindai pustakawan. Alasannya: siswa SD tidak punya akun di aplikasi mana pun saat ini, dan membuat akun untuk ratusan anak menambah beban data pribadi serta pengelolaan sandi. Siswa yang meminjam dikenali dari koleksi `siswa` (ID dokumen = NIS) yang sudah ada di Penilaian.

**Catatan penting:** aturan `siswa` di Penilaian hanya mengizinkan baca roster untuk `isGuru()`. Jadi akun pustakawan harus punya peran guru-jenis apa pun di Penilaian (guru, guru_tahsin_tahfizh, guru_akademik) atau admin. Bila pustakawan adalah TU tanpa peran guru, ada dua jalan: beri peran `guru` di Penilaian, atau ubah aturan `siswa` (diputuskan nanti, di tahap aturan).

Orang tua: tidak ada akses di fase 1. Fase 3 bisa menampilkan pinjaman anak sendiri memakai `anakSaya()` yang sudah ada.

## 4. Fitur dan fase

**Fase 1 — inti**
1. **Katalog buku**: judul, pengarang, penerbit, tahun, ISBN, kategori, jenjang baca, sinopsis, sampul. Cari dan saring.
2. **Eksemplar**: tiap fisik buku punya kode unik (`PRP-000123`), lokasi rak, kondisi. Cetak label barcode/QR.
3. **Impor Excel/CSV** untuk data awal (template disediakan). Ini yang biasanya paling lama dikerjakan, jadi dimulai paralel sejak tahap 2.
4. **Sirkulasi**: pinjam, kembali, perpanjang, daftar terlambat. Pinjam = pindai kartu siswa lalu pindai buku.
5. **Koleksi digital**: e-book (PDF), video, audio, atau tautan bacaan, dicatat di katalog yang sama dan dibuka lewat tautan (bagian 7).
6. **Kunjungan**: catat siapa berkunjung (dipindai di pintu atau dipilih per kelas).
7. **Dashboard**: pinjaman aktif, terlambat, buku terpopuler, kunjungan per kelas.

**Fase 2**
- Katalog publik tanpa login (siswa dan orang tua mencari buku dari HP; hanya item bertanda publik).
- Reservasi buku, usulan pengadaan buku dari guru.
- Stock opname (inventarisasi) dengan pindai.
- Kartu anggota cetak (QR) per kelas; laporan cetak/Excel.

**Fase 3 — ide tambahan**
- **Jurnal baca / literasi**: siswa mencatat buku yang dibaca, guru memberi tanggapan. Sejalan dengan Gerakan Literasi Sekolah dan Kurikulum Merdeka; bisa menjadi bahan narasi rapor/kokurikuler di Penilaian (hanya baca, tanpa mengubah Penilaian).
- **Pojok baca kelas**: kelas sebagai peminjam (satu paket buku untuk satu kelas).
- Tantangan membaca per kelas, "buku baru" ditampilkan di portal sekolah, pembaca teraktif.

## 5. Data (Firestore)

| Koleksi | Isi utama |
| --- | --- |
| `perpus_buku` | judul, pengarang, penerbit, tahun, isbn, kategoriId, klasifikasi, bahasa, jenjangBaca, sinopsis, coverId, jenis (`cetak` / `digital` / `keduanya`), tautanDigital, formatDigital, publik (true/false), eksemplarTotal, eksemplarTersedia |
| `perpus_eksemplar` | **ID dokumen = kode eksemplar** (`PRP-000123`), bukuId, judul (salinan), rak, kondisi, status (`tersedia` / `dipinjam` / `hilang` / `dihapus`), tahunMasuk, sumber |
| `perpus_kategori` | kode, nama |
| `perpus_peminjaman` | eksemplarId, bukuId, judul (salinan), peminjam {tipe `siswa`/`guru`, id, nama, kelas}, tglPinjam, jatuhTempo, tglKembali, status (`dipinjam` / `dikembalikan`), jumlahPerpanjang, kondisiKembali, petugasUid, catatan |
| `perpus_kunjungan` | tanggal, waktu, pengunjung {tipe, id, nama, kelas}, keperluan |
| `perpus_foto` | sampul terkompres (WebP kecil, base64) — pola sama dengan `sarpras_foto` |
| `perpus_config` | dokumen `aturan`: lama pinjam, maksimal buku per siswa/guru, jumlah perpanjangan |
| `perpus_usulan`, `perpus_reservasi`, `perpus_jurnal` | fase 2 dan 3 |
| `perpus_log` | waktu, pengguna, tindakan |

Prinsip rancangan data, demi kuota gratis dan kecepatan:
- **ID eksemplar = kode di label.** Memindai label langsung membaca satu dokumen, tanpa pencarian.
- **Salinan (denormalisasi)**: judul dan nama peminjam disimpan di dokumen peminjaman, supaya daftar pinjaman tidak perlu membaca dokumen lain.
- **Pinjam dan kembali = satu `writeBatch`** (buat/ubah peminjaman + ubah status eksemplar + ubah `eksemplarTersedia`), supaya tidak ada keadaan setengah jadi. Aturan Firestore memeriksa bahwa ketiganya berubah bersama.
- **Katalog di-cache di peramban** (persistent cache Firestore) agar pencarian tidak membaca ulang ratusan dokumen tiap hari.
- Per transaksi pinjam, bacaannya hanya sekitar 3-5 dokumen (siswa, eksemplar, pinjaman aktif siswa).
- Kuota harian Spark dibagi tiga aplikasi; angka persisnya dicek di Firebase Console sebelum peluncuran.

Foto sampul: Cloud Storage for Firebase kini mensyaratkan paket Blaze (perlu kartu), sehingga sampul dikecilkan di peramban lalu disimpan di `perpus_foto`, sama seperti Sarpras. Dicek ulang di konsol sebelum diputuskan.

## 6. Penayangan

**Rekomendasi (sama dengan Penilaian dan Sarpras):** Firebase Hosting.
1. Di project `sdm01kukusan-2e735` buat situs Hosting ketiga, mis. `sdm01-perpustakaan`.
2. Tambahkan domain khusus `perpustakaan.sdmuhammadiyah01kks.sch.id`.
3. Catatan DNS (TXT/A atau CNAME) dimasukkan di hPanel Hostinger → Domains → DNS Zone.
4. Tambahkan domain itu ke Authentication → Authorized domains.
5. Subdomain lain dan portal tidak terpengaruh. Hostinger tetap dipakai: untuk domain dan DNS, dan portal utama.

**Alternatif:** unggah hasil `npm run build` (folder `dist/`) ke Hostinger (Git deploy atau File Manager). Tetap bisa memakai Firestore. Kekurangannya: alur deploy berbeda dari dua aplikasi lain, dan setiap perubahan butuh langkah tambahan. Tidak direkomendasikan kecuali ada alasan khusus untuk menaruh semuanya di Hostinger.

## 7. Berkas koleksi digital

Aplikasi hanya menyimpan **tautan** ke berkas. Pilihan tempat berkas:

| Pilihan | Catatan |
| --- | --- |
| Buku Sekolah Elektronik Kemendikdasmen, Google Drive/YouTube, atau situs lain | Paling mudah, tanpa biaya; cocok untuk fase 1. Periksa hak cipta sebelum membagikan |
| Hostinger (File Manager/SFTP, mis. folder di subdomain `berkas.`) | Ruang disk sudah ada di paket hosting; tautan stabil; perlu diunggah manual |
| Firebase Storage | Butuh paket Blaze; ditunda |

**Rekomendasi:** mulai dengan tautan (baris 1), tambah Hostinger bila ada berkas milik sendiri (buku karya guru/siswa, modul ajar). Berkas berhak cipta tidak boleh bertanda publik.

## 8. Aturan Firestore

Sama dengan cara Sarpras: `firestore.rules.perpustakaan` di repo ini berisi Bagian A (fungsi) dan Bagian B (blok `match`) untuk **ditempel** ke `firestore.rules` di repo SDM01Penilaian, lalu diuji dan di-deploy dari sana. Repo ini **tidak** men-deploy rules; `firebase.json` hanya berisi `hosting`.

Garis besar:
- `peranPerpus()` meniru `peranSarpras()`; `perpusStaf()` = admin, pustakawan, pimpinan, guru.
- Baca katalog: staf. Tulis katalog/eksemplar: admin dan pustakawan.
- Peminjaman: dibuat/diubah hanya oleh admin dan pustakawan; tidak ada hapus; data siswa hanya terbaca staf.
- Katalog publik (fase 2): `allow read: if resource.data.publik == true || perpusStaf()`; kueri wajib memakai `where('publik','==',true)`.
- Log: staf menulis, admin membaca, tidak bisa diubah.

## 9. Tampilan

Mengikuti `DESIGN.md` Penilaian: biru `#313083`, font Inter dari `public/fonts`, kartu datar bergaris tipis, sidebar kiri, navigasi bawah di layar kecil, tanpa CDN (CSP hanya `'self'`). Komponen `ui.tsx`, `Layout`, dan token warna disalin dari Sarpras.

Catatan perangkat: banyak siswa/guru memakai ponsel lawas, jadi tampilan ringan, tanpa animasi berat, dan halaman katalog dibuat bertahap (pagination).

**Pemindaian.** Fase 1 memakai kolom input yang terfokus: bekerja dengan pemindai barcode USB (yang bertindak seperti keyboard) dan dengan mengetik kode. Pemindaian lewat kamera ponsel menyusul (butuh pustaka tambahan karena `BarcodeDetector` belum ada di semua peramban). Pencarian data buku otomatis lewat ISBN dari layanan luar tidak dipakai di fase 1 karena CSP hanya `'self'`; gantinya impor Excel.

## 10. Struktur repo

```
perpustakaan/
  docs/                 # RANCANGAN.md, DEPLOY.md, DATA_MODEL.md
  public/               # logo dan font (sama dengan Penilaian/Sarpras)
  src/
    components/         # ui.tsx, Layout, Icon (disalin dari Sarpras)
    context/            # AuthContext
    lib/                # firebase, auth, peran, menu, akses data
    pages/              # beranda, katalog, eksemplar, sirkulasi, kunjungan, digital, admin
    types/
    App.tsx  main.tsx  index.css
  firebase.json         # hanya hosting
  .firebaserc           # target perpustakaan -> sdm01-perpustakaan
  .env.example          # nilai Firebase sama dengan Penilaian
  firestore.rules.perpustakaan   # untuk ditempel ke rules Penilaian
  CHANGELOG.md  ANTIREGRESI.md  README.md
```

## 11. Tahapan

1. **Rancangan dikunci** (dokumen ini).
2. **Kerangka aplikasi**: Vite + React + TS + Tailwind v4 disalin dari pola Sarpras, login Firebase, peran, menu, situs Hosting dan subdomain.
3. **Aturan Firestore**: gabungkan dengan aturan Penilaian; uji sebelum deploy.
4. **Katalog, kategori, eksemplar, impor Excel, cetak label.**
5. **Sirkulasi** (pinjam, kembali, perpanjang, terlambat).
6. **Kunjungan, dashboard, laporan.**
7. **Koleksi digital** (tautan, tampilan baca).
8. **Uji coba bersama pustakawan dan beberapa guru, peluncuran.**
9. **Fase 2 dan 3.**

Persiapan data awal (daftar buku dalam template Excel) berjalan paralel sejak tahap 2.

Cara kerja pengiriman kode: berkas kecil dikirim langsung ke GitHub (commit ke `main`); bila banyak atau besar, dikirim sebagai arsip zip berstruktur sama dengan repo untuk di-push manual. Yang dikirim hanya berkas yang berubah atau baru.

## 12. Keputusan yang masih terbuka (dengan rekomendasi)

1. **Prioritas**: pengelolaan buku cetak (sirkulasi) atau koleksi digital dulu? *Rekomendasi: keduanya masuk fase 1, sirkulasi dikerjakan lebih dulu.*
2. **Siapa admin/pustakawan** dan apakah akunnya sudah ada di Penilaian (dengan peran guru)? *Rekomendasi: pustakawan memakai akun Penilaian yang sudah ada.*
3. **Data awal**: berapa kira-kira jumlah judul dan eksemplar, dan sudah ada buku induk/Excel? *Menentukan seberapa penting impor Excel.*
4. **Aturan pinjam**: lama pinjam, maksimal buku per siswa dan guru, apakah ada denda? *Rekomendasi: 7 hari, siswa 2 buku, guru 5 buku, perpanjang 1 kali, tanpa denda; bisa diubah di `perpus_config/aturan`.*
5. **Siswa login?** *Rekomendasi: tidak; dilayani lewat kartu anggota. Katalog publik di fase 2.*
6. **Tempat berkas e-book**: tautan dulu, atau ada berkas milik sendiri untuk diunggah ke Hostinger?
7. **Alamat**: `perpustakaan.` atau `perpus.`?
8. **DNS** `sdmuhammadiyah01kks.sch.id` dikelola di hPanel Hostinger?
9. **Perangkat**: ada pemindai barcode USB dan printer untuk label? *Tanpa pemindai, kode diketik manual atau dipindai kamera (menyusul).*
10. **Paket Firebase**: project masih Spark (gratis), atau sudah Blaze? *Memengaruhi pilihan penyimpanan berkas dan batas kuota.*
