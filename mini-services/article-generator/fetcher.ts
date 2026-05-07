// ============================================================
// GOALZONE Article Generator — Step 1: Data Fetcher
// ============================================================
// Fetches finished matches from API-Football v3
// ============================================================

import { config } from './config.js'

// ============================================================
// Types
// ============================================================

export interface FinishedMatch {
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
}

export interface Scorer {
  player: string
  team: 'home' | 'away'
  minute: number
  type: string // 'goal', 'own goal', 'penalty'
  assist?: string
}

export interface TeamStatistics {
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

export interface MatchDetail extends FinishedMatch {
  homeScorers: Scorer[]
  awayScorers: Scorer[]
  homeStats: TeamStatistics
  awayStats: TeamStatistics
  homeWinner: boolean
  awayWinner: boolean
  isDraw: boolean
  // Extra context
  leagueRound?: string
  halfTimeScore?: { home: number; away: number }
}

// ============================================================
// API-Football Request Helper
// ============================================================

async function footballApi(endpoint: string): Promise<any> {
  const url = `${config.footballApiBase}${endpoint}`
  const response = await fetch(url, {
    headers: { 'x-apisports-key': config.footballApiKey },
  })

  if (!response.ok) {
    throw new Error(`API-Football error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

// ============================================================
// Fetch Finished Matches (list)
// ============================================================

export async function fetchFinishedMatches(
  leagueIds: number[],
  lookbackHours: number
): Promise<FinishedMatch[]> {
  const date = new Date()
  const from = new Date(date.getTime() - lookbackHours * 60 * 60 * 1000)
  const to = new Date(date.getTime() + 60 * 60 * 1000) // 1hr ahead for timezone

  const fromStr = from.toISOString().split('T')[0]
  const toStr = to.toISOString().split('T')[0]

  const allMatches: FinishedMatch[] = []

  // Fetch matches for each league (API-Football allows 1 league per request)
  for (const leagueId of leagueIds) {
    try {
      const data = await footballApi(
        `/fixtures?league=${leagueId}&season=${date.getFullYear()}&from=${fromStr}&to=${toStr}&status=FT`
      )

      const matches = data.response || []
      for (const m of matches) {
        allMatches.push({
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
        })
      }

      // Rate limit: small delay between league requests
      await new Promise(r => setTimeout(r, 300))

    } catch (err: any) {
      console.warn(`   ⚠️  Failed to fetch league ${leagueId}: ${err.message}`)
    }
  }

  // Sort by date (most recent first)
  allMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return allMatches
}

// ============================================================
// Fetch Full Match Details (by fixture ID)
// ============================================================

export async function fetchMatchDetails(fixtureId: number): Promise<MatchDetail> {
  const data = await footballApi(`/fixtures?id=${fixtureId}`)
  const match = data.response?.[0]

  if (!match) {
    throw new Error(`Match ${fixtureId} not found`)
  }

  // Parse goal scorers
  const parseScorers = (events: any[], teamId: number, side: 'home' | 'away'): Scorer[] => {
    return events
      .filter((e: any) => e.type === 'goal' && e.team.id === teamId)
      .map((e: any) => ({
        player: e.player?.name || 'Unknown',
        team: side,
        minute: e.time?.elapsed || 0,
        type: e.detail?.includes('Penalty') ? 'penalty'
          : e.detail?.includes('Own') ? 'own goal'
          : 'goal',
        assist: e.assist?.name || undefined,
      }))
  }

  // Parse team statistics
  const parseTeamStats = (stats: any[], teamId: number): TeamStatistics => {
    const teamStats = stats.find((s: any) => s.team.id === teamId)
    if (!teamStats) {
      return {
        team: '',
        possession: 50,
        shots: 0,
        shotsOnGoal: 0,
        corners: 0,
        fouls: 0,
        offsides: 0,
        passes: 0,
        passAccuracy: 0,
      }
    }

    const getVal = (type: string) => {
      const stat = teamStats.statistics.find((s: any) => s.type === type)
      if (!stat) return 0
      // Handle percentage values like "52%"
      const val = stat.value
      if (typeof val === 'string' && val.includes('%')) {
        return parseInt(val, 10)
      }
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

  const events = match.events || []
  const statistics = match.statistics || []

  // Half-time score from events
  let halfTimeScore: { home: number; away: number } | undefined
  const htEvent = events.find((e: any) => e.detail === 'Halftime')
  if (htEvent) {
    const homeGoals = events.filter(
      (e: any) => e.type === 'goal' && e.team.id === match.teams.home.id && (e.time?.elapsed || 0) <= 45
    ).length
    const awayGoals = events.filter(
      (e: any) => e.type === 'goal' && e.team.id === match.teams.away.id && (e.time?.elapsed || 0) <= 45
    ).length
    halfTimeScore = { home: homeGoals, away: awayGoals }
  }

  return {
    fixtureId: match.fixture.id,
    homeTeam: match.teams.home.name,
    awayTeam: match.teams.away.name,
    homeScore: match.goals.home,
    awayScore: match.goals.away,
    homeLogo: match.teams.home.logo,
    awayLogo: match.teams.away.logo,
    league: match.league.name,
    leagueLogo: match.league.logo,
    date: match.fixture.date,
    venue: match.fixture.venue?.name || '',
    venueCity: match.fixture.venue?.city || undefined,
    referee: match.fixture.referee || null,
    homeScorers: parseScorers(events, match.teams.home.id, 'home'),
    awayScorers: parseScorers(events, match.teams.away.id, 'away'),
    homeStats: parseTeamStats(statistics, match.teams.home.id),
    awayStats: parseTeamStats(statistics, match.teams.away.id),
    homeWinner: match.teams.home.winner === true,
    awayWinner: match.teams.away.winner === true,
    isDraw: match.teams.home.winner === null,
    leagueRound: match.league.round,
    halfTimeScore,
  }
}
