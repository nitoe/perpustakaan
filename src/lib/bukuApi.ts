/**
 * Lookup metadata buku dari Open Library / Google Books (gratis, tanpa API key).
 * Generate AI (metadata + sampul) lewat Cloud Function — lihat src/lib/generateBukuAi.ts.
 * Catatan: cakupan judul Indonesia di katalog publik terbatas; data selalu bisa diedit manual.
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
  sumber: 'openlibrary' | 'googlebooks' | 'gemini'
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


/** Lookup Google Books by ISBN (tanpa API key; kuota anonim). */
async function lookupIsbnGoogle(isbn: string): Promise<HasilLookupBuku | null> {
  const id = isbnBersih(isbn)
  if (id.length < 10) return null
  const url = new URL('https://www.googleapis.com/books/v1/volumes')
  url.searchParams.set('q', `isbn:${id}`)
  url.searchParams.set('maxResults', '1')
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const data = (await res.json()) as {
    items?: {
      volumeInfo?: {
        title?: string
        authors?: string[]
        publisher?: string
        publishedDate?: string
        description?: string
        language?: string
        industryIdentifiers?: { type?: string; identifier?: string }[]
        imageLinks?: { thumbnail?: string; smallThumbnail?: string }
      }
    }[]
  }
  const info = data.items?.[0]?.volumeInfo
  if (!info?.title) return null
  const ids = info.industryIdentifiers ?? []
  const isbn13 = ids.find((x) => x.type === 'ISBN_13')?.identifier
  const isbn10 = ids.find((x) => x.type === 'ISBN_10')?.identifier
  const tahun = ambilTahun(info.publishedDate)
  const bahasa =
    info.language === 'id' ? 'Indonesia' : info.language === 'en' ? 'Inggris' : info.language
  return {
    judul: info.title,
    pengarang: info.authors?.join('; '),
    penerbit: info.publisher,
    tahun,
    isbn: isbn13 || isbn10 || id,
    sinopsis: info.description?.slice(0, 2000),
    bahasa,
    sampulUrl: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail,
    sumber: 'googlebooks',
  }
}

/** Lookup by ISBN (10 atau 13). Open Library dulu, lalu Google Books. */
export async function lookupIsbn(isbn: string): Promise<HasilLookupBuku | null> {
  const id = isbnBersih(isbn)
  if (id.length < 10) throw new Error('ISBN minimal 10 digit.')

  const res = await fetch(`https://openlibrary.org/isbn/${encodeURIComponent(id)}.json`, {
    headers: { Accept: 'application/json' },
  })
  if (res.status === 404) {
    // Banyak ISBN Indonesia tidak ada di Open Library — coba Google Books
    return lookupIsbnGoogle(id)
  }
  if (!res.ok) {
    // Open Library error: tetap coba Google Books
    try {
      const g = await lookupIsbnGoogle(id)
      if (g) return g
    } catch {
      /* abaikan */
    }
    throw new Error(`Open Library tidak merespons (${res.status}). Coba lagi nanti.`)
  }

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
