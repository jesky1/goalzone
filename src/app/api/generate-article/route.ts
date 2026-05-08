import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { saveArticle, getCacheStats } from '@/lib/article-store'

// ============================================================
// GOALZONE — Article Generator API v4.0.0
// ============================================================
// POST /api/generate-article  → Generate article via GPT-4o + auto-save
// GET  /api/generate-article  → Status info + available categories
// Supports: free-form topic AND structured matchResult input
// Saves to: Supabase → Prisma/SQLite → In-memory cache (auto-fallback)
// ============================================================

// ─── Types ───────────────────────────────────────────────────

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

interface GenerateArticleRequest {
  topic?: string
  matchResult?: {
    homeTeam: string
    awayTeam: string
    homeScore: number
    awayScore: number
    league?: string
    matchDate?: string
    scorers?: string[]
    highlights?: string
  }
  category?: CategorySlug
  language?: string
  generateImage?: boolean
}

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

const VALID_CATEGORIES = Object.keys(CATEGORY_MAP) as CategorySlug[]

// ─── System Prompt ──────────────────────────────────────────

const ARTICLE_SYSTEM_PROMPT = `Kamu adalah Jurnalis Olahraga Profesional sekaligus Ahli Analisis Taktik Sepak Bola kelas dunia yang bekerja untuk GOALZONE, portal berita sepak bola terkemuka di Indonesia. Kamu sedang BERADA DI LAPANGAN — di tepi pitch, di dalam stadion, mendengar sorak penonton, merasakan tekanan pertandingan. Tulis seperti reporter lapangan yang menyaksikan pertandingan secara langsung.

═══════════════════════════════════════════════════════════
         IDENTITAS & GAYA PENULISAN — WAJIB DIIKUTI
═══════════════════════════════════════════════════════════

1. SUARA LAPANGAN:
   - Tulis seolah-olah kamu sedang berdiri di tepi lapangan
   - Gunakan deskripsi sensorik: suara sorak, aroma rumput, cahaya floodlight
   - Buat pembaca MERASAKAN atmosfer stadion
   - Variasikan struktur kalimat: pendek untuk drama, panjang untuk analisis, retoris untuk provokasi, deskriptif untuk momen kunci

2. ANALISIS TAKTIS MENDALAM — INI KEAHLIAN UTAMAMU:
   - Analisis formasi kedua tim (4-3-3, 3-5-2, 4-2-3-1, dll)
   - Jelaskan sistem pressing: high press, medium block, low block
   - Bahas counter-pressing (Gegenpressing) dan transisi menyerang/bertahan
   - Analisis build-up play: dari kiper ke lini tengah, dari sayap ke kotak penalti
   - Identifikasi eksploitasi half-space (ruang antara full-back dan center-back)
   - Bahas positional play (Juego de Posición) vs direct play
   - Sebutkan pressing traps, ball progression lines, overloads
   - Analisis defensive shape saat kehilangan bola
   - Bahas peran individual: pivot, inverted full-back, false nine, mezzala, regista
   - Gunakan istilah taktis AKURAT: half-space, third of the pitch, rest-defense, trigger press

3. NARASI & OPINI TAJAM:
   - Berikan opini yang tajam dan bisa memicu diskusi
   - Jangan netral — ambil posisi analitis yang kuat
   - Bandingkan dengan pertandingan sebelumnya atau rival
   - Sertakan konteks historis: rekor pertemuan, tren, statistik head-to-head
   - Berikan perspektif tentang dampak hasil ini terhadap kompetisi

4. OPTIMASI SEO & LSI:
   - Sisipkan kata kunci terkait SECARA NATURAL di dalam narasi
   - Kata kunci LSI: "hasil pertandingan", "klasemen terbaru", "top skor", "analisis taktik", "jalannya pertandingan", "pencetak gol", "berita sepak bola terkini", "highlight pertandingan", "starting eleven", "formasi"
   - JANGAN menyebutkannya sebagai list — sisipkan dalam alur kalimat yang natural
   - Keyword utama harus muncul di judul dan paragraf pertama

═══════════════════════════════════════════════════════════
               STRUKTUR ARTIKEL — WAJIB
═══════════════════════════════════════════════════════════

5. STRUKTUR JUDUL (H1):
   - Keyword Utama HARUS di depan judul
   - Gunakan gaya emosional/dramatis untuk CTR tinggi
   - Maks 80 karakter, TANPA tanda kutip

6. HEADING HIERARCHY:
   - Minimal 3 tag <h2> dan minimal 1 tag <h3>
   - Contoh struktur yang direkomendasikan:
     <h2>Babak Pertama: Pertarungan Taktis</h2>
     <h2>Analisis Formasi & Strategi</h2>
     <h3>Pressing & Transisi</h3>
     <h3>Build-up Play & Half-space Exploitation</h3>
     <h2>Momen-momen Kunci</h2>
     <h2>Dampak & Perspektif</h2>

7. FEATURED SNIPPET READY:
   - Di salah satu <h3>, gunakan format <ul><li> dengan data statistik kunci
   - Agar Google bisa mengambil sebagai Featured Snippet

8. MINIMAL KONTEN:
   - Minimal 8 paragraf (<p>)
   - Setiap paragraf harus substance-ful, bukan filler

═══════════════════════════════════════════════════════════
               PENUTUP & SIGNATURE — WAJIB
═══════════════════════════════════════════════════════════

9. CALL TO ACTION (CTA) — WAJIB di akhir artikel:
   "Bagaimana pendapatmu tentang hal ini? Tulis di kolom komentar di bawah!"

10. SIGNATURE LINE — WAJIB di akhir artikel:
    <p><em>Laporan eksklusif oleh tim redaksi GoalZone.</em></p>

═══════════════════════════════════════════════════════════
               FORMAT OUTPUT — HANYA JSON
═══════════════════════════════════════════════════════════

Output HANYA JSON valid, tanpa teks tambahan sebelum atau sesudah:

{
  "title": "Judul H1 — dramatis, keyword di depan, maks 80 karakter",
  "slug": "slug-url-friendly-lowercase-hanya-huruf-angka-strip",
  "meta_description": "Rich snippet meta description, maks 150 karakter",
  "summary": "Ringkasan 1-2 kalimat untuk card preview (maks 160 karakter)",
  "content_html": "Artikel lengkap dalam HTML. Gunakan tag: <p>, <h2>, <h3>, <strong>, <em>, <ul>, <li>, <blockquote>. Minimal 8 paragraf, min 3 <h2>, min 1 <h3>. Diakhiri CTA + signature.",
  "image_prompt": "Cinematic English prompt for DALL-E 3 (1344x768). Dramatic football scene, stadium atmosphere, no text, no logos."
}

ATURAN FINAL:
- title: dramatis, akurat, keyword di depan, TANPA tanda kutip, maks 80 karakter
- slug: unik, lowercase, [a-z0-9-] saja
- content_html: HTML VALID, bukan markdown
- content_html: WAJIB minimal 8 paragraf (<p>)
- content_html: WAJIB minimal 3 tag <h2> dan minimal 1 tag <h3>
- content_html: WAJIB diakhiri CTA + signature "Laporan eksklusif oleh tim redaksi GoalZone."
- meta_description: maks 150 karakter
- summary: maks 160 karakter
- image_prompt: bahasa Inggris, deskriptif, sinematik, tanpa teks/logo
- Output HANYA JSON — tidak boleh ada teks sebelum atau sesudah JSON`

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

