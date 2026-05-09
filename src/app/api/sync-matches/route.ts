import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { footballFetch, isFootballApiConfigured } from '@/lib/football'

// ============================================================
// GOALZONE - Sync Matches API Route
// ============================================================
// Endpoint terproteksi untuk sinkronisasi data pertandingan.
//
// Alur kerja:
// 1. Validasi API_SECRET_KEY (header x-api-secret / query ?secret=)
// 2. Panggil Football-API: /fixtures?date=today
// 3. Loop semua data pertandingan
// 4. Upsert ke Supabase (onConflict: external_id) → update skor
// 5. Upsert ke Prisma/SQLite lokal (backup)
//
// Proteksi:
// - WAJIB kirim API_SECRET_KEY via header "x-api-secret"
//   atau query parameter "?secret=..."
// - Tanpa key yang benar → 401 Unauthorized
// ============================================================

const API_SECRET_KEY = process.env.API_SECRET_KEY

// ─── GOALZONE League IDs ──────────────────────────────────────
const GOALZONE_LEAGUE_IDS = [
  39, 40, 140, 141, 135, 136, 78, 79, 61, 62,
  88, 94, 2, 3, 848,
  71, 253, 252, 128,
  307, 98, 292, 297, 235, 203, 144, 4, 1,
]

// ─── Status mapping dari API-Football ke format GOALZONE ──────
function mapStatus(short: string): string {
  const s = short.toLowerCase()
  if (['1h', '2h', 'et', 'bt', 'p', 'live'].includes(s)) return 'LIVE'
  if (s === 'ht') return 'HT'
  if (['ft', 'aft', 'awd', 'wo'].includes(s)) return 'FT'
  return 'NS'
}

// ─── Extract events (goals & cards) untuk satu tim ────────────
function extractEvents(events: any[], teamId: number) {
  if (!events) return []
  return events
    .filter((e: any) => e.team.id === teamId && (e.type === 'goal' || e.type === 'card'))
    .map((e: any) => ({
      type: e.type === 'goal' ? 'goal' : 'card',
      minute: e.time.elapsed,
      player: e.player.name,
      detail: e.detail || undefined,
    }))
}

// ─── Validasi API Secret Key ──────────────────────────────────
// Cek dari header "x-api-secret" atau query parameter "secret"
function validateSecret(request: Request): boolean {
  if (!API_SECRET_KEY) {
    console.warn('[sync-matches] ⚠️ API_SECRET_KEY tidak diset di .env — proteksi tidak aktif!')
    return true // Jika tidak ada key di env, allow (mode development)
  }

  // 1. Cek header "x-api-secret"
  const headerSecret = request.headers.get('x-api-secret')
  if (headerSecret && headerSecret === API_SECRET_KEY) return true

  // 2. Cek query parameter "?secret=..."
  const { searchParams } = new URL(request.url)
  const querySecret = searchParams.get('secret')
  if (querySecret && querySecret === API_SECRET_KEY) return true

  return false
}

// ─── Transform fixture API-Football → row untuk upsert ────────
function transformFixture(f: any) {
  const homeEvents = extractEvents(f.events || [], f.teams.home.id)
  const awayEvents = extractEvents(f.events || [], f.teams.away.id)

  return {
    externalId: String(f.fixture.id),     // match_id_api (ID dari Football-API)
    league: f.league.name,
    leagueLogo: f.league.logo || '',
    leagueId: f.league.id,
    homeTeam: f.teams.home.name,
    awayTeam: f.teams.away.name,
    homeLogo: f.teams.home.logo || '',
    awayLogo: f.teams.away.logo || '',
    homeScore: f.goals.home ?? 0,
    awayScore: f.goals.away ?? 0,
    status: mapStatus(f.fixture.status.short),
    minute: f.fixture.status.elapsed || null,
    matchDate: f.fixture.date,
    venue: f.fixture.venue?.name || null,
    homeEvents: JSON.stringify(homeEvents),
    awayEvents: JSON.stringify(awayEvents),
  }
}

// ─── Fetch ALL fixtures for a date ────────────────────────────
// Endpoint: /fixtures?date={date}&timezone=Asia/Jakarta
// Menarik SELURUH pertandingan dunia untuk tanggal tsb.
async function fetchAllFixturesForDate(date: string): Promise<any[]> {
  if (!isFootballApiConfigured) return []

  try {
    console.log(`[sync-matches] 📡 Fetching fixtures for ${date}...`)
    const res = await footballFetch(
      `/fixtures?date=${date}&timezone=Asia/Jakarta`,
      { next: { revalidate: 0 } }
    )
    if (!res.ok) {
      console.error(`[sync-matches] ❌ API returned ${res.status} for date ${date}`)
      return []
    }

    const data = await res.json()
    const fixtures = data.response || []
    console.log(`[sync-matches] ✅ Got ${fixtures.length} fixtures for ${date}`)
    return fixtures
  } catch (err) {
    console.error(`[sync-matches] ❌ Fetch error for ${date}:`, err)
    return []
  }
}

