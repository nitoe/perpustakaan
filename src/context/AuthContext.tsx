import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { isFirebaseConfigured } from '../lib/firebase'
import { subscribeAuth } from '../lib/auth'
import { peranDari } from '../lib/peran'
import type { AppUser, PeranPerpus } from '../types/user'

interface AuthState {
  user: User | null
  profil: AppUser | null
  peran: PeranPerpus | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({ user: null, profil: null, peran: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ user: User | null; profil: AppUser | null; loading: boolean }>({
    user: null,
    profil: null,
    loading: isFirebaseConfigured,
  })

  useEffect(() => {
    if (!isFirebaseConfigured) return
    return subscribeAuth((user, profil) => setState({ user, profil, loading: false }))
  }, [])

  const value = useMemo<AuthState>(
    () => ({ ...state, peran: peranDari(state.profil) }),
    [state],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
