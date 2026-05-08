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

  // ─── No API key configured ──────────────────────────────────
  return NextResponse.json({
    posts: [],
    total: 0,
    source: 'none',
    blogId: blogId || null,
    notice: !blogId
      ? 'BLOGGER_BLOG_ID belum dikonfigurasi. Set BLOGGER_BLOG_ID dan BLOGGER_API_KEY di .env.local'
      : !apiKey
        ? 'BLOGGER_API_KEY belum dikonfigurasi. Set BLOGGER_API_KEY di .env.local'
        : null,
  })
}
