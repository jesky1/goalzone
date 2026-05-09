// ============================================================
// GOALZONE Article Generator — Step 2: AI Article Writer
// ============================================================
// Generates SEO-optimized, EEAT-compliant football match reports
// Uses z-ai-web-dev-sdk (backend only)
//
// Features:
//   - Super-Prompt SEO (EEAT, LSI, Featured Snippet)
//   - JSON-LD Schema.org NewsArticle generation
//   - Anti-AI Detector content style
//   - Rich metadata (og:title, og:description, keywords)
//   - CTA + signature line
// ============================================================

import ZAI from 'z-ai-web-dev-sdk'
import type { MatchDetail } from './fetcher.js'

// ============================================================
// Types
// ============================================================

export interface GeneratedArticle {
  title: string
  slug: string
  content: string        // HTML format
  summary: string        // Short excerpt for cards
  metaDescription: string // SEO meta description (≤160 chars)
  keywords: string[]     // SEO keywords (5-10)
  jsonLd: string         // JSON-LD schema.org markup (stringified)
}

export interface SEOMetadata {
  seoTitle: string
  metaDescription: string
  keywords: string[]
  ogTitle: string
  ogDescription: string
  canonicalUrl: string
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
    : '• Tidak ada data pencetak gol'

  const htScore = match.halfTimeScore
    ? `${match.halfTimeScore.home}-${match.halfTimeScore.away}`
    : 'N/A'

