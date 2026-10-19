import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

/** Konfigurasi dibaca dari .env (lihat .env.example). Project sama dengan aplikasi Penilaian. */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'PLACEHOLDER_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sdm01kukusan-2e735.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sdm01kukusan-2e735',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sdm01kukusan-2e735.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:placeholder',
}

const isNewApp = getApps().length === 0
const app = isNewApp ? initializeApp(firebaseConfig) : getApps()[0]!

export const auth = getAuth(app)
// ignoreUndefinedProperties: field kosong tidak membuat setDoc gagal. Hanya boleh dipanggil sekali.
// Cache lokal persisten (IndexedDB): katalog yang sudah dimuat tidak dibaca ulang penuh tiap sesi,
// sehingga hemat kuota baca bersama Penilaian dan Sarpras.
export const db = isNewApp
  ? initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  : getFirestore(app)

export const isFirebaseConfigured =
  Boolean(import.meta.env.VITE_FIREBASE_API_KEY) &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'PLACEHOLDER_API_KEY' &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'ganti_dengan_api_key'
