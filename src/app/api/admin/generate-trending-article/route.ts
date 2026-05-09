import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import ZAI from 'z-ai-web-dev-sdk';
import sharp from 'sharp';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { generateSlug, calculateReadTime, truncateMeta } from '@/lib/article-utils';

// ============================================================
// GOALZONE — Admin Trending Article Generator
// ============================================================
// POST /api/admin/generate-trending-article
//
// Generates a trending football news article using AI (LLM)
// based on a given topic (e.g. from Google Trends).
// Also generates a cover image, applies watermark, uploads to
// Supabase Storage, and saves the result to Supabase articles
// table with status='draft' and is_trending=true.
//
// Auto-Slug: generated from title with DB dedup check.
// Meta Description: AI-generated 150-char SEO description.
// Read Time: calculated from word count (200 wpm).
//
// Auth: JWT Bearer token (admin only)
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET || 'goalzone-admin-secret-2025';
const DEFAULT_AUTHOR_ID = process.env.ARTICLE_GEN_AUTHOR_ID || '';
const DEFAULT_CATEGORY_ID = process.env.ARTICLE_GEN_CATEGORY_ID || '';

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

// ─── Valid Categories ───────────────────────────────────────
const VALID_CATEGORIES = [
  'Premier League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'Champions League',
  'Europa League',
  'Transfer',
  'Timnas',
  'Analisis',
] as const;

// ─── System Prompt for Trending Article ─────────────────────
const TRENDING_ARTICLE_SYSTEM_PROMPT = `Kamu adalah Jurnalis Sepak Bola Senior dan Ahli SEO yang bekerja untuk GOALZONE, portal berita sepak bola #1 di Indonesia.

═══════════════════════════════════════════════════════════
     INSTRUKSI — ARTIKEL TRENDING (WAJIB DIIKUTI)
═══════════════════════════════════════════════════════════

1. BAHASA: Tulis SELURUH konten dalam Bahasa Indonesia yang profesional dan engaging.

2. JUDUL (title):
   - Buat judul yang VIRAL, emosional, dan sangat SEO-friendly
   - Keyword utama di awal judul
   - Gunakan angka, pertanyaan, atau klaim kuat untuk menarik perhatian
   - Maksimal 80 karakter
   - JANGAN gunakan tanda kutip di judul

3. KONTEN (content):
   - Tulis artikel 4-5 paragraf yang mendalam, informatif, dan engaging
   - Gunakan tag HTML: <p> untuk paragraf, <strong> untuk penekanan, <em> untuk italic
   - Paragraf pertama HARUS hook yang kuat — membuat pembaca ingin terus membaca
   - Sisipkan kata kunci terkait secara natural (2-3 kali per paragraf)
   - Berikan analisis mendalam, data/fakta menarik, dan opini yang kontroversial tapi berimbang
   - Sertakan konteks mengapa topik ini sedang TRENDING sekarang
   - Tutup dengan prediksi atau pertanyaan yang memicu diskusi

4. RINGKASAN (summary):
   - Ringkasan 1-2 kalimat yang membuat orang penasaran
   - Maksimal 160 karakter
   - Harus mengandung keyword utama

5. META DESCRIPTION (metaDescription):
   - Deskripsi SEO untuk Google Search & Google News
   - Harus mengandung keyword utama dan menarik klik
   - WAJIB tepat 140-150 karakter (tidak boleh kurang atau lebih)
   - JANGAN sama dengan summary — buat versi yang lebih SEO-optimized

6. KATEGORI (category):
   - Pilih satu dari: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League, Transfer, Timnas, Analisis

7. SEO KEYWORDS:
   - Berikan 5-8 keyword SEO yang relevan dalam array string

8. IMAGE PROMPT:
   - Buat prompt Bahasa Inggris yang detail untuk generate gambar cover artikel
   - Gambar harus bertema sepak bola, cinematic, ultra-realistic 8K
   - JANGAN sertakan teks, logo, atau nama pemain di gambar
   - Maksimal 200 karakter

═══════════════════════════════════════════════════════════
                 FORMAT OUTPUT WAJIB
═══════════════════════════════════════════════════════════
Output HANYA JSON valid, tanpa teks tambahan:

{
  "title": "Judul viral dan SEO-friendly",
  "content": "<p>Hook paragraf pertama...</p><p>Paragraf kedua...</p><p>Paragraf ketiga...</p><p>Paragraf keempat...</p><p>Penutup dan prediksi...</p>",
  "summary": "Ringkasan singkat yang engaging",
  "metaDescription": "Deskripsi SEO 140-150 karakter yang mengandung keyword utama dan menarik klik untuk Google News",
  "category": "Transfer",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "imagePrompt": "Dramatic football transfer scene, player silhouette against stadium lights, cinematic sports photography, ultra-realistic 8K, dramatic lighting"
}

ATURAN FINAL:
- Output HANYA JSON — tidak boleh ada teks sebelum/sesudah JSON
- content: HTML VALID dengan tag <p>, bukan markdown
- category: harus salah satu dari daftar yang disediakan
- metaDescription: WAJIB 140-150 karakter, SEO-optimized untuk Google News
- seoKeywords: array of strings, 5-8 keywords
- imagePrompt: prompt Bahasa Inggris untuk AI image generation`;