  const keyPlayers = allScorers
    .map(s => s.player)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(', ')

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
Penguasaan Bola:     ${match.homeTeam} ${match.homeStats.possession}% — ${match.awayStats.possession}% ${match.awayTeam}
Total Tembakan:      ${match.homeTeam} ${match.homeStats.shots} — ${match.awayStats.shots} ${match.awayTeam}
Tembakan Tepat:     ${match.homeTeam} ${match.homeStats.shotsOnGoal} — ${match.awayStats.shotsOnGoal} ${match.awayTeam}
Tendangan Sudut:    ${match.homeTeam} ${match.homeStats.corners} — ${match.awayStats.corners} ${match.awayTeam}
Pelanggaran:         ${match.homeTeam} ${match.homeStats.fouls} — ${match.awayStats.fouls} ${match.awayTeam}
Offside:             ${match.homeTeam} ${match.homeStats.offsides} — ${match.awayStats.offsides} ${match.awayTeam}
Total Umpan:         ${match.homeTeam} ${match.homeStats.passes} — ${match.awayStats.passes} ${match.awayTeam}
Akurasi Umpan:       ${match.homeTeam} ${match.homeStats.passAccuracy}% — ${match.awayStats.passAccuracy}% ${match.awayTeam}

═══ ANALISIS DATA KUNCI ═══
Efektivitas Tembakan ${match.homeTeam}: ${match.homeStats.shots > 0 ? Math.round((match.homeStats.shotsOnGoal / match.homeStats.shots) * 100) : 0}% tepat sasaran
Efektivitas Tembakan ${match.awayTeam}: ${match.awayStats.shots > 0 ? Math.round((match.awayStats.shotsOnGoal / match.awayStats.shots) * 100) : 0}% tepat sasaran
Dominasi Penguasaan Bola: ${match.homeStats.possession > match.awayStats.possession ? match.homeTeam : match.awayStats.possession > match.homeStats.possession ? match.awayTeam : 'Seimbang'} (${Math.abs(match.homeStats.possession - match.awayStats.possession)}% selisih)
`.trim()
}

// ============================================================
// SUPER-PROMPT SEO — "Google Page 1" Formula
// ============================================================

const SYSTEM_PROMPT = `Kamu adalah Senior SEO Specialist sekaligus Jurnalis Sepak Bola Profesional kelas dunia yang bekerja untuk GOALZONE, portal berita sepak bola terkemuka di Indonesia.

═══════════════════════════════════════════════════════════
               INSTRUKSI SEO KETAT — WAJIB DIIKUTI
═══════════════════════════════════════════════════════════

1. STRUKTUR JUDUL (H1):
   - Keyword Utama (Nama Tim + Skor) HARUS di depan judul
   - Gunakan gaya emosional/kontroversial untuk CTR tinggi
   - Contoh: "Bungkam Man City 2-1, Taktik Jenius Arteta Bawa Arsenal Puncaki Klasemen!"
   - Maks 80 karakter, JANGAN gunakan tanda kutip di judul
   - Hindari kata-kata yang terlalu generic seperti "Hasil Pertandingan"

2. OPTIMASI LSI (Latent Semantic Indexing):
   Sisipkan kata kunci terkait SECARA NATURAL di dalam artikel:
   - "Hasil pertandingan", "Klasemen terbaru", "Top skor"
   - "Analisis taktik", "Jalannya pertandingan", "Pencetak gol"
   - "Berita sepak bola terkini", "Highlight pertandingan"
   - JANGAN menyebutkan kata-kata ini sebagai list — sisipkan dalam kalimat natural

3. KONTEN UNIK (ANTI-AI DETECTOR) — INI PALING PENTING:
   ❌ JANGAN hanya menuliskan ulang statistik mentah
   ✅ BERIKAN ANALISIS "KENAPA" — Analisis taktis mendalam:
     - Mengapa tim X menang? Apa strategi kuncinya?
     - Formasi apa yang digunakan? Efektif atau tidak?
     - Siapa pemain yang mengontrol permainan?
     - Apa kelemahan lawan yang dimanfaatkan?
   ✅ NARASI MOMEN KUNCI — Tulis seperti reporter lapangan:
     - "Keajaiban di menit ke-78 ketika..."
     - "Stadion [nama stadion] bergemuruh ketika..."
     - "Sebuah momen yang akan dikenang para suporter..."
   ✅ PREDIKSI DAMPAK — Bagian wajib:
     - Bagaimana hasil ini mempengaruhi posisi di klasemen?
     - Peluang tim di pertandingan berikutnya?
     - Siapa yang akan menjadi ancaman di liga?

4. STRUKTUR ARTIKEL (WAJIB ikuti heading hierarchy):
   <h2>Ringkasan Pertandingan</h2>
     → 1 paragraf lead (who, what, when, where, result)
   <h2>Babak Pertama: [Judul Naratif]</h2>
     → Narasi jalannya babak pertama, momen kunci
   <h2>Babak Kedua: [Judul Naratif]</h2>
     → Narasi jalannya babak kedua, momen kunci, gol
   <h2>Analisis Performa Pemain Kunci</h2>
     → 2-3 pemain yang paling berpengaruh + analisisnya
   <h3>Statistik Pertandingan</h3>
     → Wrap statistik dalam <ul><li> format untuk Featured Snippet
   <h2>Komentar Pengamat</h2>
     → Pendapat analitis profesional — insight mendalam
   <h2>Prediksi Dampak terhadap Klasemen</h2>
     → Dampak hasil ini ke posisi tim di klasemen
   <h2>Penutup</h2>
     → CTA diskusi + signature

5. FITUR RICH SNIPPETS:
   Buat paragraf pembuka (≤150 karakter) yang menggoda klik dari Google.
   Ini bukan bagian content, tapi masukkan ke field "meta_description".

6. FEATURED SNIPPET READY:
   Di bagian <h3>Statistik Pertandingan</h3>, gunakan format <ul><li>
   agar Google bisa mengambil sebagai Featured Snippet.

7. CALL TO ACTION (CTA):
   Di bagian penutup, WAJIB sertakan:
   "Siapakah Man of the Match menurutmu? Tulis pendapatmu di kolom komentar di bawah!"

8. SIGNATURE LINE:
   Artikel WAJIB diakhiri dengan paragraf terpisah:
   <p><em>Laporan eksklusif oleh tim data GoalZone.</em></p>

═══════════════════════════════════════════════════════════
                    GAYA BAHASA
═══════════════════════════════════════════════════════════
- Bahasa Indonesia natural, profesional, dan SERU
- Jangan seperti robot AI — tulis dengan EMOSI dan OPINI
- Variasi kalimat: pendek untuk momen dramatis, panjang untuk analisis
- Gunakan istilah sepak bola Indonesia yang umum (bukan terjemahan literal)
- Hindari frasa klise AI: "Dalam pertandingan yang seru...", "Pertandingan ini menunjukkan..."
- GAYA REFRESH: "Dari kick-off hingga peluit akhir, [tim] tampil layaknya [metafora]..."

═══════════════════════════════════════════════════════════
                  FORMAT OUTPUT WAJIB
═══════════════════════════════════════════════════════════
Output HANYA JSON valid, tanpa teks tambahan:

{
  "title": "Judul H1 — emosional, keyword di depan, maks 80 karakter",
  "slug": "slug-url-friendly-lowercase-hanya-huruf-angka-strip",
  "meta_description": "Rich snippet meta description, maks 150 karakter, menggoda klik",
  "content": "Artikel lengkap dalam HTML. Gunakan tag: <p>, <h2>, <h3>, <strong>, <em>, <ul>, <li>, <blockquote>. Minimal 8 paragraf. WAJIB ikuti struktur heading di atas.",
  "summary": "Ringkasan 1-2 kalimat untuk card preview (maks 160 karakter)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]
}

ATURAN FINAL:
- title: emosional, akurat, keyword di depan, TANPA tanda kutip
- slug: unik, lowercase, [a-z0-9-] saja
- content: HTML VALID, bukan markdown, WAJIB 8+ paragraf
- content: WAJIB mengandung semua H2/H3 yang disebutkan
- content: WAJIB diakhiri dengan CTA + signature "Laporan eksklusif oleh tim data GoalZone."
- meta_description: ≤150 karakter, mengandung skor
- keywords: 6-10 kata kunci campuran Indonesia + Inggris
- Output HANYA JSON — tidak boleh ada teks sebelum/sesudah JSON`

// ============================================================
// Generate Article Text (Super-Prompt SEO)
// ============================================================

export async function generateArticleFromMatch(match: MatchDetail): Promise<GeneratedArticle> {
  const zai = await ZAI.create()
  const matchContext = buildMatchContext(match)

  const userPrompt = `Bertindaklah sebagai Senior SEO Specialist dan Jurnalis Sepak Bola Profesional. Tulis artikel berita mendalam, seru, dan SEO-optimized berdasarkan data pertandingan berikut:

${matchContext}

INGAT:
- Jangan hanya ulang statistik. BERI ANALISIS MENDALAM.
- Buat narasi dramatis untuk momen kunci.
- Sertakan prediksi dampak ke klasemen.
- Diakhiri CTA + "Laporan eksklusif oleh tim data GoalZone."
- Output HANYA JSON.`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices[0]?.message?.content || ''

  // Parse JSON from response
  let jsonStr = raw.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    const parsed = JSON.parse(jsonStr)

    if (!parsed.title || !parsed.slug || !parsed.content) {
      throw new Error('Missing required fields: title, slug, content')
    }

    // Clean slug
    const slug = parsed.slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 120)

    // Ensure content ends with signature line
    let content = parsed.content
    if (!content.includes('tim data GoalZone') && !content.includes('tim data GOALZONE')) {
      content += `\n<p><em>Laporan eksklusif oleh tim data GoalZone.</em></p>`
    }

    // Ensure content has CTA
    if (!content.includes('komentar') && !content.includes('Man of the Match')) {
      content += `\n<p><strong>Siapakah Man of the Match menurutmu? Tulis pendapatmu di kolom komentar di bawah!</strong></p>`
    }

    // Generate JSON-LD schema markup
    const jsonLd = buildJsonLd(parsed.title, content, match)

    // Extract keywords
    const keywords = Array.isArray(parsed.keywords) && parsed.keywords.length > 0
      ? parsed.keywords.slice(0, 10)
      : extractFallbackKeywords(match)

    return {
      title: parsed.title.substring(0, 200).replace(/[""]/g, ''),
      slug,
      content,
      summary: parsed.summary || parsed.title.substring(0, 150),
      metaDescription: parsed.meta_description || buildFallbackMetaDescription(match),
      keywords,
      jsonLd,
    }
  } catch (parseErr: any) {
    console.error('Failed to parse AI response as JSON:', parseErr.message)
    console.error('Raw response:', raw.substring(0, 500))

    // Fallback article
    const winner = match.homeWinner
      ? match.homeTeam
      : match.awayWinner
      ? match.awayTeam
      : null

    const baseSlug = `${match.homeTeam.toLowerCase().replace(/\s+/g, '-')}-${match.homeScore}-${match.awayScore}-${match.awayTeam.toLowerCase().replace(/\s+/g, '-')}`.replace(/[^a-z0-9-]/g, '')

    const fallbackContent = buildFallbackArticle(match)

    return {
      title: `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}${winner ? `: ${winner} Menang!` : ': Hasil Imbang Dramatis'}`,
      slug: baseSlug.substring(0, 120),
      content: fallbackContent,
      summary: `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} — Hasil ${match.league}`,
      metaDescription: buildFallbackMetaDescription(match),
      keywords: extractFallbackKeywords(match),
      jsonLd: buildJsonLd(
        `${match.homeTeam} vs ${match.awayTeam}`,
        fallbackContent,
        match
      ),
    }
  }
}

// ============================================================
// Build JSON-LD Schema.org NewsArticle
// ============================================================

function buildJsonLd(title: string, content: string, match: MatchDetail): string {
  const domain = process.env.SITE_URL || 'https://goalzone-seven.vercel.app'
  const slug = `${match.homeTeam.toLowerCase().replace(/\s+/g, '-')}-${match.homeScore}-${match.awayScore}-${match.awayTeam.toLowerCase().replace(/\s+/g, '-')}`.replace(/[^a-z0-9-]/g, '')
  const url = `${domain}/articles/${slug}`
  const imageUrl = match.homeLogo || ''

  const plainContent = content.replace(/<[^>]*>/g, '').substring(0, 200)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description: plainContent,
    image: imageUrl ? [imageUrl] : undefined,
    datePublished: new Date(match.date).toISOString(),
    dateModified: new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Tim Analis GOALZONE',
      url: domain,
    },
    publisher: {
      '@type': 'Organization',
      name: 'GOALZONE',
      url: domain,
      logo: {
        '@type': 'ImageObject',
        url: `${domain}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: match.league,
    keywords: `${match.homeTeam}, ${match.awayTeam}, ${match.league}, hasil pertandingan, skor, berita sepak bola`,
    about: {
      '@type': 'SportsEvent',
      name: `${match.homeTeam} vs ${match.awayTeam}`,
      sport: 'Soccer',
      description: `${match.league}: ${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`,
    },
  }

  return JSON.stringify(jsonLd, null, 0)
}

