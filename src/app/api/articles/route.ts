import { NextRequest, NextResponse } from 'next/server'
import { fetchArticles, type StoredArticle } from '@/lib/article-store'
import { saveArticle } from '@/lib/article-store'
import { verifyAdmin } from '@/lib/admin-auth'

// ============================================================
// GOALZONE — Articles API (unified store)
// ============================================================
// GET  → Fetch articles from Supabase → Prisma → Cache → Mock
// POST → Create article (admin only)
// ============================================================

// Mock articles fallback when no database is available
const MOCK_ARTICLES = [
  {
    id: '1', title: 'Mbappe Resmi Bergabung ke Real Madrid Musim Depan',
    slug: 'mbappe-resmi-real-madrid', summary: 'Kylian Mbappe akhirnya resmi menyelesaikan transfer ke Real Madrid dengan kontrak 5 tahun.',
    imageUrl: '/images/articles/champions-league.jpg', category: { name: 'Transfer', slug: 'transfer' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' }, viewCount: 15420, readTime: 6,
    createdAt: '2025-05-07T10:00:00Z', isFeatured: true,
  },
  {
    id: '2', title: 'Arsenal Perpanjang Kontrak Saka Hingga 2029',
    slug: 'arsenal-perpanjang-kontrak-saka', summary: 'Bukayo Saka menandatangani kontrak baru jangka panjang bersama Arsenal.',
    imageUrl: '/images/articles/premier-league.jpg', category: { name: 'Premier League', slug: 'premier-league' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' }, viewCount: 8730, readTime: 4,
    createdAt: '2025-05-06T14:30:00Z', isFeatured: true,
  },
  {
    id: '3', title: 'Barcelona Kalahkan Bayern Munich 3-1 di Camp Nou',
    slug: 'barcelona-kalahkan-bayern-munich', summary: 'Robert Lewandowski kembali menghantui mantan klubnya dengan brace di babak kedua.',
    imageUrl: '/images/articles/la-liga.jpg', category: { name: 'Champions League', slug: 'champions-league' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' }, viewCount: 22100, readTime: 7,
    createdAt: '2025-05-06T08:00:00Z', isFeatured: true,
  },
  {
    id: '4', title: 'Erling Haaland Pecahkan Rekor Gol Premier League',
    slug: 'haaland-pecahkan-rekor-gol', summary: 'Striker Manchester City ini mencetak 40 gol dalam satu musim Premier League.',
    imageUrl: '/images/articles/premier-league.jpg', category: { name: 'Premier League', slug: 'premier-league' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' }, viewCount: 31500, readTime: 5,
    createdAt: '2025-05-05T16:00:00Z', isFeatured: true,
  },
  {
    id: '5', title: 'Analisis Taktik: Formasi 3-4-3 yang Mendominasi Liga Champions',
    slug: 'analisis-taktik-formasi-3-4-3', summary: 'Bagaimana formasi 3-4-3 menjadi tren taktik paling efektif di Eropa musim ini.',
    imageUrl: '/images/articles/tactical.jpg', category: { name: 'Taktik', slug: 'taktik' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' }, viewCount: 9800, readTime: 8,
    createdAt: '2025-05-05T10:00:00Z', isFeatured: true,
  },
  {
    id: '6', title: 'Jude Bellingham Jadi Pemain Muda Terbaik FIFA 2025',
    slug: 'bellingham-pemain-muda-terbaik-fifa', summary: 'Gelandang Real Madrid meraih penghargaan prestisius di upacara FIFA Best Awards.',
    imageUrl: '/images/articles/hero-main.jpg', category: { name: 'La Liga', slug: 'la-liga' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' }, viewCount: 18900, readTime: 5,
    createdAt: '2025-05-04T12:00:00Z', isFeatured: false,
  },
  {
    id: '7', title: 'Transfer Window: Pemain Top yang Akan Pindah Musim Panas',
    slug: 'transfer-window-pemain-top-musim-panas', summary: 'Daftar lengkap pemain bintang yang dikabarkan akan pindah klub di bursa transfer.',
    imageUrl: '/images/articles/transfer.jpg', category: { name: 'Transfer', slug: 'transfer' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' }, viewCount: 25300, readTime: 10,
    createdAt: '2025-05-04T08:00:00Z', isFeatured: false,
  },
  {
    id: '8', title: 'PSG vs Inter Milan: Preview Final Supercopa Eropa',
    slug: 'psg-vs-inter-milan-preview', summary: 'Dua raksasa Eropa akan bertemu di final Supercopa Eropa yang digelar di Warsaw.',
    imageUrl: '/images/articles/champions-league.jpg', category: { name: 'Champions League', slug: 'champions-league' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' }, viewCount: 12300, readTime: 6,
    createdAt: '2025-05-03T14:00:00Z', isFeatured: false,
  },
  {
    id: '9', title: 'Klasemen Liga Champions: Fase Baru yang Lebih Ketat',
    slug: 'klasemen-liga-champions-fase-baru', summary: 'Format baru Liga Champions Swiss model membuat persaingan semakin seru dari matchday pertama.',
    imageUrl: '/images/articles/champions-league.jpg', category: { name: 'Champions League', slug: 'champions-league' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' }, viewCount: 7600, readTime: 5,
    createdAt: '2025-05-03T08:00:00Z', isFeatured: false,
  },
  {
    id: '10', title: 'Vinicius Jr. Cedera: Berapa Lama Absen dari Lapangan?',
    slug: 'vinicius-jr-cedera-absen', summary: 'Bintang Real Madrid mengalami cedera otot paha yang memaksanya istirahat selama 3-4 minggu.',
    imageUrl: '/images/articles/la-liga.jpg', category: { name: 'La Liga', slug: 'la-liga' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' }, viewCount: 11400, readTime: 4,
    createdAt: '2025-05-02T10:00:00Z', isFeatured: false,
  },
  {
    id: '11', title: 'Liverpool Tertarik Datangkan Florian Wirtz dari Leverkusen',
    slug: 'liverpool-wirtz-leverkusen', summary: 'Liverpool siap mengeluarkan dana besar untuk merekrut playmaker muda Bayer Leverkusen.',
    imageUrl: '/images/articles/premier-league.jpg', category: { name: 'Premier League', slug: 'premier-league' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' }, viewCount: 14200, readTime: 5,
    createdAt: '2025-05-02T06:00:00Z', isFeatured: false,
  },
  {
    id: '12', title: 'Top Skor Serie A: Lautaro Martinez Memimpin Daftar',
    slug: 'top-skor-serie-a-lautaro-martinez', summary: 'Striker Inter Milan ini sudah mencetak 28 gol di semua kompetisi musim ini.',
    imageUrl: '/images/articles/hero-main.jpg', category: { name: 'Serie A', slug: 'serie-a' },
    author: { username: 'GOALZONE', fullName: 'Tim Editorial' }, viewCount: 6900, readTime: 4,
    createdAt: '2025-05-01T12:00:00Z', isFeatured: false,
  },
]

// ─── Map StoredArticle → Frontend format ─────────────────────

function toFrontend(a: StoredArticle) {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    content: a.content,
    summary: a.summary,
    imageUrl: a.imageUrl,
    categoryId: a.categoryId,
    authorId: a.authorId,
    status: a.status,
    isFeatured: a.isFeatured,
    viewCount: a.viewCount,
    readTime: a.readTime,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    category: a.categoryName ? { name: a.categoryName, slug: a.categoryId } : null,
    author: a.authorName ? { username: a.authorName, fullName: a.authorName } : null,
  }
}

// ─── GET ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Try unified store (Supabase → Prisma → Cache)
    const storeResult = await fetchArticles({
      category: category || undefined,
      search: search || undefined,
      featured: featured === 'true' ? true : undefined,
      limit,
      offset,
    })

    // If store has data, return it
    if (storeResult.articles.length > 0) {
      return NextResponse.json({
        articles: storeResult.articles.map(toFrontend),
        total: storeResult.total,
        limit,
        offset,
        source: storeResult.source,
      })
    }

    // Mock data fallback (only if no real articles exist at all)
    // First check total without pagination
    const allResults = await fetchArticles({ limit: 999 })
    if (allResults.articles.length === 0) {
      let mockArticles = [...MOCK_ARTICLES]

      if (search) {
        const q = search.toLowerCase()
        mockArticles = mockArticles.filter(a =>
          a.title.toLowerCase().includes(q) ||
          (a.summary && a.summary.toLowerCase().includes(q)) ||
          a.category.name.toLowerCase().includes(q)
        )
      }
      if (featured === 'true') {
        mockArticles = mockArticles.filter(a => a.isFeatured)
      }

      return NextResponse.json({
        articles: mockArticles.slice(offset, offset + limit),
        total: mockArticles.length,
        limit,
        offset,
        source: 'mock',
      })
    }

    return NextResponse.json({
      articles: [],
      total: 0,
      limit,
      offset,
      source: storeResult.source,
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

// ─── POST ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Admin auth check
    const auth = verifyAdmin(request)
    if (!auth.valid) return auth.response

    const body = await request.json()
    const { title, slug, content, summary, imageUrl, categorySlug, categoryName, isFeatured, readTime } = body

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, content' },
        { status: 400 }
      )
    }

    const result = await saveArticle({
      title,
      slug,
      content,
      summary: summary || null,
      imageUrl: imageUrl || null,
      categorySlug: categorySlug || 'general',
      categoryName: categoryName || 'Sepak Bola Umum',
      authorName: 'GOALZONE',
      readTime: readTime || 5,
    })

    if (result.success && result.article) {
      return NextResponse.json({
        ...toFrontend(result.article),
        savedTo: result.source,
      }, { status: 201 })
    }

    return NextResponse.json(
      { error: result.error || 'Failed to save article' },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('Error creating article:', error.message)
    return NextResponse.json(
      { error: 'Failed to create article', debug: { message: error.message } },
      { status: 500 }
    )
  }
}
