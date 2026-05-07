// ============================================================
// GOALZONE Article Generator — Step 2: AI Article Writer
// ============================================================
// Generates professional football match report articles
// Uses z-ai-web-dev-sdk (backend only)
// ============================================================

import ZAI from 'z-ai-web-dev-sdk'
import type { MatchDetail } from './fetcher.js'

// ============================================================
// Types
// ============================================================

export interface GeneratedArticle {
  title: string
  slug: string
  content: string // HTML format
  summary: string // Short excerpt for cards
}

export interface SEOMetadata {
  seoTitle: string
  metaDescription: string
  keywords: string[]
}

// ============================================================
// Build Match Context for AI Prompt
// ============================================================

function buildMatchContext(match: MatchDetail): string {
  const winner = match.homeWinner
    ? match.homeTeam
    : match.awayWinner
    ? match.awayTeam
    : 'Imbang'

  const allScorers = [...match.homeScorers, ...match.awayScorers]
    .sort((a, b) => a.minute - b.minute)
    .map(s => {
      const team = s.team === 'home' ? match.homeTeam : match.awayTeam
      const type = s.type === 'penalty' ? ' (penalti)' : s.type === 'own goal' ? ' (gol bunuh diri)' : ''
      const assist = s.assist ? `, assist: ${s.assist}` : ''
      return `• ${s.minute}' — ${s.player} (${team})${type}${assist}`
    })

  const scorersText = allScorers.length > 0
    ? allScorers.join('\n')
    : '• Tidak ada pencetak gol dari data yang tersedia'

  const htScore = match.halfTimeScore
    ? `${match.halfTimeScore.home}-${match.halfTimeScore.away}`
    : 'N/A'

  return `
═══ DATA PERTANDINGAN ═══
Liga: ${match.league}${match.leagueRound ? ` — ${match.leagueRound}` : ''}
Stadion: ${match.venue}${match.venueCity ? `, ${match.venueCity}` : ''}
Wasit: ${match.referee || 'N/A'}

═══ SKOR AKHIR ═══
${match.homeTeam} ${match.homeScore} — ${match.awayScore} ${match.awayTeam}
Skor Babak Pertama: ${htScore}
Pemenang: ${winner}

═══ PENCIPTA GOL ═══
${scorersText}

═══ STATISTIK PERTANDINGAN ═══
Penguasaan Bola:     ${match.homeTeam} ${match.homeStats.possession}% — ${match.awayStats.possession}% ${match.awayTeam}
Total Tembakan:      ${match.homeTeam} ${match.homeStats.shots} — ${match.awayStats.shots} ${match.awayTeam}
Tembakan Tepat:     ${match.homeTeam} ${match.homeStats.shotsOnGoal} — ${match.awayStats.shotsOnGoal} ${match.awayTeam}
Tendangan Sudut:    ${match.homeTeam} ${match.homeStats.corners} — ${match.awayStats.corners} ${match.awayTeam}
Pelanggaran:         ${match.homeTeam} ${match.homeStats.fouls} — ${match.awayStats.fouls} ${match.awayTeam}
Offside:             ${match.homeTeam} ${match.homeStats.offsides} — ${match.awayStats.offsides} ${match.awayTeam}
Total Umpan:         ${match.homeTeam} ${match.homeStats.passes} — ${match.awayStats.passes} ${match.awayTeam}
Akurasi Umpan:       ${match.homeTeam} ${match.homeStats.passAccuracy}% — ${match.awayStats.passAccuracy}% ${match.awayTeam}
`.trim()
}

// ============================================================
// Generate Article Text
// ============================================================

const SYSTEM_PROMPT = `Kamu adalah jurnalis sepak bola profesional kelas dunia yang bekerja untuk GOALZONE, portal berita sepak bola terkemuka.

GAYA PENULISAN:
- Tulis dalam Bahasa Indonesia yang natural, seru, dan profesional
- Gunakan gaya jurnalis olahraga: dramatic tapi akurat
- Sertakan analisis taktis yang mudah dipahami
- Quote-style narasi untuk momen-momen kunci
- Variasi kalimat: pendek untuk momen dramatis, panjang untuk analisis
- Hindari bahasa robot/AI — tulis seolah kamu benar-benar menonton pertandingan

FORMAT OUTPUT WAJIB (JSON):
{
  "title": "Judul artikel yang clickbait tapi akurat (maks 80 karakter)",
  "slug": "slug-url-friendly-menggunakan-huruf-kecil-dan-tanda-strip",
  "content": "Artikel lengkap dalam format HTML. Gunakan tag: <p>, <h2>, <h3>, <strong>, <em>, <ul>, <li>. Minimal 5 paragraf. Sertakan: lead paragraph, babak pertama, babak kedua, analisis, dan kesimpulan.",
  "summary": "Ringkasan artikel dalam 1-2 kalimat untuk preview card (maks 150 karakter)"
}

ATURAN PENTING:
- title harus menarik dan clickbait tapi AKURAT
- slug harus unik, lowercase, hanya huruf dan strip
- content HARUS berupa HTML yang valid, bukan markdown
- Gunakan <h2> untuk sub-heading (misal: "Babak Pertama", "Babak Kedua", "Analisis")
- Sertakan nama pemain pencetak gol dan menitnya
- Bahas statistik kunci: penguasaan bola, tembakan, pelanggaran
- Jika skor imbang, sorot drama dan pertandingan ketat
- Jika ada tim yang menang telak, analisis mengapa
- Jika ada gol penalti atau gol bunuh diri, sorot momen tersebut
- Minimal 5 paragraf, idealnya 6-8 paragraf
- Output HANYA JSON, tanpa teks tambahan di luar JSON`


