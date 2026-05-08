import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { createServerSupabaseClient, mapArticleToAPI } from '@/lib/supabase/client'

// ============================================================
// GOALZONE — Manual Article Generator API (Supabase-backed)
// ============================================================
// POST /api/generate-article  → Generate article via AI + save to Supabase
// GET  /api/generate-article  → Status info + available categories
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
const SLUG_TO_SUPABASE_SLUG: Record<CategorySlug, string> = {
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

// ─── Supabase: Find or create category ──────────────────────

async function ensureCategory(supabase: any, slug: CategorySlug): Promise<string | null> {
  try {
    // Try to find existing category by slug
    const supabaseSlug = SLUG_TO_SUPABASE_SLUG[slug]

    const { data: existing } = await supabase
      .from('categories')
      .select('id, slug')
      .eq('slug', supabaseSlug)
      .maybeSingle()

    if (existing) return existing.id

    // Try to create the category (service role should bypass RLS)
    const { data: created, error } = await supabase
      .from('categories')
      .insert({
        name: CATEGORY_MAP[slug],
        slug: supabaseSlug,
        color: '#00f0ff',
        is_active: true,
      })
      .select('id')
      .single()

    if (created) return created.id
    if (error) {
      console.warn(`[Generate Article] Could not create category "${slug}": ${error.message}`)
      return null
    }
  } catch (err: any) {
    console.warn(`[Generate Article] Category lookup failed: ${err.message}`)
  }

  return null
}

// ─── Supabase: Get or find a valid author ───────────────────

async function findAuthor(supabase: any): Promise<string | null> {
  try {
    // Try to find any editor or admin profile
    const { data: editor } = await supabase
      .from('profiles')
      .select('id, role')
      .in('role', ['editor', 'admin'])
      .limit(1)
      .maybeSingle()

    if (editor) return editor.id

    // Try to find any profile
    const { data: anyProfile } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (anyProfile) return anyProfile.id
  } catch (err: any) {
    console.warn(`[Generate Article] Author lookup failed: ${err.message}`)
  }

  return null
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
      const existing = dbCategories.find((c) => c.slug === slug || c.slug === SLUG_TO_SUPABASE_SLUG[slug])
      return {
        slug,
        name: existing?.name || CATEGORY_MAP[slug],
        existsInDb: !!existing,
      }
    })

    // Check Supabase status
    let supabaseStatus = 'not_configured'
    try {
      const supabase = createServerSupabaseClient()
      const { error } = await supabase.from('categories').select('id').limit(1)
      supabaseStatus = error ? 'error' : 'connected'
    } catch {
      // still not configured
    }

    return NextResponse.json({
      status: 'active',
      service: 'GOALZONE Manual Article Generator',
      version: '2.0.0',
      description: 'AI-powered manual article generation — saves to Supabase',
      database: {
        backend: 'supabase',
        status: supabaseStatus,
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

    // Step 4: Try to save to Supabase
    let savedArticle: any = null
    let saveError: string | null = null
    let savedToDb = false

    try {
      const supabase = createServerSupabaseClient()

      // Ensure category exists
      const categoryId = await ensureCategory(supabase, resolvedCategory)

      if (categoryId) {
        // Find a valid author
        const authorId = await findAuthor(supabase)

        if (authorId) {
          // Check for slug uniqueness and add suffix if needed
          let finalSlug = aiArticle.slug
          let slugAttempt = 0

          while (slugAttempt < 10) {
            const { data: existing } = await supabase
              .from('articles')
              .select('id')
              .eq('slug', finalSlug)
              .maybeSingle()

            if (!existing) break
            slugAttempt++
            finalSlug = slugAttempt === 1
              ? `${aiArticle.slug}-${new Date().toISOString().split('T')[0]}`
              : `${aiArticle.slug}-${new Date().toISOString().split('T')[0]}-${slugAttempt}`
          }

          // Upload cover image to Supabase storage if it was generated (base64 → storage)
          let coverImageUrl: string | null = imageUrl
          if (imageUrl && imageUrl.startsWith('data:')) {
            try {
              // Convert base64 data URL to buffer and upload to Supabase Storage
              const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '')
              const buffer = Buffer.from(base64Data, 'base64')

              const storagePath = `articles/${finalSlug}-${Date.now()}.png`
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('news-images')
                .upload(storagePath, buffer, {
                  contentType: 'image/png',
                  cacheControl: '31536000',
                  upsert: false,
                })

              if (!uploadError && uploadData) {
                const { data: urlData } = supabase.storage
                  .from('news-images')
                  .getPublicUrl(uploadData.path)
                coverImageUrl = urlData.publicUrl
              } else {
                console.warn(`[Generate Article] Image upload failed: ${uploadError?.message}`)
                // Keep the base64 image URL as fallback
              }
            } catch (uploadErr: any) {
              console.warn(`[Generate Article] Image upload failed: ${uploadErr.message}`)
              // Keep the base64 image URL
            }
          }

          // Insert article
          const { data: row, error } = await supabase
            .from('articles')
            .insert({
              title: aiArticle.title,
              slug: finalSlug,
              content: aiArticle.content_html,
              summary: aiArticle.summary,
              cover_image: coverImageUrl,
              category_id: categoryId,
              author_id: authorId,
              status: 'published',
              is_featured: false,
              is_trending: false,
              view_count: 0,
              read_time: readTime,
              seo_title: aiArticle.title,
              seo_description: aiArticle.meta_description,
              published_at: new Date().toISOString(),
            })
            .select('*, categories(name, slug, color), profiles(username, full_name, avatar_url)')
            .single()

          if (!error && row) {
            savedArticle = mapArticleToAPI(row)
            savedToDb = true
            coverImageUrl = savedArticle.imageUrl
          } else if (error) {
            saveError = error.message
            console.warn(`[Generate Article] Supabase save failed: ${error.code} — ${error.message}`)
          }
        } else {
          saveError = 'No valid author profile found in database'
          console.warn('[Generate Article] Could not find a valid author profile')
        }
      } else {
        saveError = 'Category not available in database'
        console.warn(`[Generate Article] Category "${resolvedCategory}" not available`)
      }
    } catch (dbErr: any) {
      saveError = dbErr.message
      console.warn(`[Generate Article] Database operation failed: ${dbErr.message}`)
    }

    const duration = Date.now() - startTime

    // Return success even if DB save failed — article was still generated
    return NextResponse.json({
      success: true,
      message: savedToDb
        ? 'Article generated and saved to database successfully'
        : 'Article generated successfully (not saved to database — database not configured)',
      savedToDb,
      article: {
        id: savedArticle?.id || `ai-${Date.now()}`,
        title: aiArticle.title,
        slug: savedArticle?.slug || aiArticle.slug,
        summary: aiArticle.summary,
        imageUrl: savedArticle?.imageUrl || imageUrl,
        readTime,
        category: savedArticle?.category || {
          name: CATEGORY_MAP[resolvedCategory],
          slug: resolvedCategory,
          color: '#00f0ff',
        },
        author: savedArticle?.author || {
          username: 'GOALZONE AI',
          fullName: 'Tim Redaksi AI',
        },
        createdAt: savedArticle?.createdAt || new Date().toISOString(),
      },
      meta: {
        generationTimeMs: duration,
        contentLength,
        language,
        generateImage,
        aiImageGenerated: !!imageUrl,
        savedToDb,
        databaseError: saveError,
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
