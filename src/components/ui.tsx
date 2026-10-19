import { useEffect, type ReactNode } from 'react'

export function PageHeader({ judul, keterangan, aksi }: { judul: string; keterangan?: string; aksi?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[#1a1d33]">{judul}</h1>
        {keterangan && <p className="mt-0.5 text-sm text-muted">{keterangan}</p>}
      </div>
      {aksi}
    </div>
  )
}

export function Notice({ tipe = 'info', children }: { tipe?: 'info' | 'warn' | 'error'; children: ReactNode }) {
  const gaya = {
    info: 'border-muh-200 bg-muh-50 text-muh-800',
    warn: 'border-amber-200 bg-amber-50 text-amber-800',
    error: 'border-red-200 bg-red-50 text-red-700',
  }[tipe]
  return <div className={`rounded-lg border px-3.5 py-3 text-sm ${gaya}`}>{children}</div>
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-muh-200 bg-muh-50 px-2.5 py-0.5 text-xs font-medium text-muh-700">
      {children}
    </span>
  )
}

export const inputCls =
  'w-full rounded-lg border border-[#cdd1e0] bg-white px-3 py-2 text-sm outline-none hover:border-[#aeb4c9] focus:border-muh-600 focus:ring-[3px] focus:ring-muh-600/15 disabled:bg-surface-2 disabled:text-muted'
export const btnPrimary =
  'inline-flex items-center justify-center rounded-lg bg-muh-600 px-4 py-2 text-sm font-semibold text-white hover:bg-muh-700 disabled:opacity-55'
export const btnGhost =
  'inline-flex items-center justify-center rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-[#2b2f4a] hover:bg-surface-2 disabled:opacity-55'
export const btnDanger =
  'inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-55'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.8125rem] font-medium text-[#2b2f4a]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Modal({ judul, onTutup, children }: { judul: string; onTutup: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onTutup()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onTutup])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4 print:hidden" onMouseDown={onTutup}>
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-xl bg-white p-5 sm:rounded-xl"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={judul}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">{judul}</h2>
          <button onClick={onTutup} className="text-sm text-muted hover:text-[#1a1d33]">
            Tutup
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function StatStrip({ items }: { items: { label: string; nilai: string | number }[] }) {
  return (
    <div className="card-soft mb-4 grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x">
      {items.map((it) => (
        <div key={it.label} className="p-4">
          <div className="text-xs text-muted">{it.label}</div>
          <div className="tabular mt-0.5 text-xl font-semibold tracking-tight">{it.nilai}</div>
        </div>
      ))}
    </div>
  )
}
