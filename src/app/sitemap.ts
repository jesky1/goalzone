// ============================================================
// GOALZONE — Dynamic Sitemap
// ============================================================
// Generates sitemap.xml with all published articles + static pages
// URL: /sitemap.xml
// Auto-submitted to Google via robots.txt
// ============================================================

import { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/client'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://goalzone.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/admin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // Dynamic: fetch all published articles from Supabase
  let articles: MetadataRoute.Sitemap = []
  try {
    const supabase = createServerSupabaseClient()

    const { data: rows, error } = await supabase
      .from('articles')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1000) // Google limit: 50,000 URLs per sitemap

    if (!error && rows) {
      articles = rows.map((row: any) => ({
        url: `${SITE_URL}/articles/${row.slug}`,
        lastModified: new Date(row.updated_at || row.created_at),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }))
    }
  } catch (err) {
    console.warn('[Sitemap] Failed to fetch articles from Supabase:', err)
  }

  return [...staticPages, ...articles]
}
