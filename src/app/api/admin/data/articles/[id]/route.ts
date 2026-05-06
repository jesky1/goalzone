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
// PUT /api/admin/data/articles/[id] — Update article
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = authenticate(request);
  if (!auth.valid) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const supabase = createServerSupabaseClient();

    // Check article exists
    const { data: existing } = await supabase
      .from('articles')
      .select('id, title')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Artikel tidak ditemukan' }, { status: 404 });
    }

    // Build update object with snake_case fields, only including defined values
    const { title, slug, content, summary, imageUrl, categoryId, isFeatured, readTime } = body;

    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (imageUrl !== undefined) updateData.cover_image = imageUrl;
    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (isFeatured !== undefined) updateData.is_featured = isFeatured;
    if (readTime !== undefined) updateData.read_time = readTime;

    const { data: article, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select('*, categories(name, slug, color), profiles(username, full_name, avatar_url)')
      .single();

    if (error) {
      console.error('[Admin Article PUT Error]', error.message);
      return NextResponse.json({ success: false, error: 'Gagal mengupdate artikel' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Artikel berhasil diupdate', data: mapArticleWithNames(article) });
  } catch (error: any) {
    console.error('[Admin Article PUT Error]', error.message);
    return NextResponse.json({ success: false, error: 'Gagal mengupdate artikel' }, { status: 500 });
  }
}

// ============================================================
// DELETE /api/admin/data/articles/[id] — Delete article + comments
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = authenticate(request);
  if (!auth.valid) return auth.response;

  try {
    const { id } = await params;

    const supabase = createServerSupabaseClient();

    // Check article exists
    const { data: existing } = await supabase
      .from('articles')
      .select('id, title')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Artikel tidak ditemukan' }, { status: 404 });
    }

    // Delete associated comments first, then the article
    await supabase.from('comments').delete().eq('article_id', id);
    await supabase.from('articles').delete().eq('id', id);

    return NextResponse.json({ success: true, message: `Artikel "${existing.title}" berhasil dihapus` });
  } catch (error: any) {
    console.error('[Admin Article DELETE Error]', error.message);
    return NextResponse.json({ success: false, error: 'Gagal menghapus artikel' }, { status: 500 });
  }
}
