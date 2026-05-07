// ============================================================
// GOALZONE - Supabase Edge Function: Fetch Live Scores
// ============================================================
// Cron Job yang berjalan setiap 15 menit untuk mengambil
// data skor terbaru dari API-Football
// ============================================================
//
// DEPLOYMENT:
//   supabase functions deploy fetch-live-scores
//
// CRON SETUP (via Supabase Dashboard > Edge Functions > Cron):
//   Schedule: */15 * * * * (setiap 15 menit)
//   Function: fetch-live-scores
//   Method: POST
//
// ENV VARIABLES (set di Supabase Dashboard > Edge Functions > Settings):
//   FOOTBALL_API_KEY = your-api-football-key
//   FOOTBALL_API_BASE = https://v3.football.api-sports.io
//   SUPABASE_URL = your-supabase-url
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApiFootballMatch {
  fixture: {
    id: number
    date: string
    status: { short: string; elapsed: number | null }
    referee: string | null
    venue: { name: string; city: string }
  }
  league: {
    id: number
    name: string
    country: string
    logo: string
    season: number
  }
  teams: {
    home: { id: number; name: string; logo: string }
    away: { id: number; name: string; logo: string }
  }
  goals: { home: number | null; away: number | null }
  score: {
    halftime: { home: number | null; away: number | null }
    fulltime: { home: number | null; away: number | null }
    extratime: { home: number | null; away: number | null }
    penalty: { home: number | null; away: number | null }
  }
  events: Array<{
    time: { elapsed: number | null }
    type: string
    detail: string
    player: { name: string }
    team: { name: string }
  }>
}

