import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { catat } from '../lib/data'
import { daftarJurnalStaf, formatTanggalJurnal, tanggapiJurnal } from '../lib/jurnal'
import type { JurnalBaca } from '../lib/tipe'
import { DAFTAR_KELAS } from '../lib/siswaAuth'
import { Badge, Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'

/** Staf: daftar jurnal baca siswa + beri tanggapan. */
export default function Jurnal() {
  const { user, profil } = useAuth()
  const [list, setList] = useState<JurnalBaca[]>([])
  const [kelas, setKelas] = useState('')
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [teks, setTeks] = useState('')
  const [proses, setProses] = useState(false)

  const muat = useCallback(async () => {
    setLoading(true)
    setGalat('')
    try {
      setList(await daftarJurnalStaf({ kelas: kelas || undefined }))
    } catch (e) {
      const kode = (e as { code?: string })?.code
      setGalat(
        kode === 'permission-denied'
          ? 'Tidak ada akses jurnal. Pastikan rules perpus_jurnal sudah ditempel.'
          : kode === 'failed-precondition'
            ? 'Indeks Firestore belum ada. Buka tautan indeks di konsol browser (F12) lalu buat.'
            : 'Gagal memuat jurnal.',
      )
      setList([])
    }
    setLoading(false)
  }, [kelas])

  useEffect(() => {
    void muat()
  }, [muat])

  async function simpanTanggapan(j: JurnalBaca) {
    if (!user || !profil) return
    setProses(true)
    setGalat('')
    try {
      await tanggapiJurnal(j.id, teks, { uid: user.uid, nama: profil.nama })
      void catat(profil, 'tanggapan jurnal', 'perpus_jurnal', j.id)
      setEditId(null)
      setTeks('')
      await muat()
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Gagal menyimpan tanggapan.')
    }
    setProses(false)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        judul="Jurnal baca"
        keterangan="Bacaan yang dicatat siswa. Guru dan pustakawan dapat memberi tanggapan singkat."
      />

      {galat && (
        <div className="mb-4">
          <Notice tipe="error">{galat}</Notice>
        </div>
      )}

      <div className="card-soft mb-4 p-4">
        <Field label="Filter kelas">
          <select className={inputCls} value={kelas} onChange={(e) => setKelas(e.target.value)}>
            <option value="">Semua kelas</option>
            {DAFTAR_KELAS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {loading ? (
        <div className="text-sm text-muted">Memuat…</div>
      ) : list.length === 0 ? (
        <Notice>Belum ada jurnal{kelas ? ` di kelas ${kelas}` : ''}.</Notice>
      ) : (
        <ul className="space-y-3">
          {list.map((j) => (
            <li key={j.id} className="card-soft p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-[#1a1d33]">{j.judul}</div>
                  <div className="mt-0.5 text-sm text-muted">
                    {j.siswaNama} · Kelas {j.kelas}
                    {j.pengarang ? ` · ${j.pengarang}` : ''}
                  </div>
                </div>
                <div className="text-xs text-muted">{formatTanggalJurnal(j.tanggalBaca)}</div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[#2b2f4a]">{j.catatan}</p>

              {j.tanggapanGuru && editId !== j.id && (
                <div className="mt-3 rounded-lg border border-muh-100 bg-muh-50/50 px-3 py-2">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge>Tanggapan</Badge>
                    {j.guruNama && <span className="text-xs text-muted">{j.guruNama}</span>}
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{j.tanggapanGuru}</p>
                </div>
              )}

              {editId === j.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    className={`${inputCls} min-h-[80px]`}
                    value={teks}
                    onChange={(e) => setTeks(e.target.value)}
                    maxLength={2000}
                    placeholder="Tanggapan untuk siswa…"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={btnPrimary}
                      disabled={proses || !teks.trim()}
                      onClick={() => void simpanTanggapan(j)}
                    >
                      {proses ? 'Menyimpan…' : 'Simpan tanggapan'}
                    </button>
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => {
                        setEditId(null)
                        setTeks('')
                      }}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => {
                      setEditId(j.id)
                      setTeks(j.tanggapanGuru || '')
                    }}
                  >
                    {j.tanggapanGuru ? 'Ubah tanggapan' : 'Beri tanggapan'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