// ─── Supabase Upsert ──────────────────────────────────────────
// Jika external_id sudah ada → update (terutama skor & status)
// Jika belum ada → insert baru
async function upsertToSupabase(rows: any[]): Promise<{ upserted: number; error?: string }> {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !serviceKey) {
      return { upserted: 0, error: 'Supabase not configured (missing URL or key)' }
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Mapping ke snake_case kolom Supabase
    const supabaseRows = rows.map(r => ({
      external_id: r.externalId,        // match_id_api → unique conflict key
      league: r.league,
      league_logo: r.leagueLogo,
      league_id: r.leagueId,
      home_team: r.homeTeam,
      away_team: r.awayTeam,
      home_logo: r.homeLogo,
      away_logo: r.awayLogo,
      home_score: r.homeScore,          // ← skor di-update jika sudah ada
      away_score: r.awayScore,          // ← skor di-update jika sudah ada
      status: r.status,                 // ← status di-update (NS→LIVE→HT→FT)
      minute: r.minute,
      match_date: r.matchDate,
      venue: r.venue,
      home_events: r.homeEvents,
      away_events: r.awayEvents,
    }))

    console.log(`[sync-matches] 📤 Upserting ${supabaseRows.length} rows to Supabase...`)

    const { error } = await supabase
      .from('matches')
      .upsert(supabaseRows, {
        onConflict: 'external_id',      // Key: match_id_api (external_id)
        ignoreDuplicates: false,         // Update jika sudah ada
      })

    if (error) {
      console.error('[sync-matches] ❌ Supabase upsert error:', error.message)
      return { upserted: 0, error: error.message }
    }

    console.log(`[sync-matches] ✅ Supabase: ${supabaseRows.length} rows upserted`)
    return { upserted: supabaseRows.length }
  } catch (err: any) {
    console.error('[sync-matches] ❌ Supabase exception:', err.message)
    return { upserted: 0, error: err.message || 'Unknown Supabase error' }
  }
}

// ─── Prisma Upsert (local SQLite backup) ──────────────────────
async function upsertToPrisma(rows: any[]): Promise<{ upserted: number; error?: string }> {
  let upserted = 0
  try {
    console.log(`[sync-matches] 📤 Upserting ${rows.length} rows to Prisma/SQLite...`)

    for (const row of rows) {
      if (!row.externalId) continue

      await db.match.upsert({
        where: { externalId: row.externalId },  // match_id_api
        update: {
          league: row.league,
          leagueLogo: row.leagueLogo,
          leagueId: row.leagueId,
          homeTeam: row.homeTeam,
          awayTeam: row.awayTeam,
          homeLogo: row.homeLogo,
          awayLogo: row.awayLogo,
          homeScore: row.homeScore,      // ← skor di-update
          awayScore: row.awayScore,      // ← skor di-update
          status: row.status,            // ← status di-update
          minute: row.minute,
          matchDate: new Date(row.matchDate),
          venue: row.venue,
          homeEvents: row.homeEvents,
          awayEvents: row.awayEvents,
        },
        create: {
          externalId: row.externalId,
          league: row.league,
          leagueLogo: row.leagueLogo,
          leagueId: row.leagueId,
          homeTeam: row.homeTeam,
          awayTeam: row.awayTeam,
          homeLogo: row.homeLogo,
          awayLogo: row.awayLogo,
          homeScore: row.homeScore,
          awayScore: row.awayScore,
          status: row.status,
          minute: row.minute,
          matchDate: new Date(row.matchDate),
          venue: row.venue,
          homeEvents: row.homeEvents,
          awayEvents: row.awayEvents,
        },
      })
      upserted++
    }

    console.log(`[sync-matches] ✅ Prisma: ${upserted} rows upserted`)
    return { upserted }
  } catch (err: any) {
    console.error('[sync-matches] ❌ Prisma exception:', err.message)
    return { upserted, error: err.message || 'Unknown Prisma error' }
  }
}

