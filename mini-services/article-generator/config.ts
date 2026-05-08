// ============================================================
// GOALZONE Article Generator — Configuration
// ============================================================

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local from project root (bun --hot doesn't auto-load .env.local)
try {
  const envPath = resolve(import.meta.dirname, '../../.env.local')
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.substring(0, eqIdx).trim()
    const value = trimmed.substring(eqIdx + 1).trim()
    // Don't override already-set env vars
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
} catch {
  // .env.local not found — will use env vars from shell
}

export const config = {
  // Server
  port: Number(process.env.ARTICLE_GEN_PORT) || 3005,

  // API-Football
  footballApiKey: process.env.FOOTBALL_API_KEY || '',
  footballApiBase: 'https://v3.football.api-sports.io',

  // Leagues to monitor (API-Football league IDs)
  leagues: [
    39,   // Premier League
    140,  // La Liga
    135,  // Serie A
    78,   // Bundesliga
    61,   // Ligue 1
    2,    // Champions League
    3,    // Europa League
    10,   // Friendlies
    71,   // World Cup
    8,    // Euro Championship
  ],

  // AI Generation
  aiTemperature: 0.8, // creativity level
  aiMaxTokens: 4000,

  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Default author & category for auto-generated articles
  defaultAuthorId: process.env.ARTICLE_GEN_AUTHOR_ID || '',
  defaultCategoryId: process.env.ARTICLE_GEN_CATEGORY_ID || '',

  // Cron: run every N minutes (set to 0 to disable auto-cron)
  cronIntervalMinutes: 60,

  // Match date range: look back N hours for finished matches
  lookbackHours: 24,
}

// Validate required config on startup
export function validateConfig() {
  const missing: string[] = []
  if (!config.footballApiKey) missing.push('FOOTBALL_API_KEY')
  if (!config.supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!config.supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')

  if (missing.length > 0) {
    console.warn(`⚠️  Missing env vars: ${missing.join(', ')}`)
    console.warn('   The service will start but article generation will fail.')
  }

  if (!config.defaultCategoryId) {
    console.warn('⚠️  ARTICLE_GEN_CATEGORY_ID not set — using category slug "match-report" to find one')
  }
}
