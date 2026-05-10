import { NextResponse } from 'next/server'
import { footballFetch, isFootballApiConfigured } from '@/lib/football-api'

export const revalidate = 300 // Cache 5 minutes

interface StandingEntry {
  position: number
  team: string
  teamLogo: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  form: ('W' | 'D' | 'L')[]
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

function getMockStandings(): StandingEntry[] {
  return [
    { position: 1, team: 'Liverpool', teamLogo: 'https://media.api-sports.io/football/teams/40.png', played: 28, won: 20, drawn: 5, lost: 3, goalsFor: 62, goalsAgainst: 24, goalDiff: 38, points: 65, form: ['W', 'W', 'D', 'W', 'L'] },
    { position: 2, team: 'Arsenal', teamLogo: 'https://media.api-sports.io/football/teams/42.png', played: 28, won: 19, drawn: 6, lost: 3, goalsFor: 58, goalsAgainst: 22, goalDiff: 36, points: 63, form: ['W', 'L', 'W', 'W', 'D'] },
    { position: 3, team: 'Manchester City', teamLogo: 'https://media.api-sports.io/football/teams/50.png', played: 27, won: 18, drawn: 5, lost: 4, goalsFor: 55, goalsAgainst: 28, goalDiff: 27, points: 59, form: ['L', 'W', 'W', 'D', 'W'] },
    { position: 4, team: 'Nottingham Forest', teamLogo: 'https://media.api-sports.io/football/teams/65.png', played: 28, won: 17, drawn: 5, lost: 6, goalsFor: 46, goalsAgainst: 30, goalDiff: 16, points: 56, form: ['W', 'D', 'W', 'W', 'W'] },
    { position: 5, team: 'Chelsea', teamLogo: 'https://media.api-sports.io/football/teams/49.png', played: 28, won: 16, drawn: 6, lost: 6, goalsFor: 52, goalsAgainst: 31, goalDiff: 21, points: 54, form: ['D', 'W', 'L', 'W', 'W'] },
    { position: 6, team: 'Aston Villa', teamLogo: 'https://media.api-sports.io/football/teams/66.png', played: 28, won: 15, drawn: 6, lost: 7, goalsFor: 44, goalsAgainst: 34, goalDiff: 10, points: 51, form: ['W', 'W', 'D', 'L', 'W'] },
    { position: 7, team: 'Newcastle United', teamLogo: 'https://media.api-sports.io/football/teams/34.png', played: 28, won: 14, drawn: 6, lost: 8, goalsFor: 42, goalsAgainst: 29, goalDiff: 13, points: 48, form: ['L', 'W', 'D', 'W', 'L'] },
    { position: 8, team: 'Bournemouth', teamLogo: 'https://media.api-sports.io/football/teams/35.png', played: 28, won: 14, drawn: 5, lost: 9, goalsFor: 40, goalsAgainst: 35, goalDiff: 5, points: 47, form: ['W', 'L', 'W', 'W', 'D'] },
    { position: 9, team: 'Brighton & Hove Albion', teamLogo: 'https://media.api-sports.io/football/teams/51.png', played: 28, won: 12, drawn: 8, lost: 8, goalsFor: 44, goalsAgainst: 38, goalDiff: 6, points: 44, form: ['D', 'D', 'W', 'L', 'W'] },
    { position: 10, team: 'Manchester United', teamLogo: 'https://media.api-sports.io/football/teams/33.png', played: 28, won: 12, drawn: 5, lost: 11, goalsFor: 36, goalsAgainst: 38, goalDiff: -2, points: 41, form: ['L', 'W', 'L', 'D', 'W'] },
    { position: 11, team: 'Fulham', teamLogo: 'https://media.api-sports.io/football/teams/36.png', played: 28, won: 10, drawn: 8, lost: 10, goalsFor: 40, goalsAgainst: 42, goalDiff: -2, points: 38, form: ['D', 'L', 'D', 'W', 'L'] },
    { position: 12, team: 'Tottenham', teamLogo: 'https://media.api-sports.io/football/teams/47.png', played: 28, won: 10, drawn: 4, lost: 14, goalsFor: 52, goalsAgainst: 48, goalDiff: 4, points: 34, form: ['L', 'L', 'W', 'D', 'L'] },
    { position: 13, team: 'West Ham United', teamLogo: 'https://media.api-sports.io/football/teams/48.png', played: 28, won: 9, drawn: 6, lost: 13, goalsFor: 34, goalsAgainst: 45, goalDiff: -11, points: 33, form: ['L', 'D', 'L', 'W', 'D'] },
    { position: 14, team: 'Crystal Palace', teamLogo: 'https://media.api-sports.io/football/teams/52.png', played: 28, won: 8, drawn: 8, lost: 12, goalsFor: 30, goalsAgainst: 38, goalDiff: -8, points: 32, form: ['W', 'D', 'L', 'L', 'D'] },
    { position: 15, team: 'Brentford', teamLogo: 'https://media.api-sports.io/football/teams/55.png'.replace('.png', '.png'), played: 28, won: 8, drawn: 7, lost: 13, goalsFor: 38, goalsAgainst: 46, goalDiff: -8, points: 31, form: ['D', 'L', 'W', 'L', 'W'] },
    { position: 16, team: 'Everton', teamLogo: 'https://media.api-sports.io/football/teams/45.png', played: 28, won: 7, drawn: 8, lost: 13, goalsFor: 26, goalsAgainst: 40, goalDiff: -14, points: 29, form: ['D', 'L', 'D', 'L', 'D'] },
    { position: 17, team: 'Wolverhampton', teamLogo: 'https://media.api-sports.io/football/teams/76.png', played: 28, won: 7, drawn: 6, lost: 15, goalsFor: 33, goalsAgainst: 50, goalDiff: -17, points: 27, form: ['L', 'L', 'W', 'D', 'L'] },
    { position: 18, team: 'Leicester City', teamLogo: 'https://media.api-sports.io/football/teams/46.png', played: 28, won: 5, drawn: 7, lost: 16, goalsFor: 25, goalsAgainst: 53, goalDiff: -28, points: 22, form: ['L', 'D', 'L', 'L', 'W'] },
    { position: 19, team: 'Ipswich Town', teamLogo: 'https://media.api-sports.io/football/teams/62.png', played: 28, won: 4, drawn: 8, lost: 16, goalsFor: 24, goalsAgainst: 52, goalDiff: -28, points: 20, form: ['L', 'D', 'L', 'L', 'D'] },
    { position: 20, team: 'Southampton', teamLogo: 'https://media.api-sports.io/football/teams/41.png', played: 28, won: 3, drawn: 5, lost: 20, goalsFor: 19, goalsAgainst: 55, goalDiff: -36, points: 14, form: ['L', 'L', 'D', 'L', 'L'] },
  ]
}

async function fetchStandings(leagueInfo: LeagueInfo): Promise<{ standings: StandingEntry[]; seasonLabel: string } | null> {
  const response = await footballFetch(
    `/standings?league=${leagueInfo.id}&season=${leagueInfo.season}`,
    { next: { revalidate: 300 } }
  )

  if (!response.ok) {
    throw new Error(`API-Football error: ${response.status}`)
  }

  const data = await response.json()
  const leagueData = data.response?.[0]

  if (!leagueData?.league?.standings?.[0] || leagueData.league.standings[0].length === 0) {
    return null
  }

  const standings: StandingEntry[] = leagueData.league.standings[0].map((s: any) => ({
    position: s.rank,
    team: s.team.name,
    teamLogo: s.team.logo,
    played: s.all.played,
    won: s.all.win,
    drawn: s.all.draw,
    lost: s.all.lose,
    goalsFor: s.all.goals.for,
    goalsAgainst: s.all.goals.against,
    goalDiff: s.goalsDiff,
    points: s.points,
    form: (s.form || '').split('').filter((c: string) => c === 'W' || c === 'D' || c === 'L').map((c: string) => c as 'W' | 'D' | 'L'),
  }))

  return {
    standings,
    seasonLabel: `${leagueInfo.season}/${leagueInfo.season + 1}`,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const league = searchParams.get('league') || 'premier-league'

  const buildResponse = (leagueName: string, seasonLabel: string, standings: StandingEntry[], source: string, extra?: Record<string, unknown>) => ({
    league: leagueName,
    season: seasonLabel,
    standings,
    source,
    availableLeagues,
    ...extra,
  })

  // If no API key, fallback to mock
  if (!isFootballApiConfigured) {
    return NextResponse.json(
      buildResponse('Premier League', '2026/27', getMockStandings(), 'mock', {
        message: 'Set FOOTBALL_API_KEY in Vercel Environment Variables for real standings',
      })
    )
  }

  try {
    const leagueInfo = LEAGUES[league] || LEAGUES['premier-league']

    // Try configured season first (2026), then fall back to 2025, then 2024
    let result = await fetchStandings(leagueInfo)
    let usedFallback = false
    let fallbackSeason = ''

    if (!result && leagueInfo.season === 2026) {
      console.log(`No standings data for ${leagueInfo.name} season 2026, falling back to 2025...`)
      const fallbackInfo: LeagueInfo = { ...leagueInfo, season: 2025 }
      result = await fetchStandings(fallbackInfo)
      usedFallback = result !== null
      fallbackSeason = '2025/26'
    }
    if (!result && leagueInfo.season === 2026) {
      console.log(`No standings data for ${leagueInfo.name} season 2025, falling back to 2024...`)
      const fallbackInfo: LeagueInfo = { ...leagueInfo, season: 2024 }
      result = await fetchStandings(fallbackInfo)
      usedFallback = result !== null
      fallbackSeason = '2024/25'
    }

    if (result) {
      return NextResponse.json(
        buildResponse(leagueInfo.name, result.seasonLabel, result.standings, 'api-football', {
          ...(usedFallback ? { fallback: true, fallbackSeason } : {}),
        })
      )
    }

    // No data for either season, return mock
    return NextResponse.json(
      buildResponse(leagueInfo.name, '2026/27', getMockStandings(), 'mock', {
        error: 'No standings data available for this league',
      })
    )
  } catch (error) {
    console.error('Error fetching standings from API-Football:', error)
    return NextResponse.json(
      buildResponse('Premier League', '2026/27', getMockStandings(), 'mock', {
        error: 'API fetch failed, showing sample data',
      })
    )
  }
}
