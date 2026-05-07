import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import sharp from 'sharp'

// ============================================================
// GOALZONE — Automated News Engine
// ============================================================
// POST /api/cron/generate-news
//
// Pipeline:
//   1. Data Acquisition  → API-Football (finished matches)
//   2. Content Generation → AI (z-ai-web-dev-sdk LLM)
//   3. Image Generation   → AI (z-ai-web-dev-sdk DALL-E)
//   4. Watermark          → Sharp (GOALZONE logo)
//   5. Storage            → Supabase Storage (news-assets bucket)
//   6. Database           → Supabase Database (articles table)
//   7. SEO & Indexing     → JSON-LD + On-demand Revalidation
//   8. Monetization       → [AD_SLOT] injection in HTML
// ============================================================

// ─── Types ───────────────────────────────────────────────────

interface Scorer {
  player: string
  team: 'home' | 'away'
  minute: number
  type: string
  assist?: string
}

interface TeamStatistics {
  team: string
  possession: number
  shots: number
  shotsOnGoal: number
  corners: number
  fouls: number
  offsides: number
  passes: number
  passAccuracy: number
}

interface MatchData {
  fixtureId: number
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  homeLogo: string
  awayLogo: string
  league: string
  leagueLogo: string
  date: string
  venue: string
  venueCity?: string
  referee: string | null
  homeScorers: Scorer[]
  awayScorers: Scorer[]
  homeStats: TeamStatistics
  awayStats: TeamStatistics
  homeWinner: boolean
  awayWinner: boolean
  isDraw: boolean
  leagueRound?: string
  halfTimeScore?: { home: number; away: number }
}

interface GeneratedArticle {
  title: string
  slug: string
  contentHtml: string
  metaDescription: string
  summary: string
  keywords: string[]
  imagePrompt: string
  jsonLd: string
}

interface PipelineResult {
  success: boolean
  match: string
  fixtureId: number
  article?: {
    id: string
    slug: string
    title: string
    imageUrl: string
  }
  error?: string
  stage?: string
  duration: number
}

// ─── Config ──────────────────────────────────────────────────

const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY || process.env.NEXT_PUBLIC_FOOTBALL_API_KEY || ''
const FOOTBALL_API_BASE = 'https://v3.football.api-sports.io'

const LEAGUE_IDS = [
  39,   // Premier League
  140,  // La Liga
  135,  // Serie A
  78,   // Bundesliga
  61,   // Ligue 1
  2,    // Champions League
  3,    // Europa League
  8,    // Euro Championship
  71,   // World Cup
  10,   // Friendlies
]

const DEFAULT_AUTHOR_ID = process.env.ARTICLE_GEN_AUTHOR_ID || ''
const DEFAULT_CATEGORY_ID = process.env.ARTICLE_GEN_CATEGORY_ID || ''

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://goalzone.vercel.app'
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET || ''

// ─── 1. DATA ACQUISITION (API-Football) ──────────────────────