// ============================================================
// Fallback Helpers
// ============================================================

function buildFallbackMetaDescription(match: MatchDetail): string {
  const winner = match.homeWinner
    ? match.homeTeam
    : match.awayWinner
    ? match.awayTeam
    : null

  if (winner) {
    return `${winner} menang ${match.homeScore}-${match.awayScore}! Hasil ${match.league}, analisis taktik & statistik lengkap di GOALZONE.`
  }
  return `${match.homeTeam} vs ${match.awayTeam} imbang ${match.homeScore}-${match.awayScore}. Hasil ${match.league} & statistik lengkap di GOALZONE.`
}

function extractFallbackKeywords(match: MatchDetail): string[] {
  const base = [
    `${match.homeTeam} vs ${match.awayTeam}`,
    `hasil ${match.league}`,
    `skor ${match.homeTeam} ${match.awayScore} ${match.awayScore} ${match.awayTeam}`,
    'match report',
    'berita sepak bola',
    'analisis taktik',
  ]

  // Add league-specific keywords
  base.push(match.league.toLowerCase())
  if (match.leagueRound) {
    base.push(match.league.toLowerCase() + ' ' + match.leagueRound)
  }

  // Add key player names
  const allScorers = [...match.homeScorers, ...match.awayScorers]
  const playerNames = allScorers
    .map(s => s.player)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 2)
  base.push(...playerNames)

  return [...new Set(base)].slice(0, 10)
}