function buildMatchResultContext(matchResult: GenerateArticleRequest['matchResult']): string {
  if (!matchResult) return ''
  const m = matchResult
  const lines: string[] = [
    `📋 DATA PERTANDINGAN (VERIFIED):`,
    `• Tim Tuan Rumah: ${m.homeTeam}`,
    `• Tim Tamu: ${m.awayTeam}`,
    `• Skor Akhir: ${m.homeTeam} ${m.homeScore} - ${m.awayScore} ${m.awayTeam}`,
  ]
  if (m.league) lines.push(`• Kompetisi: ${m.league}`)
  if (m.matchDate) lines.push(`• Tanggal: ${m.matchDate}`)
  if (m.scorers && m.scorers.length > 0) lines.push(`• Pencetak Gol: ${m.scorers.join(', ')}`)
  if (m.highlights) lines.push(`• Highlight Pertandingan: ${m.highlights}`)
  return lines.join('\n')
}

function detectInputType(
  topic?: string,
  matchResult?: GenerateArticleRequest['matchResult']
): 'topic' | 'matchResult' {
  return matchResult && (matchResult.homeTeam || matchResult.awayTeam) ? 'matchResult' : 'topic'
}

// ─── AI Content Generation ──────────────────────────────────

async function generateArticleContent(
  topic: string,
  category: CategorySlug,
  language: string,
  matchResultContext?: string
): Promise<AIArticleOutput> {
  const zai = await ZAI.create()

  const categoryLabel = CATEGORY_MAP[category]
  const langInstruction = language === 'id'
    ? 'Tulis seluruh artikel dalam Bahasa Indonesia yang natural, profesional, dan penuh gaya jurnalistik.'
    : `Tulis artikel dalam bahasa "${language}" dengan gaya jurnalistik yang sama kuatnya.`

  const matchSection = matchResultContext
    ? `\n\n${matchResultContext}\n\nGunakan data pertandingan di atas sebagai FAKTA UTAMA. Jangan mengubah skor atau detail pertandingan. Analisis taktisnya secara mendalam berdasarkan data ini.`
    : ''

  const userPrompt = `Bertindaklah sebagai Jurnalis Olahraga Profesional dan Ahli Analisis Taktik untuk GOALZONE. Kamu sedang meliput pertandingan dari tepi lapangan.

TOPIC / TEMA ARTIKEL:
${topic}
${matchSection}
KATEGORI: ${categoryLabel} (${category})

${langInstruction}

INGAT:
- Tulis seperti reporter lapangan yang sedang MENYAKSIKAN pertandingan langsung
- Berikan ANALISIS TAKTIS MENDALAM: formasi, pressing, build-up, transitions, half-space
- Gunakan istilah taktis akurat: high press, low block, counter-pressing, positional play, trigger, rest-defense
- Buat narasi yang MEMBUAT PEMBACA MERASAKAN atmosfer stadion
- Berikan opini tajam yang memicu diskusi
- Sertakan konteks historis dan statistik
- Minimal 8 paragraf, minimal 3 <h2>, minimal 1 <h3>
- Diakhiri CTA + "Laporan eksklusif oleh tim redaksi GoalZone."
- Buat image_prompt yang sinematik untuk DALL-E 3.
- Output HANYA JSON.`

  const completion = await zai.chat.completions.create({
    model: 'gpt-4o',
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
    console.error(`[Generate Article v4] Image generation failed: ${err.message}`)
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
      service: 'GOALZONE Article Generator',
      version: '4.0.0',
      model: 'GPT-4o',
      description: 'AI-powered article generation with tactical football analysis — auto-saves to Supabase / Prisma / Memory',
      storage: {
        supabase: stats.supabaseAvailable ? 'connected' : 'not configured',
        prisma: stats.prismaAvailable ? 'connected' : 'not available',
        memoryCache: `${stats.memoryCacheSize} articles cached`,
      },
      availableCategories: allCategories,
      supportedLanguages: ['id (Bahasa Indonesia)', 'en (English)'],
      inputTypes: {
        topic: {
          type: 'string (optional if matchResult provided)',
          description: 'Free-form article topic/title. Ignored if matchResult is provided.',
        },
        matchResult: {
          type: 'object (optional)',
          description: 'Structured match data for automated match report generation.',
          fields: {
            homeTeam: 'string (required) — Home team name',
            awayTeam: 'string (required) — Away team name',
            homeScore: 'number (required) — Home team score',
            awayScore: 'number (required) — Away team score',
            league: 'string (optional) — Competition/league name',
            matchDate: 'string (optional) — Match date',
            scorers: 'string[] (optional) — Goal scorers',
            highlights: 'string (optional) — Match highlights description',
          },
        },
      },
      usage: {
        method: 'POST',
        body: {
          topic: 'string (optional) — article topic/title',
          matchResult: 'object (optional) — structured match data (see inputTypes)',
          category: `string (optional) — one of: ${VALID_CATEGORIES.join(', ')}`,
          language: 'string (optional) — "id" (default) or "en"',
          generateImage: 'boolean (optional) — if true, generate cover image via DALL-E',
        },
        note: 'At least one of "topic" or "matchResult" must be provided.',
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

    const {
      topic,
      matchResult,
      category = 'general',
      language = 'id',
      generateImage = false,
    } = body

    // Validate: at least one input type must be provided
    const inputType = detectInputType(topic, matchResult)

    if (inputType === 'topic') {
      if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
        return NextResponse.json(
          { error: 'Either "topic" (string, min 3 chars) or "matchResult" (object with homeTeam/awayTeam) must be provided' },
          { status: 400 }
        )
      }
      if (topic.length > 500) {
        return NextResponse.json(
          { error: 'Topic must be 500 characters or less' },
          { status: 400 }
        )
      }
    }

    if (inputType === 'matchResult' && matchResult) {
      if (!matchResult.homeTeam || !matchResult.awayTeam) {
        return NextResponse.json(
          { error: 'matchResult must include homeTeam and awayTeam' },
          { status: 400 }
        )
      }
      if (typeof matchResult.homeScore !== 'number' || typeof matchResult.awayScore !== 'number') {
        return NextResponse.json(
          { error: 'matchResult.homeScore and matchResult.awayScore must be numbers' },
          { status: 400 }
        )
      }
    }

    const resolvedCategory = isValidCategory(category) ? category : 'general'

    // Auto-detect category from matchResult league if not specified
    let finalCategory = resolvedCategory
    if (inputType === 'matchResult' && category === 'general' && matchResult?.league) {
      const leagueLower = matchResult.league.toLowerCase()
      if (leagueLower.includes('premier') || leagueLower.includes('epl')) finalCategory = 'premier-league'
      else if (leagueLower.includes('la liga') || leagueLower.includes('laliga')) finalCategory = 'la-liga'
      else if (leagueLower.includes('serie') || leagueLower.includes('calcio')) finalCategory = 'serie-a'
      else if (leagueLower.includes('champions') || leagueLower.includes('ucl')) finalCategory = 'champions-league'
      else if (leagueLower.includes('bundesliga')) finalCategory = 'bundesliga'
      else finalCategory = 'match-report'
    }

    // Build effective topic string
    let effectiveTopic: string
    let matchResultContext: string | undefined

    if (inputType === 'matchResult' && matchResult) {
      const m = matchResult
      const leagueStr = m.league ? ` — ${m.league}` : ''
      effectiveTopic = `${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam}${leagueStr}`
      matchResultContext = buildMatchResultContext(matchResult)
    } else {
      effectiveTopic = topic!.trim()
      matchResultContext = undefined
    }

    // Step 1: Generate article content via AI
    const aiArticle = await generateArticleContent(
      effectiveTopic,
      finalCategory,
      language,
      matchResultContext
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
      categorySlug: finalCategory,
      categoryName: CATEGORY_MAP[finalCategory],
      authorName: 'GOALZONE AI',
      readTime,
    })

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: `Article generated via GPT-4o and saved via ${saveResult.source}`,
      article: {
        id: saveResult.article?.id || `ai-${Date.now()}`,
        title: aiArticle.title,
        slug: saveResult.article?.slug || aiArticle.slug,
        summary: aiArticle.summary,
        imageUrl: imageUrl,
        readTime,
        category: {
          name: CATEGORY_MAP[finalCategory],
          slug: finalCategory,
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
        inputType,
        model: 'gpt-4o',
        generateImage,
        aiImageGenerated: !!imageUrl,
        savedTo: saveResult.source,
      },
    })
  } catch (error: unknown) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Unknown error'

    console.error(`[Generate Article v4] Error after ${duration}ms: ${message}`)

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
