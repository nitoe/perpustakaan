import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  bacaSesiSiswa,
  loginSiswa,
  logoutSiswa,
  masukModePratinjau,
  keluarModePratinjau,
  type SiswaSesi,
} from '../lib/siswaAuth'
import type { SiswaDasar } from '../lib/sirkulasi'

interface SiswaState {
  sesi: SiswaSesi | null
  loading: boolean
  masuk: (siswa: SiswaDasar, sandiNisn: string) => Promise<void>
  keluar: () => void
  /** Masuk mode pratinjau (admin/pustakawan). */
  masukPratinjau: () => void
  /** Keluar mode pratinjau. */
  keluarPratinjau: () => void
}

const SiswaContext = createContext<SiswaState>({
  sesi: null,
  loading: true,
  masuk: async () => {},
  keluar: () => {},
  masukPratinjau: () => {},
  keluarPratinjau: () => {},
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

  const masukPratinjau = useCallback(() => {
    const s = masukModePratinjau()
    setSesi(s)
  }, [])

  const keluarPratinjau = useCallback(() => {
    keluarModePratinjau()
    setSesi(null)
  }, [])

  const value = useMemo(
    () => ({ sesi, loading, masuk, keluar, masukPratinjau, keluarPratinjau }),
    [sesi, loading, masuk, keluar, masukPratinjau, keluarPratinjau],
  )

  return <SiswaContext.Provider value={value}>{children}</SiswaContext.Provider>
}

export function useSiswa() {
  return useContext(SiswaContext)
}
