import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { generateSlug, calculateReadTime, truncateMeta } from '@/lib/article-utils';

const JWT_SECRET = process.env.JWT_SECRET || 'goalzone-admin-secret-2025';
const DEFAULT_AUTHOR_ID = process.env.ARTICLE_GEN_AUTHOR_ID || '';

// ─── JWT Auth ───────────────────────────────────────────────
function authenticate(request: NextRequest): { valid: true; decoded: any } | { valid: false; response: NextResponse } {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, response: NextResponse.json({ success: false, error: 'Unauthorized — token tidak ditemukan' }, { status: 401 }) };
  }
  try {
    const decoded = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET);
    return { valid: true, decoded };
  } catch {
    return { valid: false, response: NextResponse.json({ success: false, error: 'Token tidak valid atau expired' }, { status: 401 }) };
  }
}

// ─── Slug Dedup Check ───────────────────────────────────────
async function ensureUniqueSlug(supabase: any, baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const { data } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!data) return slug // slug is unique

    counter++
    slug = `${baseSlug}-${counter}`
  }
}

// ============================================================
// POST /api/admin/save-article
// Saves an AI-generated article to Supabase as draft.
//
// Auto-generates slug from title with dedup check.
// Auto-calculates read_time from word count.
// Uses metaDescription for seo_description (or falls back to summary).
// ============================================================
export async function POST(request: NextRequest) {
  const auth = authenticate(request);
  if (!auth.valid) return auth.response;

  try {
    const body = await request.json();
    const { title, content, summary, category, readTime, seoKeywords, imageUrl, metaDescription, slug: providedSlug } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'title dan content wajib diisi' },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();

    // 1. Auto-Slug: generate from title with dedup check
    //    If slug is provided (from AI generator), validate & use it; otherwise generate from title
    let slug: string
    if (providedSlug && typeof providedSlug === 'string' && providedSlug.trim().length > 0) {
      slug = await ensureUniqueSlug(supabase, providedSlug.trim())
    } else {
      const baseSlug = generateSlug(title)
      slug = await ensureUniqueSlug(supabase, baseSlug)
    }

    // 2. Resolve category_id
    let categoryId: string | null = null;
    if (category) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .or(`name.ilike.${category},slug.ilike.${category.toLowerCase().replace(/\s+/g, '-')}`)
        .limit(1);

      if (catData && catData.length > 0) {
        categoryId = catData[0].id;
      }
    }

    // Fallback: try to find any category if specific one not found
    if (!categoryId) {
      const { data: fallbackCat } = await supabase
        .from('categories')
        .select('id')
        .limit(1);

      if (fallbackCat && fallbackCat.length > 0) {
        categoryId = fallbackCat[0].id;
      }
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada kategori ditemukan di database. Buat kategori terlebih dahulu.' },
        { status: 400 },
      );
    }

    // 3. Resolve author_id — prefer env var, fallback to JWT decoded id
    const authorId = DEFAULT_AUTHOR_ID || auth.decoded?.id || null;

    // 4. Estimated Read Time: always recalculate from word count
    const calculatedReadTime = calculateReadTime(content)

    // 5. SEO Description: use metaDescription from AI if available, else fall back to summary
    const seoDescription = metaDescription
      ? truncateMeta(metaDescription, 150)
      : truncateMeta(summary || title, 150)

    // 6. Insert into articles table with status 'draft'
    const { data: article, error: dbError } = await supabase
      .from('articles')
      .insert({
        title,
        slug,
        content,
        summary: summary || null,
        category_id: categoryId,
        author_id: authorId,
        status: 'draft',
        is_featured: false,
        is_trending: true,
        read_time: calculatedReadTime,
        cover_image: imageUrl || null,
        seo_title: title.substring(0, 500),
        seo_description: seoDescription,
        seo_keywords: Array.isArray(seoKeywords) && seoKeywords.length > 0 ? seoKeywords : null,
      })
      .select('id, title, slug, status, is_trending, read_time, created_at, categories(name, slug, color)')
      .single();

    if (dbError) {
      console.error('[Save Article] Supabase insert error:', dbError.message);
      return NextResponse.json(
        { success: false, error: `Gagal menyimpan artikel: ${dbError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Berita berhasil disimpan sebagai Draft!',
      data: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        status: article.status,
        isTrending: article.is_trending,
        readTime: article.read_time,
        category: (article as any).categories?.name || category,
        seoDescription,
        createdAt: article.created_at,
      },
    });
  } catch (err: any) {
    console.error('[Save Article] Error:', err);
    return NextResponse.json(
      { success: false, error: `Gagal menyimpan artikel: ${err.message || 'Unknown error'}` },
      { status: 500 },
    );
  }
}
