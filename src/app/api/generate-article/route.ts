import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
<<<<<<< HEAD
import sharp from 'sharp'
import { verifyAdmin } from '@/lib/admin-auth'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { generateSlug, calculateReadTime, truncateMeta } from '@/lib/article-utils'
=======
import { verifyAdmin } from '@/lib/admin-auth'
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0

// ============================================================
// GOALZONE — Admin AI Article Generator
// ============================================================
// POST /api/generate-article
//
// Generates a football news article using the LLM based on a
<<<<<<< HEAD
// given topic. Also generates a cover image using AI, applies
// watermark, and uploads to Supabase Storage.
// Returns title, slug, content (HTML), summary, metaDescription,
// suggested category, estimated read time, and imageUrl.
=======
// given topic. Returns title, content (HTML), summary, suggested
// category, and estimated read time.
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
//
// Auth: Bearer {ADMIN_API_KEY}
// ============================================================

// ─── Valid Categories ────────────────────────────────────────

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
] as const

// ─── System Prompt ───────────────────────────────────────────

const GENERATE_ARTICLE_SYSTEM_PROMPT = `Kamu adalah Jurnalis Sepak Bola Profesional dan Penulis Konten SEO yang bekerja untuk GOALZONE, portal berita sepak bola terkemuka di Indonesia.

═══════════════════════════════════════════════════════════
               INSTRUKSI — WAJIB DIIKUTI
═══════════════════════════════════════════════════════════

1. BAHASA: Tulis SELURUH konten dalam Bahasa Indonesia yang baik dan menarik.

2. JUDUL (title):
   - Buat judul yang menarik, emosional, dan SEO-friendly
   - Keyword utama di depan judul
   - Maksimal 80 karakter
   - JANGAN gunakan tanda kutip di judul

3. KONTEN (content):
   - Tulis artikel 3-4 paragraf yang mendalam dan informatif
   - Gunakan tag HTML: <p> untuk paragraf, <strong> untuk penekanan, <em> untuk italic
   - Sisipkan kata kunci terkait secara natural
   - Berikan analisis dan insight yang mendalam, bukan sekadar deskripsi
   - Jangan hanya menuliskan fakta — berikan opini dan prediksi yang menarik

4. RINGKASAN (summary):
   - Ringkasan 1-2 kalimat untuk card preview
   - Maksimal 160 karakter

<<<<<<< HEAD
5. META DESCRIPTION (metaDescription):
   - Deskripsi SEO untuk Google Search & Google News
   - Harus mengandung keyword utama dan menarik klik
   - WAJIB tepat 140-150 karakter (tidak boleh kurang atau lebih)
   - JANGAN sama dengan summary — buat versi yang lebih SEO-optimized

6. KATEGORI (category):
   - Pilih satu dari: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League, Transfer, Timnas, Analisis
   - Pilih berdasarkan topik yang diberikan

7. IMAGE PROMPT:
   - Buat prompt Bahasa Inggris yang detail untuk generate gambar cover artikel
   - Gambar harus bertema sepak bola, cinematic, ultra-realistic 8K
   - JANGAN sertakan teks, logo, atau nama pemain di gambar
   - Maksimal 200 karakter
=======
5. KATEGORI (category):
   - Pilih satu dari: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League, Transfer, Timnas, Analisis
   - Pilih berdasarkan topik yang diberikan

6. READ TIME:
   - Estimasi waktu baca dalam menit (angka bulat)
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0

═══════════════════════════════════════════════════════════
                    FORMAT OUTPUT WAJIB
═══════════════════════════════════════════════════════════
Output HANYA JSON valid, tanpa teks tambahan:

{
  "title": "Judul artikel yang menarik dan SEO-friendly",
  "content": "<p>Paragraf pertama...</p><p>Paragraf kedua...</p><p>Paragraf ketiga...</p><p>Paragraf keempat...</p>",
  "summary": "Ringkasan 1-2 kalimat untuk preview",
<<<<<<< HEAD
  "metaDescription": "Deskripsi SEO 140-150 karakter yang mengandung keyword utama dan menarik klik untuk Google News",
  "category": "Transfer",
  "imagePrompt": "Dramatic football stadium at night with floodlights, cinematic sports photography, ultra-realistic 8K, dramatic lighting"
=======
  "category": "Transfer",
  "readTime": 5
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
}

ATURAN FINAL:
- Output HANYA JSON — tidak boleh ada teks sebelum/sesudah JSON
- content: HTML VALID dengan tag <p>, bukan markdown
- category: harus salah satu dari daftar yang disediakan
<<<<<<< HEAD
- metaDescription: WAJIB 140-150 karakter, SEO-optimized untuk Google News
- imagePrompt: prompt Bahasa Inggris untuk AI image generation`

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
      console.error('[Generate Article] Storage upload error:', uploadError.message)
      return null
    }

    const { data: urlData } = supabase.storage.from('news-images').getPublicUrl(uploadData.path)
    return urlData.publicUrl
  } catch (err: any) {
    console.error('[Generate Article] Image generation failed:', err.message)
    return null
  }
}

