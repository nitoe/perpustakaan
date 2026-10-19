import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from './firebase'
import type { Peminjaman } from './tipe'
import { daftarPinjamanAktif, terlambat } from './sirkulasi'
import { daftarKunjunganRentang, rekapPerKelas, tanggalHariIni } from './kunjungan'

export interface BukuPopuler {
  bukuId: string
  judul: string
  kali: number
}

/** Pinjaman aktif yang sudah lewat jatuh tempo. */
export async function laporanTerlambat(): Promise<Peminjaman[]> {
  const aktif = await daftarPinjamanAktif(400)
  return aktif.filter((p) => terlambat(p))
}

/**
 * Buku terpopuler dari pinjaman aktif + sampel dikembalikan (batas baca).
 * Cukup untuk fase 1; laporan penuh bisa pakai agregasi server nanti.
 */
export async function laporanBukuPopuler(batas = 15): Promise<BukuPopuler[]> {
  const [aktif, kembali] = await Promise.all([
    getDocs(query(collection(db, 'perpus_peminjaman'), where('status', '==', 'dipinjam'), limit(300))),
    getDocs(query(collection(db, 'perpus_peminjaman'), where('status', '==', 'dikembalikan'), limit(400))),
  ])
  const hitung = new Map<string, { judul: string; kali: number }>()
  for (const snap of [aktif, kembali]) {
    for (const d of snap.docs) {
      const data = d.data()
      const id = data.bukuId as string
      if (!id) continue
      const judul = (data.judul as string) || id
      const cur = hitung.get(id)
      if (cur) cur.kali += 1
      else hitung.set(id, { judul, kali: 1 })
    }
  }
  return [...hitung.entries()]
    .map(([bukuId, v]) => ({ bukuId, judul: v.judul, kali: v.kali }))
    .sort((a, b) => b.kali - a.kali)
    .slice(0, batas)
}

export async function laporanKunjungan(dari: string, sampai: string) {
  const list = await daftarKunjunganRentang(dari, sampai)
  return {
    total: list.length,
    perKelas: rekapPerKelas(list),
    list,
  }
}

export function rentangDefault(hari = 7): { dari: string; sampai: string } {
  const sampai = new Date()
  const dari = new Date()
  dari.setDate(dari.getDate() - (hari - 1))
  return { dari: tanggalHariIni(dari), sampai: tanggalHariIni(sampai) }
}