function buildFallbackArticle(match: MatchDetail): string {
  const winner = match.homeWinner
    ? match.homeTeam
    : match.awayWinner
    ? match.awayTeam
    : null

  const allScorers = [...match.homeScorers, ...match.awayScorers]
    .sort((a, b) => a.minute - b.minute)

  const scorersHtml = allScorers.length > 0
    ? allScorers.map(s => {
        const team = s.team === 'home' ? match.homeTeam : match.awayTeam
        return `<li><strong>${s.player}</strong> (${team}) — Menit ke-${s.minute}${s.type === 'penalty' ? ' (penalti)' : s.type === 'own goal' ? ' (gol bunuh diri)' : ''}</li>`
      }).join('\n      ')
    : '<li>Tidak ada data pencetak gol tersedia</li>'

  const dominantTeam = match.homeStats.possession >= match.awayStats.possession
    ? match.homeTeam : match.awayTeam
  const possDiff = Math.abs(match.homeStats.possession - match.awayStats.possession)

  return `
<h2>Ringkasan Pertandingan</h2>
<p>${match.homeTeam} menjamu ${match.awayTeam} di ${match.venue} dalam lanjutan ${match.league}${match.leagueRound ? ` (${match.leagueRound})` : ''} dan pertandingan berakhir dengan skor ${match.homeScore}-${match.awayScore} untuk ${winner || 'hasil imbang'}. ${dominantTeam} menguasai jalannya pertandingan dengan ${Math.max(match.homeStats.possession, match.awayStats.possession)}% penguasaan bola.</p>

<h2>Jalannya Pertandingan</h2>
<p>Pertandingan berlangsung di ${match.venue}${match.venueCity ? `, ${match.venueCity}` : ''} dengan intensitas tinggi sejak menit awal. Kedua tim saling jual beli serangan dalam pertandingan yang ${match.isDraw ? 'berakhir imbang dan penuh drama' : `berakhir dengan kemenangan untuk ${winner}`}. ${match.referee ? `Wasit ${match.referee} memimpin jalannya pertandingan.` : ''}</p>

<h2>Analisis Performa Pemain Kunci</h2>
<p>${allScorers.length > 0 ? allScorers[0].player + ` menjadi bintang lapangan dengan gol penting di menit ke-${allScorers[0].minute}.` : 'Pertandingan ini berjalan ketat tanpa gol yang tercipta.'} ${dominantTeam} mendominasi penguasaan bola dengan selisih ${possDiff}% — menunjukkan superioritas ${dominantTeam} dalam mengatur tempo permainan.</p>

<h3>Statistik Pertandingan</h3>
<ul>
  <li><strong>Penguasaan Bola:</strong> ${match.homeTeam} ${match.homeStats.possession}% — ${match.awayStats.possession}% ${match.awayTeam}</li>
  <li><strong>Total Tembakan:</strong> ${match.homeTeam} ${match.homeStats.shots} — ${match.awayStats.shots} ${match.awayTeam}</li>
  <li><strong>Tembakan Tepat:</strong> ${match.homeTeam} ${match.homeStats.shotsOnGoal} — ${match.awayStats.shotsOnGoal} ${match.awayTeam}</li>
  <li><strong>Tendangan Sudut:</strong> ${match.homeTeam} ${match.homeStats.corners} — ${match.awayStats.corners} ${match.awayTeam}</li>
  <li><strong>Pelanggaran:</strong> ${match.homeTeam} ${match.homeStats.fouls} — ${match.awayStats.fouls} ${match.awayTeam}</li>
</ul>

<h3>Pencetak Gol</h3>
<ul>
  ${scorersHtml}
</ul>

<h2>Prediksi Dampak terhadap Klasemen</h2>
<p>Hasil ini ${winner ? `akan membawa ${winner} naik di klasemen ${match.league}` : 'tidak mengubah banyak di papan klasemen'}. ${winner ? `Dengan tambahan tiga poin, ${winner} semakin percaya diri menyongsong pertandingan berikutnya.` : 'Kedua tim harus memperbaiki performa mereka di pertandingan selanjutnya.'}</p>

<p><strong>Siapakah Man of the Match menurutmu? Tulis pendapatmu di kolom komentar di bawah!</strong></p>
<p><em>Laporan eksklusif oleh tim data GoalZone.</em></p>
`.trim()
}

