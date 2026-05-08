import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, mapArticleToAPI, mapCommentToAPI } from '@/lib/supabase/client'
import { verifyAdmin } from '@/lib/admin-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createServerSupabaseClient()

    // Fetch article with category and author joins
    const { data: articleRow, error: articleError } = await supabase
      .from('articles')
      .select('*, categories(name, slug, color), profiles(username, full_name, avatar_url)')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (articleError || !articleRow) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Fetch comments with profile joins
    const { data: commentRows } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('article_id', articleRow.id)
      .order('created_at', { ascending: false })

    // Increment view count
    const { error: updateError } = await supabase
      .from('articles')
      .update({ view_count: articleRow.view_count + 1 })
      .eq('slug', slug)

    if (updateError) {
      console.error('Failed to increment view count:', updateError)
    }

    const article = mapArticleToAPI(articleRow)
    const comments = (commentRows || []).map(mapCommentToAPI)

    return NextResponse.json({
      ...article,
      viewCount: articleRow.view_count + 1,
      comments,
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
    // Admin auth check
    const auth = verifyAdmin(request)
    if (!auth.valid) return auth.response

    const { slug } = await params
    const body = await request.json()
    const { title, content, summary, imageUrl, categoryId, isFeatured, readTime } = body

    const supabase = createServerSupabaseClient()

    // Check if article exists
    const { data: existing, error: findError } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .single()

    if (findError || !existing) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Build update payload with snake_case mapping
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (summary !== undefined) updateData.summary = summary
    if (imageUrl !== undefined) updateData.cover_image = imageUrl
    if (categoryId !== undefined) updateData.category_id = categoryId
    if (isFeatured !== undefined) updateData.is_featured = isFeatured
    if (readTime !== undefined) updateData.read_time = readTime

    const { data: row, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('slug', slug)
      .select('*, categories(name, slug, color), profiles(username, full_name, avatar_url)')
      .single()

    if (error) {
      console.error('Supabase error updating article:', error)
      return NextResponse.json(
        { error: 'Failed to update article' },
        { status: 500 }
      )
    }

    const article = mapArticleToAPI(row)
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
    const supabase = createServerSupabaseClient()

    // Check if article exists
    const { data: existing, error: findError } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .single()

    if (findError || !existing) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('slug', slug)

    if (error) {
      console.error('Supabase error deleting article:', error)
      return NextResponse.json(
        { error: 'Failed to delete article' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}
