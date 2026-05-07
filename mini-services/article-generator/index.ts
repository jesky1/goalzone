// ============================================================
// GOALZONE Article Generator — Full Pipeline Service
// ============================================================
// Complete Auto-News Generation:
//   Step 1: Fetch finished matches from API-Football
//   Step 2: Generate article text via AI (z-ai-web-dev-sdk)
//   Step 3: Generate featured image via AI (z-ai-web-dev-sdk)
//   Step 4: Apply GOALZONE watermark (sharp) + Upload to Supabase Storage
//   Step 5: Generate SEO metadata
//   Step 6: Publish article to Supabase database
// ============================================================

import express from 'express'
import cors from 'cors'
import { config, validateConfig } from './config.js'
import {
  fetchFinishedMatches,
  fetchMatchDetails,
  type FinishedMatch,
  type MatchDetail,
} from './fetcher.js'
import {
  generateArticleFromMatch,
  generateSEOMetadata,
  type GeneratedArticle,
  type SEOMetadata,
} from './ai-writer.js'
import {
  generateMatchImage,
  uploadImageToSupabase,
  type ImageResult,
} from './ai-artist.js'
import { applyWatermark } from './watermark.js'
import {
  publishArticle,
  articleExistsByFixtureId,
  ensureCategoryAndAuthor,
} from './publisher.js'

// ============================================================
// Types
// ============================================================

interface GenerationResult {
  fixtureId: number
  homeTeam: string
  awayTeam: string
  article?: GeneratedArticle
  seo?: SEOMetadata
  image?: ImageResult
  published?: boolean
  articleUrl?: string
  error?: string
  duration: number
  timestamp: string
}

interface PipelineStats {
  totalProcessed: number
  success: number
  failed: number
  skipped: number
  lastRun: string | null
  running: boolean
  history: GenerationResult[]
}

// ============================================================
// State
// ============================================================

const stats: PipelineStats = {
  totalProcessed: 0,
  success: 0,
  failed: 0,
  skipped: 0,
  lastRun: null,
  running: false,
  history: [],
}

let cronTimer: ReturnType<typeof setInterval> | null = null

// ============================================================
// STEP 1 → 5: Full Pipeline for a Single Match
// ============================================================

