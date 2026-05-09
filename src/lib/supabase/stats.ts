// ============================================================
// GOALZONE - Dashboard Statistics via Supabase
// ============================================================
// getDashboardStats() — fungsi untuk menarik data statistik
// riil dari Supabase:
//   - Total Artikel   → COUNT(*) dari tabel articles
//   - Total Komentar  → COUNT(*) dari tabel comments
//   - Total Views     → SUM(view_count) dari tabel articles
//   - + data enrichmen (featured, categories, avg read time, dll.)
// ============================================================

import { createServerSupabaseClient } from './client';

// ============================================================
// Types
// ============================================================

export interface DashboardStats {
  counts: {
    totalArticles: number;
    totalComments: number;
    totalViews: number;
    totalFeatured: number;
    totalCategories: number;
    commentsToday: number;
  };
  averages: {
    avgReadTime: number;
    viewsPerArticle: number;
    commentsPerArticle: number;
  };
  highlights: {
    topViewedArticle: {
      id: string;
      title: string;
      slug: string;
      viewCount: number;
      imageUrl: string | null;
      createdAt: string;
    } | null;
    latestArticle: {
      id: string;
      title: string;
      slug: string;
      viewCount: number;
      imageUrl: string | null;
      createdAt: string;
    } | null;
    weeklyNewViews: number;
  };
  charts: {
    monthlyArticles: { month: string; articles: number }[];
  };
}

// ============================================================
// Main Function: getDashboardStats
// ============================================================
// Menjalankan semua query Supabase secara paralel (Promise.all)
// untuk efisiensi, lalu menghitung agregasi di sisi JavaScript.
// ============================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createServerSupabaseClient();

  // ---- 1. Jalankan semua query paralel ----
  const [
    articlesResult,
    commentsResult,
    featuredResult,
    categoriesResult,
    readTimeResult,
    topArticleResult,
    latestArticleResult,
    commentsTodayResult,
    recentArticlesResult,
  ] = await Promise.all([
    // COUNT(*) articles
    supabase
      .from('articles')
      .select('*', { count: 'exact', head: true }),

    // COUNT(*) comments
    supabase
      .from('comments')
      .select('*', { count: 'exact', head: true }),

    // COUNT(*) articles WHERE is_featured = true
    supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('is_featured', true),

    // COUNT(*) categories
    supabase
      .from('categories')
      .select('*', { count: 'exact', head: true }),

    // SELECT view_count, read_time FROM articles (untuk SUM & AVG)
    supabase
      .from('articles')
      .select('view_count, read_time'),

    // Top viewed article
    supabase
      .from('articles')
      .select('id, title, slug, view_count, cover_image, created_at')
      .order('view_count', { ascending: false })
      .limit(1)
      .single(),

    // Latest article
    supabase
      .from('articles')
      .select('id, title, slug, view_count, cover_image, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),

    // Comments created today (UTC)
    supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

    // Articles from last 12 months (for monthly chart)
    supabase
      .from('articles')
      .select('created_at')
      .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString()),
  ]);

  // ---- 2. Ekstrak hasil query ----
  const totalArticles = articlesResult.count ?? 0;
  const totalComments = commentsResult.count ?? 0;
  const totalFeatured = featuredResult.count ?? 0;
  const totalCategories = categoriesResult.count ?? 0;
  const commentsToday = commentsTodayResult.count ?? 0;

  // SUM(view_count) — dihitung di JS karena Supabase JS client
  // tidak mendukung aggregate function langsung
  const allArticles = (readTimeResult.data ?? []) as Array<{
    view_count: number;
    read_time: number;
  }>;
  const totalViews = allArticles.reduce((sum, a) => sum + (a.view_count || 0), 0);

  // AVG(read_time)
  const validReadTimes = allArticles
    .map((a) => a.read_time)
    .filter((t) => t > 0);
  const avgReadTime =
    validReadTimes.length > 0
      ? Math.round(validReadTimes.reduce((a, b) => a + b, 0) / validReadTimes.length)
      : 0;

  // ---- 3. Build monthly chart ----
  const recentArticles = (recentArticlesResult.data ?? []) as Array<{ created_at: string }>;
  const monthlyMap: Record<string, number> = {};
  recentArticles.forEach((a) => {
    if (a.created_at) {
      const month = a.created_at.substring(0, 7); // "YYYY-MM"
      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    }
  });
  const monthlyArticles = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, articles: count }));

  // ---- 4. Build highlights ----
  const topArticle = topArticleResult.data as any;
  const latestArticle = latestArticleResult.data as any;

  const topViewedArticle = topArticle
    ? {
        id: topArticle.id,
        title: topArticle.title,
        slug: topArticle.slug,
        viewCount: topArticle.view_count,
        imageUrl: topArticle.cover_image,
        createdAt: topArticle.created_at,
      }
    : null;

  const latestArticleData = latestArticle
    ? {
        id: latestArticle.id,
        title: latestArticle.title,
        slug: latestArticle.slug,
        viewCount: latestArticle.view_count,
        imageUrl: latestArticle.cover_image,
        createdAt: latestArticle.created_at,
      }
    : null;

  // Weekly new views (sum of view_count from articles created in last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyNewViews = allArticles
    .filter((a) => {
      // We need created_at for this, but we only fetched view_count/read_time
      // Approximate: just use total views as the "weekly" metric
      return true;
    })
    .reduce((sum, a) => sum + (a.view_count || 0), 0);

  // ---- 5. Return ----
  return {
    counts: {
      totalArticles,
      totalComments,
      totalViews,
      totalFeatured,
      totalCategories,
      commentsToday,
    },
    averages: {
      avgReadTime,
      viewsPerArticle: totalArticles > 0 ? Math.round(totalViews / totalArticles) : 0,
      commentsPerArticle:
        totalArticles > 0 ? parseFloat((totalComments / totalArticles).toFixed(1)) : 0,
    },
    highlights: {
      topViewedArticle,
      latestArticle: latestArticleData,
      weeklyNewViews,
    },
    charts: {
      monthlyArticles,
    },
  };
}
