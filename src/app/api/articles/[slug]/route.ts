import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdmin } from '@/lib/admin-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const article = await db.article.findUnique({
      where: { slug },
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
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await db.article.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json({ ...article, viewCount: article.viewCount + 1 })
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
    // Admin auth check
    const auth = verifyAdmin(request)
    if (!auth.valid) return auth.response

    const { slug } = await params
    const body = await request.json()

    const { title, content, summary, imageUrl, categoryId, isFeatured, readTime } = body

    // Check if article exists
    const existing = await db.article.findUnique({ where: { slug } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const article = await db.article.update({
      where: { slug },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(summary !== undefined && { summary }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(categoryId !== undefined && { categoryId }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(readTime !== undefined && { readTime }),
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

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Admin auth check
    const auth = verifyAdmin(request)
    if (!auth.valid) return auth.response

    const { slug } = await params

    const existing = await db.article.findUnique({ where: { slug } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    await db.article.delete({ where: { slug } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}
