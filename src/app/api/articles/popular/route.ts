import { NextResponse } from 'next/server'
import { fetchArticles } from '@/lib/article-store'

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

    // No real data available
    return NextResponse.json({
      articles: [],
      total: 0,
      source: 'none',
    })
  } catch (error) {
    console.error('Error fetching popular articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular articles' },
      { status: 500 }
    )
  }
}
