# Aturan Firestore untuk login siswa

Login siswa di `/siswa/masuk` memuat daftar nama per kelas dari koleksi `siswa` (milik aplikasi Penilaian) **tanpa** login staf. Verifikasi sandi (NISN) dilakukan di klien setelah daftar dimuat.

Rules **tidak** di-deploy dari repo perpustakaan. Ubah `firestore.rules` di repo **SDM01Penilaian**, lalu deploy dari sana.

## Perubahan yang diperlukan (Bagian C / match `siswa`)

Saat ini (perkiraan dari `firestore.rules.perpustakaan`):

```
// allow get: if isGuru() || perpusPustakawan() || anakSaya(id);
// allow list: if isGuru() || perpusPustakawan();
```

Agar dropdown login siswa berfungsi, `list` (dan idealnya `get`) harus mengizinkan baca tanpa auth untuk data dasar saja. Contoh yang aman untuk skala sekolah:

```
match /siswa/{id} {
  // Login siswa: daftar nama per kelas tanpa akun Auth.
  // Hanya field yang sudah ada di dokumen (nama, kelas, nisn, aktif, …).
  allow get: if isGuru() || perpusPustakawan() || anakSaya(id) || true;
  allow list: if isGuru() || perpusPustakawan() || true;
  // tulis tetap ketat seperti sebelumnya
}
```

Atau lebih ketat (hanya list, tanpa membuka get sembarangan) — Firestore tetap mengembalikan seluruh dokumen pada list:

```
allow list: if isGuru() || perpusPustakawan() || true;
```

## Catatan privasi

- Nama dan NISN siswa dapat terbaca siapa pun yang membuka aplikasi dan memilih kelas.
- Untuk lingkungan sekolah internal ini biasanya dapat diterima; NISN dipakai sebagai sandi sederhana (sama pola TKA 2026).
- Bila kebijakan sekolah menolak baca publik, alternatifnya: akun Firebase Auth per siswa (impor massal Admin SDK) — belum dikerjakan di fase ini.

## Setelah mengubah rules

1. Tempel perubahan ke `firestore.rules` di SDM01Penilaian.
2. Deploy rules dari repo Penilaian.
3. Uji: buka `/siswa/masuk` → pilih kelas → dropdown nama terisi → masuk dengan NISN yang benar.
