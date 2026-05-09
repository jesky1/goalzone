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

    const supabase = createServerSupabaseClient();

    let query = supabase
      .from('articles')
      .select('*, categories(name, slug, color), profiles(username, full_name, avatar_url)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
    }

    const { data: articles, count: total } = await query;

    return NextResponse.json({
      success: true,
      data: {
        articles: (articles ?? []).map((a: any) => mapArticleWithNames(a)),
        total: total ?? 0,
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

    const supabase = createServerSupabaseClient();

    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        title,
        slug,
        content,
        summary: summary || null,
        cover_image: imageUrl || null,
        category_id: categoryId,
        author_id: authorId || null,
        is_featured: isFeatured || false,
        read_time: readTime || 5,
      })
      .select('*, categories(name, slug, color), profiles(username, full_name, avatar_url)')
      .single();

    if (error) {
      console.error('[Admin Articles POST Error]', error.message);
      return NextResponse.json({ success: false, error: 'Gagal membuat artikel' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Artikel berhasil dibuat', data: mapArticleWithNames(article) }, { status: 201 });
  } catch (error: any) {
    console.error('[Admin Articles POST Error]', error.message);
    return NextResponse.json({ success: false, error: 'Gagal membuat artikel' }, { status: 500 });
  }
}
