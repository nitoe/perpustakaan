/** Pembaca/penulis CSV sederhana (kutip ganda, pemisah otomatis , ; atau tab). Tanpa pustaka luar. */

export function parseCsv(teks: string): string[][] {
  const t = teks.replace(/^\uFEFF/, '')
  const barisPertama = t.split(/\r?\n/, 1)[0] ?? ''
  const hitung = (c: string) => barisPertama.split(c).length - 1
  const kandidat: [string, number][] = [
    [';', hitung(';')],
    [',', hitung(',')],
    ['\t', hitung('\t')],
  ]
  kandidat.sort((a, b) => b[1] - a[1])
  const pemisah = kandidat[0]![1] > 0 ? kandidat[0]![0] : ','

  const hasil: string[][] = []
  let baris: string[] = []
  let sel = ''
  let kutip = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]!
    if (kutip) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          sel += '"'
          i++
        } else kutip = false
      } else sel += c
    } else if (c === '"') kutip = true
    else if (c === pemisah) {
      baris.push(sel)
      sel = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      baris.push(sel)
      sel = ''
      hasil.push(baris)
      baris = []
    } else sel += c
  }
  if (sel !== '' || baris.length > 0) {
    baris.push(sel)
    hasil.push(baris)
  }
  return hasil.filter((b) => b.some((s) => s.trim() !== ''))
}

export function buatCsv(baris: string[][], pemisah = ';'): string {
  const esc = (s: string) => (/["\n\r;,\t]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s)
  // BOM supaya Excel membaca sebagai UTF-8.
  return '\uFEFF' + baris.map((b) => b.map(esc).join(pemisah)).join('\r\n') + '\r\n'
}

export function unduhTeks(nama: string, isi: string, jenis = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([isi], { type: jenis }))
  const a = document.createElement('a')
  a.href = url
  a.download = nama
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
