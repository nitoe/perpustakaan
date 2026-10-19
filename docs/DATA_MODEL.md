# Model data — Perpustakaan

Semua koleksi berada di Firestore project `sdm01kukusan-2e735` (bersama Penilaian dan Sarpras) dan berawalan `perpus_`. Bentuk TypeScript-nya ada di `src/lib/tipe.ts`; aturan aksesnya di `firestore.rules.perpustakaan`.

| Koleksi | ID dokumen | Isi utama | Ditulis oleh |
| --- | --- | --- | --- |
| `perpus_kategori` | otomatis | kode, nama | admin, pustakawan |
| `perpus_buku` | otomatis | judul, pengarang, penerbit, tahun, isbn, kategoriId, klasifikasi, bahasa, jenjangBaca, sinopsis, coverId, jenis, tautanDigital, formatDigital, publik, eksemplarTotal, eksemplarTersedia | admin, pustakawan |
| `perpus_eksemplar` | kode di label (`PRP-000123`) | bukuId, judul, rak, kondisi, status, tahunMasuk, sumber | admin, pustakawan |
| `perpus_anggota` | otomatis | nama, jenis (`guru` / `karyawan` / `kelas`), aktif | admin, pustakawan |
| `perpus_peminjaman` | otomatis | eksemplarId, bukuId, judul, peminjam {tipe, id, nama, kelas}, tglPinjam, jatuhTempo, tglKembali, status, jumlahPerpanjang, kondisiKembali, petugasUid, catatan | admin, pustakawan |
| `perpus_kunjungan` | otomatis | tanggal, waktu, pengunjung {tipe, id, nama, kelas}, keperluan | admin, pustakawan |
| `perpus_foto` | otomatis | data (JPEG base64, maks 120.000 karakter), createdBy, createdAt | admin, pustakawan |
| `perpus_config` | `aturan` | lamaPinjamHari, maksSiswa, maksAnggota, maksPerpanjang | admin |
| `perpus_config` | `penomoran` | terakhir (nomor kode eksemplar terakhir yang dipesan), updatedAt | admin, pustakawan (hanya menaikkan) |
| `perpus_log` | otomatis | uid, nama, tindakan, koleksi, refId, waktu | staf (dicatat otomatis) |

Fase 2 dan 3 (belum ada aturannya): `perpus_usulan`, `perpus_reservasi`, `perpus_jurnal`.

## Hubungan dengan data lain

- **Siswa**: peminjam bertipe `siswa` memakai NIS = ID dokumen `siswa/{nis}` (milik Penilaian). Nama dan kelas disalin ke dokumen peminjaman agar daftar tidak perlu membaca `siswa` lagi.
- **Pengguna**: `users/{uid}.peranPerpus` menentukan peran. Perpustakaan tidak menyimpan data pengguna sendiri.

## Arti penghitung pada `perpus_buku`

- `eksemplarTotal` = jumlah eksemplar yang belum dikeluarkan dari koleksi (status selain `dihapus`).
- `eksemplarTersedia` = jumlah eksemplar berstatus `tersedia`.
- Keduanya diubah dengan `increment()` dalam batch yang sama dengan perubahan eksemplar.

## Alur tulis

- **Buku baru**: pesan nomor di `perpus_config/penomoran` (transaksi), lalu satu `writeBatch`: buku + semua eksemplarnya (`PRP-000123`, dst.).
- **Tambah eksemplar**: pesan nomor, lalu batch: eksemplar baru + `increment` penghitung buku.
- **Hilang / ditemukan / keluarkan**: batch: status eksemplar + `increment` penghitung buku.
- **Impor**: pesan satu rentang nomor untuk seluruh impor, lalu batch maksimal 450 operasi (buku dan eksemplarnya tidak dipisah antar batch).

- **Pinjam** (satu `writeBatch`): buat `perpus_peminjaman` (status `dipinjam`) + ubah `perpus_eksemplar` (`tersedia` → `dipinjam`) + `perpus_buku.eksemplarTersedia` dikurangi 1.
- **Kembali** (satu `writeBatch`): ubah `perpus_peminjaman` (status `dikembalikan`, `tglKembali`) + ubah `perpus_eksemplar` (→ `tersedia`, atau `hilang`) + `perpus_buku.eksemplarTersedia` ditambah 1 bila tersedia.
- **Perpanjang**: ubah `jatuhTempo` dan `jumlahPerpanjang` pada peminjaman yang masih `dipinjam`.

## Kueri yang akan dipakai (calon indeks komposit)

Indeks komposit hidup di `firestore.indexes.json` repo Penilaian. Saat modul sirkulasi dibuat, kueri berikut didaftarkan ke sana:
- peminjaman aktif per peminjam: `peminjam.id` + `status`
- riwayat per eksemplar: `eksemplarId` + `status`