// ─── GET handler ─────────────────────────────────────────────
export async function GET(request: Request) {
  const startTime = Date.now()

  // ── 1. VALIDASI API SECRET KEY ────────────────────────────
  if (!validateSecret(request)) {
    return NextResponse.json({
      success: false,
      error: 'Unauthorized. Kirim API_SECRET_KEY via header "x-api-secret" atau query "?secret=..."',
      hint: 'Contoh: curl -H "x-api-secret: YOUR_KEY" /api/sync-matches',
    }, { status: 401 })
  }

  // ── 2. CEK KONFIGURASI ────────────────────────────────────
  if (!isFootballApiConfigured) {
    return NextResponse.json({
      success: false,
      error: 'FOOTBALL_API_KEY tidak dikonfigurasi. Set FOOTBALL_API_KEY di .env.',
      upserted: 0,
    }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date')           // optional: YYYY-MM-DD
  const days = Math.min(Number(searchParams.get('days') || '2'), 3)  // default 2 hari

  try {
    // ── 3. TENTUKAN TANGGAL YANG DI-FETCH ────────────────────
    const allRows: any[] = []
    const dates: string[] = []

    if (dateParam) {
      // Tanggal spesifik dari parameter
      dates.push(dateParam)
    } else {
      // Default: hari ini + besok
      for (let i = 0; i < days; i++) {
        const d = new Date()
        d.setDate(d.getDate() + i)
        dates.push(d.toISOString().split('T')[0])
      }
    }

    // ── 4. FETCH FIXTURES DARI FOOTBALL-API ──────────────────
    for (const date of dates) {
      const fixtures = await fetchAllFixturesForDate(date)

      // Loop semua pertandingan dan transform
      for (const f of fixtures) {
        allRows.push(transformFixture(f))
      }

      // Rate limit: tunggu 1 detik antar request tanggal
      if (dates.indexOf(date) < dates.length - 1) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    // ── 5. DEDUP BERDASARKAN external_id ─────────────────────
    const seen = new Set<string>()
    const dedupedRows = allRows.filter((row) => {
      if (seen.has(row.externalId)) return false
      seen.add(row.externalId)
      return true
    })

    // ── 6. SORT: LIVE/HT → FT → NS, lalu by matchDate ───────
    dedupedRows.sort((a, b) => {
      const statusOrder: Record<string, number> = { LIVE: 0, HT: 1, FT: 2, NS: 3 }
      const sa = statusOrder[a.status] ?? 4
      const sb = statusOrder[b.status] ?? 4
      if (sa !== sb) return sa - sb
      return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
    })

    // ── 7. STATISTIK ─────────────────────────────────────────
    const goalzoneSet = new Set(GOALZONE_LEAGUE_IDS)
    const goalzoneCount = dedupedRows.filter(r => goalzoneSet.has(r.leagueId)).length
    const nonGoalzoneCount = dedupedRows.length - goalzoneCount
    const uniqueLeagues = [...new Set(dedupedRows.map(r => r.league))].sort()
    const uniqueGoalzoneLeagues = [...new Set(dedupedRows.filter(r => goalzoneSet.has(r.leagueId)).map(r => r.league))].sort()

    if (dedupedRows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada fixtures ditemukan untuk tanggal yang diminta',
        upserted: 0,
        dates,
        elapsed: Date.now() - startTime,
      })
    }

    // ── 8. UPSERT KE SUPABASE ────────────────────────────────
    // Jika external_id sudah ada → update (skor, status, dll)
    // Jika belum ada → insert baru
    const supabaseResult = await upsertToSupabase(dedupedRows)

    // ── 9. UPSERT KE PRISMA (LOCAL SQLITE BACKUP) ────────────
    const prismaResult = await upsertToPrisma(dedupedRows)

    // ── 10. RETURN RESPONSE ──────────────────────────────────
    return NextResponse.json({
      success: true,
      message: `Sinkronisasi berhasil: ${dedupedRows.length} fixtures dari ${dates.length} tanggal via /fixtures?date=`,
      totalFetched: dedupedRows.length,
      goalzoneMatchCount: goalzoneCount,
      nonGoalzoneMatchCount: nonGoalzoneCount,
      totalLeagues: uniqueLeagues.length,
      goalzoneLeagues: uniqueGoalzoneLeagues,
      dates,
      supabase: supabaseResult,
      prisma: prismaResult,
      elapsed: Date.now() - startTime,
    })
  } catch (error: any) {
    console.error('[sync-matches] ❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      elapsed: Date.now() - startTime,
    }, { status: 500 })
  }
}

// ─── POST handler (untuk cron job / webhook) ─────────────────
export async function POST(request: Request) {
  return GET(request)
}
