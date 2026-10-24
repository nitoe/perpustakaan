# Cara memasang patch login siswa (0.11.0)

Arsip ini berisi **hanya file baru dan file yang diubah**. Salin ke root repo `perpustakaan` dengan mempertahankan struktur folder.

## File baru

```
src/lib/siswaAuth.ts
src/context/SiswaContext.tsx
src/pages/siswa/SiswaMasuk.tsx
src/pages/siswa/SiswaLayout.tsx
src/pages/siswa/SiswaBeranda.tsx
src/pages/siswa/SiswaRakBaca.tsx
docs/RULES_SISWA_LOGIN.md
CARA_PASANG.md
```

## File yang diganti (overwrite)

```
src/App.tsx
src/main.tsx
src/pages/Login.tsx
src/pages/publik/PublikLayout.tsx
CHANGELOG.md
ANTIREGRESI.md
```

## Langkah

1. Ekstrak arsip di root repo `nitoe/perpustakaan` (atau salin file satu per satu).
2. Pastikan tidak menimpa perubahan lokal yang belum di-commit pada file yang sama.
3. **Wajib:** sesuaikan rules `siswa` di repo SDM01Penilaian (lihat `docs/RULES_SISWA_LOGIN.md`), lalu deploy rules dari sana.
4. `npm run build` — pastikan lolos.
5. Uji lokal: `/siswa/masuk` → pilih kelas → nama → NISN.
6. Commit & push, atau `npm run deploy`.

## Perilaku

| URL | Fungsi |
|-----|--------|
| `/siswa/masuk` | Login: kelas → nama → NISN |
| `/siswa` | Beranda siswa (setelah login) |
| `/siswa/baca` | Rak baca digital (koleksi publik) |
| `/publik/baca` | Tetap tersedia tanpa login |

Sesi siswa disimpan di `sessionStorage` (hilang saat tab ditutup). Bukan Firebase Authentication.
