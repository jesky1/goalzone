import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, mapCommentToAPI } from '@/lib/supabase/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createServerSupabaseClient()

    // Verify article exists
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .single()

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Fetch comments with profile joins
    const { data: rows, error } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('article_id', article.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching comments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    const comments = (rows || []).map(mapCommentToAPI)
    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { userId, text } = body

    if (!userId || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, text' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Verify article exists
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .single()

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Insert comment — DB column is 'content', API field is 'text'
    const { data: row, error } = await supabase
      .from('comments')
      .insert({
        article_id: article.id,
        user_id: userId,
        content: text,
      })
      .select('*, profiles(username, avatar_url)')
      .single()

    if (error) {
      console.error('Supabase error creating comment:', error)
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    const comment = mapCommentToAPI(row)
    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
