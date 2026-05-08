import { NextResponse } from 'next/server'

export const revalidate = 300 // Cache 5 minutes

const API_KEY = process.env.FOOTBALL_API_KEY
const API_BASE = 'https://v3.football.api-sports.io'

interface TopScorer {
  rank: number
  name: string
  photo: string
  team: string
  teamLogo: string
  goals: number
  assists: number
  minutesPlayed: number
}

interface LeagueInfo {
  id: number
  name: string
  season: number
}

// Supported leagues: Premier League (39), La Liga (140), Serie A (135), Bundesliga (78), Ligue 1 (61), Champions League (2), Europa League (3)
const LEAGUES: Record<string, LeagueInfo> = {
  'premier-league': { id: 39, name: 'Premier League', season: 2024 },
  'la-liga': { id: 140, name: 'La Liga', season: 2024 },
  'serie-a': { id: 135, name: 'Serie A', season: 2024 },
  'bundesliga': { id: 78, name: 'Bundesliga', season: 2024 },
  'ligue-1': { id: 61, name: 'Ligue 1', season: 2024 },
  'champions-league': { id: 2, name: 'Champions League', season: 2024 },
  'europa-league': { id: 3, name: 'Europa League', season: 2024 },
}

const availableLeagues = Object.entries(LEAGUES).map(([slug, info]) => ({
  slug,
  name: info.name,
  logo: `https://media.api-sports.io/football/leagues/${info.id}.png`,
}))

async function fetchTopScorers(leagueInfo: LeagueInfo): Promise<{ topScorers: TopScorer[]; seasonLabel: string } | null> {
  const response = await fetch(
    `${API_BASE}/players/topscorers?league=${leagueInfo.id}&season=${leagueInfo.season}`,
    {
      headers: { 'x-apisports-key': API_KEY! },
      next: { revalidate: 300 },
    }
  )

  if (!response.ok) {
    throw new Error(`API-Football error: ${response.status}`)
  }

  const data = await response.json()
  const players: any[] = data.response || []

  if (players.length === 0) {
    return null
  }

  const topScorers: TopScorer[] = players.slice(0, 20).map((p: any, idx: number) => ({
    rank: idx + 1,
    name: p.player.name,
    photo: p.player.photo || '',
    team: p.statistics[0]?.team?.name || '-',
    teamLogo: p.statistics[0]?.team?.logo || '',
    goals: p.statistics[0]?.goals?.total || 0,
    assists: p.statistics[0]?.goals?.assists || 0,
    minutesPlayed: p.statistics[0]?.games?.minutes || 0,
  }))

  return {
    topScorers,
    seasonLabel: `${leagueInfo.season}/${leagueInfo.season + 1}`,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const league = searchParams.get('league') || 'premier-league'

  const buildResponse = (leagueName: string, topScorers: TopScorer[], source: string, extra?: Record<string, unknown>) => ({
    topScorers,
    league: leagueName,
    source,
    availableLeagues,
    ...extra,
  })

  // If no API key, return empty
  if (!API_KEY) {
    return NextResponse.json(
      buildResponse('Premier League', [], 'none', {
        season: '',
        message: 'Configure FOOTBALL_API_KEY in environment variables for real top scorers',
      })
    )
  }

  try {
    const leagueInfo = LEAGUES[league] || LEAGUES['premier-league']

    // Try configured season first (2026), then fall back to 2025, then 2024
    let result = await fetchTopScorers(leagueInfo)
    let usedFallback = false
    let fallbackSeason = ''

    if (!result && leagueInfo.season === 2024) {
      console.log(`No top scorers data for ${leagueInfo.name} season 2024, falling back to 2025...`)
      const fallbackInfo: LeagueInfo = { ...leagueInfo, season: 2025 }
      result = await fetchTopScorers(fallbackInfo)
      usedFallback = result !== null
      fallbackSeason = '2025/26'
    }
    if (!result && leagueInfo.season === 2024) {
      console.log(`No top scorers data for ${leagueInfo.name} season 2025, falling back to 2023...`)
      const fallbackInfo: LeagueInfo = { ...leagueInfo, season: 2023 }
      result = await fetchTopScorers(fallbackInfo)
      usedFallback = result !== null
      fallbackSeason = '2023/24'
    }

    if (result) {
      return NextResponse.json(
        buildResponse(leagueInfo.name, result.topScorers, 'api-football', {
          season: result.seasonLabel,
          ...(usedFallback ? { fallback: true, fallbackSeason } : {}),
        })
      )
    }

    // No data for any season, return empty
    return NextResponse.json(
      buildResponse(leagueInfo.name, [], 'none', {
        season: '',
        error: 'No top scorers data available for this league',
      })
    )
  } catch (error) {
    console.error('Error fetching top scorers from API-Football:', error)
    return NextResponse.json(
      buildResponse('Premier League', [], 'none', {
        season: '',
        error: 'API fetch failed',
      })
    )
  }
}
