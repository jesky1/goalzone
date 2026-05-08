import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { saveArticle, getCacheStats } from '@/lib/article-store'

// ============================================================
// GOALZONE — Manual Article Generator API (Unified Store)
// ============================================================
// POST /api/generate-article  → Generate article via AI + auto-save
// GET  /api/generate-article  → Status info + available categories
// Saves to: Supabase → Prisma/SQLite → In-memory cache (auto-fallback)
// ============================================================

// ─── Types ───────────────────────────────────────────────────

interface GenerateArticleRequest {
  topic: string
  category?: CategorySlug
  language?: string
  generateImage?: boolean
}

type CategorySlug =
  | 'match-report'
  | 'transfer'
  | 'taktik'
  | 'premier-league'
  | 'la-liga'
  | 'serie-a'
  | 'champions-league'
  | 'bundesliga'
  | 'general'

interface AIArticleOutput {
  title: string
  slug: string
  content_html: string
  summary: string
  meta_description: string
  image_prompt: string
}

// ─── Category Map ───────────────────────────────────────────

const CATEGORY_MAP: Record<CategorySlug, string> = {
  'match-report': 'Laporan Pertandingan',
  'transfer': 'Transfer Pemain',
  'taktik': 'Analisis Taktik',
  'premier-league': 'Premier League',
  'la-liga': 'La Liga',
  'serie-a': 'Serie A',
  'champions-league': 'Champions League',
  'bundesliga': 'Bundesliga',
  'general': 'Sepak Bola Umum',
}

// Map our slugs to Supabase category slugs
const CATEGORY_SLUG_MAP: Record<CategorySlug, string> = {
  'match-report': 'analisis-taktis',
  'transfer': 'transfer',
  'taktik': 'analisis-taktis',
  'premier-league': 'premier-league',
  'la-liga': 'la-liga',
  'serie-a': 'serie-a',
  'champions-league': 'champions-league',
  'bundesliga': 'bundesliga',
  'general': 'analisis-taktis',
}

const VALID_CATEGORIES = Object.keys(CATEGORY_MAP) as CategorySlug[]

// ─── System Prompt ──────────────────────────────────────────

const ARTICLE_SYSTEM_PROMPT = `Kamu adalah Senior SEO Specialist sekaligus Jurnalis Sepak Bola Profesional kelas dunia yang bekerja untuk GOALZONE, portal berita sepak bola terkemuka di Indonesia.

═══════════════════════════════════════════════════════════
               INSTRUKSI SEO KETAT — WAJIB DIIKUTI
═══════════════════════════════════════════════════════════

1. STRUKTUR JUDUL (H1):
   - Keyword Utama HARUS di depan judul
   - Gunakan gaya emosional/kontroversial untuk CTR tinggi
   - Maks 80 karakter, JANGAN gunakan tanda kutip di judul

2. OPTIMASI LSI (Latent Semantic Indexing):
   Sisipkan kata kunci terkait SECARA NATURAL di dalam artikel:
   - "Hasil pertandingan", "Klasemen terbaru", "Top skor"
   - "Analisis taktik", "Jalannya pertandingan", "Pencetak gol"
   - "Berita sepak bola terkini", "Highlight pertandingan"
   - JANGAN menyebutkan kata-kata ini sebagai list — sisipkan dalam kalimat natural

3. KONTEN UNIK (ANTI-AI DETECTOR) — INI PALING PENTING:
   ❌ JANGAN hanya menuliskan ulang informasi mentah
   ✅ BERIKAN ANALISIS "KENAPA" — Analisis taktis mendalam
   ✅ NARASI MOMEN KUNCI — Tulis seperti reporter lapangan
   ✅ PREDIKSI DAMPAK — Bagaimana hal ini mempengaruhi kompetisi

4. STRUKTUR ARTIKEL (WAJIB ikuti heading hierarchy):
   Gunakan minimal 3 tag <h2> dan 1 tag <h3>.
   Contoh struktur:
   <h2>Ringkasan</h2>
   <h2>Analisis Mendalam</h2>
   <h3>Statistik & Data Kunci</h3>
   <h2>Prediksi & Dampak</h2>

5. FEATURED SNIPPET READY:
   Di bagian <h3>Statistik & Data Kunci</h3>, gunakan format <ul><li>
   agar Google bisa mengambil sebagai Featured Snippet.

6. CALL TO ACTION (CTA):
   "Bagaimana pendapatmu tentang hal ini? Tulis di kolom komentar di bawah!"

7. SIGNATURE LINE:
   <p><em>Laporan eksklusif oleh tim redaksi GoalZone.</em></p>

8. IMAGE PROMPT:
   Buat deskripsi gambar sinematik dalam bahasa Inggris untuk DALL-E 3 (1344x768).
   Format: pertandingan sepak bola dramatis, stadium penuh penonton, pencahayaan sinematik.

═══════════════════════════════════════════════════════════
                    FORMAT OUTPUT WAJIB
═══════════════════════════════════════════════════════════
Output HANYA JSON valid, tanpa teks tambahan:

{
  "title": "Judul H1 — emosional, keyword di depan, maks 80 karakter",
  "slug": "slug-url-friendly-lowercase-hanya-huruf-angka-strip",
  "meta_description": "Rich snippet meta description, maks 150 karakter",
  "summary": "Ringkasan 1-2 kalimat untuk card preview (maks 160 karakter)",
  "content_html": "Artikel lengkap dalam HTML. Gunakan tag: <p>, <h2>, <h3>, <strong>, <em>, <ul>, <li>, <blockquote>. Minimal 8 paragraf.",
  "image_prompt": "Cinematic English prompt for DALL-E 3 (1344x768). Dramatic football scene, no text, no logos."
}

ATURAN FINAL:
- title: emosional, akurat, keyword di depan, TANPA tanda kutip
- slug: unik, lowercase, [a-z0-9-] saja
- content_html: HTML VALID, bukan markdown, WAJIB 8+ paragraf
- content_html: WAJIB mengandung minimal 3 tag <h2> dan 1 tag <h3>
- content_html: WAJIB diakhiri CTA + signature "Laporan eksklusif oleh tim redaksi GoalZone."
- meta_description: ≤150 karakter
- image_prompt: English, descriptive, cinematic, no text/logos
- Output HANYA JSON — tidak boleh ada teks sebelum/sesudah JSON`

