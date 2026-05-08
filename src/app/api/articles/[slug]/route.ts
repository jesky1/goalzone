import { NextRequest, NextResponse } from 'next/server'
import { fetchArticleBySlug, incrementViewCount } from '@/lib/article-store'
import { verifyAdmin } from '@/lib/admin-auth'

// ============================================================
// GOALZONE — Single Article API (unified store)
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const article = await fetchArticleBySlug(slug)

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Increment view count (fire and forget)
    incrementViewCount(slug).catch(() => {})

    return NextResponse.json({
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      summary: article.summary,
      imageUrl: article.imageUrl,
      categoryId: article.categoryId,
      authorId: article.authorId,
      status: article.status,
      isFeatured: article.isFeatured,
      viewCount: article.viewCount + 1,
      readTime: article.readTime,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      category: article.categoryName ? { name: article.categoryName, slug: article.categoryId } : null,
      author: article.authorName ? { username: article.authorName, fullName: article.authorName } : null,
      comments: [],
    })
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = verifyAdmin(request)
    if (!auth.valid) return auth.response

    const { slug } = await params
    const body = await request.json()

    // Try Supabase first
    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase/client')
      const supabase = createServerSupabaseClient()

      const { data: existing } = await supabase
        .from('articles').select('id').eq('slug', slug).maybeSingle()

      if (existing) {
        const updateData: Record<string, unknown> = {}
        if (body.title !== undefined) updateData.title = body.title
        if (body.content !== undefined) updateData.content = body.content
        if (body.summary !== undefined) updateData.summary = body.summary
        if (body.imageUrl !== undefined) updateData.cover_image = body.imageUrl
        if (body.isFeatured !== undefined) updateData.is_featured = body.isFeatured
        if (body.readTime !== undefined) updateData.read_time = body.readTime

        const { data, error } = await supabase
          .from('articles').update(updateData).eq('slug', slug)
          .select('*, categories(name, slug), profiles(username)').single()

        if (!error && data) {
          return NextResponse.json({ success: true, source: 'supabase' })
        }
      }
    } catch { /* try prisma */ }

    // Try Prisma
    try {
      if (process.env.DATABASE_URL) {
        const { db } = await import('@/lib/db')
        const existing = await db.article.findUnique({ where: { slug } })
        if (existing) {
          const updateData: Record<string, unknown> = {}
          if (body.title !== undefined) updateData.title = body.title
          if (body.content !== undefined) updateData.content = body.content
          if (body.summary !== undefined) updateData.summary = body.summary
          if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl
          if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured
          if (body.readTime !== undefined) updateData.readTime = body.readTime

          await db.article.update({ where: { slug }, data: updateData })
          return NextResponse.json({ success: true, source: 'prisma' })
        }
      }
    } catch { /* skip */ }

    return NextResponse.json(
      { error: 'Article not found' },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('Error updating article:', error.message)
    return NextResponse.json(
      { error: 'Failed to update article', debug: { message: error.message } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = verifyAdmin(request)
    if (!auth.valid) return auth.response

    const { slug } = await params

    // Try Supabase
    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase/client')
      const supabase = createServerSupabaseClient()
      const { data: existing } = await supabase
        .from('articles').select('id').eq('slug', slug).maybeSingle()
      if (existing) {
        const { error } = await supabase.from('articles').delete().eq('slug', slug)
        if (!error) return NextResponse.json({ success: true, source: 'supabase' })
      }
    } catch { /* try prisma */ }

    // Try Prisma
    try {
      if (process.env.DATABASE_URL) {
        const { db } = await import('@/lib/db')
        const existing = await db.article.findUnique({ where: { slug } })
        if (existing) {
          await db.article.delete({ where: { slug } })
          return NextResponse.json({ success: true, source: 'prisma' })
        }
      }
    } catch { /* skip */ }

    return NextResponse.json(
      { error: 'Article not found' },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('Error deleting article:', error.message)
    return NextResponse.json(
      { error: 'Failed to delete article', debug: { message: error.message } },
      { status: 500 }
    )
  }
}
