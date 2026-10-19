# Pemasangan — Perpustakaan

Dilakukan sekali. Aplikasi ditayangkan di **Firebase Hosting** (situs ketiga di project yang sama dengan Penilaian dan Sarpras). Hostinger hanya dipakai untuk DNS.

## 1. Siapkan komputer
Node.js 20 ke atas, lalu `npm install -g firebase-tools` dan `firebase login`.

## 2. Buat situs Hosting ketiga
```bash
firebase hosting:sites:create sdm01-perpustakaan --project sdm01kukusan-2e735
```
Bila nama sudah dipakai, pilih nama lain dan samakan di `.firebaserc`.
`.firebaserc` sudah memetakan target `perpustakaan` ke `sdm01-perpustakaan`.

## 3. Isi .env
Salin nilai dari `.env` Sarpras/Penilaian ke `.env` di repo ini.

## 4. Izinkan domain untuk login
Firebase Console → Authentication → Settings → Authorized domains → tambahkan
`perpustakaan.sdmuhammadiyah01kks.sch.id` (dan `sdm01-perpustakaan.web.app` bila belum ada).

## 5. Aturan Firestore (di repo SDM01Penilaian)
Aturan perpustakaan digabung ke `firestore.rules` di repo SDM01Penilaian (satu berkas untuk semua aplikasi). Sumber rujukan: `firestore.rules.perpustakaan` di repo ini.

Versi penting:
- Pustakawan boleh menaikkan `perpus_config/penomoran` (tanpa ini, simpan buku+eksemplar ditolak).
- Pustakawan boleh **membaca** data dasar `siswa` (untuk NISN / pinjam / kunjungan).

Lalu di repo SDM01Penilaian: uji dulu, baru `npm run deploy:rules`.  
**Jangan** men-deploy rules dari repo perpustakaan.

## 6. Indeks Firestore
Di `firestore.indexes.json` repo Penilaian, pastikan ada (lalu `firebase deploy --only firestore:indexes`):

- `perpus_peminjaman`: `peminjam.id` Asc + `status` Asc  
- `perpus_peminjaman`: `eksemplarId` Asc + `status` Asc  

Tunggu status **Enabled** di Console sebelum uji sirkulasi penuh.

## 7. Deploy aplikasi
```bash
npm install
npm run deploy
```
Hasil sementara: `https://sdm01-perpustakaan.web.app`.

## 8. Domain khusus
Firebase Console → Hosting → situs `sdm01-perpustakaan` → Add custom domain → `perpustakaan.sdmuhammadiyah01kks.sch.id`. Catatan DNS di hPanel Hostinger. Sertifikat HTTPS biasanya aktif dalam beberapa jam.

## 9. Beri peran perpustakaan
Tanpa akun baru. Admin Penilaian = Admin Perpustakaan; guru otomatis peran "guru".  
Pustakawan/pimpinan: Firestore → `users/{uid}` → field **`peranPerpus`** = `pustakawan` atau `pimpinan`. Pengguna perlu masuk ulang.

## 10. Anggaran (Blaze)
Google Cloud Console → Billing → Budgets & alerts — pasang pemberitahuan anggaran.

## 11. Uji coba
Ikuti daftar di [UJI_COBA.md](UJI_COBA.md) sebelum mengumumkan ke seluruh guru.

## Catatan
- Login di `perpustakaan.` terpisah dari `penilaian.` / `sarpras.` (akun sama, sesi berbeda).
- Lookup ISBN memakai Open Library (jaringan keluar dari peramban); judul Indonesia mungkin perlu dilengkapi manual.
