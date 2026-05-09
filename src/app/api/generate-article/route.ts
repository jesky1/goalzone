import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { verifyAdmin } from '@/lib/admin-auth'

// ============================================================
// GOALZONE — Admin AI Article Generator
// ============================================================
// POST /api/generate-article
//
// Generates a football news article using the LLM based on a
// given topic. Returns title, content (HTML), summary, suggested
// category, and estimated read time.
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

5. KATEGORI (category):
   - Pilih satu dari: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League, Transfer, Timnas, Analisis
   - Pilih berdasarkan topik yang diberikan

6. READ TIME:
   - Estimasi waktu baca dalam menit (angka bulat)

═══════════════════════════════════════════════════════════
                    FORMAT OUTPUT WAJIB
═══════════════════════════════════════════════════════════
Output HANYA JSON valid, tanpa teks tambahan:

{
  "title": "Judul artikel yang menarik dan SEO-friendly",
  "content": "<p>Paragraf pertama...</p><p>Paragraf kedua...</p><p>Paragraf ketiga...</p><p>Paragraf keempat...</p>",
  "summary": "Ringkasan 1-2 kalimat untuk preview",
  "category": "Transfer",
  "readTime": 5
}

ATURAN FINAL:
- Output HANYA JSON — tidak boleh ada teks sebelum/sesudah JSON
- content: HTML VALID dengan tag <p>, bukan markdown
- category: harus salah satu dari daftar yang disediakan
- readTime: angka bulat (menit)`

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
    const readTime = typeof parsed.readTime === 'number' && parsed.readTime > 0 ? Math.round(parsed.readTime) : Math.max(3, Math.ceil(content.length / 500))

    return NextResponse.json({
      success: true,
      article: {
        title,
        content,
        summary,
        category: suggestedCategory,
        readTime,
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