async function footballApi(endpoint: string): Promise<any> {
  const url = `${FOOTBALL_API_BASE}${endpoint}`
  const response = await fetch(url, {
    headers: { 'x-apisports-key': FOOTBALL_API_KEY },
    next: { revalidate: 0 },
  })
  if (!response.ok) {
    throw new Error(`API-Football error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

async function fetchFinishedMatches(lookbackHours = 24): Promise<MatchData[]> {
  if (!FOOTBALL_API_KEY) {
    console.warn('[News Engine] FOOTBALL_API_KEY not set — skipping data acquisition')
    return []
  }

  const now = new Date()
  const from = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000)
  const to = new Date(now.getTime() + 60 * 60 * 1000)
  const fromStr = from.toISOString().split('T')[0]
  const toStr = to.toISOString().split('T')[0]

  const matches: MatchData[] = []

  for (const leagueId of LEAGUE_IDS) {
    try {
      const data = await footballApi(
        `/fixtures?league=${leagueId}&season=${now.getFullYear()}&from=${fromStr}&to=${toStr}&status=FT`
      )
      const fixtures = data.response || []

      for (const m of fixtures) {
        matches.push(parseMatchResponse(m))
      }
      // Rate limit
      await new Promise(r => setTimeout(r, 250))
    } catch (err: any) {
      console.warn(`[News Engine] Failed to fetch league ${leagueId}: ${err.message}`)
    }
  }

  // Sort most recent first
  matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return matches
}

async function fetchMatchById(fixtureId: number): Promise<MatchData> {
  const data = await footballApi(`/fixtures?id=${fixtureId}`)
  const match = data.response?.[0]
  if (!match) throw new Error(`Fixture ${fixtureId} not found`)
  return parseMatchResponse(match)
}

function parseMatchResponse(m: any): MatchData {
  const events = m.events || []
  const statistics = m.statistics || []

  const parseScorers = (teamId: number, side: 'home' | 'away'): Scorer[] => {
    return events
      .filter((e: any) => e.type === 'goal' && e.team.id === teamId)
      .map((e: any) => ({
        player: e.player?.name || 'Unknown',
        team: side,
        minute: e.time?.elapsed || 0,
        type: e.detail?.includes('Penalty') ? 'penalty' : e.detail?.includes('Own') ? 'own goal' : 'goal',
        assist: e.assist?.name || undefined,
      }))
  }

  const parseTeamStats = (teamId: number): TeamStatistics => {
    const teamStats = statistics.find((s: any) => s.team.id === teamId)
    if (!teamStats) {
      return { team: '', possession: 50, shots: 0, shotsOnGoal: 0, corners: 0, fouls: 0, offsides: 0, passes: 0, passAccuracy: 0 }
    }
    const getVal = (type: string) => {
      const stat = teamStats.statistics.find((s: any) => s.type === type)
      if (!stat) return 0
      const val = stat.value
      if (typeof val === 'string' && val.includes('%')) return parseInt(val, 10)
      return parseInt(String(val), 10) || 0
    }
    return {
      team: teamStats.team.name,
      possession: getVal('Ball Possession'),
      shots: getVal('Total Shots'),
      shotsOnGoal: getVal('Shots on Goal'),
      corners: getVal('Corner Kicks'),
      fouls: getVal('Fouls'),
      offsides: getVal('Offsides'),
      passes: getVal('Total Passes'),
      passAccuracy: getVal('Pass Accuracy'),
    }
  }

  const homeGoals = events.filter((e: any) => e.type === 'goal' && e.team.id === m.teams.home.id && (e.time?.elapsed || 0) <= 45).length
  const awayGoals = events.filter((e: any) => e.type === 'goal' && e.team.id === m.teams.away.id && (e.time?.elapsed || 0) <= 45).length

  return {
    fixtureId: m.fixture.id,
    homeTeam: m.teams.home.name,
    awayTeam: m.teams.away.name,
    homeScore: m.goals.home,
    awayScore: m.goals.away,
    homeLogo: m.teams.home.logo,
    awayLogo: m.teams.away.logo,
    league: m.league.name,
    leagueLogo: m.league.logo,
    date: m.fixture.date,
    venue: m.fixture.venue?.name || '',
    venueCity: m.fixture.venue?.city || undefined,
    referee: m.fixture.referee || null,
    homeScorers: parseScorers(m.teams.home.id, 'home'),
    awayScorers: parseScorers(m.teams.away.id, 'away'),
    homeStats: parseTeamStats(m.teams.home.id),
    awayStats: parseTeamStats(m.teams.away.id),
    homeWinner: m.teams.home.winner === true,
    awayWinner: m.teams.away.winner === true,
    isDraw: m.teams.home.winner === null,
    leagueRound: m.league.round,
    halfTimeScore: { home: homeGoals, away: awayGoals },
  }
}

// ─── 2. CONTENT GENERATION (AI LLM) ─────────────────────────

const ARTICLE_SYSTEM_PROMPT = `Kamu adalah Senior SEO Specialist sekaligus Jurnalis Sepak Bola Profesional kelas dunia yang bekerja untuk GOALZONE, portal berita sepak bola terkemuka di Indonesia.

═══════════════════════════════════════════════════════════
               INSTRUKSI SEO KETAT — WAJIB DIIKUTI
═══════════════════════════════════════════════════════════

1. STRUKTUR JUDUL (H1):
   - Keyword Utama (Nama Tim + Skor) HARUS di depan judul
   - Gunakan gaya emosional/kontroversial untuk CTR tinggi
   - Contoh: "Bungkam Man City 2-1, Taktik Jenius Arteta Bawa Arsenal Puncaki Klasemen!"
   - Maks 80 karakter, JANGAN gunakan tanda kutip di judul

2. OPTIMASI LSI (Latent Semantic Indexing):
   Sisipkan kata kunci terkait SECARA NATURAL di dalam artikel:
   - "Hasil pertandingan", "Klasemen terbaru", "Top skor"
   - "Analisis taktik", "Jalannya pertandingan", "Pencetak gol"
   - "Berita sepak bola terkini", "Highlight pertandingan"
   - JANGAN menyebutkan kata-kata ini sebagai list — sisipkan dalam kalimat natural

3. KONTEN UNIK (ANTI-AI DETECTOR) — INI PALING PENTING:
   ❌ JANGAN hanya menuliskan ulang statistik mentah
   ✅ BERIKAN ANALISIS "KENAPA" — Analisis taktis mendalam
   ✅ NARASI MOMEN KUNCI — Tulis seperti reporter lapangan
   ✅ PREDIKSI DAMPAK — Bagaimana hasil ini mempengaruhi klasemen

4. STRUKTUR ARTIKEL (WAJIB ikuti heading hierarchy):
   <h2>Ringkasan Pertandingan</h2>
   <h2>Babak Pertama: [Judul Naratif]</h2>
   <h2>Babak Kedua: [Judul Naratif]</h2>
   <h2>Analisis Performa Pemain Kunci</h2>
   <h3>Statistik Pertandingan</h3>
   <h2>Komentar Pengamat</h2>
   <h2>Prediksi Dampak terhadap Klasemen</h2>
   <h2>Penutup</h2>

5. FEATURED SNIPPET READY:
   Di bagian <h3>Statistik Pertandingan</h3>, gunakan format <ul><li>
   agar Google bisa mengambil sebagai Featured Snippet.

6. CALL TO ACTION (CTA):
   "Siapakah Man of the Match menurutmu? Tulis pendapatmu di kolom komentar di bawah!"

7. SIGNATURE LINE:
   <p><em>Laporan eksklusif oleh tim data GoalZone.</em></p>

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
  "image_prompt": "Cinematic English prompt for DALL-E 3 (1344x768). Dramatic football scene, no text, no logos.",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"]
}

ATURAN FINAL:
- title: emosional, akurat, keyword di depan, TANPA tanda kutip
- slug: unik, lowercase, [a-z0-9-] saja
- content_html: HTML VALID, bukan markdown, WAJIB 8+ paragraf
- content_html: WAJIB mengandung semua H2/H3 yang disebutkan
- content_html: WAJIB diakhiri CTA + signature "Laporan eksklusif oleh tim data GoalZone."
- meta_description: ≤150 karakter, mengandung skor
- keywords: 6-10 kata kunci campuran Indonesia + Inggris
- image_prompt: English, descriptive, cinematic, no text/logos
- Output HANYA JSON — tidak boleh ada teks sebelum/sesudah JSON`

function buildMatchContext(match: MatchData): string {
  const winner = match.homeWinner ? match.homeTeam : match.awayWinner ? match.awayTeam : 'Imbang'
  const allScorers = [...match.homeScorers, ...match.awayScorers]
    .sort((a, b) => a.minute - b.minute)
    .map(s => {
      const team = s.team === 'home' ? match.homeTeam : match.awayTeam
      const type = s.type === 'penalty' ? ' (penalti)' : s.type === 'own goal' ? ' (gol bunuh diri)' : ''
      const assist = s.assist ? `, assist: ${s.assist}` : ''
      return `• ${s.minute}' — ${s.player} (${team})${type}${assist}`
    })
  const scorersText = allScorers.length > 0 ? allScorers.join('\n') : '• Tidak ada data pencetak gol'
  const htScore = match.halfTimeScore ? `${match.halfTimeScore.home}-${match.halfTimeScore.away}` : 'N/A'
  const keyPlayers = allScorers.map(s => s.player).filter((v, i, a) => a.indexOf(v) === i).join(', ')

  return `
════════════════════════════════════════════
        DATA PERTANDINGAN — SUMBER UTAMA
════════════════════════════════════════════

KOMPETISI: ${match.league}${match.leagueRound ? ` — ${match.leagueRound}` : ''}
VENUE: ${match.venue}${match.venueCity ? `, ${match.venueCity}` : ''}
WASIT: ${match.referee || 'N/A'}
TANGGAL: ${new Date(match.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

═══ SKOR AKHIR ═══
${match.homeTeam} ${match.homeScore} — ${match.awayScore} ${match.awayTeam}
Skor Babak Pertama: ${htScore}
Status: ${match.isDraw ? 'SERI' : `${winner} MENANG`}

═══ PENCIPTA GOL ═══
${scorersText}

═══ PEMAIN KUNCI ═══
${keyPlayers || 'Tidak ada data pemain kunci'}

═══ STATISTIK LENGKAP ═══
Penguasaan Bola: ${match.homeTeam} ${match.homeStats.possession}% — ${match.awayStats.possession}% ${match.awayTeam}
Total Tembakan: ${match.homeTeam} ${match.homeStats.shots} — ${match.awayStats.shots} ${match.awayTeam}
Tembakan Tepat: ${match.homeTeam} ${match.homeStats.shotsOnGoal} — ${match.awayStats.shotsOnGoal} ${match.awayTeam}
Tendangan Sudut: ${match.homeTeam} ${match.homeStats.corners} — ${match.awayStats.corners} ${match.awayTeam}
Pelanggaran: ${match.homeTeam} ${match.homeStats.fouls} — ${match.awayStats.fouls} ${match.awayTeam}
Offside: ${match.homeTeam} ${match.homeStats.offsides} — ${match.awayStats.offsides} ${match.awayTeam}
Total Umpan: ${match.homeTeam} ${match.homeStats.passes} — ${match.awayStats.passes} ${match.awayTeam}
Akurasi Umpan: ${match.homeTeam} ${match.homeStats.passAccuracy}% — ${match.awayStats.passAccuracy}% ${match.awayTeam}

═══ ANALISIS DATA KUNCI ═══
Efektivitas Tembakan ${match.homeTeam}: ${match.homeStats.shots > 0 ? Math.round((match.homeStats.shotsOnGoal / match.homeStats.shots) * 100) : 0}% tepat sasaran
Efektivitas Tembakan ${match.awayTeam}: ${match.awayStats.shots > 0 ? Math.round((match.awayStats.shotsOnGoal / match.awayStats.shots) * 100) : 0}% tepat sasaran
Dominasi Penguasaan Bola: ${match.homeStats.possession > match.awayStats.possession ? match.homeTeam : match.awayStats.possession > match.homeStats.possession ? match.awayTeam : 'Seimbang'} (${Math.abs(match.homeStats.possession - match.awayStats.possession)}% selisih)`.trim()
}

