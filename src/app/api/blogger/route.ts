import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/blogger
 *
 * Memanggil Blogger API v3 untuk mengambil 5 postingan terbaru.
 *
 * Endpoint yang dipanggil:
 *   GET https://www.googleapis.com/blogger/v3/blogs/{blogId}/posts
 *     ?key={apiKey}
 *     &maxResults=5
 *     &orderBy=published
 *     &fields=kind,items(id,title,published,updated,url,labels,author/displayName)
 *
 * Environment Variables:
 *   BLOGGER_BLOG_ID  — ID blog Blogger (wajib)
 *   BLOGGER_API_KEY  — API Key Google Cloud (wajib)
 */

interface BloggerPost {
  id: string
  title: string
  published: string
  updated: string
  url: string
  labels?: string[]
  author?: {
    displayName: string
  }
}

// Mock fallback saat env vars belum dikonfigurasi
const MOCK_POSTS: BloggerPost[] = [
  {
    id: 'mock-1',
    title: 'Preview: Real Madrid vs Barcelona — El Clasico Akhir Pekan Ini',
    published: '2025-07-15T08:00:00.000+07:00',
    updated: '2025-07-15T10:30:00.000+07:00',
    url: 'https://blog.example.com/2025/07/preview-real-madrid-vs-barcelona.html',
    labels: ['La Liga', 'Preview'],
    author: { displayName: 'GOALZONE Editorial' },
  },
  {
    id: 'mock-2',
    title: 'Transfer Update: Florian Wirtz Resmi ke Liverpool Senilai €150 Juta',
    published: '2025-07-14T14:00:00.000+07:00',
    updated: '2025-07-14T16:00:00.000+07:00',
    url: 'https://blog.example.com/2025/07/transfer-wirtz-liverpool.html',
    labels: ['Transfer', 'Premier League'],
    author: { displayName: 'GOALZONE Editorial' },
  },
  {
    id: 'mock-3',
    title: 'Analisis Taktik: Guardiola Ubah Formasi 3-4-3 di Manchester City',
    published: '2025-07-13T09:00:00.000+07:00',
    updated: '2025-07-13T12:00:00.000+07:00',
    url: 'https://blog.example.com/2025/07/analisis-guardiola-3-4-3.html',
    labels: ['Analisis Taktis', 'Premier League'],
    author: { displayName: 'GOALZONE Editorial' },
  },
  {
    id: 'mock-4',
    title: 'Top 5 Pemain Muda Terbaik Musim 2024/25 — Lamine Yamal Mendominasi',
    published: '2025-07-12T11:00:00.000+07:00',
    updated: '2025-07-12T14:00:00.000+07:00',
    url: 'https://blog.example.com/2025/07/top-5-pemain-muda.html',
    labels: ['Opini', 'La Liga'],
    author: { displayName: 'GOALZONE Editorial' },
  },
  {
    id: 'mock-5',
    title: 'Jadwal Liga Champions 2025/26: Fase Baru Swiss Model',
    published: '2025-07-11T07:00:00.000+07:00',
    updated: '2025-07-11T09:00:00.000+07:00',
    url: 'https://blog.example.com/2025/07/jadwal-liga-champions.html',
    labels: ['Champions League'],
    author: { displayName: 'GOALZONE Editorial' },
  },
]

export async function GET(request: NextRequest) {
  const blogId = process.env.BLOGGER_BLOG_ID
  const apiKey = process.env.BLOGGER_API_KEY

  const { searchParams } = new URL(request.url)
  const maxResults = Math.min(parseInt(searchParams.get('max') || '5', 10), 10)

  // ─── Jika env vars terisi, panggil Blogger API v3 ──────────
  if (blogId && apiKey) {
    try {
      const url = new URL(`https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts`)
      url.searchParams.set('key', apiKey)
      url.searchParams.set('maxResults', String(maxResults))
      url.searchParams.set('orderBy', 'published')
      url.searchParams.set(
        'fields',
        'kind,items(id,title,published,updated,url,labels,author/displayName)'
      )

      const res = await fetch(url.toString(), {
        next: { revalidate: 300 }, // cache 5 menit
        headers: { 'Accept': 'application/json' },
      })

      if (!res.ok) {
        const errorBody = await res.text()
        console.error(`Blogger API error ${res.status}:`, errorBody)
        return NextResponse.json(
          {
            error: `Blogger API returned ${res.status}`,
            detail: errorBody,
            source: 'blogger-api',
          },
          { status: res.status }
        )
      }

      const data = await res.json()

      const posts: BloggerPost[] = (data.items || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        published: item.published,
        updated: item.updated,
        url: item.url,
        labels: item.labels || [],
        author: item.author ? { displayName: item.author.displayName } : null,
      }))

      return NextResponse.json({
        posts,
        total: posts.length,
        source: 'blogger-api',
        blogId,
      })
    } catch (err: any) {
      console.error('Blogger API fetch error:', err)
      return NextResponse.json(
        { error: 'Failed to fetch from Blogger API', detail: err.message, source: 'blogger-api' },
        { status: 502 }
      )
    }
  }

  // ─── Fallback: Mock data ────────────────────────────────────
  return NextResponse.json({
    posts: MOCK_POSTS.slice(0, maxResults),
    total: MOCK_POSTS.length,
    source: 'mock',
    blogId: blogId || null,
    notice: !blogId
      ? 'BLOGGER_BLOG_ID belum dikonfigurasi. Set BLOGGER_BLOG_ID dan BLOGGER_API_KEY di .env.local'
      : !apiKey
        ? 'BLOGGER_API_KEY belum dikonfigurasi. Set BLOGGER_API_KEY di .env.local'
        : null,
  })
}
