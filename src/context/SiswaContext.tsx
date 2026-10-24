import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  bacaSesiSiswa,
  loginSiswa,
  logoutSiswa,
  type SiswaSesi,
} from '../lib/siswaAuth'
import type { SiswaDasar } from '../lib/sirkulasi'

interface SiswaState {
  sesi: SiswaSesi | null
  loading: boolean
  masuk: (siswa: SiswaDasar, sandiNisn: string) => Promise<void>
  keluar: () => void
}

const SiswaContext = createContext<SiswaState>({
  sesi: null,
  loading: true,
  masuk: async () => {},
  keluar: () => {},
})

export function SiswaProvider({ children }: { children: ReactNode }) {
  const [sesi, setSesi] = useState<SiswaSesi | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSesi(bacaSesiSiswa())
    setLoading(false)
  }, [])

  const masuk = useCallback(async (siswa: SiswaDasar, sandiNisn: string) => {
    const s = await loginSiswa(siswa, sandiNisn)
    setSesi(s)
  }, [])

  const keluar = useCallback(() => {
    logoutSiswa()
    setSesi(null)
  }, [])

  const value = useMemo(
    () => ({ sesi, loading, masuk, keluar }),
    [sesi, loading, masuk, keluar],
  )

  return <SiswaContext.Provider value={value}>{children}</SiswaContext.Provider>
}

export function useSiswa() {
  return useContext(SiswaContext)
}
