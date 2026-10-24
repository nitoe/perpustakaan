import { collection, getDocs, query, where } from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'
import type { SiswaDasar } from './sirkulasi'
import { idPeminjamSiswa } from './sirkulasi'

const STORAGE_KEY = 'perpus_siswa_sesi'

/** Sesi login siswa (bukan Firebase Auth — akun Auth siswa belum dibuat). */
export interface SiswaSesi {
  id: string
  nama: string
  kelas: string
  nisn: string
  loginAt: number
}

/** Daftar kelas SD yang biasa dipakai (dropdown login). */
export const DAFTAR_KELAS = [
  '1A', '1B', '1C',
  '2A', '2B', '2C',
  '3A', '3B', '3C',
  '4A', '4B', '4C',
  '5A', '5B', '5C',
  '6A', '6B', '6C',
] as const

export function bacaSesiSiswa(): SiswaSesi | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as SiswaSesi
    if (!s?.id || !s?.nama || !s?.nisn) return null
    return s
  } catch {
    return null
  }
}

export function simpanSesiSiswa(s: SiswaSesi) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export function hapusSesiSiswa() {
  sessionStorage.removeItem(STORAGE_KEY)
}

/** Siswa aktif satu kelas (untuk dropdown nama di halaman masuk siswa). */
export async function muatSiswaKelas(kelas: string): Promise<SiswaDasar[]> {
  if (!isFirebaseConfigured) throw new Error('Firebase belum dikonfigurasi.')
  const k = kelas.trim().toUpperCase()
  if (!k) return []
  const snap = await getDocs(query(collection(db, 'siswa'), where('kelas', '==', k)))
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<SiswaDasar, 'id'>) }))
    .filter((s) => s.aktif !== false)
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
}

/**
 * Verifikasi login siswa: pilih nama (dari daftar kelas), sandi = NISN.
 * Tidak memakai Firebase Auth; menyimpan sesi di sessionStorage.
 */
export async function loginSiswa(siswa: SiswaDasar, sandiNisn: string): Promise<SiswaSesi> {
  const input = sandiNisn.trim()
  if (!input) throw new Error('Masukkan NISN.')
  const nisnBenar = (siswa.nisn && siswa.nisn.trim()) || ''
  // Cadangan: bila NISN kosong di data, izinkan NIPD (ID dokumen) sebagai sandi.
  const alternatif = siswa.id
  if (input !== nisnBenar && input !== alternatif) {
    throw new Error('NISN tidak cocok. Periksa lagi atau tanya guru/pustakawan.')
  }
  const sesi: SiswaSesi = {
    id: siswa.id,
    nama: siswa.nama,
    kelas: (siswa.kelas || '').toUpperCase(),
    nisn: idPeminjamSiswa(siswa),
    loginAt: Date.now(),
  }
  simpanSesiSiswa(sesi)
  return sesi
}

export function logoutSiswa() {
  hapusSesiSiswa()
}