// ============================================================
// Generate SEO Metadata (Enhanced EEAT)
// ============================================================

const SEO_SYSTEM_PROMPT = `Kamu adalah Senior SEO Specialist yang fokus pada EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) untuk konten olahraga sepak bola.

Buatkan SEO metadata komprehensif dalam format JSON.
Output HANYA JSON, tanpa teks tambahan.

Format:
{
  "seoTitle": "Judul SEO (50-60 karakter, mengandung keyword utama + skor)",
  "metaDescription": "Deskripsi meta (150-160 karakter, mengandung skor, nama tim, dan CTA implisit)",
  "ogTitle": "Open Graph title (60-80 karakter, untuk sharing di sosial media)",
  "ogDescription": "Open Graph description (150-200 karakter, untuk preview di Facebook/Twitter)",
  "canonicalUrl": "URL kanonikal yang SEO-friendly",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]
}

ATURAN EEAT:
- seoTitle: Berbeda dari judul artikel, lebih fokus ke search intent
- metaDescription: Mengandung skor + nama tim + value proposition (mengapa harus baca)
- ogTitle: Lebih emosional, cocok untuk sosial media sharing
- ogDescription: Lebih detail, mengandung hook untuk click
- canonicalUrl: Format: /articles/[home-team]-[score]-[score]-[away-team]
- keywords: 7-10 kata kunci campuran Indonesia + Inggris, termasuk long-tail keywords
- Fokus pada search intent: orang mencari "hasil [tim] vs [tim]" atau "skor [liga]"`

