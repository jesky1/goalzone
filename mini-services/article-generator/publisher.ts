// ============================================================
// GOALZONE Article Generator — Step 4: Supabase Publisher
// ============================================================
// Publishes generated articles to Supabase
// ============================================================

import { config } from './config.js'
import { createClient } from '@supabase/supabase-js'

// ============================================================
// Supabase Client (service role — bypasses RLS)
// ============================================================

function getSupabaseAdmin() {
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw new Error('Supabase credentials not configured')
  }
  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ============================================================
// Ensure Category & Author Exist
// ============================================================

export async function ensureCategoryAndAuthor(): Promise<void> {
  const supabase = getSupabaseAdmin()

  // 1. Find or create "Match Report" category
  if (config.defaultCategoryId) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('id', config.defaultCategoryId)
      .single()

    if (existing) {
      console.log(`   ✓ Category found: ${config.defaultCategoryId}`)
      return
    }
  }

  // Try to find "Match Report" category by slug
  const { data: matchCat } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('slug', 'match-report')
    .single()

  if (matchCat) {
    console.log(`   ✓ Found category: ${matchCat.name} (${matchCat.id})`)
    return
  }

  // Try to find any existing category
  const { data: anyCat } = await supabase
    .from('categories')
    .select('id, name, slug')
    .limit(1)
    .single()

  if (anyCat) {
    console.log(`   ✓ Using existing category: ${anyCat.name} (${anyCat.id})`)
    return
  }

  // Create a new category
  console.log('   ⚠️  No category found. Create a "Match Report" category in Supabase first.')
  console.log('      Run this SQL in Supabase SQL Editor:')
  console.log(`      INSERT INTO categories (id, name, slug) VALUES (gen_random_uuid(), 'Match Report', 'match-report');`)
}

// ============================================================
// Find Author (profile)
// ============================================================

async function findAuthorId(): Promise<string | null> {
  if (config.defaultAuthorId) return config.defaultAuthorId

  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('profiles')
    .select('id, username, role')
    .limit(1)
    .single()

  return data?.id || null
}

// ============================================================
// Check if Article Already Exists (by fixture ID)
// ============================================================

export async function articleExistsByFixtureId(fixtureId: number): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin()

    // Check via slug pattern: {home}-{score}-{score}-{away}
    // Or via a custom metadata field if available
    // For now, check the slug pattern
    const { data: articles } = await supabase
      .from('articles')
      .select('slug, title')
      .ilike('slug', `%${fixtureId}%`)
      .limit(1)

    if (data && data.length > 0) return true

    // Alternative: check by title pattern
    const { data: byTitle } = await supabase
      .from('articles')
      .select('id')
      .ilike('title', '%-0-%') // rough pattern match for match reports
      .limit(50)

    // Also check if we have a metadata table
    // For now return false to allow generation
    return false
  } catch {
    return false
  }
}

// ============================================================
// Check if Article Exists by Slug
// ============================================================

async function articleExistsBySlug(slug: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin()
    const { data } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .single()

    return !!data
  } catch {
    return false
  }
}

// ============================================================
// Publish Article to Supabase
// ============================================================

export interface PublishPayload {
  title: string
  slug: string
  content: string
  summary: string
  imageUrl: string | null
  seoTitle?: string
  seoDescription?: string
  fixtureId?: string
  matchInfo?: string
  jsonLd?: string
  keywords?: string[]
}

export async function publishArticle(payload: PublishPayload): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  // Check duplicate by slug
  const exists = await articleExistsBySlug(payload.slug)
  if (exists) {
    console.log(`   ⏭️  Article "${payload.slug}" already exists — skipping`)
    return false
  }

  // Get author
  const authorId = await findAuthorId()
  if (!authorId) {
    console.warn('   ⚠️  No author found. Set ARTICLE_GEN_AUTHOR_ID or create a profile in Supabase.')
    return false
  }

  // Get category
  let categoryId = config.defaultCategoryId

  if (!categoryId) {
    // Try to find any category
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .limit(1)
      .single()

    categoryId = cat?.id
    if (!categoryId) {
      console.warn('   ⚠️  No category found. Create a category in Supabase first.')
      return false
    }
  }

  // Estimate read time (rough: ~200 words per minute, ~5 chars per word)
  const plainContent = payload.content.replace(/<[^>]*>/g, '')
  const wordCount = Math.ceil(plainContent.length / 5)
  const readTime = Math.max(3, Math.ceil(wordCount / 200))

  // Insert article
  const { error } = await supabase.from('articles').insert({
    title: payload.title,
    slug: payload.slug,
    content: payload.content,
    summary: payload.summary,
    cover_image: payload.imageUrl,
    category_id: categoryId,
    author_id: authorId,
    status: 'published',
    is_featured: false,
    read_time: readTime,
    view_count: 0,
    seo_title: payload.seoTitle || null,
    seo_description: payload.seoDescription || null,
  })

  if (error) {
    // Handle unique constraint violation (slug duplicate)
    if (error.message?.includes('duplicate') || error.code === '23505') {
      console.log(`   ⏭️  Duplicate slug "${payload.slug}" — skipping`)
      return false
    }
    console.error(`   ❌ Publish error: ${error.message}`)
    return false
  }

  return true
}
