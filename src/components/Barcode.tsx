import { code128Modul } from '../lib/code128'

/** Barcode Code 128 sebagai SVG (tajam saat dicetak). Zona tenang 10 modul di kiri dan kanan. */
export default function Barcode({ teks, tinggi = 36 }: { teks: string; tinggi?: number }) {
  const modul = code128Modul(teks)
  const tenang = 10
  const garis: { x: number; w: number }[] = []
  let i = 0
  while (i < modul.length) {
    if (modul[i] === '1') {
      let j = i
      while (modul[j] === '1') j++
      garis.push({ x: i + tenang, w: j - i })
      i = j
    } else i++
  }
  const lebar = modul.length + tenang * 2
  return (
    <svg
      viewBox={`0 0 ${lebar} ${tinggi}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: `${tinggi}px`, display: 'block' }}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Barcode ${teks}`}
    >
      <rect width={lebar} height={tinggi} fill="#fff" />
      {garis.map((g) => (
        <rect key={g.x} x={g.x} y={0} width={g.w} height={tinggi} fill="#000" />
      ))}
    </svg>
  )
}