export async function generateSEOMetadata(
  title: string,
  content: string,
  match: MatchDetail
): Promise<SEOMetadata> {
  try {
    const zai = await ZAI.create()

    const plainContent = content.replace(/<[^>]*>/g, '').substring(0, 1000)

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SEO_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Artikel: "${title}"\n\nKonten: ${plainContent}\n\nPertandingan: ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} (${match.league})\n\nBuatkan SEO metadata EEAT-compliant.`,
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
      metaDescription: parsed.metaDescription || buildFallbackMetaDescription(match),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : extractFallbackKeywords(match),
      ogTitle: parsed.ogTitle || title,
      ogDescription: parsed.ogDescription || buildFallbackMetaDescription(match),
      canonicalUrl: parsed.canonicalUrl || '',
    }
  } catch (err: any) {
    console.warn('   ⚠️  SEO generation failed, using fallback:', err.message)

    const domain = process.env.SITE_URL || 'https://goalzone-seven.vercel.app'
    const slug = `${match.homeTeam.toLowerCase().replace(/\s+/g, '-')}-${match.homeScore}-${match.awayScore}-${match.awayTeam.toLowerCase().replace(/\s+/g, '-')}`.replace(/[^a-z0-9-]/g, '')

    return {
      seoTitle: `${match.homeTeam} vs ${match.awayTeam} ${match.homeScore}-${match.awayScore} — Hasil & Analisis ${match.league}`,
      metaDescription: buildFallbackMetaDescription(match),
      keywords: extractFallbackKeywords(match),
      ogTitle: `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}! Hasil ${match.league} Terbaru`,
      ogDescription: `Saksikan hasil lengkap ${match.homeTeam} vs ${match.awayTeam} skor ${match.homeScore}-${match.awayScore} di ${match.league}. Analisis taktik, statistik, dan pencetak gol hanya di GOALZONE.`,
      canonicalUrl: `${domain}/articles/${slug}`,
    }
  }
}