async function generateArticle(match: MatchData): Promise<GeneratedArticle> {
  const zai = await ZAI.create()
  const matchContext = buildMatchContext(match)

  const userPrompt = `Bertindaklah sebagai Senior SEO Specialist dan Jurnalis Sepak Bola Profesional. Tulis artikel berita mendalam, seru, dan SEO-optimized berdasarkan data pertandingan berikut:

${matchContext}

INGAT:
- Jangan hanya ulang statistik. BERI ANALISIS MENDALAM.
- Buat narasi dramatis untuk momen kunci.
- Sertakan prediksi dampak ke klasemen.
- Diakhiri CTA + "Laporan eksklusif oleh tim data GoalZone."
- Buat image_prompt yang sinematik untuk DALL-E 3.
- Output HANYA JSON.`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: ARTICLE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices[0]?.message?.content || ''
  let jsonStr = raw.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  let parsed: any
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    console.error('[News Engine] Failed to parse AI JSON, using fallback')
    parsed = buildFallbackArticle(match)
  }

  // Clean slug
  const slug = (parsed.slug || `${match.homeTeam.toLowerCase().replace(/\s+/g, '-')}-${match.homeScore}-${match.awayScore}-${match.awayTeam.toLowerCase().replace(/\s+/g, '-')}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 120)

  // Ensure content has signature + CTA
  let contentHtml = parsed.content_html || ''
  if (!contentHtml.includes('tim data GoalZone')) {
    contentHtml += `\n<p><em>Laporan eksklusif oleh tim data GoalZone.</em></p>`
  }
  if (!contentHtml.includes('komentar')) {
    contentHtml += `\n<p><strong>Siapakah Man of the Match menurutmu? Tulis pendapatmu di kolom komentar di bawah!</strong></p>`
  }

  // Inject [AD_SLOT] placeholders
  contentHtml = injectAdSlots(contentHtml)

  // Build JSON-LD schema
  const jsonLd = buildNewsSchema(parsed.title || `${match.homeTeam} vs ${match.awayTeam}`, match)

  return {
    title: (parsed.title || `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`).replace(/[""]/g, '').substring(0, 200),
    slug,
    contentHtml,
    metaDescription: parsed.meta_description || `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}. Hasil ${match.league} terbaru di GOALZONE.`.substring(0, 150),
    summary: parsed.summary || `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} — Hasil ${match.league}`,
    keywords: Array.isArray(parsed.keywords) && parsed.keywords.length > 0 ? parsed.keywords.slice(0, 10) : [
      `${match.homeTeam} vs ${match.awayTeam}`, `hasil ${match.league}`, `skor ${match.league}`, 'berita sepak bola', 'analisis taktik',
    ],
    imagePrompt: parsed.image_prompt || `Epic football celebration at ${match.venue}, ${match.homeTeam} vs ${match.awayTeam}, final score ${match.homeScore}-${match.awayScore}. Cinematic sports photography, ultra-realistic 8K, dramatic stadium lighting, packed crowd, golden rim light, professional sports photography style. No text, no logos, no watermark.`,
    jsonLd,
  }
}

function injectAdSlots(html: string): string {
  // Split by closing </p> tags and insert [AD_SLOT] after roughly the 3rd paragraph
  const paragraphs = html.split(/<\/p>/i)
  if (paragraphs.length > 5) {
    // Insert after 3rd paragraph
    paragraphs.splice(3, 0, '\n<!-- AD_SLOT: mid-content-1 -->\n<div class="ad-container my-6 flex justify-center"><div class="ad-slot" data-ad-slot="mid-content-1" style="min-width:300px;min-height:250px;"></div></div>\n')
  }
  if (paragraphs.length > 9) {
    // Insert after 6th paragraph (original index shifted)
    paragraphs.splice(7, 0, '\n<!-- AD_SLOT: mid-content-2 -->\n<div class="ad-container my-6 flex justify-center"><div class="ad-slot" data-ad-slot="mid-content-2" style="min-width:300px;min-height:250px;"></div></div>\n')
  }
  return paragraphs.join('</p>')
}

function buildFallbackArticle(match: MatchData): any {
  const winner = match.homeWinner ? match.homeTeam : match.awayWinner ? match.awayTeam : null
  return {
    title: `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}${winner ? `: ${winner} Menang!` : ': Hasil Imbang'}`,
    slug: `${match.homeTeam.toLowerCase().replace(/\s+/g, '-')}-${match.homeScore}-${match.awayScore}-${match.awayTeam.toLowerCase().replace(/\s+/g, '-')}`,
    meta_description: `${winner || 'Kedua tim'} ${match.homeScore}-${match.awayScore}! Hasil ${match.league}, analisis taktik & statistik lengkap.`,
    summary: `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} — Hasil ${match.league}`,
    content_html: `<h2>Ringkasan Pertandingan</h2><p>${match.homeTeam} menjamu ${match.awayTeam} di ${match.venue} dalam lanjutan ${match.league} dan pertandingan berakhir dengan skor ${match.homeScore}-${match.awayScore}.</p><h2>Analisis Performa</h2><p>Pertandingan berlangsung sengit di ${match.venue}. ${winner ? `${winner} berhasil memenangkan pertandingan.` : 'Kedua tim bermain imbang.'}</p><h3>Statistik Pertandingan</h3><ul><li>Penguasaan Bola: ${match.homeTeam} ${match.homeStats.possession}% — ${match.awayStats.possession}% ${match.awayTeam}</li><li>Total Tembakan: ${match.homeTeam} ${match.homeStats.shots} — ${match.awayStats.shots} ${match.awayTeam}</li><li>Tembakan Tepat: ${match.homeTeam} ${match.homeStats.shotsOnGoal} — ${match.awayStats.shotsOnGoal} ${match.awayTeam}</li></ul><h2>Prediksi Dampak terhadap Klasemen</h2><p>Hasil ini akan berpengaruh pada posisi ${match.homeTeam} dan ${match.awayTeam} di klasemen ${match.league}.</p><p><strong>Siapakah Man of the Match menurutmu? Tulis pendapatmu di kolom komentar di bawah!</strong></p><p><em>Laporan eksklusif oleh tim data GoalZone.</em></p>`,
    image_prompt: `Dramatic football match scene at ${match.venue}, ${match.homeTeam} vs ${match.awayTeam}. Cinematic sports photography, ultra-realistic 8K, dramatic lighting, professional sports photography. No text, no logos.`,
    keywords: [`${match.homeTeam} vs ${match.awayTeam}`, `hasil ${match.league}`, 'berita sepak bola'],
  }
}

// ─── 3. IMAGE GENERATION (AI DALL-E) ───────────────────────

async function generateImage(imagePrompt: string): Promise<Buffer | null> {
  try {
    const zai = await ZAI.create()
    const response = await zai.images.generations.create({
      prompt: imagePrompt,
      size: '1344x768',
    })
    const base64 = response.data?.[0]?.base64
    if (!base64) throw new Error('No image data returned')
    return Buffer.from(base64, 'base64')
  } catch (err: any) {
    console.error(`[News Engine] Image generation failed: ${err.message}`)
    return null
  }
}

// ─── 4. WATERMARK (Sharp) ──────────────────────────────────

async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const { width = 1344, height = 768 } = await sharp(imageBuffer).metadata()
    const logoWidth = Math.round(width * 0.10)
    const logoHeight = logoWidth
    const padding = 28
    const svgW = logoWidth + padding
    const svgH = logoHeight + padding
    const opacity = 0.55

    // Build GOALZONE text watermark badge
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

    return await sharp(imageBuffer)
      .composite([{ input: overlaySvg, gravity: 'southeast' as const, blend: 'over' as const }])
      .png({ compressionLevel: 9 })
      .toBuffer()
  } catch (err: any) {
    console.warn(`[News Engine] Watermark failed: ${err.message}`)
    return imageBuffer // Return original if watermark fails
  }
}

// ─── 5. STORAGE (Supabase) ─────────────────────────────────

async function uploadToSupabaseStorage(buffer: Buffer, slug: string, supabase: any): Promise<{ url: string; path: string } | null> {
  try {
    const timestamp = Date.now()
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const fileName = `${timestamp}-${slug}.png`
    const filePath = `articles/${year}/${month}/${fileName}`

    const { data, error } = await supabase.storage
      .from('news-images')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: false,
      })

    if (error) {
      console.error(`[News Engine] Storage upload error: ${error.message}`)
      return null
    }

    const { data: urlData } = supabase.storage.from('news-images').getPublicUrl(data.path)
    return { url: urlData.publicUrl, path: data.path }
  } catch (err: any) {
    console.error(`[News Engine] Storage upload failed: ${err.message}`)
    return null
  }
}

// ─── 6. DATABASE (Supabase) ─────────────────────────────────

async function checkDuplicate(supabase: any, slug: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}

async function publishArticle(supabase: any, article: GeneratedArticle, imageUrl: string | null, match: MatchData): Promise<string | null> {
  try {
    // Resolve category
    let categoryId = DEFAULT_CATEGORY_ID
    if (!categoryId) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'match-report')
        .maybeSingle()
      if (catData) categoryId = catData.id
      else {
        // Create category if not exists
        const { data: newCat } = await supabase
          .from('categories')
          .insert({ name: 'Match Report', slug: 'match-report', color: '#10b981' })
          .select('id')
          .single()
        categoryId = newCat?.id || ''
      }
    }

    // Resolve author
    let authorId = DEFAULT_AUTHOR_ID
    if (!authorId) {
      const { data: authorData } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', 'goalzone-auto')
        .maybeSingle()
      if (authorData) authorId = authorData.id
      else {
        const { data: newAuthor } = await supabase
          .from('profiles')
          .insert({ username: 'goalzone-auto', role: 'admin' })
          .select('id')
          .single()
        authorId = newAuthor?.id || ''
      }
    }

    if (!categoryId || !authorId) {
      console.error('[News Engine] Cannot resolve category or author')
      return null
    }

    const { data, error } = await supabase
      .from('articles')
      .insert({
        title: article.title,
        slug: article.slug,
        content: article.contentHtml,
        summary: article.summary,
        cover_image: imageUrl,
        category_id: categoryId,
        author_id: authorId,
        status: 'published',
        is_featured: false,
        read_time: Math.max(3, Math.ceil(article.contentHtml.length / 1000)),
        seo_title: article.title,
        seo_description: article.metaDescription,
        published_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error(`[News Engine] DB insert error: ${error.message}`)
      return null
    }

    return data.id
  } catch (err: any) {
    console.error(`[News Engine] publishArticle failed: ${err.message}`)
    return null
  }
}

// ─── 7. SEO & INDEXING (JSON-LD + Revalidation) ────────────

function buildNewsSchema(title: string, match: MatchData): string {
  const slug = `${match.homeTeam.toLowerCase().replace(/\s+/g, '-')}-${match.homeScore}-${match.awayScore}-${match.awayTeam.toLowerCase().replace(/\s+/g, '-')}`.replace(/[^a-z0-9-]/g, '')
  const url = `${SITE_URL}/articles/${slug}`

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    image: match.homeLogo ? [match.homeLogo] : undefined,
    datePublished: new Date(match.date).toISOString(),
    dateModified: new Date().toISOString(),
    author: { '@type': 'Organization', name: 'Tim Analis GOALZONE', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'GOALZONE',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    articleSection: match.league,
    keywords: `${match.homeTeam}, ${match.awayTeam}, ${match.league}, hasil pertandingan, skor, berita sepak bola`,
    about: {
      '@type': 'SportsEvent',
      name: `${match.homeTeam} vs ${match.awayTeam}`,
      sport: 'Soccer',
      description: `${match.league}: ${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`,
    },
  }, null, 0)
}

async function triggerRevalidation(path?: string, tag?: string): Promise<void> {
  if (!REVALIDATION_SECRET) return
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || SITE_URL || 'http://localhost:3000'
    const body: any = { secret: REVALIDATION_SECRET }
    if (path) body.path = path
    if (tag) body.tag = tag

    await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    console.log('[News Engine] Revalidation triggered')
  } catch (err: any) {
    console.warn(`[News Engine] Revalidation failed: ${err.message}`)
  }
}

// ─── PIPELINE ORCHESTRATOR ──────────────────────────────────

async function processMatch(match: MatchData, supabase: any): Promise<PipelineResult> {
  const startTime = Date.now()
  const matchLabel = `${match.homeTeam} vs ${match.awayTeam}`

  try {
    // Step 1: Check duplicate
    const tempSlug = `${match.homeTeam.toLowerCase().replace(/\s+/g, '-')}-${match.homeScore}-${match.awayScore}-${match.awayTeam.toLowerCase().replace(/\s+/g, '-')}`.replace(/[^a-z0-9-]/g, '').substring(0, 120)
    const isDuplicate = await checkDuplicate(supabase, tempSlug)
    if (isDuplicate) {
      return { success: false, match: matchLabel, fixtureId: match.fixtureId, error: 'Article already exists', stage: 'dedup', duration: Date.now() - startTime }
    }

    // Step 2: Generate article content
    const article = await generateArticle(match)

    // Step 3: Generate image
    const imageBuffer = await generateImage(article.imagePrompt)

    // Step 4: Apply watermark
    let finalImageBuffer = imageBuffer
    if (imageBuffer) {
      finalImageBuffer = await applyWatermark(imageBuffer)
    }

    // Step 5: Upload to Supabase Storage
    let imageUrl: string | null = null
    if (finalImageBuffer) {
      const uploadResult = await uploadToSupabaseStorage(finalImageBuffer, article.slug, supabase)
      imageUrl = uploadResult?.url || null
    }

    // Step 6: Publish to database
    const articleId = await publishArticle(supabase, article, imageUrl, match)
    if (!articleId) {
      return { success: false, match: matchLabel, fixtureId: match.fixtureId, error: 'Failed to publish article', stage: 'database', duration: Date.now() - startTime }
    }

    // Step 7: Trigger revalidation
    await triggerRevalidation('/', 'articles')
    await triggerRevalidation(`/articles/${article.slug}`)

    return {
      success: true,
      match: matchLabel,
      fixtureId: match.fixtureId,
      article: { id: articleId, slug: article.slug, title: article.title, imageUrl: imageUrl || '' },
      duration: Date.now() - startTime,
    }
  } catch (err: any) {
    console.error(`[News Engine] Pipeline error for ${matchLabel}: ${err.message}`)
    return { success: false, match: matchLabel, fixtureId: match.fixtureId, error: err.message, duration: Date.now() - startTime }
  }
}

// ─── API ROUTE HANDLERS ─────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      status: 'active',
      service: 'GOALZONE Automated News Engine',
      version: '2.0.0',
      leagues_monitored: LEAGUE_IDS.length,
      features: [
        'Data Acquisition (API-Football)',
        'AI Content Generation (z-ai-web-dev-sdk LLM)',
        'AI Image Generation (z-ai-web-dev-sdk DALL-E)',
        'Watermark (Sharp)',
        'Storage (Supabase Storage)',
        'Database (Supabase PostgreSQL)',
        'SEO (JSON-LD Schema.org)',
        'On-demand Revalidation (Next.js ISR)',
        'Monetization ([AD_SLOT] injection)',
      ],
      config: {
        footballApi: !!FOOTBALL_API_KEY,
        supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL),
        revalidation: !!REVALIDATION_SECRET,
        defaultAuthor: DEFAULT_AUTHOR_ID ? 'set' : 'auto-create',
        defaultCategory: DEFAULT_CATEGORY_ID ? 'set' : 'auto-resolve',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const pipelineStart = Date.now()

  try {
    const body = await request.json().catch(() => ({}))
    const {
      mode = 'auto',       // 'auto' (fetch matches) | 'manual' (provide fixtureIds)
      fixtureIds = [],      // Array of fixture IDs for manual mode
      leagueIds = [],       // Override league IDs
      lookbackHours = 24,   // How many hours to look back
      maxArticles = 5,      // Max articles to generate per run
      dryRun = false,       // If true, only fetch + generate, don't publish
    } = body

    // Initialize Supabase
    let supabase: any = null
    try {
      supabase = createServerSupabaseClient()
    } catch (err: any) {
      return NextResponse.json({ error: `Supabase initialization failed: ${err.message}` }, { status: 500 })
    }

    // Step 1: Data Acquisition
    let matches: MatchData[] = []

    if (mode === 'manual' && fixtureIds.length > 0) {
      // Fetch specific fixtures by ID
      for (const fid of fixtureIds) {
        try {
          const match = await fetchMatchById(fid)
          matches.push(match)
        } catch (err: any) {
          console.warn(`[News Engine] Failed to fetch fixture ${fid}: ${err.message}`)
        }
      }
    } else {
      // Auto mode: fetch finished matches from monitored leagues
      const leagues = leagueIds.length > 0 ? leagueIds : LEAGUE_IDS
      const now = new Date()
      const from = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000)
      const to = new Date(now.getTime() + 60 * 60 * 1000)
      const fromStr = from.toISOString().split('T')[0]
      const toStr = to.toISOString().split('T')[0]

      for (const leagueId of leagues) {
        try {
          const data = await footballApi(
            `/fixtures?league=${leagueId}&season=${now.getFullYear()}&from=${fromStr}&to=${toStr}&status=FT`
          )
          for (const m of (data.response || [])) {
            matches.push(parseMatchResponse(m))
          }
          await new Promise(r => setTimeout(r, 250))
        } catch (err: any) {
          console.warn(`[News Engine] Failed to fetch league ${leagueId}: ${err.message}`)
        }
      }

      matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    // Limit matches
    matches = matches.slice(0, maxArticles)

    if (matches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No finished matches found in the specified time range',
        pipeline_duration_ms: Date.now() - pipelineStart,
        matches_found: 0,
        articles_generated: 0,
        results: [],
      })
    }

    // Step 2-8: Process each match through the pipeline
    const results: PipelineResult[] = []
    for (const match of matches) {
      if (dryRun) {
        // Dry run: only generate, don't publish
        try {
          const article = await generateArticle(match)
          results.push({
            success: true,
            match: `${match.homeTeam} vs ${match.awayTeam}`,
            fixtureId: match.fixtureId,
            article: { id: 'dry-run', slug: article.slug, title: article.title, imageUrl: '(not generated in dry run)' },
            duration: Date.now() - pipelineStart,
          })
        } catch (err: any) {
          results.push({ success: false, match: `${match.homeTeam} vs ${match.awayTeam}`, fixtureId: match.fixtureId, error: err.message, stage: 'generation', duration: Date.now() - pipelineStart })
        }
      } else {
        const result = await processMatch(match, supabase)
        results.push(result)
      }
    }

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: successCount > 0,
      message: `Pipeline complete: ${successCount}/${results.length} articles ${dryRun ? 'generated (dry run)' : 'published'}`,
      pipeline_duration_ms: Date.now() - pipelineStart,
      mode,
      dry_run: dryRun,
      matches_found: matches.length,
      articles_generated: successCount,
      results,
    })
  } catch (error: any) {
    console.error('[News Engine] Fatal error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      pipeline_duration_ms: Date.now() - pipelineStart,
    }, { status: 500 })
  }
}