// ─── Helper Functions ───────────────────────────────────────

function cleanSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 120)
}

function isValidCategory(value: string): value is CategorySlug {
  return VALID_CATEGORIES.includes(value as CategorySlug)
}

// ─── AI Content Generation ──────────────────────────────────

async function generateArticleContent(
  topic: string,
  category: CategorySlug,
  language: string
): Promise<AIArticleOutput> {
  const zai = await ZAI.create()

  const categoryLabel = CATEGORY_MAP[category]
  const langInstruction = language === 'id'
    ? 'Tulis seluruh artikel dalam Bahasa Indonesia yang natural dan profesional.'
    : `Tulis artikel dalam bahasa "${language}".`

  const userPrompt = `Bertindaklah sebagai Senior SEO Specialist dan Jurnalis Sepak Bola Profesional untuk GOALZONE.

TOPIC / TEMA ARTIKEL:
${topic}

KATEGORI: ${categoryLabel} (${category})

${langInstruction}

INGAT:
- Tulis artikel mendalam, seru, dan SEO-optimized.
- Jangan hanya ulang informasi mentah. BERI ANALISIS MENDALAM.
- Buat narasi yang engaging untuk pembaca.
- Sertakan prediksi dan dampak ke dunia sepak bola.
- Diakhiri CTA + "Laporan eksklusif oleh tim redaksi GoalZone."
- Buat image_prompt yang sinematik untuk DALL-E 3.
- Output HANYA JSON.`

  const completion = await zai.chat.completions.create({
    model: 'glm-4-flash',
    messages: [
      { role: 'assistant', content: ARTICLE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices[0]?.message?.content || ''

  if (!raw.trim()) {
    throw new Error('AI returned empty response')
  }

  // Parse JSON from response (handle code fences)
  let jsonStr = raw.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  let parsed: AIArticleOutput
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error(`Failed to parse AI response as JSON. Raw response: ${raw.substring(0, 300)}`)
    }
    parsed = JSON.parse(jsonMatch[0])
  }

  // Validate required fields
  if (!parsed.title || !parsed.content_html) {
    throw new Error('AI response missing required fields: title or content_html')
  }

  // Clean and ensure slug
  const slug = cleanSlug(parsed.slug || topic)

  // Ensure content has signature + CTA
  let contentHtml = parsed.content_html
  if (!contentHtml.toLowerCase().includes('tim redaksi goalzone') && !contentHtml.toLowerCase().includes('tim data goalzone')) {
    contentHtml += '\n<p><em>Laporan eksklusif oleh tim redaksi GoalZone.</em></p>'
  }
  if (!contentHtml.toLowerCase().includes('komentar')) {
    contentHtml += '\n<p><strong>Bagaimana pendapatmu tentang hal ini? Tulis di kolom komentar di bawah!</strong></p>'
  }

  return {
    title: parsed.title.replace(/[""\u201C\u201D]/g, '').substring(0, 200),
    slug,
    content_html: contentHtml,
    summary: (parsed.summary || parsed.title).substring(0, 160),
    meta_description: (parsed.meta_description || '').substring(0, 150),
    image_prompt: parsed.image_prompt || `Epic football scene related to ${topic}. Cinematic sports photography, ultra-realistic 8K, dramatic stadium lighting, professional sports photography style. No text, no logos, no watermark.`,
  }
}

// ─── Image Generation ───────────────────────────────────────

async function generateCoverImage(imagePrompt: string): Promise<string | null> {
  try {
    const zai = await ZAI.create()
    const response = await zai.images.generations.create({
      prompt: imagePrompt,
      size: '1344x768',
    })

    const base64 = response.data?.[0]?.base64
    if (!base64) return null

    // Return as data URL
    return `data:image/png;base64,${base64}`
  } catch (err: any) {
    console.error(`[Generate Article] Image generation failed: ${err.message}`)
    return null
  }
}

// ─── GET Handler ────────────────────────────────────────────

export async function GET() {
  try {
    // Try Supabase categories
    let dbCategories: Array<{ slug: string; name: string }> = []

    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase/client')
      const supabase = createServerSupabaseClient()
      const { data: cats } = await supabase
        .from('categories')
        .select('slug, name')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (cats) {
        dbCategories = cats.map((c: any) => ({ slug: c.slug, name: c.name }))
      }
    } catch {
      // Supabase not available
    }

    // Merge with all available categories
    const allCategories = VALID_CATEGORIES.map((slug) => {
      const existing = dbCategories.find((c) => c.slug === slug)
      return {
        slug,
        name: existing?.name || CATEGORY_MAP[slug],
        existsInDb: !!existing,
      }
    })

    // Check storage status
    const stats = getCacheStats()

    return NextResponse.json({
      status: 'active',
      service: 'GOALZONE Manual Article Generator',
      version: '3.0.0',
      description: 'AI-powered article generation — auto-saves to Supabase / Prisma / Memory',
      storage: {
        supabase: stats.supabaseAvailable ? 'connected' : 'not configured',
        prisma: stats.prismaAvailable ? 'connected' : 'not available',
        memoryCache: `${stats.memoryCacheSize} articles cached`,
      },
      availableCategories: allCategories,
      supportedLanguages: ['id (Bahasa Indonesia)', 'en (English)'],
      usage: {
        method: 'POST',
        body: {
          topic: 'string (required) — article topic/title',
          category: `string (optional) — one of: ${VALID_CATEGORIES.join(', ')}`,
          language: 'string (optional) — "id" (default) for Indonesian',
          generateImage: 'boolean (optional) — if true, generate cover image',
        },
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to fetch status: ${message}` },
      { status: 500 }
    )
  }
}

// ─── POST Handler ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Parse and validate request body
    const body: GenerateArticleRequest = await request.json()

    const { topic, category = 'general', language = 'id', generateImage = false } = body

    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      return NextResponse.json(
        { error: 'Topic is required and must be at least 3 characters' },
        { status: 400 }
      )
    }

    if (topic.length > 500) {
      return NextResponse.json(
        { error: 'Topic must be 500 characters or less' },
        { status: 400 }
      )
    }

    const resolvedCategory = isValidCategory(category) ? category : 'general'

    // Step 1: Generate article content via AI
    const aiArticle = await generateArticleContent(
      topic.trim(),
      resolvedCategory,
      language
    )

    // Step 2: Generate cover image if requested
    let imageUrl: string | null = null
    if (generateImage && aiArticle.image_prompt) {
      imageUrl = await generateCoverImage(aiArticle.image_prompt)
    }

    // Step 3: Calculate read time (rough estimate: ~1000 chars per minute)
    const contentLength = aiArticle.content_html.length
    const readTime = Math.max(3, Math.ceil(contentLength / 1000))

    // Step 4: Save article via unified store (Supabase → Prisma → Memory)
    const saveResult = await saveArticle({
      title: aiArticle.title,
      slug: aiArticle.slug,
      content: aiArticle.content_html,
      summary: aiArticle.summary,
      imageUrl: imageUrl,
      categorySlug: resolvedCategory,
      categoryName: CATEGORY_MAP[resolvedCategory],
      authorName: 'GOALZONE AI',
      readTime,
    })

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: `Article generated and saved via ${saveResult.source}`,
      savedToDb: saveResult.source !== 'cache',
      savedTo: saveResult.source,
      article: {
        id: saveResult.article?.id || `ai-${Date.now()}`,
        title: aiArticle.title,
        slug: saveResult.article?.slug || aiArticle.slug,
        summary: aiArticle.summary,
        imageUrl: imageUrl,
        readTime,
        category: {
          name: CATEGORY_MAP[resolvedCategory],
          slug: resolvedCategory,
        },
        author: {
          username: saveResult.article?.authorName || 'GOALZONE AI',
          fullName: 'Tim Redaksi AI',
        },
        createdAt: saveResult.article?.createdAt || new Date().toISOString(),
      },
      meta: {
        generationTimeMs: duration,
        contentLength,
        language,
        generateImage,
        aiImageGenerated: !!imageUrl,
        savedTo: saveResult.source,
      },
    })
  } catch (error: unknown) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Unknown error'

    console.error(`[Generate Article] Error after ${duration}ms: ${message}`)

    return NextResponse.json(
      {
        success: false,
        error: `Article generation failed: ${message}`,
        meta: { generationTimeMs: duration },
      },
      { status: 500 }
    )
  }
}
