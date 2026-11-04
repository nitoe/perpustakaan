# CHANGELOG

## 0.14.34 — Perbaikan buka PDF di smartphone
- Error `getOrInsertComputed is not a function` di HP: pdfjs-dist v6 memakai API Map yang belum ada di banyak browser mobile.
- Polyfill: `Map.getOrInsertComputed`, `Map.getOrInsert`, `Promise.withResolvers`, `Promise.try`.
- Pembaca PDF memakai **build legacy** (`pdfjs-dist/legacy/build/...`) yang lebih kompatibel.
