import { NextResponse } from 'next/server'
import { createServerSupabaseClient, mapCategoryToAPI } from '@/lib/supabase/client'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Fetch all categories ordered by name
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Supabase error fetching categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    // Count published articles per category
    const { data: articleRows } = await supabase
      .from('articles')
      .select('category_id')
      .eq('status', 'published')

    const countMap: Record<string, number> = {}
    for (const row of articleRows || []) {
      const cid = row.category_id
      countMap[cid] = (countMap[cid] || 0) + 1
    }

    // Map categories with article counts
    const mapped = (categories || []).map((cat) =>
      mapCategoryToAPI({ ...cat, article_count: countMap[cat.id] || 0 })
    )

    return NextResponse.json({ categories: mapped })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
