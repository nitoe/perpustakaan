# Rancangan Aplikasi Perpustakaan Digital — SD Muhammadiyah 01 Kukusan

Draf 2, Oktober 2026 (draf 1 + keputusan pemilik aplikasi). Disusun setelah memeriksa repo `nitoe/sarpras` (README, RANCANGAN, DEPLOY, ANTIREGRESI, `package.json`, `firestore.rules.sarpras`) dan `nitoe/SDM01Penilaian` (`firestore.rules`). Repo `nitoe/perpustakaan` masih kosong; dokumen ini adalah isi pertamanya.

Status: tahap 1-3 selesai (rancangan, kerangka aplikasi, aturan Firestore siap tempel). Keputusan yang sudah diambil:
- Database memakai project Firebase yang sama dengan Penilaian dan Sarpras.
- Akun perpustakaan tidak membuat akun baru: cukup menambah field `peranPerpus` pada `users/{uid}` yang sudah ada.
- Akun siswa baru dibuat kelak, bukan sekarang.
- Project Firebase sudah memakai paket berbayar (Blaze), sehingga Cloud Storage tersedia.
- Ide tambahan (jurnal baca, katalog publik, reservasi, stock opname, pojok baca kelas) disetujui.
Pertanyaan yang masih terbuka ada di bagian 12.

## 1. Keputusan utama (ringkas)

| Hal | Keputusan | Alasan singkat |
| --- | --- | --- |
| Frontend | **Tetap Vite + React 19 + TypeScript + Tailwind CSS v4** (versi sama dengan Sarpras) | Komponen, tampilan, dan cara kerja bisa disalin dari Sarpras/Penilaian; tidak perlu server sendiri |
| Data dan login | **Firebase project yang sama** (`sdm01kukusan-2e735`): Authentication + Firestore | Akun yang sama, tanpa akun baru; sudah dipakai Penilaian dan Sarpras. Project sudah Blaze |
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

**Cara memberi akses (tanpa akun baru):** buka Firestore → `users/{uid}` orang tersebut → tambahkan field teks `peranPerpus` berisi `pustakawan`, `pimpinan`, `guru`, atau `admin`. Hanya admin yang bisa mengisinya (aturan `users` di Penilaian melarang pemilik akun mengubahnya). Bila kosong: admin Penilaian = admin perpustakaan, semua jenis guru = guru. Akun yang tidak punya field `role` sama sekali (mis. petugas TU) tetap bisa diberi akses hanya dengan field ini.

**Siswa belum punya akun (untuk saat ini).** Siswa dilayani lewat kartu anggota (QR/barcode berisi NIS) yang dipindai pustakawan, dan dikenali dari koleksi `siswa` (ID dokumen = NIS) yang sudah ada di Penilaian. Rancangan sudah disiapkan untuk akun siswa kelak: peminjaman mencatat siswa lewat NIS, bukan lewat uid, jadi akun siswa nanti cukup dihubungkan ke NIS-nya (peran `siswa` ditambahkan di `peranPerpus()` dan `peran.ts`) tanpa mengubah data yang sudah tercatat.

**Perubahan kecil di Penilaian:** aturan `siswa` di Penilaian hanya mengizinkan baca roster untuk `isGuru()`. Supaya pustakawan non-guru (mis. TU) cukup diberi field `peranPerpus`, dua baris di blok `siswa` diubah (Bagian C di `firestore.rules.perpustakaan`) sehingga pustakawan juga boleh membaca data dasar siswa. Biodata sensitif di `identitas_siswa` tidak tersentuh.

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
| `perpus_anggota` | anggota non-siswa: nama, jenis (`guru` / `karyawan` / `kelas`), aktif. Siswa tidak dicatat di sini; mereka dikenali dari `siswa` (ID = NIS) |
| `perpus_peminjaman` | eksemplarId, bukuId, judul (salinan), peminjam {tipe `siswa`/`anggota`, id (NIS atau ID anggota), nama, kelas}, tglPinjam, jatuhTempo, tglKembali, status (`dipinjam` / `dikembalikan`), jumlahPerpanjang, kondisiKembali, petugasUid, catatan |
| `perpus_kunjungan` | tanggal, waktu, pengunjung {tipe `siswa`/`anggota`, id, nama, kelas}, keperluan |
| `perpus_foto` | sampul terkompres (JPEG kecil, base64, maks 120.000 karakter) — pola sama dengan `sarpras_foto` |
| `perpus_config` | dokumen `aturan`: lama pinjam, maksimal buku per siswa/guru, jumlah perpanjangan |
| `perpus_usulan`, `perpus_reservasi`, `perpus_jurnal` | fase 2 dan 3 |
| `perpus_log` | waktu, pengguna, tindakan |

