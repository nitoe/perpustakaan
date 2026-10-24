# Perpustakaan — SD Muhammadiyah 01 Kukusan

Aplikasi perpustakaan digital sekolah: katalog, koleksi digital, eksemplar, peminjaman, kunjungan, laporan, anggota.

Frontend: **Vite + React 19 + TypeScript + Tailwind CSS v4**  
Backend: **Firebase** (Authentication + Firestore + Hosting), project `sdm01kukusan-2e735` (sama dengan Penilaian dan Sarpras)

URL tujuan: `https://perpustakaan.sdmuhammadiyah01kks.sch.id`

| Dokumen | Isi |
|---------|-----|
| [docs/RANCANGAN.md](docs/RANCANGAN.md) | Rancangan & fase |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Model data Firestore |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Pemasangan Hosting & rules |
| [docs/UJI_COBA.md](docs/UJI_COBA.md) | Daftar uji fase 1 |
| [CHANGELOG.md](CHANGELOG.md) | Riwayat versi |

## Status

**Fase 1 dan fase 2 selesai di kode**, ditambah rak baca siswa tanpa akun di `/publik/baca`.  
Akun siswa belum dibuat. Tahap berikutnya: **uji coba** bersama pustakawan/guru ([docs/UJI_COBA.md](docs/UJI_COBA.md)), lalu peluncuran.

## Menjalankan di komputer

```bash
npm install
cp .env.example .env     # isi nilai Firebase (sama dengan .env Penilaian/Sarpras)
npm run dev
```

## Perintah

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Server pengembangan |
| `npm run build` | Periksa tipe dan build ke `dist/` |
| `npm run lint` | Periksa kode (oxlint) |
| `npm run deploy` | Build + deploy ke situs Hosting `sdm01-perpustakaan` |

## Modul

| Menu | Siapa | Fungsi |
|------|--------|--------|
| Katalog | Semua staf | Cari, detail, tambah/ubah buku & eksemplar |
| Digital | Semua staf | Koleksi digital + buka tautan |
| Kategori / Impor / Label | Admin, pustakawan | Master data, CSV, cetak barcode |
| Sirkulasi | Admin, pustakawan | Pinjam, kembali, perpanjang |
| Kunjungan | Admin, pustakawan | Catat pengunjung (NISN / kelas) |
| Anggota | Admin, pustakawan | Peminjam non-siswa |
| Laporan | Admin, pustakawan, pimpinan | Terlambat, populer, kunjungan |
| Pengaturan | Semua (aturan pinjam: admin) | Akun, DDC, aturan |
| Rak baca `/publik/baca` | Siswa dan orang tua, tanpa akun | Baca koleksi digital yang ditandai publik |

## Memberi akses

Tanpa akun baru: di Firestore, dokumen `users/{uid}` diberi field teks `peranPerpus` = `pustakawan`, `pimpinan`, `guru`, atau `admin`. Admin Penilaian otomatis admin perpustakaan; semua jenis guru otomatis `guru`.

Siswa dilayani lewat **NISN** (koleksi `siswa` Penilaian), bukan akun login. Bacaan digital yang boleh dibaca siswa dibuka tanpa akun di `/publik/baca`.
