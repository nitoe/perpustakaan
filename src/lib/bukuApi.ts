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
  /** URL sampul katalog publik (opsional; unduh lewat cariSampulBuku / tombol sampul). */
  sampulUrl?: string
  sumber: 'openlibrary' | 'googlebooks' | 'gemini'
}

export interface HasilSampul {
  file: File
  sumber: 'openlibrary' | 'googlebooks'
  url: string
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

/** Naikkan http→https dan perbesar thumbnail Google Books bila memungkinkan. */
function normUrlGambar(url: string): string {
  let u = url.trim().replace(/^http:\/\//i, 'https://')
  // Google Books: zoom=0/1 sering lebih besar dari thumbnail default
  if (u.includes('books.google.') && !/[?&]zoom=/.test(u)) {
    u += (u.includes('?') ? '&' : '?') + 'zoom=1'
  }
  return u
}

/**
 * Unduh gambar dari URL katalog. Mengembalikan null jika gagal / terlalu kecil (placeholder).
 * Open Library mendukung CORS; Google Books sering juga.
 */
async function unduhGambarSampul(url: string): Promise<File | null> {
  try {
    const res = await fetch(normUrlGambar(url), {
      mode: 'cors',
      redirect: 'follow',
      headers: { Accept: 'image/*,*/*' },
    })
    if (!res.ok) return null
    const blob = await res.blob()
    const tipe = blob.type || res.headers.get('content-type') || ''
    if (tipe && !tipe.startsWith('image/') && !tipe.includes('octet-stream')) return null
    // Placeholder OL / gambar rusak biasanya sangat kecil
    if (blob.size < 2500) return null
    const ext = tipe.includes('png') ? 'png' : tipe.includes('webp') ? 'webp' : 'jpg'
    return new File([blob], `sampul-katalog.${ext}`, { type: tipe.startsWith('image/') ? tipe : 'image/jpeg' })
  } catch {
    return null
  }
}

/** Kandidat URL sampul dari ISBN (Open Library L/M, Google Books). */
async function kandidatUrlDariIsbn(isbn: string): Promise<{ url: string; sumber: 'openlibrary' | 'googlebooks' }[]> {
  const id = isbnBersih(isbn)
  const out: { url: string; sumber: 'openlibrary' | 'googlebooks' }[] = []
  if (id.length < 10) return out

  // default=false → 404 jika tidak ada sampul (bukan gambar 1x1)
  out.push({
    url: `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(id)}-L.jpg?default=false`,
    sumber: 'openlibrary',
  })
  out.push({
    url: `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(id)}-M.jpg?default=false`,
    sumber: 'openlibrary',
  })

  try {
    const g = await lookupIsbnGoogle(id)
    if (g?.sampulUrl) out.push({ url: g.sampulUrl, sumber: 'googlebooks' })
  } catch {
    /* abaikan */
  }
  return out
}

/** Kandidat dari pencarian judul (Open Library cover_i + Google Books). */
async function kandidatUrlDariJudul(
  judul: string,
  pengarang?: string,
): Promise<{ url: string; sumber: 'openlibrary' | 'googlebooks' }[]> {
  const out: { url: string; sumber: 'openlibrary' | 'googlebooks' }[] = []
  const q = judul.trim()
  if (q.length < 2) return out

  try {
    const list = await cariJudul(pengarang ? `${q} ${pengarang}` : q, 5)
    for (const h of list) {
      if (h.sampulUrl) out.push({ url: h.sampulUrl, sumber: h.sumber === 'googlebooks' ? 'googlebooks' : 'openlibrary' })
      if (h.isbn) {
        const id = isbnBersih(h.isbn)
        if (id.length >= 10) {
          out.push({
            url: `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(id)}-L.jpg?default=false`,
            sumber: 'openlibrary',
          })
        }
      }
    }
  } catch {
    /* abaikan */
  }

  try {
    const url = new URL('https://www.googleapis.com/books/v1/volumes')
    url.searchParams.set('q', pengarang ? `intitle:${q}+inauthor:${pengarang}` : `intitle:${q}`)
    url.searchParams.set('maxResults', '3')
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
    if (res.ok) {
      const data = (await res.json()) as {
        items?: { volumeInfo?: { imageLinks?: { thumbnail?: string; smallThumbnail?: string } } }[]
      }
      for (const it of data.items || []) {
        const img = it.volumeInfo?.imageLinks?.thumbnail || it.volumeInfo?.imageLinks?.smallThumbnail
        if (img) out.push({ url: img, sumber: 'googlebooks' })
      }
    }
  } catch {
    /* abaikan */
  }

  // unik by URL
  const seen = new Set<string>()
  return out.filter((x) => {
    const k = normUrlGambar(x.url)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/**
 * Cari sampul di katalog publik (Open Library → Google Books).
 * Tidak memanggil AI. Mengembalikan null jika tidak ditemukan.
 */
export async function cariSampulBuku(input: {
  judul?: string
  isbn?: string
  pengarang?: string
}): Promise<HasilSampul | null> {
  const kandidat: { url: string; sumber: 'openlibrary' | 'googlebooks' }[] = []
  const isbn = (input.isbn || '').trim()
  if (isbn) kandidat.push(...(await kandidatUrlDariIsbn(isbn)))
  const judul = (input.judul || '').trim()
  if (judul.length >= 2) kandidat.push(...(await kandidatUrlDariJudul(judul, input.pengarang)))

  const seen = new Set<string>()
  for (const k of kandidat) {
    const u = normUrlGambar(k.url)
    if (seen.has(u)) continue
    seen.add(u)
    const file = await unduhGambarSampul(u)
    if (file) return { file, sumber: k.sumber, url: u }
  }
  return null
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
    sinopsis: info.description,
    bahasa: bahasa || undefined,
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
    return lookupIsbnGoogle(id)
  }
  if (!res.ok) {
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
  if (!pengarang) {
    try {
      const s = await cariJudul(id, 1)
      if (s[0]?.pengarang) pengarang = s[0].pengarang
    } catch {
      /* abaikan */
    }
  }

  const publishers = d.publishers
  const penerbit = Array.isArray(publishers) && typeof publishers[0] === 'string' ? publishers[0] : undefined
  const tahun = ambilTahun(typeof d.publish_date === 'string' ? d.publish_date : undefined)
  const isbn13 = Array.isArray(d.isbn_13) ? String(d.isbn_13[0]) : undefined
  const isbn10 = Array.isArray(d.isbn_10) ? String(d.isbn_10[0]) : undefined
  const desk = d.description
  let sinopsis: string | undefined
  if (typeof desk === 'string') sinopsis = desk
  else if (desk && typeof desk === 'object' && 'value' in desk && typeof (desk as { value: unknown }).value === 'string') {
    sinopsis = (desk as { value: string }).value
  }

  return {
    judul,
    pengarang,
    penerbit,
    tahun,
    isbn: isbn13 || isbn10 || id,
    sinopsis,
    bahasa: 'Indonesia',
    sampulUrl: `https://covers.openlibrary.org/b/isbn/${id}-L.jpg?default=false`,
    sumber: 'openlibrary',
  }
}

/** Cari judul di Open Library (maks. beberapa hasil). */
export async function cariJudul(q: string, limit = 8): Promise<HasilLookupBuku[]> {
  const url = new URL('https://openlibrary.org/search.json')
  url.searchParams.set('q', q.trim())
  url.searchParams.set('limit', String(Math.min(20, Math.max(1, limit))))
  url.searchParams.set('fields', 'key,title,author_name,first_publish_year,isbn,publisher,language,cover_i')
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Pencarian gagal (${res.status}).`)
  const data = (await res.json()) as { docs?: Record<string, unknown>[] }
  const docs = data.docs || []
  return docs
    .map((d) => {
      const judul = typeof d.title === 'string' ? d.title : undefined
      if (!judul) return null
      const authors = Array.isArray(d.author_name) ? (d.author_name as string[]) : []
      const isbns = Array.isArray(d.isbn) ? (d.isbn as string[]) : []
      const isbn = isbns.find((x) => String(x).length === 13) || isbns[0]
      const pubs = Array.isArray(d.publisher) ? (d.publisher as string[]) : []
      const tahun = typeof d.first_publish_year === 'number' ? d.first_publish_year : undefined
      const coverId = typeof d.cover_i === 'number' ? d.cover_i : undefined
      return {
        judul,
        pengarang: authors.length ? authors.join('; ') : undefined,
        penerbit: pubs[0],
        tahun: tahun && tahun >= 1000 && tahun <= 2100 ? tahun : undefined,
        isbn: isbn ? String(isbn) : undefined,
        sampulUrl: coverId
          ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg?default=false`
          : isbn
            ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(String(isbn))}-L.jpg?default=false`
            : undefined,
        sumber: 'openlibrary' as const,
      }
    })
    .filter(Boolean) as HasilLookupBuku[]
}