Prinsip rancangan data, demi kuota gratis dan kecepatan:
- **ID eksemplar = kode di label.** Memindai label langsung membaca satu dokumen, tanpa pencarian.
- **Salinan (denormalisasi)**: judul dan nama peminjam disimpan di dokumen peminjaman, supaya daftar pinjaman tidak perlu membaca dokumen lain.
- **Pinjam dan kembali = satu `writeBatch`** (buat/ubah peminjaman + ubah status eksemplar + ubah `eksemplarTersedia`), supaya tidak ada keadaan setengah jadi. Aturan Firestore memeriksa bahwa ketiganya berubah bersama.
- **Katalog di-cache di peramban** (persistent cache Firestore) agar pencarian tidak membaca ulang ratusan dokumen tiap hari.
- Per transaksi pinjam, bacaannya hanya sekitar 3-5 dokumen (siswa, eksemplar, pinjaman aktif siswa).
- Tiga aplikasi memakai satu project, jadi pemakaian dibagi bersama. Pada Blaze kuota gratis harian tetap berlaku dan kelebihannya baru ditagih; pantau di Firebase Console.

Sampul buku: karena project sudah Blaze, Cloud Storage tersedia, tetapi sampul tetap disimpan kecil di `perpus_foto` (sama seperti Sarpras) supaya tidak perlu menambah `storage.rules` di Penilaian untuk fitur yang sederhana. Cloud Storage dipakai nanti untuk berkas e-book (bagian 7). Pada paket Blaze, pasang pemberitahuan anggaran (budget alert) di Google Cloud Console agar biaya tak terduga langsung terlihat.

## 6. Penayangan

**Rekomendasi (sama dengan Penilaian dan Sarpras):** Firebase Hosting.
1. Di project `sdm01kukusan-2e735` buat situs Hosting ketiga, mis. `sdm01-perpustakaan`.
2. Tambahkan domain khusus `perpustakaan.sdmuhammadiyah01kks.sch.id`.
3. Catatan DNS (TXT/A atau CNAME) dimasukkan di hPanel Hostinger → Domains → DNS Zone.
4. Tambahkan domain itu ke Authentication → Authorized domains.
5. Subdomain lain dan portal tidak terpengaruh. Hostinger tetap dipakai: untuk domain dan DNS, dan portal utama.

**Alternatif:** unggah hasil `npm run build` (folder `dist/`) ke Hostinger (Git deploy atau File Manager). Tetap bisa memakai Firestore. Kekurangannya: alur deploy berbeda dari dua aplikasi lain, dan setiap perubahan butuh langkah tambahan. Tidak direkomendasikan kecuali ada alasan khusus untuk menaruh semuanya di Hostinger.

## 7. Berkas koleksi digital

Aplikasi menyimpan **tautan** ke berkas. Pilihan tempat berkas:

| Pilihan | Catatan |
| --- | --- |
| Buku Sekolah Elektronik Kemendikdasmen, Google Drive/YouTube, atau situs lain | Paling mudah, tanpa biaya; cocok untuk fase 1. Periksa hak cipta sebelum membagikan |
| Hostinger (File Manager/SFTP, mis. folder di subdomain `berkas.`) | Ruang disk sudah ada di paket hosting; tautan stabil; perlu diunggah manual |
| Firebase Storage | Tersedia (project sudah Blaze). Cocok untuk unggah PDF langsung dari aplikasi; butuh `storage.rules` yang ditempel di repo Penilaian (pola sama dengan firestore.rules). Dikerjakan di tahap koleksi digital |

