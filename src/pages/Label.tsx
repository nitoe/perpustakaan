import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { collection, documentId, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { kodeEksemplar } from '../lib/penomoran'
import type { Eksemplar } from '../lib/tipe'
import Barcode from '../components/Barcode'
import { Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from '../components/ui'

const MAKS_LABEL = 300

export default function Label() {
  const [sp] = useSearchParams()
  const bukuId = sp.get('buku')
  const [dari, setDari] = useState(sp.get('dari') ?? '')
  const [sampai, setSampai] = useState(sp.get('sampai') ?? '')
  const [kolom, setKolom] = useState(3)
  const [garis, setGaris] = useState(true)
  const [data, setData] = useState<Eksemplar[] | null>(null)
  const [galat, setGalat] = useState('')
  const [memuat, setMemuat] = useState(false)

  const muat = useCallback(
    async (dariNo: string, sampaiNo: string) => {
      setGalat('')
      setMemuat(true)
      try {
        let q
        if (bukuId) {
          q = query(collection(db, 'perpus_eksemplar'), where('bukuId', '==', bukuId), limit(MAKS_LABEL))
        } else {
          const a = Number(dariNo)
          const b = Number(sampaiNo)
          if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < a) {
            setGalat('Isi nomor awal dan akhir dengan benar (mis. 1 sampai 50).')
            setMemuat(false)
            return
          }
          if (b - a + 1 > MAKS_LABEL) {
            setGalat(`Maksimal ${MAKS_LABEL} label sekali cetak.`)
            setMemuat(false)
            return
          }
          q = query(
            collection(db, 'perpus_eksemplar'),
            where(documentId(), '>=', kodeEksemplar(a)),
            where(documentId(), '<=', kodeEksemplar(b)),
            orderBy(documentId()),
          )
        }
        const snap = await getDocs(q)
        const hasil = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as unknown as Eksemplar)
          .filter((e) => e.status !== 'dihapus')
          .sort((x, y) => x.id.localeCompare(y.id))
        setData(hasil)
        if (hasil.length === 0) setGalat('Tidak ada eksemplar pada pilihan ini.')
      } catch (e) {
        const kode = (e as { code?: string })?.code
        setGalat(kode === 'permission-denied' ? 'Anda tidak memiliki akses.' : 'Gagal memuat eksemplar.')
      }
      setMemuat(false)
    },
    [bukuId],
  )

  useEffect(() => {
    if (bukuId || (sp.get('dari') && sp.get('sampai'))) void muat(sp.get('dari') ?? '', sp.get('sampai') ?? '')
  }, [bukuId, sp, muat])

  return (
    <div className="mx-auto max-w-5xl">
      <div className="print:hidden">
        <PageHeader judul="Cetak label" keterangan="Label barcode untuk ditempel pada buku. Pemindai membaca kode eksemplar (mis. PRP-000123)." />
        <div className="card-soft mb-4 grid gap-4 p-4 sm:grid-cols-4">
          {bukuId ? (
            <div className="sm:col-span-2 text-sm text-muted">Label untuk semua eksemplar satu buku.</div>
          ) : (
            <>
              <Field label="Dari nomor">
                <input className={inputCls} inputMode="numeric" value={dari} onChange={(e) => setDari(e.target.value)} placeholder="1" />
              </Field>
              <Field label="Sampai nomor">
                <input className={inputCls} inputMode="numeric" value={sampai} onChange={(e) => setSampai(e.target.value)} placeholder="50" />
              </Field>
            </>
          )}
          <Field label="Kolom per baris" hint="3 dianjurkan; 4 untuk label kecil.">
            <select className={inputCls} value={kolom} onChange={(e) => setKolom(Number(e.target.value))}>
              {[2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" checked={garis} onChange={(e) => setGaris(e.target.checked)} />
            Garis potong
          </label>
          <div className="flex gap-3 sm:col-span-4">
            {!bukuId && (
              <button className={btnGhost} disabled={memuat} onClick={() => void muat(dari, sampai)}>
                {memuat ? 'Memuat…' : 'Tampilkan'}
              </button>
            )}
            <button className={btnPrimary} disabled={!data || data.length === 0} onClick={() => window.print()}>
              Cetak {data && data.length > 0 ? `(${data.length} label)` : ''}
            </button>
          </div>
        </div>
        {galat && (
          <div className="mb-4">
            <Notice tipe={data && data.length === 0 ? 'warn' : 'error'}>{galat}</Notice>
          </div>
        )}
        <div className="mb-3 text-xs text-muted">
          Tips: di jendela cetak pilih ukuran A4, skala 100%, dan matikan "Header dan footer". Uji dulu dengan satu lembar biasa sebelum mencetak di kertas stiker.
        </div>
      </div>

      <style>{'@media print { @page { size: A4; margin: 8mm; } body { background: #fff; } }'}</style>
      {data && data.length > 0 && (
        <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${kolom}, minmax(0, 1fr))` }}>
          {data.map((e) => (
            <div
              key={e.id}
              className="break-inside-avoid p-2"
              style={{ border: garis ? '1px dashed #9aa0b5' : '1px solid transparent', background: '#fff' }}
            >
              <div className="text-[7pt] font-semibold uppercase tracking-wide text-[#1a1d33]">Perpustakaan SDM 01 Kukusan</div>
              <div className="my-1">
                <Barcode teks={e.id} tinggi={34} />
              </div>
              <div className="text-center font-mono text-[9pt] font-bold tracking-wider text-black">{e.id}</div>
              <div className="mt-0.5 line-clamp-2 text-[7.5pt] leading-tight text-[#1a1d33]">{e.judul}</div>
              {e.rak && <div className="text-[7pt] text-[#5b6275]">Rak {e.rak}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
