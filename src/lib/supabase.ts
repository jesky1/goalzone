// ============================================================
// GOALZONE - Supabase Client Configuration
// ============================================================
// Client-side dan server-side Supabase client
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase (menggunakan anon key, RLS aktif)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Type helper
export type Tables<Schema extends string = 'public'> = {
  articles: {
    id: string
    title: string
    slug: string
    content: string
    summary: string | null
    excerpt: string | null
    cover_image: string | null
    category_id: string
    author_id: string
    status: 'draft' | 'published' | 'archived'
    is_featured: boolean
    is_trending: boolean
    view_count: number
    like_count: number
    comment_count: number
    read_time: number
    seo_title: string | null
    seo_description: string | null
    seo_keywords: string[] | null
    published_at: string | null
    created_at: string
    updated_at: string
  }
  categories: {
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
  }
  comments: {
    id: string
    article_id: string
    user_id: string
    content: string
    is_edited: boolean
    likes: number
    parent_id: string | null
    status: 'published' | 'hidden' | 'flagged'
    created_at: string
    updated_at: string
  }
  profiles: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    bio: string | null
    role: 'user' | 'editor' | 'admin'
    is_verified: boolean
    preferences: Record<string, unknown>
    created_at: string
    updated_at: string
  }
  live_scores: {
    id: string
    external_id: number
    league_name: string
    league_logo: string | null
    league_country: string | null
    season: number
    home_team: string
    home_team_logo: string | null
    away_team: string
    away_team_logo: string | null
    home_score: number
    away_score: number
    status: string
    minute: number | null
    elapsed: number | null
    match_date: string | null
    venue: string | null
    home_events: Array<{ type: string; minute: number; player: string; detail?: string }>
    away_events: Array<{ type: string; minute: number; player: string; detail?: string }>
    statistics: Record<string, unknown>
    last_updated: string
    created_at: string
  }
  standings: {
    id: string
    league_name: string
    season: number
    team_name: string
    team_logo: string | null
    position: number
    played: number
    won: number
    draw: number
    lost: number
    goals_for: number
    goals_against: number
    goal_difference: number
    points: number
    form: string
    last_updated: string
  }
  top_scorers: {
    id: string
    league_name: string
    season: number
    player_name: string
    player_photo: string | null
    team_name: string | null
    team_logo: string | null
    goals: number
    assists: number
    appearances: number
    minutes_played: number
    last_updated: string
  }
  bookmarked_matches: {
    id: string
    user_id: string
    match_id: number
    home_team: string | null
    away_team: string | null
    match_date: string | null
    league_name: string | null
    notified: boolean
    created_at: string
  }
}

// Server-side Supabase admin client (menggunakan service role key, bypass RLS)
export function createServerSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
