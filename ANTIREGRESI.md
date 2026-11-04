# ANTIREGRESI (tambahan 0.14.34–0.14.37)

33. **PDF di mobile.** Jangan import `pdfjs-dist` modern build tanpa polyfill Map/Promise. Utamakan `pdfjs-dist/legacy/build/pdf.mjs` + worker legacy, dan import `pdfPolyfill` di `main.tsx` serta di `pdf.ts` sebelum pdfjs.

34. **Swipe halaman PDF.** Handler touch hanya pada area bacaan; ambang horizontal ≥ 56px dan |dx| > |dy| × 1.4. Jangan pakai preventDefault pada touchmove agar scroll vertikal (zoom) tetap jalan. Satu jari saja; multi-touch diabaikan.

35. **Login mobile.** Jangan sembunyikan `.auth-hero` di breakpoint ≤900px. Tampilkan di atas form (stack), rapat padding, `flex: none` pada `.auth-hero-inner` agar hero tidak memakan full viewport dan form tetap bisa di-scroll.
