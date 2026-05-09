import { NextResponse } from 'next/server'
import { footballFetch, isFootballApiConfigured } from '@/lib/football-api'

export const revalidate = 300 // Cache 5 minutes

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

// Supported leagues with API-Football IDs and seasons
const LEAGUES: Record<string, LeagueInfo> = {
  'premier-league': { id: 39, name: 'Premier League', season: 2026 },
  'la-liga': { id: 140, name: 'La Liga', season: 2026 },
  'serie-a': { id: 135, name: 'Serie A', season: 2026 },
  'bundesliga': { id: 78, name: 'Bundesliga', season: 2026 },
  'ligue-1': { id: 61, name: 'Ligue 1', season: 2026 },
  'champions-league': { id: 2, name: 'Champions League', season: 2026 },
  'europa-league': { id: 3, name: 'Europa League', season: 2026 },
  'eredivisie': { id: 88, name: 'Eredivisie', season: 2026 },
  'primeira-liga': { id: 94, name: 'Primeira Liga', season: 2026 },
  'belgian-pro-league': { id: 144, name: 'Belgian Pro League', season: 2026 },
  'scottish-premiership': { id: 179, name: 'Scottish Premiership', season: 2026 },
  'turkish-super-lig': { id: 203, name: 'Süper Lig', season: 2026 },
  'mls': { id: 253, name: 'Major League Soccer', season: 2025 },
  'liga-mx': { id: 262, name: 'Liga MX', season: 2025 },
  'brasileirao': { id: 71, name: 'Brasileirão Série A', season: 2025 },
  'argentine-primera': { id: 128, name: 'Argentine Primera División', season: 2025 },
  'saudi-pro-league': { id: 307, name: 'Saudi Pro League', season: 2025 },
  'k-league': { id: 292, name: 'K League 1', season: 2025 },
  'j-league': { id: 98, name: 'J1 League', season: 2025 },
}

const availableLeagues = Object.entries(LEAGUES).map(([slug, info]) => ({
  slug,
  name: info.name,
  logo: `https://media.api-sports.io/football/leagues/${info.id}.png`,
}))

function getMockTopScorers(): TopScorer[] {
  return [
    { rank: 1, name: 'Mohamed Salah', photo: 'https://media.api-sports.io/football/players/306.png', team: 'Liverpool', teamLogo: 'https://media.api-sports.io/football/teams/40.png', goals: 22, assists: 14, minutesPlayed: 2430 },
    { rank: 2, name: 'Erling Haaland', photo: 'https://media.api-sports.io/football/players/882.png', team: 'Manchester City', teamLogo: 'https://media.api-sports.io/football/teams/50.png', goals: 21, assists: 5, minutesPlayed: 2250 },
    { rank: 3, name: 'Alexander Isak', photo: 'https://media.api-sports.io/football/players/524.png', team: 'Newcastle United', teamLogo: 'https://media.api-sports.io/football/teams/34.png', goals: 18, assists: 4, minutesPlayed: 2190 },
    { rank: 4, name: 'Bukayo Saka', photo: 'https://media.api-sports.io/football/players/519.png', team: 'Arsenal', teamLogo: 'https://media.api-sports.io/football/teams/42.png', goals: 16, assists: 11, minutesPlayed: 2310 },
    { rank: 5, name: 'Bryan Mbeumo', photo: 'https://media.api-sports.io/football/players/620.png', team: 'Brentford', teamLogo: 'https://media.api-sports.io/football/teams/55.png', goals: 15, assists: 3, minutesPlayed: 2340 },
    { rank: 6, name: 'Cole Palmer', photo: 'https://media.api-sports.io/football/players/624.png', team: 'Chelsea', teamLogo: 'https://media.api-sports.io/football/teams/49.png', goals: 15, assists: 6, minutesPlayed: 2160 },
    { rank: 7, name: 'Chris Wood', photo: 'https://media.api-sports.io/football/players/516.png', team: 'Nottingham Forest', teamLogo: 'https://media.api-sports.io/football/teams/65.png', goals: 14, assists: 3, minutesPlayed: 2280 },
    { rank: 8, name: 'Kai Havertz', photo: 'https://media.api-sports.io/football/players/506.png', team: 'Arsenal', teamLogo: 'https://media.api-sports.io/football/teams/42.png', goals: 13, assists: 5, minutesPlayed: 2100 },
    { rank: 9, name: 'Matheus Cunha', photo: 'https://media.api-sports.io/football/players/741.png', team: 'Wolverhampton', teamLogo: 'https://media.api-sports.io/football/teams/76.png', goals: 12, assists: 7, minutesPlayed: 2220 },
    { rank: 10, name: 'Dominic Solanke', photo: 'https://media.api-sports.io/football/players/533.png', team: 'Tottenham', teamLogo: 'https://media.api-sports.io/football/teams/47.png', goals: 12, assists: 4, minutesPlayed: 2070 },
  ]
}

async function fetchTopScorers(leagueInfo: LeagueInfo): Promise<{ topScorers: TopScorer[]; seasonLabel: string } | null> {
  const response = await footballFetch(
    `/players/topscorers?league=${leagueInfo.id}&season=${leagueInfo.season}`,
    { next: { revalidate: 300 } }
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

  // If no API key, fallback to mock
  if (!isFootballApiConfigured) {
    return NextResponse.json(
      buildResponse('Premier League', getMockTopScorers(), 'mock', {
        season: '2026/27',
        message: 'Set FOOTBALL_API_KEY in Vercel Environment Variables for real top scorers',
      })
    )
  }

  try {
    const leagueInfo = LEAGUES[league] || LEAGUES['premier-league']

    // Try configured season first (2026), then fall back to 2025, then 2024
    let result = await fetchTopScorers(leagueInfo)
    let usedFallback = false
    let fallbackSeason = ''

    if (!result && leagueInfo.season === 2026) {
      console.log(`No top scorers data for ${leagueInfo.name} season 2026, falling back to 2025...`)
      const fallbackInfo: LeagueInfo = { ...leagueInfo, season: 2025 }
      result = await fetchTopScorers(fallbackInfo)
      usedFallback = result !== null
      fallbackSeason = '2025/26'
    }
    if (!result && leagueInfo.season === 2026) {
      console.log(`No top scorers data for ${leagueInfo.name} season 2025, falling back to 2024...`)
      const fallbackInfo: LeagueInfo = { ...leagueInfo, season: 2024 }
      result = await fetchTopScorers(fallbackInfo)
      usedFallback = result !== null
      fallbackSeason = '2024/25'
    }

    if (result) {
      return NextResponse.json(
        buildResponse(leagueInfo.name, result.topScorers, 'api-football', {
          season: result.seasonLabel,
          ...(usedFallback ? { fallback: true, fallbackSeason } : {}),
        })
      )
    }

    // No data for either season, return mock
    return NextResponse.json(
      buildResponse(leagueInfo.name, getMockTopScorers(), 'mock', {
        season: '2026/27',
        error: 'No top scorers data available for this league',
      })
    )
  } catch (error) {
    console.error('Error fetching top scorers from API-Football:', error)
    return NextResponse.json(
      buildResponse('Premier League', getMockTopScorers(), 'mock', {
        season: '2026/27',
        error: 'API fetch failed, showing sample data',
      })
    )
  }
}
