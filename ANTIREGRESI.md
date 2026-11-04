# ANTIREGRESI (tambahan 0.14.34)

33. **PDF di mobile.** Jangan import `pdfjs-dist` modern build tanpa polyfill Map/Promise. Utamakan `pdfjs-dist/legacy/build/pdf.mjs` + worker legacy, dan import `pdfPolyfill` di `main.tsx` serta di `pdf.ts` sebelum pdfjs.
