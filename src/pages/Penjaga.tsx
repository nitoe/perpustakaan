import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { bisaKelola } from '../lib/peran'
import { Notice } from '../components/ui'

/** Membatasi halaman pengelolaan untuk admin dan pustakawan (penegakan sebenarnya ada di Firestore rules). */
export default function Penjaga({ children }: { children: ReactNode }) {
  const { peran } = useAuth()
  if (!bisaKelola(peran)) {
    return (
      <div className="mx-auto max-w-xl">
        <Notice tipe="warn">Halaman ini hanya untuk admin dan pustakawan.</Notice>
      </div>
    )
  }
  return children
}
