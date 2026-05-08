import { NextResponse } from 'next/server'
import { createServerSupabaseClient, mapCategoryToAPI } from '@/lib/supabase/client'

// Default football categories fallback when Supabase is not available
const DEFAULT_CATEGORIES = [
  { id: 'premier-league', name: 'Premier League', slug: 'premier-league', article_count: 0 },
  { id: 'la-liga', name: 'La Liga', slug: 'la-liga', article_count: 0 },
  { id: 'serie-a', name: 'Serie A', slug: 'serie-a', article_count: 0 },
  { id: 'bundesliga', name: 'Bundesliga', slug: 'bundesliga', article_count: 0 },
  { id: 'ligue-1', name: 'Ligue 1', slug: 'ligue-1', article_count: 0 },
  { id: 'champions-league', name: 'Champions League', slug: 'champions-league', article_count: 0 },
  { id: 'transfer', name: 'Transfer', slug: 'transfer', article_count: 0 },
]

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
      // Return default categories when table doesn't exist or other errors
      return NextResponse.json({
        categories: DEFAULT_CATEGORIES,
        source: 'default',
      })
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

    // If no categories from DB, return defaults
    if (mapped.length === 0) {
      return NextResponse.json({
        categories: DEFAULT_CATEGORIES,
        source: 'default',
      })
    }

    return NextResponse.json({ categories: mapped, source: 'supabase' })
  } catch (error) {
    console.error('Error fetching categories:', error)
    // Return default categories when Supabase is not configured
    return NextResponse.json({
      categories: DEFAULT_CATEGORIES,
      source: 'default',
    })
  }
}
