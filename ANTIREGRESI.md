# ANTIREGRESI (tambahan 0.14.30)

30. **Hapus buku vs eksemplar `dihapus`.** Jangan memblokir hapus katalog hanya karena masih ada dokumen eksemplar berstatus `dihapus`. Blokir hanya jika masih ada status aktif (`tersedia`/`dipinjam`/`hilang`). Saat hapus, bersihkan dokumen eksemplar `dihapus` dalam batch yang sama agar tidak menyisakan data yatim.
