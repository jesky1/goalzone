// ============================================================
// GOALZONE - Supabase Client Configuration
// ============================================================
// Client-side dan server-side Supabase client
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

// Client-side Supabase (anon key, RLS aktif) — lazy init
export function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
<<<<<<< HEAD
      'Please set these in .env.local or Vercel Environment Variables. ' +
      'Get the anon key from Supabase Dashboard → Settings → API → Project API keys.'
=======
      'Please set these in .env.local or Vercel Environment Variables.'
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
    )
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return _supabase
}

// Convenience export (calls getSupabaseClient lazily)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') return value.bind(client)
    return value
  },
})

// Server-side Supabase admin client (service role key, bypass RLS)
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Please set these in .env.local or Vercel Environment Variables.'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// ============================================================
// Field Mapping Helpers (snake_case DB ↔ camelCase API)
// ============================================================

export interface ArticleRow {
  id: string
  title: string
  slug: string
  content: string
  summary: string | null
  excerpt: string | null
  cover_image: string | null
  category_id: string
  author_id: string
  status: string
  is_featured: boolean
  is_trending: boolean
  view_count: number
  like_count: number
  comment_count: number
  read_time: number
  seo_title: string | null
  seo_description: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  // Joined fields
  categories?: { name: string; slug: string; color: string } | null
  profiles?: { username: string; full_name: string | null; avatar_url: string | null } | null
}

export interface ArticleAPI {
  id: string
  title: string
  slug: string
  content: string
  summary: string | null
  imageUrl: string | null
  categoryId: string
  authorId: string
  status: string
  isFeatured: boolean
  isTrending: boolean
  viewCount: number
  likeCount: number
  commentCount: number
  readTime: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  category?: { name: string; slug: string; color: string } | null
  author?: { username: string; fullName: string | null; avatarUrl: string | null } | null
}

export function mapArticleToAPI(row: ArticleRow): ArticleAPI {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    summary: row.summary,
    imageUrl: row.cover_image,
    categoryId: row.category_id,
    authorId: row.author_id,
    status: row.status,
    isFeatured: row.is_featured,
    isTrending: row.is_trending,
    viewCount: row.view_count,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    readTime: row.read_time,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.categories ? {
      name: row.categories.name,
      slug: row.categories.slug,
      color: row.categories.color,
    } : null,
    author: row.profiles ? {
      username: row.profiles.username,
      fullName: row.profiles.full_name,
      avatarUrl: row.profiles.avatar_url,
    } : null,
  }
}

export interface ArticleRowWithCount extends ArticleRow {
  category_name?: string | null
  author_name?: string | null
}

export function mapArticleWithNames(row: ArticleRowWithCount): any {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    summary: row.summary,
    imageUrl: row.cover_image,
    categoryId: row.category_id,
    authorId: row.author_id,
    status: row.status,
    isFeatured: row.is_featured,
    viewCount: row.view_count,
    readTime: row.read_time,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    categoryName: row.categories?.name || row.category_name || null,
    authorName: row.profiles?.username || row.author_name || null,
  }
}

export interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  article_count?: number
}

export interface CategoryAPI {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  icon: string | null
  articleCount: number
}

export function mapCategoryToAPI(row: CategoryRow): CategoryAPI {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    color: row.color,
    icon: row.icon,
    articleCount: row.article_count || 0,
  }
}

export interface CommentRow {
  id: string
  article_id: string
  user_id: string
  content: string
  is_edited: boolean
  likes: number
  parent_id: string | null
  status: string
  created_at: string
  updated_at: string
  profiles?: { username: string; avatar_url: string | null } | null
}

export interface CommentAPI {
  id: string
  articleId: string
  userId: string
  text: string
  createdAt: string
  user?: { username: string; avatarUrl: string | null } | null
}

export function mapCommentToAPI(row: CommentRow): CommentAPI {
  return {
    id: row.id,
    articleId: row.article_id,
    userId: row.user_id,
    text: row.content,
    createdAt: row.created_at,
    user: row.profiles ? {
      username: row.profiles.username,
      avatarUrl: row.profiles.avatar_url,
    } : null,
  }
}
