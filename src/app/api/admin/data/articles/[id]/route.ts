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

    const existing = await db.article.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Artikel tidak ditemukan' }, { status: 404 });
    }

    const { title, slug, content, summary, imageUrl, categoryId, isFeatured, readTime } = body;
    const article = await db.article.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(summary !== undefined && { summary }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(categoryId !== undefined && { categoryId }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(readTime !== undefined && { readTime }),
      },
      include: { category: { select: { name: true } }, author: { select: { username: true } } },
    });

    return NextResponse.json({ success: true, message: 'Artikel berhasil diupdate', data: article });
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

    const existing = await db.article.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Artikel tidak ditemukan' }, { status: 404 });
    }

    await db.comment.deleteMany({ where: { articleId: id } });
    await db.article.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `Artikel "${existing.title}" berhasil dihapus` });
  } catch (error: any) {
    console.error('[Admin Article DELETE Error]', error.message);
    return NextResponse.json({ success: false, error: 'Gagal menghapus artikel' }, { status: 500 });
  }
}
