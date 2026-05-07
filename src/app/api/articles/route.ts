import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, mapArticleToAPI } from '@/lib/supabase/client'
import { verifyAdmin } from '@/lib/admin-auth'

// Mock articles fallback when Supabase is not configured
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Try Supabase first, fall back to mock data
    let result = null

    try {
      const supabase = createServerSupabaseClient()

      const searchFilter = search
        ? `title.ilike.%${search}%,summary.ilike.%${search}%`
        : null

      // Build the count query
      let countQuery = supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')

      if (category) {
        countQuery = countQuery.eq('category_id', category)
      }
      if (searchFilter) {
        countQuery = countQuery.or(searchFilter)
      }
      if (featured === 'true') {
        countQuery = countQuery.eq('is_featured', true)
      }

      const { count } = await countQuery

      // Build the data query
      let dataQuery = supabase
        .from('articles')
        .select('*, categories(name, slug, color), profiles(username, full_name, avatar_url)')
        .eq('status', 'published')

      if (category) {
        dataQuery = dataQuery.eq('category_id', category)
      }
      if (searchFilter) {
        dataQuery = dataQuery.or(searchFilter)
      }
      if (featured === 'true') {
        dataQuery = dataQuery.eq('is_featured', true)
      }

      const { data: rows, error } = await dataQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (!error && rows) {
        result = {
          articles: rows.map(mapArticleToAPI),
          total: count || 0,
        }
      }
    } catch {
      // Supabase not available — fall back to mock data
    }

    // Use mock data if Supabase failed or returned nothing
    if (!result) {
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

      result = {
        articles: mockArticles.slice(offset, offset + limit),
        total: mockArticles.length,
      }
    }

    return NextResponse.json({
      articles: result.articles,
      total: result.total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin auth check
    const auth = verifyAdmin(request)
    if (!auth.valid) return auth.response

    const body = await request.json()
    const { title, slug, content, summary, imageUrl, categoryId, authorId, isFeatured, readTime } = body

    if (!title || !slug || !content || !categoryId || !authorId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, content, categoryId, authorId' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    const { data: row, error } = await supabase
      .from('articles')
      .insert({
        title,
        slug,
        content,
        summary: summary || null,
        cover_image: imageUrl || null,
        category_id: categoryId,
        author_id: authorId,
        status: 'published',
        is_featured: isFeatured || false,
        read_time: readTime || 5,
      })
      .select('*, categories(name, slug, color), profiles(username, full_name, avatar_url)')
      .single()

    if (error) {
      console.error('Supabase error creating article:', error)
      return NextResponse.json(
        { error: 'Failed to create article' },
        { status: 500 }
      )
    }

    const article = mapArticleToAPI(row)
    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}