// ─── Slug Dedup Check ────────────────────────────────────────

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  const supabase = createServerSupabaseClient()
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
=======
- readTime: angka bulat (menit)`
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0

// ─── POST Handler ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Auth check
  const auth = verifyAdmin(request)
  if (!auth.valid) return auth.response

  // 2. Parse body
  let body: { topic?: string; category?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { topic, category } = body

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'Field "topic" is required and must be a non-empty string' },
      { status: 400 }
    )
  }

  // Validate optional category
  if (category && !VALID_CATEGORIES.includes(category as any)) {
    return NextResponse.json(
      { success: false, error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
      { status: 400 }
    )
  }

  // 3. Build user prompt
  let userPrompt = `Tulis artikel berita sepak bola yang menarik dan mendalam tentang topik berikut:\n\n${topic.trim()}`
  if (category) {
    userPrompt += `\n\nKategori yang diminta: ${category}`
  }

  // 4. Call LLM
  try {
    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: GENERATE_ARTICLE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = completion.choices?.[0]?.message?.content || ''
    let jsonStr = raw.trim()

    // Strip code fences if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    // 5. Parse response
    let parsed: any
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      console.error('[Generate Article] Failed to parse AI JSON:', jsonStr.substring(0, 200))
      return NextResponse.json(
        { success: false, error: 'AI returned invalid JSON. Please try again.' },
        { status: 502 }
      )
    }

    // 6. Validate and sanitize fields
    const title = typeof parsed.title === 'string' ? parsed.title.replace(/["""]/g, '').substring(0, 200) : topic
    const content = typeof parsed.content === 'string' ? parsed.content : '<p>Artikel tidak dapat dihasilkan. Silakan coba lagi.</p>'
    const summary = typeof parsed.summary === 'string' ? parsed.summary.substring(0, 200) : topic
    const suggestedCategory = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : (category || 'Analisis')
<<<<<<< HEAD
    const imagePrompt = typeof parsed.imagePrompt === 'string' ? parsed.imagePrompt : `Dramatic football scene, ${topic.trim()}, cinematic sports photography, ultra-realistic 8K, dramatic lighting. No text, no logos.`

    // 7. Auto-Slug: generated from title with dedup check
    const baseSlug = generateSlug(title)
    const slug = await ensureUniqueSlug(baseSlug)

    // 8. Meta Description: from AI, fallback to summary truncated to 150 chars
    const metaDescription = typeof parsed.metaDescription === 'string' && parsed.metaDescription.length >= 100
      ? truncateMeta(parsed.metaDescription, 150)
      : truncateMeta(summary || title, 150)

    // 9. Estimated Read Time: calculated from word count (not AI estimate)
    const readTime = calculateReadTime(content)

    // 10. Generate cover image (non-blocking — article is returned even if image fails)
    let imageUrl: string | null = null
    try {
      imageUrl = await generateCoverImage(imagePrompt, slug)
    } catch (imgErr: any) {
      console.warn('[Generate Article] Cover image generation skipped:', imgErr.message)
    }
=======
    const readTime = typeof parsed.readTime === 'number' && parsed.readTime > 0 ? Math.round(parsed.readTime) : Math.max(3, Math.ceil(content.length / 500))
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0

    return NextResponse.json({
      success: true,
      article: {
        title,
<<<<<<< HEAD
        slug,
        content,
        summary,
        metaDescription,
        category: suggestedCategory,
        readTime,
        imageUrl,
        imagePrompt,
=======
        content,
        summary,
        category: suggestedCategory,
        readTime,
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
      },
    })
  } catch (err: any) {
    console.error('[Generate Article] LLM error:', err)
    return NextResponse.json(
      { success: false, error: `AI generation failed: ${err.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}