async function processMatch(fixtureId: number): Promise<GenerationResult> {
  const start = Date.now()
  const result: GenerationResult = {
    fixtureId,
    homeTeam: 'Unknown',
    awayTeam: 'Unknown',
    timestamp: new Date().toISOString(),
    duration: 0,
  }

  try {
    // ── STEP 1: Fetch Match Details ──
    console.log(`\n⚽ STEP 1: Fetching match ${fixtureId} details...`)
    const match = await fetchMatchDetails(fixtureId)

    result.homeTeam = match.homeTeam
    result.awayTeam = match.awayTeam

    console.log(`   ${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`)

    // ── Duplicate Check ──
    const exists = await articleExistsByFixtureId(fixtureId)
    if (exists) {
      console.log(`   ⏭️  Article already exists — skipping`)
      result.error = 'Article already exists'
      stats.skipped++
      return result
    }

    // ── STEP 2: Generate Article Text ──
    console.log(`\n📝 STEP 2: Generating article with AI...`)
    const article = await generateArticleFromMatch(match)
    result.article = article
    console.log(`   Title: "${article.title}"`)
    console.log(`   Slug: ${article.slug}`)

    // ── STEP 3: Generate Featured Image ──
    console.log(`\n🎨 STEP 3: Generating featured image...`)
    const image = await generateMatchImage(match)
    result.image = image
    console.log(`   Image: ${image.success ? '✅ Generated' : '❌ Failed'}`)

    // ── STEP 4: Watermark + Upload Image to Supabase Storage ──
    let storageUrl: string | null = null
    if (image.success && image.buffer) {
      // Apply GOALZONE watermark before uploading
      console.log(`\n💧 STEP 4a: Applying GOALZONE watermark...`)
      try {
        const watermarkedBuffer = await applyWatermark(image.buffer, {
          position: 'bottom-right',
          logoScale: 0.10,
          opacity: 0.55,
          padding: 24,
        })
        console.log(`   ✅ Watermark applied (${(watermarkedBuffer.length / 1024).toFixed(0)} KB)`)

        console.log(`\n☁️  STEP 4b: Uploading to Supabase Storage...`)
        const uploadResult = await uploadImageToSupabase(watermarkedBuffer, article.slug)
        storageUrl = uploadResult.url
        console.log(`   Storage URL: ${storageUrl}`)
      } catch (wmErr: any) {
        console.warn(`   ⚠️  Watermark failed (${wmErr.message}), uploading original...`)
        try {
          const uploadResult = await uploadImageToSupabase(image.buffer, article.slug)
          storageUrl = uploadResult.url
          console.log(`   Storage URL: ${storageUrl}`)
        } catch (uploadErr: any) {
          console.warn(`   ⚠️  Storage upload failed: ${uploadErr.message}`)
        }
      }
    }

    // ── STEP 5: Generate SEO Metadata ──
    console.log(`\n🔍 STEP 5: Generating SEO metadata...`)
    const seo = await generateSEOMetadata(article.title, article.content, match)
    result.seo = seo
    console.log(`   Meta: "${seo.metaDescription}"`)
    console.log(`   Keywords: ${seo.keywords.join(', ')}`)

    // ── Publish to Supabase ──
    console.log(`\n🚀 STEP 6: Publishing to Supabase...`)
    const published = await publishArticle({
      title: article.title,
      slug: article.slug,
      content: article.content,
      summary: seo.metaDescription,
      imageUrl: storageUrl,
      seoTitle: seo.seoTitle,
      seoDescription: seo.metaDescription,
      fixtureId: String(fixtureId),
      matchInfo: `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`,
    })

    result.published = published
    if (published) {
      result.articleUrl = `/articles/${article.slug}`
      console.log(`   ✅ Article published!`)
    }

    stats.success++

  } catch (err: any) {
    result.error = err.message
    stats.failed++
    console.error(`   ❌ Error processing match ${fixtureId}:`, err.message)
  }

  result.duration = Date.now() - start
  stats.totalProcessed++
  stats.history.unshift(result)

  // Keep only last 50 results in memory
  if (stats.history.length > 50) stats.history = stats.history.slice(0, 50)

  return result
}

// ============================================================
// Pipeline Runner: Process All Finished Matches
// ============================================================

