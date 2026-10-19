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
Aturan perpustakaan sudah digabung ke `firestore.rules` di repo SDM01Penilaian (satu berkas untuk semua aplikasi). `firestore.rules.perpustakaan` di repo ini adalah sumbernya: bila blok `perpus_*` di sana berubah, samakan blok yang sama di `firestore.rules` Penilaian (jangan menempel ulang seluruh berkas).
Versi 0.2.0 mengubah satu blok: `perpus_config` (pustakawan boleh menaikkan penghitung `penomoran`). Tanpa perubahan ini, tombol Simpan pada buku dengan eksemplar akan ditolak.

Lalu di repo SDM01Penilaian: ujilah dulu (mis. dengan Firebase Emulator atau Rules Playground di konsol), baru `npm run deploy:rules`.
Jangan men-deploy rules dari repo perpustakaan (lihat ANTIREGRESI.md butir 1).

## 6. Deploy pertama
```bash
npm install
npm run deploy
```
Hasil sementara ada di `https://sdm01-perpustakaan.web.app`.

## 7. Domain khusus
Firebase Console → Hosting → situs `sdm01-perpustakaan` → Add custom domain → `perpustakaan.sdmuhammadiyah01kks.sch.id`. Masukkan catatan DNS (TXT/A atau CNAME) yang ditampilkan ke DNS domain (hPanel Hostinger → Domains → DNS Zone, bila DNS dikelola di sana). Sertifikat HTTPS dibuat otomatis, biasanya dalam beberapa jam.

## 8. Beri peran perpustakaan
Tanpa membuat akun baru. Admin Penilaian otomatis menjadi Admin Perpustakaan, dan semua guru otomatis berperan "guru". Untuk pustakawan atau pimpinan: Firebase Console → Firestore → `users/{uid}` → tambahkan field **`peranPerpus`** (tipe string) berisi `pustakawan` atau `pimpinan`. Pengguna perlu masuk ulang.

Akun yang belum punya dokumen `users/{uid}` perlu dibuat dulu lewat halaman admin Penilaian.

## 9. Anggaran (paket Blaze)
Project sudah Blaze. Di Google Cloud Console → Billing → Budgets & alerts, pasang pemberitahuan anggaran supaya pemakaian di luar kuota gratis langsung terlihat.

## Catatan
- Login di `perpustakaan.` terpisah dari `penilaian.` dan `sarpras.`: pengguna perlu masuk sekali di tiap alamat (akun dan kata sandinya sama).
- Domain `penilaian.`, `sarpras.`, dan portal tidak terpengaruh.
