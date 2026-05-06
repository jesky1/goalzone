import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createServerSupabaseClient, mapArticleWithNames } from '@/lib/supabase/client';

const JWT_SECRET = process.env.JWT_SECRET || 'goalzone-admin-secret-2025';

function authenticate(request: NextRequest): { valid: true; decoded: any } | { valid: false; response: NextResponse } {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  try {
    const decoded = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET);
    return { valid: true, decoded };
  } catch {
    return { valid: false, response: NextResponse.json({ success: false, error: 'Token tidak valid atau expired' }, { status: 401 }) };
  }
}

// ============================================================
// GET /api/admin/data — All dashboard data + stats
// ============================================================
export async function GET(request: NextRequest) {
  const auth = authenticate(request);
  if (!auth.valid) return auth.response;

  try {
    const supabase = createServerSupabaseClient();

    // Run independent queries in parallel
    const [articlesRes, commentsRes, featuredRes, categoriesRes, viewsRes] = await Promise.all([
      supabase
        .from('articles')
        .select('*, categories(name, slug, color), profiles(username, full_name, avatar_url)')
        .order('created_at', { ascending: false }),
      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('is_featured', true),
      supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true }),
      supabase
        .from('articles')
        .select('view_count'),
    ]);

    const totalArticles = articlesRes.count ?? articlesRes.data?.length ?? 0;
    const totalComments = commentsRes.count ?? 0;
    const featuredArticles = featuredRes.count ?? 0;
    const categories = categoriesRes.data ?? [];

    // Sum view counts in JS
    const totalViews = (viewsRes.data ?? []).reduce((sum, a) => sum + (a.view_count || 0), 0);

    // Build category article count map
    const categoryCountMap: Record<string, number> = {};
    (articlesRes.data ?? []).forEach((a: any) => {
      if (a.category_id) {
        categoryCountMap[a.category_id] = (categoryCountMap[a.category_id] || 0) + 1;
      }
    });

    // Fetch recent 10 comments with user and article info
    const { data: recentCommentsRaw } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url), articles(title)')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalArticles,
          totalComments,
          totalViews,
          featuredArticles,
          totalCategories: categories.length,
        },
        articles: (articlesRes.data ?? []).map((a: any) => mapArticleWithNames(a)),
        categories: categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          color: c.color,
          icon: c.icon,
          articleCount: categoryCountMap[c.id] || 0,
        })),
        recentComments: (recentCommentsRaw ?? []).map((c: any) => ({
          id: c.id,
          text: c.content,
          createdAt: c.created_at,
          authorName: c.profiles?.username || 'Anonymous',
          articleTitle: c.articles?.title || null,
        })),
      },
    });
  } catch (error: any) {
    console.error('[Admin Data Error]', error.message);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data' }, { status: 500 });
  }
}