async function runPipeline(leagues?: number[]): Promise<GenerationResult[]> {
  if (stats.running) {
    console.log('⏳ Pipeline already running — skipping')
    return []
  }

  stats.running = true
  const results: GenerationResult[] = []

  try {
    console.log('\n' + '='.repeat(60))
    console.log('🚀 GOALZONE Auto-News Pipeline — Starting')
    console.log('='.repeat(60))

    // Ensure category & author exist in Supabase
    await ensureCategoryAndAuthor()

    // STEP 1: Fetch all finished matches
    console.log('\n📡 Fetching finished matches...')
    const matches = await fetchFinishedMatches(leagues || config.leagues, config.lookbackHours)
    console.log(`   Found ${matches.length} finished matches`)

    if (matches.length === 0) {
      console.log('   No finished matches found. Nothing to do.')
      stats.running = false
      stats.lastRun = new Date().toISOString()
      return results
    }

    // Process each match sequentially (to avoid API rate limits)
    for (const match of matches) {
      console.log(`\n${'─'.repeat(50)}`)
      const result = await processMatch(match.fixtureId)
      results.push(result)

      // Small delay between matches to avoid rate limits
      if (matches.indexOf(match) < matches.length - 1) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Pipeline Complete: ${results.filter(r => r.published).length} articles published`)
    console.log(`   Success: ${stats.success} | Failed: ${stats.failed} | Skipped: ${stats.skipped}`)
    console.log('='.repeat(60) + '\n')

  } catch (err: any) {
    console.error('Pipeline error:', err.message)
  } finally {
    stats.running = false
    stats.lastRun = new Date().toISOString()
  }

  return results
}

// ============================================================
// Express Server
// ============================================================

const app = express()
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({
    service: 'goalzone-article-generator',
    status: 'running',
    uptime: process.uptime(),
    version: '1.0.0',
    env: {
      hasFootballApi: !!config.footballApiKey,
      hasSupabase: !!config.supabaseUrl && !!config.supabaseServiceKey,
      leagues: config.leagues.length,
      cronMinutes: config.cronIntervalMinutes,
    },
  })
})

// Get pipeline stats
app.get('/stats', (_req, res) => {
  res.json(stats)
})

// Get generation history
app.get('/history', (_req, res) => {
  res.json({
    history: stats.history,
    total: stats.totalProcessed,
  })
})

// ── Manual Trigger: Run full pipeline ──
app.post('/generate', async (_req, res) => {
  if (stats.running) {
    return res.status(429).json({
      success: false,
      message: 'Pipeline already running. Please wait.',
      stats,
    })
  }

  try {
    const results = await runPipeline()
    res.json({
      success: true,
      message: `Processed ${results.length} matches`,
      results: results.map(r => ({
        fixtureId: r.fixtureId,
        homeTeam: r.homeTeam,
        awayTeam: r.awayTeam,
        published: r.published,
        articleUrl: r.articleUrl,
        error: r.error,
        duration: r.duration,
      })),
      stats,
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Manual Trigger: Generate for a single match ──
app.post('/generate/:fixtureId', async (req, res) => {
  const fixtureId = parseInt(req.params.fixtureId)
  if (isNaN(fixtureId)) {
    return res.status(400).json({ error: 'Invalid fixture ID' })
  }

  try {
    await ensureCategoryAndAuthor()
    const result = await processMatch(fixtureId)
    res.json({ success: true, result, stats })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Manual Trigger: Custom league(s) ──
app.post('/generate/leagues', async (req, res) => {
  const { leagues } = req.body
  if (!Array.isArray(leagues) || leagues.length === 0) {
    return res.status(400).json({ error: 'Provide leagues array, e.g. [39, 140, 135]' })
  }

  if (stats.running) {
    return res.status(429).json({ success: false, message: 'Pipeline already running.' })
  }

  try {
    const results = await runPipeline(leagues)
    res.json({ success: true, results, stats })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ============================================================
// Start Server + Cron
// ============================================================

async function start() {
  validateConfig()

  console.log('═'.repeat(60))
  console.log('⚽ GOALZONE Auto-News Generator v1.0')
  console.log('═'.repeat(60))
  console.log(`   Port:           ${config.port}`)
  console.log(`   Leagues:        ${config.leagues.length} monitored`)
  console.log(`   Lookback:       ${config.lookbackHours} hours`)
  console.log(`   Cron interval:  ${config.cronIntervalMinutes} min`)
  console.log('═'.repeat(60))

  // Start Express
  app.listen(config.port, () => {
    console.log(`\n🟢 Server running on http://localhost:${config.port}`)
    console.log(`   Health:  http://localhost:${config.port}/health`)
    console.log(`   Stats:   http://localhost:${config.port}/stats`)
    console.log(`   Generate: POST http://localhost:${config.port}/generate\n`)
  })

  // Start cron job
  if (config.cronIntervalMinutes > 0) {
    console.log(`⏰ Cron job: running every ${config.cronIntervalMinutes} minutes`)
    cronTimer = setInterval(async () => {
      console.log(`\n⏰ Cron triggered at ${new Date().toISOString()}`)
      await runPipeline()
    }, config.cronIntervalMinutes * 60 * 1000)

    // Run once on startup (after 30s delay to let server stabilize)
    // Only runs if FOOTBALL_API_KEY is configured
    setTimeout(async () => {
      if (config.footballApiKey && config.supabaseUrl) {
        console.log('🔄 Running initial pipeline on startup...')
        await runPipeline()
      } else {
        console.log('⏭️  Skipping initial pipeline — missing API keys')
        console.log('   Trigger manually: POST http://localhost:3005/generate')
      }
    }, 30000)
  }
}

start().catch(console.error)
