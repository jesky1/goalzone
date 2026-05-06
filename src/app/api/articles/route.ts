import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}

    if (category) {
      where.category = { slug: category }
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { summary: { contains: search } },
      ]
    }

    if (featured === 'true') {
      where.isFeatured = true
    }

    const articles = await db.article.findMany({
      where,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await db.article.count({ where })

    return NextResponse.json({
      articles,
      total,
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

    const article = await db.article.create({
      data: {
        title,
        slug,
        content,
        summary: summary || null,
        imageUrl: imageUrl || null,
        categoryId,
        authorId,
        isFeatured: isFeatured || false,
        readTime: readTime || 5,
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}
