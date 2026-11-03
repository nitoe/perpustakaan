/**
 * Lookup metadata buku dari Open Library (gratis, tanpa API key).
 * Dipakai untuk mengisi form dari ISBN atau judul.
 * Catatan: cakupan judul Indonesia terbatas; data selalu bisa diedit manual.
 */

export interface HasilLookupBuku {
  judul?: string
  pengarang?: string
  penerbit?: string
  tahun?: number
  isbn?: string
  sinopsis?: string
  bahasa?: string
  jenjangBaca?: string
  /** URL sampul Open Library (opsional; tidak otomatis diunduh ke Firestore). */
  sampulUrl?: string
  sumber: 'openlibrary' | 'gemini'
}

function isbnBersih(s: string): string {
  return s.replace(/[^0-9Xx]/g, '')
}

function ambilTahun(publishDate?: string): number | undefined {
  if (!publishDate) return undefined
  const m = publishDate.match(/(\d{4})/)
  if (!m) return undefined
  const y = Number(m[1])
  return y >= 1000 && y <= 2100 ? y : undefined
}

function namaPengarang(authors: unknown): string | undefined {
  if (!Array.isArray(authors) || authors.length === 0) return undefined
  const nama = authors
    .map((a) => {
      if (a && typeof a === 'object' && 'name' in a && typeof (a as { name: unknown }).name === 'string') {
        return (a as { name: string }).name
      }
      return null
    })
    .filter(Boolean) as string[]
  return nama.length ? nama.join('; ') : undefined
}

