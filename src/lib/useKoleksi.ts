import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'

/** Membaca satu koleksi secara langsung (otomatis ikut berubah). */
export function useKoleksi<T extends { id: string }>(nama: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    return onSnapshot(
      collection(db, nama),
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as T))
        setGalat('')
        setLoading(false)
      },
      (e) => {
        setGalat(e.code === 'permission-denied' ? 'Anda tidak memiliki akses ke data ini.' : 'Gagal memuat data.')
        setLoading(false)
      },
    )
  }, [nama])

  return { data, loading, galat }
}
