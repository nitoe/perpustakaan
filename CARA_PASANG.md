# Cara memasang 0.13.0 — Jurnal baca

Ekstrak di **root repo** `perpustakaan`.

## File baru
```
src/lib/jurnal.ts
src/pages/Jurnal.tsx
src/pages/siswa/SiswaJurnal.tsx
```

## File diganti
```
src/App.tsx
src/lib/menu.ts
src/lib/tipe.ts
src/pages/siswa/SiswaLayout.tsx
src/pages/siswa/SiswaBeranda.tsx
firestore.rules.perpustakaan
docs/RULES_SISWA_LOGIN.md
CHANGELOG.md
ANTIREGRESI.md
```

## Setelah ekstrak
1. Tempel blok `perpus_jurnal` dari `firestore.rules.perpustakaan` ke rules Penilaian (atau Firebase Console), lalu publish.
2. `npm run dev` — uji `/siswa/jurnal` (siswa) dan `/jurnal` (staf).
3. Bila error indeks, klik tautan di konsol browser (F12) untuk membuat indeks komposit.
4. Commit & push manual.
