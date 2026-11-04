# CHANGELOG

## 0.14.29 — Sampul AI adaptif menurut jenis buku
- Prompt sampul AI tidak lagi memaksa ilustrasi anak.
- Heuristik + instruksi model memilih gaya: tipografi profesional (guru/tes), fiksi anak, nonfiksi anak, agama, sains, fiksi umum, atau netral sekolah.
- Form mengirim kategori, klasifikasi, jenjang baca, sinopsis, penerbit, bahasa ke `generateBukuSampulAi`.
- Log server mencatat kode `gaya` yang dipilih.
