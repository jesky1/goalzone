import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

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
    const [totalArticles, totalComments, viewsAgg, featuredArticles, categories] = await Promise.all([
      db.article.count(),
      db.comment.count(),
      db.article.aggregate({ _sum: { viewCount: true } }),
      db.article.count({ where: { isFeatured: true } }),
      db.category.findMany({ include: { _count: { select: { articles: true } } }, orderBy: { name: 'asc' } }),
    ]);

    const articles = await db.article.findMany({
      include: { category: { select: { name: true } }, author: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const recentComments = await db.comment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true } }, article: { select: { title: true } } },
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalArticles,
          totalComments,
          totalViews: viewsAgg._sum.viewCount || 0,
          featuredArticles,
          totalCategories: categories.length,
        },
        articles: articles.map((a) => ({
          ...a,
          categoryName: a.category?.name || null,
          authorName: a.author?.username || null,
          category: undefined,
          author: undefined,
        })),
        categories: categories.map((c) => ({ ...c, articleCount: c._count.articles })),
        recentComments: recentComments.map((c) => ({
          id: c.id,
          text: c.text,
          createdAt: c.createdAt,
          authorName: c.user?.username || 'Anonymous',
          articleTitle: c.article?.title || null,
        })),
      },
    });
  } catch (error: any) {
    console.error('[Admin Data Error]', error.message);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data' }, { status: 500 });
  }
}
