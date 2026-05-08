import { NextResponse } from 'next/server'
import { fetchArticles } from '@/lib/article-store'

// Mock fallback data — sudah diurutkan view_count DESC
const MOCK_POPULAR_ARTICLES = [
  {
    id: '4',
    title: 'Erling Haaland Pecahkan Rekor Gol Premier League',
    slug: 'haaland-pecahkan-rekor-gol',
    summary: 'Striker Manchester City ini mencetak 40 gol dalam satu musim Premier League.',
    imageUrl: '/images/articles/premier-league.jpg',
    category: { name: 'Premier League', slug: 'premier-league', color: '#3b0764' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' },
    viewCount: 31500,
    readTime: 5,
    createdAt: '2025-05-05T16:00:00Z',
    isFeatured: true,
  },
  {
    id: '7',
    title: 'Transfer Window: Pemain Top yang Akan Pindah Musim Panas',
    slug: 'transfer-window-pemain-top-musim-panas',
    summary: 'Daftar lengkap pemain bintang yang dikabarkan akan pindah klub di bursa transfer.',
    imageUrl: '/images/articles/transfer.jpg',
    category: { name: 'Transfer', slug: 'transfer', color: '#f59e0b' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' },
    viewCount: 25300,
    readTime: 10,
    createdAt: '2025-05-04T08:00:00Z',
    isFeatured: false,
  },
  {
    id: '3',
    title: 'Barcelona Kalahkan Bayern Munich 3-1 di Camp Nou',
    slug: 'barcelona-kalahkan-bayern-munich',
    summary: 'Robert Lewandowski kembali menghantui mantan klubnya dengan brace di babak kedua.',
    imageUrl: '/images/articles/la-liga.jpg',
    category: { name: 'Champions League', slug: 'champions-league', color: '#1e40af' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' },
    viewCount: 22100,
    readTime: 7,
    createdAt: '2025-05-06T08:00:00Z',
    isFeatured: true,
  },
  {
    id: '6',
    title: 'Jude Bellingham Jadi Pemain Muda Terbaik FIFA 2025',
    slug: 'bellingham-pemain-muda-terbaik-fifa',
    summary: 'Gelandang Real Madrid meraih penghargaan prestisius di upacara FIFA Best Awards.',
    imageUrl: '/images/articles/hero-main.jpg',
    category: { name: 'La Liga', slug: 'la-liga', color: '#ea580c' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' },
    viewCount: 18900,
    readTime: 5,
    createdAt: '2025-05-04T12:00:00Z',
    isFeatured: false,
  },
  {
    id: '1',
    title: 'Mbappe Resmi Bergabung ke Real Madrid Musim Depan',
    slug: 'mbappe-resmi-real-madrid',
    summary: 'Kylian Mbappe akhirnya resmi menyelesaikan transfer ke Real Madrid dengan kontrak 5 tahun.',
    imageUrl: '/images/articles/champions-league.jpg',
    category: { name: 'Transfer', slug: 'transfer', color: '#f59e0b' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' },
    viewCount: 15420,
    readTime: 6,
    createdAt: '2025-05-07T10:00:00Z',
    isFeatured: true,
  },
]

function toFrontend(a: any) {
  return {
    id: a.id, title: a.title, slug: a.slug, summary: a.summary,
    imageUrl: a.imageUrl, viewCount: a.viewCount, readTime: a.readTime,
    createdAt: a.createdAt, isFeatured: a.isFeatured,
    category: a.categoryName ? { name: a.categoryName, slug: a.categoryId } : a.category || null,
    author: a.authorName ? { username: a.authorName, fullName: a.authorName } : a.author || null,
  }
}

export async function GET() {
  try {
    let source = 'mock'

    // Try unified store (Supabase → Prisma → Cache)
    const { articles: storeArticles, source: storeSource } = await fetchArticles({
      limit: 100,
    })

    if (storeArticles.length > 0) {
      // Sort by view count (most popular first)
      const sorted = [...storeArticles].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5)
      return NextResponse.json({
        articles: sorted.map(toFrontend),
        total: sorted.length,
        source: storeSource,
      })
    }

    // Fallback to mock
    return NextResponse.json({
      articles: MOCK_POPULAR_ARTICLES,
      total: MOCK_POPULAR_ARTICLES.length,
      source,
    })
  } catch (error) {
    console.error('Error fetching popular articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular articles' },
      { status: 500 }
    )
  }
}
