import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { catat } from '../lib/data'
import { ambilEksemplar } from '../lib/sirkulasi'
import {
  buatSesiOpname,
  catatPindaiOpname,
  daftarItemOpname,
  daftarSesiOpname,
  selesaiSesiOpname,
} from '../lib/opname'
import type { OpnameItem, OpnameSesi } from '../lib/tipe'
import { Badge, Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'

export default function Opname() {
  const { profil } = useAuth()
  const [sesiList, setSesiList] = useState<OpnameSesi[]>([])
  const [sesi, setSesi] = useState<OpnameSesi | null>(null)
  const [item, setItem] = useState<OpnameItem[]>([])
  const [kode, setKode] = useState('')
  const [namaSesi, setNamaSesi] = useState('')
  const [galat, setGalat] = useState('')
  const [ok, setOk] = useState('')
  const [proses, setProses] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const muatSesi = useCallback(async () => {
    try {
      setSesiList(await daftarSesiOpname())
    } catch {
      setGalat('Gagal memuat sesi opname.')
    }
  }, [])

  useEffect(() => {
    void muatSesi()
  }, [muatSesi])

  async function bukaSesi(s: OpnameSesi) {
    setSesi(s)
    setGalat('')
    try {
      setItem(await daftarItemOpname(s.id))
    } catch {
      setGalat('Gagal memuat item opname.')
    }
  }

  async function mulai() {
    setProses(true)
    setGalat('')
    try {
      const id = await buatSesiOpname(namaSesi, profil?.nama ?? '')
      void catat(profil, 'opname mulai', 'perpus_opname', id)
      setNamaSesi('')
      await muatSesi()
      const semua = await daftarSesiOpname()
      const s = semua.find((x) => x.id === id)
      if (s) await bukaSesi(s)
      setOk('Sesi opname dimulai. Pindai kode eksemplar.')
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal memulai sesi.')
    }
    setProses(false)
  }

  async function pindai() {
    if (!sesi || sesi.status !== 'berjalan') return
    const k = kode.trim().toUpperCase()
    if (!k) return
    setProses(true)
    setGalat('')
    try {
      if (item.some((i) => i.eksemplarId === k)) {
        setGalat(`${k} sudah dipindai di sesi ini.`)
        setProses(false)
        return
      }
      const eks = await ambilEksemplar(k)
      await catatPindaiOpname(sesi.id, eks, k)
      setOk(eks ? `OK: ${eks.judul} (${k}) — status sistem: ${eks.status}` : `Kode ${k} tidak ada di katalog (dicatat sebagai temuan).`)
      setKode('')
      setItem(await daftarItemOpname(sesi.id))
      ref.current?.focus()
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal mencatat pindai.')
    }
    setProses(false)
  }

  async function selesai() {
    if (!sesi || !window.confirm('Tutup sesi opname ini?')) return
    try {
      await selesaiSesiOpname(sesi.id)
      void catat(profil, 'opname selesai', 'perpus_opname', sesi.id)
      setSesi({ ...sesi, status: 'selesai' })
      await muatSesi()
      setOk('Sesi ditutup.')
    } catch {
      setGalat('Gagal menutup sesi.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        judul="Stock opname"
        keterangan="Inventarisasi dengan memindai label eksemplar. Bandingkan hasil pindai dengan status di sistem."
      />
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

      {!sesi && (
        <>
          <div className="card-soft mb-4 space-y-3 p-4">
            <Field label="Nama sesi (opsional)">
              <input className={inputCls} value={namaSesi} onChange={(e) => setNamaSesi(e.target.value)} placeholder="Opname Maret 2026" />
            </Field>
            <button type="button" className={btnPrimary} disabled={proses} onClick={() => void mulai()}>
              Mulai sesi baru
            </button>
          </div>
          <ul className="card-soft divide-y divide-border">
            {sesiList.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <div className="font-medium">{s.nama}</div>
                  <div className="text-muted">
                    {s.petugasNama} · <Badge>{s.status}</Badge>
                  </div>
                </div>
                <button type="button" className="text-xs font-medium text-muh-600 hover:underline" onClick={() => void bukaSesi(s)}>
                  Buka
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {sesi && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-semibold">{sesi.nama}</div>
              <Badge>{sesi.status}</Badge>
              <span className="ml-2 text-sm text-muted">{item.length} dipindai</span>
            </div>
            <div className="flex gap-2">
              <button type="button" className={btnGhost} onClick={() => setSesi(null)}>
                Daftar sesi
              </button>
              {sesi.status === 'berjalan' && (
                <button type="button" className={btnPrimary} onClick={() => void selesai()}>
                  Selesai
                </button>
              )}
            </div>
          </div>

          {sesi.status === 'berjalan' && (
            <div className="card-soft space-y-3 p-4">
              <Field label="Kode eksemplar" hint="Pindai label, lalu Enter.">
                <input
                  ref={ref}
                  className={`${inputCls} font-mono`}
                  value={kode}
                  autoFocus
                  disabled={proses}
                  onChange={(e) => setKode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void pindai()
                    }
                  }}
                  placeholder="PRP-000123"
                />
              </Field>
              <button type="button" className={btnPrimary} disabled={proses || !kode.trim()} onClick={() => void pindai()}>
                Catat
              </button>
            </div>
          )}

          <ul className="card-soft max-h-96 divide-y divide-border overflow-y-auto">
            {item.length === 0 ? (
              <li className="p-4 text-sm text-muted">Belum ada pindai.</li>
            ) : (
              [...item].reverse().map((i) => (
                <li key={i.id} className="px-4 py-2 text-sm">
                  <span className="font-mono font-medium">{i.eksemplarId}</span>
                  {i.judul ? ` · ${i.judul}` : ' · (tidak di katalog)'}
                  {i.statusSistem && <span className="text-muted"> · sistem: {i.statusSistem}</span>}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
