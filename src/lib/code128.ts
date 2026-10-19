/**
 * Pembuat barcode Code 128 (set B, ASCII 32-126) tanpa pustaka luar.
 * Hasil: deretan modul '1' (garis) dan '0' (spasi). Dapat dibaca pemindai barcode USB
 * maupun pembaca kamera. Kode eksemplar seperti PRP-000123 memakai set B.
 */
const POLA = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232',
]
const HENTI = '2331112'
const START_B = 104

function keModul(pola: string): string {
  let hasil = ''
  let garis = true
  for (const d of pola) {
    hasil += (garis ? '1' : '0').repeat(Number(d))
    garis = !garis
  }
  return hasil
}

export function code128Modul(teks: string): string {
  const nilai: number[] = []
  for (const ch of teks) {
    const k = ch.charCodeAt(0)
    if (k < 32 || k > 126) throw new Error('Karakter tidak didukung barcode: ' + ch)
    nilai.push(k - 32)
  }
  let jumlah = START_B
  nilai.forEach((v, i) => {
    jumlah += v * (i + 1)
  })
  const cek = jumlah % 103
  return [START_B, ...nilai, cek].map((v) => keModul(POLA[v]!)).join('') + keModul(HENTI)
}
