import { NextResponse } from 'next/server'

/* ─────────────────────────────────────────────
   GET /api/google-trends?geo=ID
   Fetches Google Trends Daily Search Trends
   via the public RSS feed and returns
   structured JSON for the frontend widget.
   ───────────────────────────────────────────── */

// Simple in-memory cache (10 min TTL)
interface CacheEntry {
  data: TrendingItem[]
  fetchedAt: string
  expiry: number
}
const cache = new Map<string, CacheEntry>()

function getCached(key: string): CacheEntry | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiry) {
    cache.delete(key)
    return undefined
  }
  return entry
}

function setCache(key: string, data: TrendingItem[]): void {
  cache.set(key, {
    data,
    fetchedAt: new Date().toISOString(),
    expiry: Date.now() + 10 * 60 * 1000, // 10 minutes
  })
  // Evict old entries if too many
  if (cache.size > 10) {
    const firstKey = cache.keys().next().value
    if (firstKey) cache.delete(firstKey)
  }
}

interface TrendingItem {
  title: string
  traffic: string
  picture: string
  pictureSource: string
  newsItems: {
    title: string
    url: string
    picture: string
    source: string
  }[]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const geo = searchParams.get('geo') || 'ID'

    const cacheKey = `trends:${geo}`
    const cached = getCached(cacheKey)
    if (cached) {
      return NextResponse.json({ data: cached.data, fetchedAt: cached.fetchedAt, source: 'cache' })
    }

    const rssUrl = `https://trends.google.com/trending/rss?geo=${geo}`
    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'GOALZONE-Bot/1.0 (+https://goalzone.vercel.app)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      throw new Error(`RSS fetch failed: ${res.status}`)
    }

    const xml = await res.text()
    const items = parseRSS(xml)

    const result = { data: items, fetchedAt: new Date().toISOString() }

    setCache(cacheKey, items)

    return NextResponse.json({ ...result, source: 'live' })
  } catch (error: any) {
    console.error('Google Trends API error:', error.message)

    // Fallback mock data
    return NextResponse.json({
      data: getFallbackItems(),
      fetchedAt: new Date().toISOString(),
      source: 'fallback',
    })
  }
}

/* ─────────────────────────────────────────────
   Simple RSS parser — no external deps needed.
   Extracts items from Google Trends RSS with
   the ht: prefixed custom tags.
   ───────────────────────────────────────────── */
function parseRSS(xml: string): TrendingItem[] {
  const items: TrendingItem[] = []

  // Match each <item>...</item> block
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match: RegExpExecArray | null

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]

    const title = extractTag(block, 'title') || ''
    const traffic = extractAttr(block, 'ht:approx_traffic') || ''
    const picture = extractAttr(block, 'ht:picture') || ''
    const pictureSource = extractAttr(block, 'ht:picture_source') || ''

    // Extract news items
    const newsItems: TrendingItem['newsItems'] = []
    const newsRegex = /<ht:news_item>([\s\S]*?)<\/ht:news_item>/g
    let newsMatch: RegExpExecArray | null

    while ((newsMatch = newsRegex.exec(block)) !== null) {
      const newsBlock = newsMatch[1]
      newsItems.push({
        title: extractTag(newsBlock, 'ht:news_item_title') || '',
        url: extractTag(newsBlock, 'ht:news_item_url') || '',
        picture: extractTag(newsBlock, 'ht:news_item_picture') || '',
        source: extractTag(newsBlock, 'ht:news_item_source') || '',
      })
    }

    if (title) {
      items.push({
        title: title.trim(),
        traffic: traffic.trim(),
        picture: picture.trim(),
        pictureSource: pictureSource.trim(),
        newsItems,
      })
    }

    if (items.length >= 10) break // Top 10 trending
  }

  return items
}

/** Extract text content from <tag>...</tag> */
function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`)
  const m = regex.exec(xml)
  if (m) return m[1]

  const regex2 = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)
  const m2 = regex2.exec(xml)
  return m2 ? m2[1].trim() : null
}

/** Extract text content from <tag>value</tag> (simple text, no CDATA) */
function extractAttr(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)
  const m = regex.exec(xml)
  return m ? m[1].trim() : null
}

/* ─────────────────────────────────────────────
   Fallback data when RSS is unreachable
   ───────────────────────────────────────────── */
function getFallbackItems(): TrendingItem[] {
  return [
    {
      title: 'Premier League',
      traffic: '5000+',
      picture: '',
      pictureSource: 'GOALZONE',
      newsItems: [
        { title: 'Premier League standings & results', url: '#', picture: '', source: 'GOALZONE' },
      ],
    },
    {
      title: 'Liga Champions',
      traffic: '3000+',
      picture: '',
      pictureSource: 'GOALZONE',
      newsItems: [
        { title: 'Final Liga Champions 2025 preview', url: '#', picture: '', source: 'GOALZONE' },
      ],
    },
    {
      title: 'La Liga',
      traffic: '2000+',
      picture: '',
      pictureSource: 'GOALZONE',
      newsItems: [],
    },
    {
      title: 'Serie A',
      traffic: '1000+',
      picture: '',
      pictureSource: 'GOALZONE',
      newsItems: [],
    },
    {
      title: 'Bundesliga',
      traffic: '1000+',
      picture: '',
      pictureSource: 'GOALZONE',
      newsItems: [],
    },
  ]
}
