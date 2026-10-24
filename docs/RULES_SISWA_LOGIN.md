# Aturan Firestore untuk area siswa (login + pinjaman)

Login siswa di `/siswa/masuk` dan halaman **Pinjaman saya** membutuhkan penyesuaian rules di project Firebase yang sama. Rules **tidak** di-deploy dari repo perpustakaan — ubah di repo **SDM01Penilaian**, lalu deploy dari sana (atau sementara lewat Firebase Console untuk uji `npm run dev`).

## 1. Koleksi `siswa` — dropdown login

Agar daftar nama per kelas terisi tanpa login staf:

```
match /siswa/{id} {
  // Login siswa: daftar nama per kelas tanpa akun Auth.
  allow get: if isGuru() || perpusPustakawan() || anakSaya(id) || true;
  allow list: if isGuru() || perpusPustakawan() || true;
  // aturan create/update/delete tetap seperti sebelumnya
}
```

## 2. Koleksi `perpus_peminjaman` — pinjaman saya

Halaman `/siswa/pinjaman` memanggil kueri:

`where('peminjam.id', '==', nisn)` + `where('status', '==', 'dipinjam')`.

Tanpa akun Firebase Auth untuk siswa, rules tidak bisa membatasi “hanya NISN yang login”. Model keamanan sementara: siapa yang tahu NISN (sama dengan sandi login) boleh melihat pinjaman siswa itu.

Ganti blok `perpus_peminjaman` bagian **read**:

```
match /perpus_peminjaman/{id} {
  // Staf: penuh. Publik: hanya dokumen peminjam siswa (klien wajib filter peminjam.id).
  allow read: if perpusStaf()
              || resource.data.peminjam.tipe == 'siswa';
  allow create: if perpusPustakawan()
                && request.resource.data.status == 'dipinjam'
                && request.resource.data.petugasUid == request.auth.uid
                && request.resource.data.peminjam.tipe in ['siswa', 'anggota']
                && perpusEksemplarSebelum(request.resource.data.eksemplarId).status == 'tersedia'
                && perpusEksemplarSesudah(request.resource.data.eksemplarId).status == 'dipinjam';
  allow update: if perpusPustakawan()
                && resource.data.status == 'dipinjam'
                && request.resource.data.diff(resource.data).affectedKeys()
                     .hasOnly(['status', 'tglKembali', 'jatuhTempo', 'jumlahPerpanjang',
                               'kondisiKembali', 'catatan', 'updatedAt'])
                && request.resource.data.status in ['dipinjam', 'dikembalikan']
                && (request.resource.data.status == 'dipinjam'
                    || perpusEksemplarSesudah(resource.data.eksemplarId).status in ['tersedia', 'hilang']);
  allow delete: if false;
}
```

**Catatan:** aturan di atas mengizinkan siapa pun membaca semua dokumen peminjaman bertipe siswa (bukan hanya satu NISN). Untuk lingkungan internal sekolah dan sandi = NISN, ini sejalan dengan risiko login siswa. Bila tidak dapat diterima, tunda fitur pinjaman saya sampai ada akun Firebase Auth per siswa.

## 3. Uji cepat (npm run dev)

1. Tempel perubahan rules di Firebase Console → Firestore → Rules → Publish  
   **atau** lewat repo Penilaian lalu `firebase deploy --only firestore:rules`.
2. Buka `http://localhost:…/siswa/masuk` → pilih kelas → nama → NISN.
3. Buka **Pinjaman** — harus muncul daftar (atau kosong jika belum pernah pinjam), bukan permission-denied.

## 4. Deploy hosting (menyusul)

Hosting perpustakaan belum wajib untuk pengembangan. Setelah DNS/Hosting siap:

```bash
npm run build
npm run deploy
```

Lihat `docs/DEPLOY.md` di repo perpustakaan.
