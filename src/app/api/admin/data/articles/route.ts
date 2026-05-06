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
// GET /api/admin/data/articles — List articles with search
// ============================================================
export async function GET(request: NextRequest) {
  const auth = authenticate(request);
  if (!auth.valid) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = Number(searchParams.get('limit') || '50');
    const offset = Number(searchParams.get('offset') || '0');

    const where: any = {};
    if (search) {
      where.OR = [{ title: { contains: String(search) } }, { summary: { contains: String(search) } }];
    }

    const [articles, total] = await Promise.all([
      db.article.findMany({
        where,
        include: { category: { select: { name: true } }, author: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.article.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        articles: articles.map((a) => ({
          ...a,
          categoryName: a.category?.name || null,
          authorName: a.author?.username || null,
          category: undefined,
          author: undefined,
        })),
        total,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error('[Admin Articles GET Error]', error.message);
    return NextResponse.json({ success: false, error: 'Gagal mengambil artikel' }, { status: 500 });
  }
}

// ============================================================
// POST /api/admin/data/articles — Create article
// ============================================================
export async function POST(request: NextRequest) {
  const auth = authenticate(request);
  if (!auth.valid) return auth.response;

  try {
    const { title, slug, content, summary, imageUrl, categoryId, authorId, isFeatured, readTime } = await request.json();

    if (!title || !slug || !content || !categoryId) {
      return NextResponse.json({ success: false, error: 'title, slug, content, categoryId wajib diisi' }, { status: 400 });
    }

    const article = await db.article.create({
      data: {
        title,
        slug,
        content,
        summary: summary || null,
        imageUrl: imageUrl || null,
        categoryId,
        authorId: authorId || null,
        isFeatured: isFeatured || false,
        readTime: readTime || 5,
      },
      include: { category: { select: { name: true } }, author: { select: { username: true } } },
    });

    return NextResponse.json({ success: true, message: 'Artikel berhasil dibuat', data: article }, { status: 201 });
  } catch (error: any) {
    console.error('[Admin Articles POST Error]', error.message);
    return NextResponse.json({ success: false, error: 'Gagal membuat artikel' }, { status: 500 });
  }
}