**Rekomendasi:** tahap koleksi digital dimulai dengan tautan (baris 1) dan unggah ke Firebase Storage untuk berkas milik sendiri (buku karya guru/siswa, modul ajar); Hostinger tidak diperlukan. Berkas berhak cipta tidak boleh bertanda publik.

## 8. Aturan Firestore

Sama dengan cara Sarpras: `firestore.rules.perpustakaan` di repo ini berisi Bagian A (fungsi) dan Bagian B (blok `match`) untuk **ditempel** ke `firestore.rules` di repo SDM01Penilaian, lalu diuji dan di-deploy dari sana. Repo ini **tidak** men-deploy rules; `firebase.json` hanya berisi `hosting`.

Garis besar:
- `peranPerpus()` meniru `peranSarpras()`; `perpusStaf()` = admin, pustakawan, pimpinan, guru.
- Baca katalog: staf. Tulis katalog/eksemplar: admin dan pustakawan.
- Peminjaman: dibuat/diubah hanya oleh admin dan pustakawan, dan wajib satu batch dengan perubahan status eksemplar; tidak ada hapus; data siswa hanya terbaca staf.
- `siswa` (Bagian C): pustakawan non-guru boleh membaca data dasar siswa.
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

1. **Rancangan dikunci** (dokumen ini) — selesai.
2. **Kerangka aplikasi**: Vite + React + TS + Tailwind v4 disalin dari pola Sarpras, login Firebase, peran, menu — selesai (lolos `tsc`, build, dan lint). Situs Hosting dan subdomain dipasang mengikuti `docs/DEPLOY.md`.
3. **Aturan Firestore**: `firestore.rules.perpustakaan` siap — tinggal ditempel ke Penilaian dan diuji sebelum deploy.
4. **Katalog, kategori, eksemplar, impor Excel, cetak label.**
5. **Sirkulasi** (pinjam, kembali, perpanjang, terlambat).
6. **Kunjungan, dashboard, laporan.**
7. **Koleksi digital** (tautan, tampilan baca).
8. **Uji coba bersama pustakawan dan beberapa guru, peluncuran.**
9. **Fase 2 dan 3.**

Persiapan data awal (daftar buku dalam template Excel) berjalan paralel sejak tahap 2.

Cara kerja pengiriman kode: berkas kecil dikirim langsung ke GitHub (commit ke `main`); bila banyak atau besar, dikirim sebagai arsip zip berstruktur sama dengan repo untuk di-push manual. Yang dikirim hanya berkas yang berubah atau baru.

## 12. Keputusan

**Sudah diputuskan:** database satu project dengan Penilaian dan Sarpras; akun perpustakaan lewat field `peranPerpus`; akun siswa kelak; paket Blaze; ide tambahan disetujui.

**Masih terbuka (ada jawaban bawaan; bila tidak dijawab, bawaan dipakai):**
1. **Prioritas**: *keduanya fase 1, sirkulasi lebih dulu.*
2. **Siapa admin/pustakawan** (akunnya cukup diberi `peranPerpus`).
3. **Data awal**: perkiraan jumlah judul dan eksemplar, dan apakah sudah ada buku induk/Excel? *Menentukan seberapa penting impor Excel.*
4. **Aturan pinjam**: *7 hari, siswa 2 buku, guru/karyawan 5 buku, perpanjang 1 kali, tanpa denda* (bisa diubah di `perpus_config/aturan`).
5. **Alamat**: `perpustakaan.` atau `perpus.`? *Bawaan: `perpustakaan.`*
6. **DNS** `sdmuhammadiyah01kks.sch.id` dikelola di hPanel Hostinger?
7. **Perangkat**: ada pemindai barcode USB dan printer untuk label? *Tanpa pemindai, kode diketik manual atau dipindai kamera (menyusul).*