export async function generateArticleFromMatch(match: MatchDetail): Promise<GeneratedArticle> {
  const zai = await ZAI.create()
  const matchContext = buildMatchContext(match)

  const userPrompt = `Tulis artikel berita pertandingan berdasarkan data berikut:

${matchContext}

Tulis artikel yang mendalam, seru, dan akurat. Output dalam format JSON.`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices[0]?.message?.content || ''

  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = raw.trim()
  // Remove ```json and ``` wrappers
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    const parsed = JSON.parse(jsonStr)

    // Validate required fields
    if (!parsed.title || !parsed.slug || !parsed.content) {
      throw new Error('Missing required fields: title, slug, content')
    }

    // Clean slug
    const slug = parsed.slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 120)

    return {
      title: parsed.title.substring(0, 200),
      slug,
      content: parsed.content,
      summary: parsed.summary || parsed.title.substring(0, 150),
    }
  } catch (parseErr: any) {
    console.error('Failed to parse AI response as JSON:', parseErr.message)
    console.error('Raw response:', raw.substring(0, 500))

    // Fallback: generate basic article
    const winner = match.homeWinner
      ? match.homeTeam
      : match.awayWinner
      ? match.awayTeam
      : null

    const baseSlug = `${match.homeTeam.toLowerCase().replace(/\s+/g, '-')}-${match.homeScore}-${match.awayScore}-${match.awayTeam.toLowerCase().replace(/\s+/g, '-')}`.replace(/[^a-z0-9-]/g, '')

    return {
      title: `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}${winner ? `: ${winner} Menang!` : ': Hasil Imbang'}`,
      slug: baseSlug.substring(0, 120),
      content: `<p>${match.homeTeam} bermain imbang ${match.homeScore}-${match.awayScore} melawan ${match.awayTeam} di ${match.venue} dalam lanjutan ${match.league}.</p><p>Pertandingan berlangsung sengit dengan ${match.homeStats.possession}% penguasaan bola untuk ${match.homeTeam} dan ${match.awayStats.possession}% untuk ${match.awayTeam}.</p>`,
      summary: `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} — Hasil ${match.league}`,
    }
  }
}

// ============================================================
// Generate SEO Metadata (Step 5)
// ============================================================

const SEO_SYSTEM_PROMPT = `Kamu adalah ahli SEO yang fokus pada konten olahraga sepak bola.
Buatkan SEO metadata dalam format JSON.
Output HANYA JSON, tanpa teks tambahan.

Format:
{
  "seoTitle": "Judul SEO (50-60 karakter, mengandung kata kunci utama)",
  "metaDescription": "Deskripsi meta (150-160 karakter, mengandung skor dan nama tim)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Aturan:
- seoTitle harus berbeda dari judul artikel tapi tetap relevan
- metaDescription harus mengandung skor akhir dan nama kedua tim
- keywords harus 5-8 kata kunci relevan dalam Bahasa Indonesia dan Inggris
- Fokus pada: nama tim, liga, skor, pemain kunci, dan momen penting`


export async function generateSEOMetadata(
  title: string,
  content: string,
  match: MatchDetail
): Promise<SEOMetadata> {
  try {
    const zai = await ZAI.create()

    // Strip HTML tags for the prompt
    const plainContent = content.replace(/<[^>]*>/g, '').substring(0, 1000)

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SEO_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Artikel: "${title}"\n\nKonten: ${plainContent}\n\nPertandingan: ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} (${match.league})\n\nBuatkan SEO metadata.`,
        },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = completion.choices[0]?.message?.content || ''
    let jsonStr = raw.trim()
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const parsed = JSON.parse(jsonStr)
    return {
      seoTitle: parsed.seoTitle || title,
      metaDescription: parsed.metaDescription || '',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    }
  } catch (err: any) {
    console.warn('   ⚠️  SEO generation failed, using fallback:', err.message)

    // Fallback SEO
    return {
      seoTitle: `${match.homeTeam} vs ${match.awayTeam} Hasil & Skor — ${match.league}`,
      metaDescription: `Hasil pertandingan ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} di ${match.league}. Baca ringkasan lengkap dan statistik pertandingan di GOALZONE.`,
      keywords: [
        `${match.homeTeam} vs ${match.awayTeam}`,
        `hasil ${match.league}`,
        `skor ${match.homeTeam} ${match.awayScore} ${match.awayScore} ${match.awayTeam}`,
        'match report',
        'berita sepak bola',
        match.league.toLowerCase(),
      ],
    }
  }
}
