import { NextRequest, NextResponse } from 'next/server'
import { fetchArticles, type StoredArticle } from '@/lib/article-store'
import { saveArticle } from '@/lib/article-store'
import { verifyAdmin } from '@/lib/admin-auth'

// ============================================================
// GOALZONE — Articles API (unified store)
// ============================================================
// GET  → Fetch articles from Supabase → Prisma → Cache
// POST → Create article (admin only)
// ============================================================

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

    // No real data available
    return NextResponse.json({
      articles: [],
      total: 0,
      limit,
      offset,
      source: 'none',
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
