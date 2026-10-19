# Perpustakaan — SD Muhammadiyah 01 Kukusan

Aplikasi perpustakaan digital sekolah: katalog buku, koleksi digital, eksemplar, peminjaman, kunjungan.

Frontend: **Vite + React 19 + TypeScript + Tailwind CSS v4**
Backend: **Firebase** (Authentication + Firestore + Hosting), project `sdm01kukusan-2e735` (sama dengan Penilaian dan Sarpras)

URL tujuan: `https://perpustakaan.sdmuhammadiyah01kks.sch.id`

Rancangan: [docs/RANCANGAN.md](docs/RANCANGAN.md) · Model data: [docs/DATA_MODEL.md](docs/DATA_MODEL.md) · Pemasangan: [docs/DEPLOY.md](docs/DEPLOY.md)

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

## Struktur

```
src/
  components/   Layout, ui
  context/      AuthContext
  lib/          firebase, auth, peran, menu, tipe, data, foto, katalog, penomoran, impor, csv, code128
  pages/        Login, Beranda, Katalog, BukuForm, BukuDetail, Kategori, Impor, Label (sirkulasi, kunjungan menyusul)
  types/
firestore.rules.perpustakaan   aturan untuk ditempel ke rules Penilaian (tidak di-deploy dari sini)
```

## Memberi akses

Tanpa akun baru: di Firestore, dokumen `users/{uid}` diberi field teks `peranPerpus` = `pustakawan`, `pimpinan`, `guru`, atau `admin`. Admin Penilaian otomatis admin perpustakaan; semua jenis guru otomatis `guru`.
