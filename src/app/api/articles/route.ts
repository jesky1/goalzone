import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, mapArticleToAPI } from '@/lib/supabase/client'
import { verifyAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const supabase = createServerSupabaseClient()

    // Build the count query with the same filters
    let countQuery = supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    if (category) {
      countQuery = countQuery.eq('categories.slug', category)
    }
    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,summary.ilike.%${search}%`)
    }
    if (featured === 'true') {
      countQuery = countQuery.eq('is_featured', true)
    }

    const { count: total } = await countQuery

    // Build the data query with the same filters
    let dataQuery = supabase
      .from('articles')
      .select('*, categories(name, slug, color), profiles(username, full_name, avatar_url)')
      .eq('status', 'published')

    if (category) {
      dataQuery = dataQuery.eq('categories.slug', category)
    }
    if (search) {
      dataQuery = dataQuery.or(`title.ilike.%${search}%,summary.ilike.%${search}%`)
    }
    if (featured === 'true') {
      dataQuery = dataQuery.eq('is_featured', true)
    }

    const { data: rows, error } = await dataQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase error fetching articles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      )
    }

    const articles = (rows || []).map(mapArticleToAPI)

    return NextResponse.json({
      articles,
      total: total || 0,
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