// ─── Image Generation ────────────────────────────────────────

async function generateCoverImage(imagePrompt: string, slug: string): Promise<string | null> {
  try {
    // 1. Generate image with AI
    const zai = await ZAI.create()
    const response = await zai.images.generations.create({
      prompt: imagePrompt,
      size: '1344x768',
    })
    const base64 = response.data?.[0]?.base64
    if (!base64) throw new Error('No image data returned')

    const imageBuffer = Buffer.from(base64, 'base64')

    // 2. Apply GOALZONE watermark
    const { width = 1344, height = 768 } = await sharp(imageBuffer).metadata()
    const logoWidth = Math.round(width * 0.10)
    const logoHeight = logoWidth
    const padding = 28
    const svgW = logoWidth + padding
    const svgH = logoHeight + padding
    const opacity = 0.55

    const overlaySvg = Buffer.from(
      `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wm-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.55)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.35)"/>
    </linearGradient>
    <filter id="wm-shadow">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>
  <g filter="url(#wm-shadow)">
    <rect x="4" y="4" width="${logoWidth - 8}" height="${logoHeight - 8}" rx="8" ry="8" fill="url(#wm-bg)"/>
    <text x="${logoWidth / 2}" y="${logoHeight / 2 + 6}"
          font-family="Arial, Helvetica, sans-serif" font-weight="900"
          font-size="${Math.round(logoHeight * 0.38)}"
          fill="white" text-anchor="middle" dominant-baseline="middle"
          opacity="${opacity}">GOALZONE</text>
  </g>
</svg>`
    )

    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([{ input: overlaySvg, gravity: 'southeast' as const, blend: 'over' as const }])
      .png({ compressionLevel: 9 })
      .toBuffer()

    // 3. Upload to Supabase Storage
    const supabase = createServerSupabaseClient()
    const timestamp = Date.now()
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const fileName = `${timestamp}-${slug}.png`
    const filePath = `articles/${year}/${month}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('news-images')
      .upload(filePath, watermarkedBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: false,
      })

    if (uploadError) {
      console.error('[Trending Article] Storage upload error:', uploadError.message)
      return null
    }

    const { data: urlData } = supabase.storage.from('news-images').getPublicUrl(uploadData.path)
    return urlData.publicUrl
  } catch (err: any) {
    console.error('[Trending Article] Image generation failed:', err.message)
    return null
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

// ─── POST Handler ───────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Auth check — JWT Bearer token
  const auth = authenticate(request);
  if (!auth.valid) return auth.response;

  // 2. Parse body
  let body: { topic?: string; category?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const { topic, category } = body;

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'Topik wajib diisi' },
      { status: 400 },
    );
  }

  // Validate optional category
  if (category && !VALID_CATEGORIES.includes(category as any)) {
    return NextResponse.json(
      { success: false, error: `Kategori tidak valid. Pilih: ${VALID_CATEGORIES.join(', ')}` },
      { status: 400 },
    );
  }

  // 3. Build user prompt — emphasize trending context
  let userPrompt = `Topik TRENDING yang sedang viral sekarang:\n\n"${topic.trim()}"\n\nTulis artikel berita sepak bola yang menarik, mendalam, dan SEO-optimized berdasarkan topik trending ini. Pastikan artikel menjelaskan MENGAPA topik ini sedang hangat dan apa dampaknya.`;
  if (category) {
    userPrompt += `\n\nKategori yang diminta: ${category}`;
  }

  // 4. Call LLM to generate article
  try {
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: TRENDING_ARTICLE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    });

    const raw = completion.choices?.[0]?.message?.content || '';
    let jsonStr = raw.trim();

    // Strip code fences if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    // 5. Parse AI response
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error('[Trending Article] Failed to parse AI JSON:', jsonStr.substring(0, 300));
      return NextResponse.json(
        { success: false, error: 'AI mengembalikan format yang tidak valid. Silakan coba lagi.' },
        { status: 502 },
      );
    }

    // 6. Validate and sanitize fields
    const title = typeof parsed.title === 'string'
      ? parsed.title.replace(/["""]/g, '').substring(0, 200)
      : topic;
    const content = typeof parsed.content === 'string'
      ? parsed.content
      : '<p>Artikel tidak dapat dihasilkan. Silakan coba lagi.</p>';
    const summary = typeof parsed.summary === 'string'
      ? parsed.summary.substring(0, 200)
      : topic;
    const suggestedCategory = VALID_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : (category || 'Analisis');
    const seoKeywords = Array.isArray(parsed.seoKeywords)
      ? parsed.seoKeywords.filter((k: any) => typeof k === 'string').slice(0, 8)
      : [];
    const imagePrompt = typeof parsed.imagePrompt === 'string'
      ? parsed.imagePrompt
      : `Dramatic football scene, ${topic.trim()}, cinematic sports photography, ultra-realistic 8K, dramatic lighting. No text, no logos.`;

    // 7. Auto-Slug: generated from title with DB dedup check
    const supabase = createServerSupabaseClient();
    const baseSlug = generateSlug(title);
    const slug = await ensureUniqueSlug(supabase, baseSlug);

    // 8. Meta Description: from AI, fallback to summary truncated to 150 chars
    const metaDescription = typeof parsed.metaDescription === 'string' && parsed.metaDescription.length >= 100
      ? truncateMeta(parsed.metaDescription, 150)
      : truncateMeta(summary || title, 150);

    // 9. Estimated Read Time: calculated from word count (200 wpm)
    const readTime = calculateReadTime(content);

    // 10. Generate cover image (non-blocking — article saved even if image fails)
    let imageUrl: string | null = null;
    try {
      imageUrl = await generateCoverImage(imagePrompt, slug);
    } catch (imgErr: any) {
      console.warn('[Trending Article] Cover image generation skipped:', imgErr.message);
    }

    // 11. Resolve category_id from Supabase
    let categoryId = DEFAULT_CATEGORY_ID;

    if (suggestedCategory) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .or(`name.ilike.${suggestedCategory},slug.ilike.${suggestedCategory.toLowerCase().replace(/\s+/g, '-')}`)
        .limit(1);

      if (catData && catData.length > 0) {
        categoryId = catData[0].id;
      }
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Kategori tidak ditemukan di database. Pastikan kategori sudah dibuat.' },
        { status: 400 },
      );
    }

    // 12. Resolve author_id
    const authorId = DEFAULT_AUTHOR_ID || auth.decoded?.id || null;

    // 13. Save to Supabase — status 'draft', is_trending true, with cover_image + meta_description
    const { data: article, error: dbError } = await supabase
      .from('articles')
      .insert({
        title,
        slug,
        content,
        summary,
        cover_image: imageUrl,
        category_id: categoryId,
        author_id: authorId,
        status: 'draft',
        is_featured: false,
        is_trending: true,
        read_time: readTime,
        seo_title: title.substring(0, 500),
        seo_description: metaDescription,
        seo_keywords: seoKeywords.length > 0 ? seoKeywords : null,
      })
      .select('id, title, slug, status, is_trending, read_time, created_at, categories(name, slug, color)')
      .single();

    if (dbError) {
      console.error('[Trending Article] Supabase insert error:', dbError.message);
      return NextResponse.json(
        { success: false, error: `Gagal menyimpan artikel: ${dbError.message}` },
        { status: 500 },
      );
    }

    // 14. Return success
    return NextResponse.json({
      success: true,
      message: 'Artikel trending berhasil dibuat dan disimpan sebagai draft',
      data: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        status: article.status,
        isTrending: article.is_trending,
        category: (article as any).categories?.name || suggestedCategory,
        readTime: article.read_time,
        seoKeywords,
        metaDescription,
        imageUrl,
        createdAt: article.created_at,
      },
    });
  } catch (err: any) {
    console.error('[Trending Article] Error:', err);
    return NextResponse.json(
      { success: false, error: `Gagal membuat artikel: ${err.message || 'Unknown error'}` },
      { status: 500 },
    );
  }
}
