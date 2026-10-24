# Cara memasang patch 0.12.0 — Pinjaman saya

Ekstrak di **root repo** `perpustakaan`.

## File baru
```
src/pages/siswa/SiswaPinjaman.tsx
```

## File diganti
```
src/App.tsx
src/pages/siswa/SiswaLayout.tsx
src/pages/siswa/SiswaBeranda.tsx
docs/RULES_SISWA_LOGIN.md
CHANGELOG.md
ANTIREGRESI.md
CARA_PASANG.md
```

## Setelah ekstrak
1. `npm run dev` — buka `/siswa/pinjaman` setelah login siswa.
2. Bila muncul *permission-denied*, sesuaikan rules (lihat `docs/RULES_SISWA_LOGIN.md` bagian 2) di Firebase Console atau repo Penilaian.
3. Commit & push manual.