function extractEvents(events: ApiFootballMatch['events'], teamName: string) {
  return events
    .filter(e => e.team.name === teamName && (e.type === 'Goal' || e.detail === 'Goal'))
    .map(e => ({
      type: 'goal',
      minute: e.time.elapsed ?? 0,
      player: e.player.name,
      detail: e.detail,
    }))
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  const log: string[] = []
  let totalProcessed = 0
  let totalInserted = 0
  let totalUpdated = 0

  try {
    const FOOTBALL_API_KEY = Deno.env.get('FOOTBALL_API_KEY')
    const FOOTBALL_API_BASE = Deno.env.get('FOOTBALL_API_BASE') || 'https://v3.football.api-sports.io'
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!FOOTBALL_API_KEY) {
      throw new Error('FOOTBALL_API_KEY tidak ditemukan di environment variables')
    }

    // Initialize Supabase client with service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Liga-liga yang ingin kita monitor
    const leaguesToMonitor = [
      { id: 39, name: 'Premier League' },      // EPL
      { id: 140, name: 'La Liga' },              // Liga Spanyol
      { id: 135, name: 'Serie A' },              // Liga Italia
      { id: 78, name: 'Bundesliga' },            // Liga Jerman
      { id: 61, name: 'Ligue 1' },               // Liga Prancis
      { id: 2, name: 'Champions League' },        // UCL
    ]

    log.push(`Memulai fetch live scores untuk ${leaguesToMonitor.length} liga...`)

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    for (const league of leaguesToMonitor) {
      try {
        // Fetch live matches for this league
        const url = `${FOOTBALL_API_BASE}/fixtures?league=${league.id}&season=2024&date=${today}&timezone=Asia/Jakarta`

        const response = await fetch(url, {
          headers: {
            'x-apisports-key': FOOTBALL_API_KEY,
          },
        })

        if (!response.ok) {
          log.push(`[WARN] Gagal fetch ${league.name}: HTTP ${response.status}`)
          continue
        }

        const data = await response.json()
        const matches: ApiFootballMatch[] = data.response || []

        log.push(`${league.name}: ${matches.length} pertandingan ditemukan`)

        for (const match of matches) {
          totalProcessed++

          const fixture = match.fixture
          const homeTeam = match.teams.home
          const awayTeam = match.teams.away
          const goals = match.goals
          const events = match.events || []

          const homeEvents = extractEvents(events, homeTeam.name)
          const awayEvents = extractEvents(events, awayTeam.name)

          // Determine status
          let status = fixture.status.short
          // Normalize statuses
          if (['1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(status)) {
            status = status === 'HT' ? 'HT' : 'LIVE'
          } else if (status === 'FT' || status === 'AED') {
            status = 'FT'
          } else if (status === 'PST' || status === 'CANC') {
            continue // Skip postponed/cancelled matches
          }

          // Upsert into database
          const { error: upsertError } = await supabase
            .from('live_scores')
            .upsert({
              external_id: fixture.id,
              league_name: league.name,
              league_logo: match.league.logo,
              league_country: match.league.country,
              season: match.league.season,
              home_team: homeTeam.name,
              home_team_logo: homeTeam.logo,
              away_team: awayTeam.name,
              away_team_logo: awayTeam.logo,
              home_score: goals.home ?? 0,
              away_score: goals.away ?? 0,
              status: status,
              minute: fixture.status.elapsed,
              elapsed: fixture.status.elapsed,
              match_date: fixture.date,
              venue: `${fixture.venue?.name || ''}, ${fixture.venue?.city || ''}`.trim(),
              home_events: homeEvents,
              away_events: awayEvents,
              last_updated: new Date().toISOString(),
            }, {
              onConflict: 'external_id',
            })

          if (upsertError) {
            log.push(`[ERROR] Upsert gagal untuk match ${fixture.id}: ${upsertError.message}`)
          } else {
            totalUpdated++
          }
        }

        // Small delay between league requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (leagueError) {
        log.push(`[ERROR] ${league.name}: ${(leagueError as Error).message}`)
      }
    }

    // Also fetch live matches specifically (for real-time updates)
    try {
      const liveUrl = `${FOOTBALL_API_BASE}/fixtures?live=all`
      const liveResponse = await fetch(liveUrl, {
        headers: { 'x-apisports-key': FOOTBALL_API_KEY },
      })

      if (liveResponse.ok) {
        const liveData = await liveResponse.json()
        const liveMatches: ApiFootballMatch[] = liveData.response || []

        for (const match of liveMatches) {
          const homeEvents = extractEvents(match.events || [], match.teams.home.name)
          const awayEvents = extractEvents(match.events || [], match.teams.away.name)

          const { error } = await supabase
            .from('live_scores')
            .upsert({
              external_id: match.fixture.id,
              league_name: match.league.name,
              league_logo: match.league.logo,
              league_country: match.league.country,
              season: match.league.season,
              home_team: match.teams.home.name,
              home_team_logo: match.teams.home.logo,
              away_team: match.teams.away.name,
              away_team_logo: match.teams.away.logo,
              home_score: match.goals.home ?? 0,
              away_score: match.goals.away ?? 0,
              status: 'LIVE',
              minute: match.fixture.status.elapsed,
              elapsed: match.fixture.status.elapsed,
              match_date: match.fixture.date,
              venue: `${match.fixture.venue?.name || ''}, ${match.fixture.venue?.city || ''}`.trim(),
              home_events: homeEvents,
              away_events: awayEvents,
              last_updated: new Date().toISOString(),
            }, { onConflict: 'external_id' })

          if (!error) totalUpdated++
        }
        log.push(`Live matches update: ${liveMatches.length} pertandingan sedang berlangsung`)
      }
    } catch (liveError) {
      log.push(`[WARN] Live fetch error: ${(liveError as Error).message}`)
    }

    // Clean up old matches (older than 24 hours)
    const { error: cleanupError } = await supabase
      .from('live_scores')
      .delete()
      .lt('match_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (!cleanupError) {
      log.push('Old matches cleaned up (older than 24 hours)')
    }

    const elapsed = Date.now() - startTime

    return new Response(JSON.stringify({
      success: true,
      message: 'Live scores updated successfully',
      stats: {
        leagues_monitored: leaguesToMonitor.length,
        total_processed: totalProcessed,
        total_updated: totalUpdated,
        elapsed_ms: elapsed,
      },
      logs: log,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    const elapsed = Date.now() - startTime
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
      stats: { total_processed: totalProcessed, total_updated: totalUpdated, elapsed_ms: elapsed },
      logs: log,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
