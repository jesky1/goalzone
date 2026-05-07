import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

// ============================================================
// GET /api/admin/stats — Platform Statistics
// Server-side Supabase aggregate queries
// ============================================================
//
// Uses Supabase's .select() with aggregate functions to efficiently
// compute stats directly in the database (no JS-side loops).
//
// Returns:
//   - totalArticles:  COUNT(*) from articles
//   - totalComments: COUNT(*) from comments
//   - totalViews:    SUM(view_count) from articles
//   - totalFeatured: COUNT(*) from articles WHERE is_featured = true
//   - totalCategories: COUNT(*) from categories
//   - avgReadTime:  AVG(read_time) from articles
//   - topViewedArticle: article with highest view_count
//   - latestArticle: most recently created article
//   - commentsToday: comments created today
// ============================================================

export async function GET(request: NextRequest) {
  // Simple admin check (same pattern as /api/admin/data)
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();

    // ---- 1. Core aggregate queries (parallel) ----

    // Count all articles
    const { count: articleCount, error: aErr } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });

    // Count all comments
    const { count: commentCount, error: cErr } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });

    // Sum view_count across all articles
    const { data: viewsData, error: vErr } = await supabase
      .from('articles')
      .select('view_count');

    // Count featured articles
    const { count: featuredCount, error: fErr } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('is_featured', true);

    // Count categories
    const { count: categoryCount, error: catErr } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    // Average read time
    const { data: avgData, error: avgErr } = await supabase
      .from('articles')
      .select('read_time');

    // ---- 2. Enrichment queries (parallel) ----

    // Top viewed article
    const { data: topArticle } = await supabase
      .from('articles')
      .select('id, title, slug, view_count, cover_image, created_at')
      .order('view_count', { ascending: false })
      .limit(1)
      .single();

    // Latest article
    const { data: latestArticle } = await supabase
      .from('articles')
      .select('id, title, slug, view_count, cover_image, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Comments today (UTC)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: commentsToday, error: ctErr } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    // Articles per month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const { data: monthlyArticles } = await supabase
      .from('articles')
      .select('created_at')
      .gte('created_at', twelveMonthsAgo.toISOString());

    // Group by month
    const monthlyMap: Record<string, number> = {};
    if (monthlyArticles) {
      monthlyArticles.forEach((a: any) => {
        if (a.created_at) {
          const month = a.created_at.substring(0, 7); // "YYYY-MM"
          monthlyMap[month] = (monthlyMap[month] || 0) + 1;
        }
      });
    }

    // Views per day this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: weeklyViews } = await supabase
      .from('articles')
      .select('view_count, created_at')
      .gte('created_at', weekAgo.toISOString());

    // ---- 3. Compute aggregates ----

    const totalArticles = articleCount ?? 0;
    const totalComments = commentCount ?? 0;
    const totalViews = (viewsData ?? []).reduce((sum, a) => sum + (a.view_count || 0), 0);
    const totalFeatured = featuredCount ?? 0;
    const totalCategories = categoryCount ?? 0;

    // Average read time (rounded)
    const allReadTimes = (avgData ?? []).map((a: any) => a.read_time).filter((t: number) => t > 0);
    const avgReadTime = allReadTimes.length > 0
      ? Math.round(allReadTimes.reduce((a: number, b: number) => a + b, 0) / allReadTimes.length)
      : 0;

    // Weekly new views (sum of views from articles published this week)
    const weeklyNewViews = (weeklyViews ?? []).reduce((sum: number, a: any) => sum + (a.view_count || 0), 0);

    // Build monthly chart data
    const monthlyChart = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month,
        articles: count,
      }));

    // ---- 4. Build response ----

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          totalArticles,
          totalComments,
          totalViews,
          totalFeatured,
          totalCategories,
          commentsToday: commentsToday ?? 0,
        },
        averages: {
          avgReadTime,
          viewsPerArticle: totalArticles > 0 ? Math.round(totalViews / totalArticles) : 0,
          commentsPerArticle: totalArticles > 0 ? parseFloat((totalComments / totalArticles).toFixed(1)) : 0,
        },
        highlights: {
          topViewedArticle: topArticle
            ? {
                id: topArticle.id,
                title: topArticle.title,
                slug: topArticle.slug,
                viewCount: topArticle.view_count,
                imageUrl: topArticle.cover_image,
                createdAt: topArticle.created_at,
              }
            : null,
          latestArticle: latestArticle
            ? {
                id: latestArticle.id,
                title: latestArticle.title,
                slug: latestArticle.slug,
                viewCount: latestArticle.view_count,
                imageUrl: latestArticle.cover_image,
                createdAt: latestArticle.created_at,
              }
            : null,
          weeklyNewViews,
        },
        charts: {
          monthlyArticles: monthlyChart,
        },
      },
    });
  } catch (error: any) {
    console.error('[Admin Stats Error]', error.message);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil statistik' },
      { status: 500 }
    );
  }
}
