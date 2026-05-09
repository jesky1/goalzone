import { NextResponse } from 'next/server'
import { createServerSupabaseClient, mapArticleToAPI } from '@/lib/supabase/client'

/**
 * GET /api/articles/popular
 *
 * Supabase SQL Query yang dieksekusi:
 * ====================================
 * SELECT
 *   a.id, a.title, a.slug, a.summary, a.cover_image,
 *   a.view_count, a.like_count, a.comment_count, a.read_time,
 *   a.is_featured, a.is_trending, a.status,
 *   a.published_at, a.created_at, a.updated_at,
 *   c.name AS category_name, c.slug AS category_slug, c.color AS category_color,
 *   p.username AS author_name, p.avatar_url AS author_avatar
 * FROM public.articles a
 * LEFT JOIN public.categories c ON a.category_id = c.id
 * LEFT JOIN public.profiles p ON a.author_id = p.id
 * WHERE a.status = 'published'
 * ORDER BY a.view_count DESC
 * LIMIT 5;
 *
 * Melalui Supabase JS Client:
 *   supabase
 *     .from('articles')
 *     .select('*, categories(name, slug, color), profiles(username, full_name, avatar_url)')
 *     .eq('status', 'published')
 *     .order('view_count', { ascending: false })
 *     .limit(5)
 */

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

export async function GET() {
  try {
    let articles = null
    let source = 'mock'

    // ─── Supabase Query ─────────────────────────────
    try {
      const supabase = createServerSupabaseClient()

      const { data: rows, error } = await supabase
        .from('articles')
        .select('*, categories(name, slug, color), profiles(username, full_name, avatar_url)')
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(5)

      if (!error && rows && rows.length > 0) {
        articles = rows.map(mapArticleToAPI)
        source = 'supabase'
      }
    } catch {
      // Supabase belum dikonfigurasi — gunakan mock data
    }

    // ─── Fallback ke mock data ──────────────────────
    if (!articles) {
      articles = MOCK_POPULAR_ARTICLES
    }

    return NextResponse.json({
      articles,
      total: articles.length,
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
