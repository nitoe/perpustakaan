import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { bisaKelola } from '../lib/peran'
import { catat } from '../lib/data'
import { ajukanUsulan, daftarUsulan, putuskanUsulan } from '../lib/usulan'
import type { StatusUsulan, Usulan as TUsulan } from '../lib/tipe'
import { Badge, Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'

const NAMA: Record<StatusUsulan, string> = {
  diajukan: 'Diajukan',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
  dibatalkan: 'Dibatalkan',
}

export default function Usulan() {
  const { profil, peran } = useAuth()
  const kelola = bisaKelola(peran)
  const [list, setList] = useState<TUsulan[]>([])
  const [filter, setFilter] = useState<StatusUsulan | ''>('diajukan')
  const [galat, setGalat] = useState('')
  const [ok, setOk] = useState('')
  const [judul, setJudul] = useState('')
  const [pengarang, setPengarang] = useState('')
  const [alasan, setAlasan] = useState('')
  const [proses, setProses] = useState(false)

  const muat = useCallback(async () => {
    try {
      setList(await daftarUsulan(filter || undefined))
      setGalat('')
    } catch (e) {
      const kode = (e as { code?: string })?.code
      setGalat(kode === 'permission-denied' ? 'Tidak ada akses.' : 'Gagal memuat usulan.')
    }
  }, [filter])

  useEffect(() => {
    void muat()
  }, [muat])

  async function kirim(e: FormEvent) {
    e.preventDefault()
    setProses(true)
    setGalat('')
    setOk('')
    try {
      const id = await ajukanUsulan({
        judul,
        pengarang,
        alasan,
        pengusulNama: profil?.nama ?? '',
      })
      void catat(profil, 'usulan', 'perpus_usulan', id)
      setOk('Usulan terkirim.')
      setJudul('')
      setPengarang('')
      setAlasan('')
      await muat()
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Gagal mengajukan.')
    }
    setProses(false)
  }

  async function putuskan(u: TUsulan, status: 'disetujui' | 'ditolak') {
    try {
      await putuskanUsulan(u.id, status)
      void catat(profil, `usulan ${status}`, 'perpus_usulan', u.id)
      await muat()
    } catch {
      setGalat('Gagal memutuskan usulan.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader judul="Usulan buku" keterangan="Guru dan staf dapat mengusulkan judul untuk dibeli/diadakan." />
      {galat && (
        <div className="mb-4">
          <Notice tipe="error">{galat}</Notice>
        </div>
      )}
      {ok && (
        <div className="mb-4">
          <Notice>{ok}</Notice>
        </div>
      )}

      <form onSubmit={(e) => void kirim(e)} className="card-soft mb-4 space-y-3 p-4">
        <Field label="Judul *">
          <input className={inputCls} value={judul} onChange={(e) => setJudul(e.target.value)} required />
        </Field>
        <Field label="Pengarang">
          <input className={inputCls} value={pengarang} onChange={(e) => setPengarang(e.target.value)} />
        </Field>
        <Field label="Alasan / keterangan">
          <textarea className={inputCls} rows={2} value={alasan} onChange={(e) => setAlasan(e.target.value)} />
        </Field>
        <button type="submit" className={btnPrimary} disabled={proses}>
          {proses ? 'Mengirim…' : 'Ajukan'}
        </button>
      </form>

      <div className="mb-3 flex flex-wrap gap-2">
        {(['', 'diajukan', 'disetujui', 'ditolak'] as const).map((s) => (
          <button key={s || 'semua'} type="button" className={filter === s ? btnPrimary : btnGhost} onClick={() => setFilter(s)}>
            {s ? NAMA[s] : 'Semua'}
          </button>
        ))}
      </div>

      <ul className="card-soft divide-y divide-border">
        {list.length === 0 ? (
          <li className="p-4 text-sm text-muted">Belum ada usulan.</li>
        ) : (
          list.map((u) => (
            <li key={u.id} className="px-4 py-3 text-sm">
              <div className="font-medium">{u.judul}</div>
              <div className="text-muted">
                {[u.pengarang, u.pengusulNama].filter(Boolean).join(' · ')}
              </div>
              {u.alasan && <p className="mt-1 text-muted">{u.alasan}</p>}
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge>{NAMA[u.status]}</Badge>
                {kelola && u.status === 'diajukan' && (
                  <>
                    <button type="button" className="text-xs font-medium text-muh-600 hover:underline" onClick={() => void putuskan(u, 'disetujui')}>
                      Setujui
                    </button>
                    <button type="button" className="text-xs font-medium text-red-700 hover:underline" onClick={() => void putuskan(u, 'ditolak')}>
                      Tolak
                    </button>
                  </>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
