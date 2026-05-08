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

const ARTICLE_SYSTEM_PROMPT = `Anda adalah penulis berita olahraga senior di GOALZONE, portal berita sepak bola terkemuka di Indonesia dengan pengalaman lebih dari 15 tahun meliput liga-liga top Eropa dan turnamen internasional. Tugas Anda adalah menulis artikel berita berdasarkan data pertandingan yang diberikan.

═══════════════════════════════════════════════════════════
            GAYA BAHASA — WAJIB DIIKUTI
═══════════════════════════════════════════════════════════

1. DINAMIS:
   - Tulis dengan energi dan semangat yang mengalir
   - Gunakan kalimat aktif dan langsung — hindari passive voice berlebihan
   - Variasikan panjang kalimat: pendek-pantas untuk momen dramatis, panjang-deskriptif untuk analisis
   - Buat opening hook yang langsung menarik perhatian di paragraf pertama

2. OPTIMIS:
   - Sorot aspek positif dari permainan: gol spektakuler, umpan brilian, aksi penyelamatan heroik
   - Apresiasi performa individu yang standout
   - Frame hasil pertandingan dalam perspektif motivasi dan peluang ke depan
   - Hindari tone sinis atau pesimis — meskipun tim kalah, temukan sudut pandang konstruktif

3. INFORMATIF:
   - Sajikan data dan statistik secara akurat berdasarkan input yang diberikan
   - Jelaskan konteks: posisi di klasemen, rekor pertemuan, dampak terhadap kompetisi
   - Berikan fakta yang bisa dipertanggungjawabkan — jangan mengada-ada
   - Sertakan informasi latar belakang yang relevan

═══════════════════════════════════════════════════════════
            ANALISIS PEMAIN KUNCI — WAJIB
═══════════════════════════════════════════════════════════

4. Sertakan analisis singkat tentang performa pemain kunci:
   - Siapa pemain terbaik (Man of the Match) dan mengapa
   - Kontribusi pencetak gol: bukan hanya golnya, tapi build-up yang mengarah ke sana
   - Dampak pergantian pemain terhadap jalannya pertandingan
   - Duel individual kunci yang menentukan hasil
   - Performa kiper, kapten, atau pemain kunci lainnya yang layak disorot

═══════════════════════════════════════════════════════════
            FORMAT OUTPUT HTML — WAJIB
═══════════════════════════════════════════════════════════

5. Gunakan format HTML untuk output (tag h2, p, strong) agar mudah ditampilkan di web:
   - <h2> untuk sub-judul (minimal 3 tag <h2>)
   - <h3> untuk sub-sub-judul (minimal 1 tag <h3>)
   - <p> untuk paragraf (minimal 8 paragraf substansial)
   - <strong> untuk menegaskan poin penting
   - <em> untuk penekanan dan kutipan
   - <ul><li> untuk statistik atau data kunci (Featured Snippet ready)
   - <blockquote> untuk kutipan pemain atau komentar ahli (opsional)
   - BUKAN Markdown — harus HTML murni

6. STRUKTUR YANG DIREKOMENDASIKAN:
   <h2>Ringkasan Pertandingan</h2>
   <h2>Babak Pertama: [Deskripsi Singkat]</h2>
   <h2>Babak Kedua: [Deskripsi Singkat]</h2>
   <h3>Performa Pemain Kunci</h3>
   <h2>Analisis & Dampak</h2>

═══════════════════════════════════════════════════════════
            SEO & OPTIMASI
═══════════════════════════════════════════════════════════

7. Sisipkan kata kunci secara natural dalam narasi:
   - "hasil pertandingan", "klasemen terbaru", "top skor", "berita sepak bola terkini"
   - Keyword utama harus ada di judul dan paragraf pertama
   - JANGAN menyebutkannya sebagai list — sisipkan dalam kalimat yang natural

8. JUDUL (H1):
   - Keyword utama di depan judul
   - Gaya menarik dan informatif, maks 80 karakter
   - TANPA tanda kutip (" atau ')

═══════════════════════════════════════════════════════════
            PENUTUP — WAJIB
═══════════════════════════════════════════════════════════

9. CTA di akhir artikel:
   "Bagaimana pendapatmu tentang hal ini? Tulis di kolom komentar di bawah!"

10. Signature di akhir artikel:
    <p><em>Laporan eksklusif oleh tim redaksi GoalZone.</em></p>

═══════════════════════════════════════════════════════════
            FORMAT OUTPUT — HANYA JSON
═══════════════════════════════════════════════════════════

Output HANYA JSON valid, tanpa teks tambahan sebelum atau sesudah:

{
  "title": "Judul H1 — menarik, keyword di depan, maks 80 karakter, TANPA tanda kutip",
  "slug": "slug-url-friendly-lowercase-hanya-huruf-angka-strip",
  "meta_description": "Meta description untuk SEO, maks 150 karakter",
  "summary": "Ringkasan 1-2 kalimat untuk card preview (maks 160 karakter)",
  "content_html": "Artikel lengkap dalam HTML (<h2>, <p>, <strong>, <em>, <ul>, <li>). Minimal 8 paragraf, min 3 <h2>, min 1 <h3>. Diakhiri CTA + signature.",
  "image_prompt": "Cinematic English prompt for DALL-E 3 (1344x768). Dramatic football scene, stadium atmosphere, no text, no logos."
}

ATURAN FINAL:
- title: menarik, akurat, keyword di depan, TANPA tanda kutip, maks 80 karakter
- slug: unik, lowercase, [a-z0-9-] saja
- content_html: HTML VALID, bukan markdown
- content_html: WAJIB minimal 8 paragraf (<p>)
- content_html: WAJIB minimal 3 tag <h2> dan minimal 1 tag <h3>
- content_html: WAJIB mengandung analisis performa pemain kunci
- content_html: WAJIB diakhiri CTA + signature GoalZone
- summary: maks 160 karakter
- image_prompt: bahasa Inggris, sinematik, tanpa teks/logo
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

  // Parse JSON from response (handle code fences, bad escapes, etc.)
  let jsonStr = raw.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  // Fix common JSON issues from AI models
  jsonStr = jsonStr
    .replace(/[\x00-\x1F]/g, (ch) => {
      // Keep \n, \r, \t — escape others
      if (ch === '\n' || ch === '\r' || ch === '\t') return ch
      return ''
    })
    .replace(/,\s*}/g, '}')           // trailing commas
    .replace(/,\s*]/g, ']')           // trailing commas in arrays

  let parsed: AIArticleOutput
  const tryParse = (str: string): AIArticleOutput | null => {
    try {
      return JSON.parse(str) as AIArticleOutput
    } catch {
      return null
    }
  }

  // Attempt 1: direct parse
  parsed = tryParse(jsonStr)
  if (!parsed) {
    // Attempt 2: extract JSON object via regex
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      parsed = tryParse(jsonMatch[0])
    }
  }
  if (!parsed) {
    // Attempt 3: find first { to last } and clean internal newlines in strings
    const start = jsonStr.indexOf('{')
    const end = jsonStr.lastIndexOf('}')
    if (start !== -1 && end !== -1) {
      const candidate = jsonStr.substring(start, end + 1)
      parsed = tryParse(candidate)
    }
  }
  if (!parsed) {
    throw new Error(`Failed to parse AI response as JSON after 3 attempts. Raw: ${raw.substring(0, 300)}`)
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