/** Lookup by ISBN (10 atau 13). */
export async function lookupIsbn(isbn: string): Promise<HasilLookupBuku | null> {
  const id = isbnBersih(isbn)
  if (id.length < 10) throw new Error('ISBN minimal 10 digit.')

  const res = await fetch(`https://openlibrary.org/isbn/${encodeURIComponent(id)}.json`, {
    headers: { Accept: 'application/json' },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Open Library tidak merespons (${res.status}). Coba lagi nanti.`)

  const d = (await res.json()) as Record<string, unknown>
  const judul = typeof d.title === 'string' ? d.title : undefined
  if (!judul) return null

  let pengarang = namaPengarang(d.authors)
  // authors sering hanya { key: "/authors/..." } — ambil dari search bila perlu
  if (!pengarang) {
    try {
      const s = await cariJudul(id, 1)
      if (s[0]?.pengarang) pengarang = s[0].pengarang
    } catch {
      /* abaikan */
    }
  }

  const publishers = d.publishers
  const penerbit =
    Array.isArray(publishers) && typeof publishers[0] === 'string'
      ? publishers[0]
      : Array.isArray(publishers) && publishers[0] && typeof publishers[0] === 'object' && 'name' in (publishers[0] as object)
        ? String((publishers[0] as { name: string }).name)
        : undefined

  const desk = d.description
  let sinopsis: string | undefined
  if (typeof desk === 'string') sinopsis = desk
  else if (desk && typeof desk === 'object' && 'value' in desk) sinopsis = String((desk as { value: string }).value)

  const isbn13 = Array.isArray(d.isbn_13) ? String(d.isbn_13[0]) : undefined
  const isbn10 = Array.isArray(d.isbn_10) ? String(d.isbn_10[0]) : undefined

  return {
    judul,
    pengarang,
    penerbit,
    tahun: ambilTahun(typeof d.publish_date === 'string' ? d.publish_date : undefined),
    isbn: isbn13 || isbn10 || id,
    sinopsis: sinopsis?.slice(0, 2000),
    bahasa: Array.isArray(d.languages) ? undefined : undefined,
    sampulUrl: `https://covers.openlibrary.org/b/isbn/${id}-M.jpg`,
    sumber: 'openlibrary',
  }
}

/** Cari dari judul / kata kunci. */
export async function cariJudul(q: string, batas = 8): Promise<HasilLookupBuku[]> {
  const query = q.trim()
  if (query.length < 2) return []

  const url = new URL('https://openlibrary.org/search.json')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(batas))
  url.searchParams.set('fields', 'key,title,author_name,first_publish_year,isbn,publisher,language,cover_i')

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Pencarian gagal (${res.status}).`)

  const data = (await res.json()) as { docs?: Record<string, unknown>[] }
  const docs = data.docs ?? []
  return docs
    .map((d) => {
      const judul = typeof d.title === 'string' ? d.title : undefined
      if (!judul) return null
      const authors = Array.isArray(d.author_name) ? (d.author_name as string[]).join('; ') : undefined
      const isbns = Array.isArray(d.isbn) ? (d.isbn as string[]) : []
      const isbn = isbns.find((x) => x.length === 13) || isbns[0]
      const publishers = Array.isArray(d.publisher) ? (d.publisher as string[]) : []
      const tahun = typeof d.first_publish_year === 'number' ? d.first_publish_year : undefined
      const coverId = typeof d.cover_i === 'number' ? d.cover_i : undefined
      return {
        judul,
        pengarang: authors,
        penerbit: publishers[0],
        tahun: tahun && tahun >= 1000 && tahun <= 2100 ? tahun : undefined,
        isbn,
        sampulUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : undefined,
        sumber: 'openlibrary' as const,
      }
    })
    .filter(Boolean) as HasilLookupBuku[]
}


/** Model Gemini yang dicoba berurutan (sama pola Penilaian). */
const MODEL_GEMINI = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']

function thinkingGemini(nama: string): Record<string, unknown> | undefined {
  if (/^gemini-2\.5-/.test(nama)) return { thinkingBudget: 0 }
  if (/^gemini-3/.test(nama)) return { thinkingLevel: 'low' }
  return undefined
}

function ambilJson(teks: string): Record<string, unknown> {
  const t = teks.trim()
  const mulai = t.indexOf('{')
  const akhir = t.lastIndexOf('}')
  if (mulai < 0 || akhir <= mulai) throw new Error('Jawaban AI bukan JSON yang valid.')
  return JSON.parse(t.slice(mulai, akhir + 1)) as Record<string, unknown>
}

/**
 * Generate identitas buku dari judul saja lewat Gemini.
 * Membutuhkan VITE_GEMINI_API_KEY di .env (sama key yang dipakai Penilaian bila diizinkan).
 * Hasil selalu bisa diedit manual; jangan menganggap ISBN/sinopsis 100% akurat.
 */
export async function generateDariJudulAi(judul: string): Promise<HasilLookupBuku> {
  const q = judul.trim()
  if (q.length < 2) throw new Error('Isi judul (minimal 2 huruf) dulu.')

  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim()
  if (!apiKey) {
    throw new Error(
      'VITE_GEMINI_API_KEY belum diatur di .env. Salin key Gemini ke berkas .env lalu restart npm run dev.',
    )
  }

  const sistem = `Anda asisten katalog perpustakaan sekolah dasar di Indonesia.
Tugas: dari judul buku saja, isi metadata bibliografi sebaik mungkin.
Aturan ketat:
- Jawab HANYA JSON valid tanpa markdown dan tanpa penjelasan.
- Jangan mengarang ISBN. Jika tidak yakin, biarkan isbn string kosong.
- Sinopsis singkat (2–4 kalimat), netral, cocok untuk katalog sekolah.
- Bahasa: "Indonesia" atau "Inggris" atau nama bahasa lain yang relevan.
- Jenjang baca contoh: "Kelas 1-2", "Kelas 3-4", "Kelas 5-6", "Guru", atau kosong.
- Tahun hanya angka 4 digit bila diketahui; jika tidak yakin null.
- Pengarang dan penerbit: isi bila umum diketahui; jika tidak yakin string kosong.
- Jangan menambah field di luar skema.`

  const user = `Judul buku: ${q}

Format JSON wajib:
{"judul":"...","pengarang":"...","penerbit":"...","tahun":null,"isbn":"","sinopsis":"...","bahasa":"Indonesia","jenjangBaca":""}`

  const gagal: string[] = []
  let terakhir = 'Gemini tidak menjawab.'

  for (const nama of MODEL_GEMINI) {
    for (let percobaan = 0; percobaan < 2; percobaan++) {
      const generationConfig: Record<string, unknown> = {
        temperature: 0.3,
        responseMimeType: 'application/json',
        maxOutputTokens: 2048,
      }
      const thinking = thinkingGemini(nama)
      if (thinking) generationConfig.thinkingConfig = thinking

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${nama}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: sistem }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig,
          }),
        },
      )
      const json = (await res.json().catch(() => ({}))) as {
        error?: { message?: string }
        candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
      }
      if (!res.ok) {
        terakhir = `Gemini (${nama}) ${res.status}: ${json?.error?.message || 'gagal'}`
        if (res.status === 404) {
          gagal.push(`${nama} 404`)
          break
        }
        if ([429, 500, 503].includes(res.status)) {
          if (percobaan === 0) {
            await new Promise((r) => setTimeout(r, 1500))
            continue
          }
          gagal.push(`${nama} ${res.status}`)
          break
        }
        throw new Error(terakhir)
      }
      const kandidat = json?.candidates?.[0]
      const teks = kandidat?.content?.parts?.map((p) => p.text || '').join('') || ''
      if (!teks) {
        terakhir =
          `Gemini (${nama}) mengembalikan jawaban kosong` +
          (kandidat?.finishReason ? ` (${kandidat.finishReason}).` : '.')
        gagal.push(`${nama} kosong`)
        break
      }
      let data: Record<string, unknown>
      try {
        data = ambilJson(teks)
      } catch {
        terakhir = `Gemini (${nama}) tidak mengembalikan JSON valid.`
        gagal.push(`${nama} json`)
        break
      }

      const judulOut = typeof data.judul === 'string' && data.judul.trim() ? data.judul.trim() : q
      const pengarang =
        typeof data.pengarang === 'string' && data.pengarang.trim() ? data.pengarang.trim() : undefined
      const penerbit =
        typeof data.penerbit === 'string' && data.penerbit.trim() ? data.penerbit.trim() : undefined
      let tahun: number | undefined
      if (typeof data.tahun === 'number' && data.tahun >= 1000 && data.tahun <= 2100) tahun = data.tahun
      else if (typeof data.tahun === 'string') {
        const y = Number(data.tahun.replace(/\D/g, '').slice(0, 4))
        if (y >= 1000 && y <= 2100) tahun = y
      }
      const isbnRaw = typeof data.isbn === 'string' ? data.isbn.replace(/[^0-9Xx]/g, '') : ''
      const isbn = isbnRaw.length >= 10 ? isbnRaw : undefined
      const sinopsis =
        typeof data.sinopsis === 'string' && data.sinopsis.trim()
          ? data.sinopsis.trim().slice(0, 2000)
          : undefined
      const bahasa =
        typeof data.bahasa === 'string' && data.bahasa.trim() ? data.bahasa.trim() : 'Indonesia'
      const jenjangBaca =
        typeof data.jenjangBaca === 'string' && data.jenjangBaca.trim()
          ? data.jenjangBaca.trim()
          : undefined

      return {
        judul: judulOut.slice(0, 300),
        pengarang,
        penerbit,
        tahun,
        isbn,
        sinopsis,
        bahasa,
        jenjangBaca,
        sumber: 'gemini',
      }
    }
  }

  throw new Error(gagal.length > 1 ? `${terakhir} (percobaan: ${gagal.join(', ')})` : terakhir)
}
