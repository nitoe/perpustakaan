# CHANGELOG

## 0.14.30 — Hapus buku saat hanya sisa eksemplar dikeluarkan
- **Penyebab:** Eksemplar berstatus `dihapus` disembunyikan di UI ("Belum ada eksemplar" / 0 dari 0), tetapi `hapusBuku` menolak karena masih ada dokumen eksemplar.
- **Perbaikan:** Buku boleh dihapus jika tidak ada eksemplar aktif (`tersedia` / `dipinjam` / `hilang`). Sisa eksemplar `dihapus` dibersihkan bersama dokumen buku.
- Pesan error lebih jelas bila masih ada yang dipinjam atau aktif.
- Detail buku menampilkan jumlah "dikeluarkan" dan petunjuk centang tampilkan eksemplar dikeluarkan.
- Riwayat peminjaman tetap utuh (judul/kode tersimpan di `perpus_peminjaman`).
