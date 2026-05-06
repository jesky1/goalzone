import { NextResponse } from 'next/server'

export const revalidate = 300 // Cache 5 menit

const API_KEY = process.env.FOOTBALL_API_KEY || process.env.NEXT_PUBLIC_FOOTBALL_API_KEY
const API_BASE = 'https://v3.football.api-sports.io'

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

// Liga yang didukung: Premier League (39), La Liga (140), Serie A (135), Bundesliga (78), Ligue 1 (61)
const LEAGUES: Record<string, { id: number; name: string; season: number }> = {
  'premier-league': { id: 39, name: 'Premier League', season: 2024 },
  'la-liga': { id: 140, name: 'La Liga', season: 2024 },
  'serie-a': { id: 135, name: 'Serie A', season: 2024 },
  'bundesliga': { id: 78, name: 'Bundesliga', season: 2024 },
  'ligue-1': { id: 61, name: 'Ligue 1', season: 2024 },
}

function getMockStandings(): StandingEntry[] {
  return [
    { position: 1, team: 'Liverpool', teamLogo: '', played: 28, won: 20, drawn: 5, lost: 3, goalsFor: 62, goalsAgainst: 24, goalDiff: 38, points: 65, form: ['W', 'W', 'D', 'W', 'L'] },
    { position: 2, team: 'Arsenal', teamLogo: '', played: 28, won: 19, drawn: 6, lost: 3, goalsFor: 58, goalsAgainst: 22, goalDiff: 36, points: 63, form: ['W', 'L', 'W', 'W', 'D'] },
    { position: 3, team: 'Manchester City', teamLogo: '', played: 27, won: 18, drawn: 5, lost: 4, goalsFor: 55, goalsAgainst: 28, goalDiff: 27, points: 59, form: ['L', 'W', 'W', 'D', 'W'] },
    { position: 4, team: 'Nottingham Forest', teamLogo: '', played: 28, won: 17, drawn: 5, lost: 6, goalsFor: 46, goalsAgainst: 30, goalDiff: 16, points: 56, form: ['W', 'D', 'W', 'W', 'W'] },
    { position: 5, team: 'Chelsea', teamLogo: '', played: 28, won: 16, drawn: 6, lost: 6, goalsFor: 52, goalsAgainst: 31, goalDiff: 21, points: 54, form: ['D', 'W', 'L', 'W', 'W'] },
    { position: 6, team: 'Aston Villa', teamLogo: '', played: 28, won: 15, drawn: 6, lost: 7, goalsFor: 44, goalsAgainst: 34, goalDiff: 10, points: 51, form: ['W', 'W', 'D', 'L', 'W'] },
    { position: 7, team: 'Newcastle United', teamLogo: '', played: 28, won: 14, drawn: 6, lost: 8, goalsFor: 42, goalsAgainst: 29, goalDiff: 13, points: 48, form: ['L', 'W', 'D', 'W', 'L'] },
    { position: 8, team: 'Bournemouth', teamLogo: '', played: 28, won: 14, drawn: 5, lost: 9, goalsFor: 40, goalsAgainst: 35, goalDiff: 5, points: 47, form: ['W', 'L', 'W', 'W', 'D'] },
    { position: 9, team: 'Brighton & Hove Albion', teamLogo: '', played: 28, won: 12, drawn: 8, lost: 8, goalsFor: 44, goalsAgainst: 38, goalDiff: 6, points: 44, form: ['D', 'D', 'W', 'L', 'W'] },
    { position: 10, team: 'Manchester United', teamLogo: '', played: 28, won: 12, drawn: 5, lost: 11, goalsFor: 36, goalsAgainst: 38, goalDiff: -2, points: 41, form: ['L', 'W', 'L', 'D', 'W'] },
    { position: 11, team: 'Fulham', teamLogo: '', played: 28, won: 10, drawn: 8, lost: 10, goalsFor: 40, goalsAgainst: 42, goalDiff: -2, points: 38, form: ['D', 'L', 'D', 'W', 'L'] },
    { position: 12, team: 'Tottenham', teamLogo: '', played: 28, won: 10, drawn: 4, lost: 14, goalsFor: 52, goalsAgainst: 48, goalDiff: 4, points: 34, form: ['L', 'L', 'W', 'D', 'L'] },
    { position: 13, team: 'West Ham United', teamLogo: '', played: 28, won: 9, drawn: 6, lost: 13, goalsFor: 34, goalsAgainst: 45, goalDiff: -11, points: 33, form: ['L', 'D', 'L', 'W', 'D'] },
    { position: 14, team: 'Crystal Palace', teamLogo: '', played: 28, won: 8, drawn: 8, lost: 12, goalsFor: 30, goalsAgainst: 38, goalDiff: -8, points: 32, form: ['W', 'D', 'L', 'L', 'D'] },
    { position: 15, team: 'Brentford', teamLogo: '', played: 28, won: 8, drawn: 7, lost: 13, goalsFor: 38, goalsAgainst: 46, goalDiff: -8, points: 31, form: ['D', 'L', 'W', 'L', 'W'] },
    { position: 16, team: 'Everton', teamLogo: '', played: 28, won: 7, drawn: 8, lost: 13, goalsFor: 26, goalsAgainst: 40, goalDiff: -14, points: 29, form: ['D', 'L', 'D', 'L', 'D'] },
    { position: 17, team: 'Wolverhampton', teamLogo: '', played: 28, won: 7, drawn: 6, lost: 15, goalsFor: 33, goalsAgainst: 50, goalDiff: -17, points: 27, form: ['L', 'L', 'W', 'D', 'L'] },
    { position: 18, team: 'Leicester City', teamLogo: '', played: 28, won: 5, drawn: 7, lost: 16, goalsFor: 25, goalsAgainst: 53, goalDiff: -28, points: 22, form: ['L', 'D', 'L', 'L', 'W'] },
    { position: 19, team: 'Ipswich Town', teamLogo: '', played: 28, won: 4, drawn: 8, lost: 16, goalsFor: 24, goalsAgainst: 52, goalDiff: -28, points: 20, form: ['L', 'D', 'L', 'L', 'D'] },
    { position: 20, team: 'Southampton', teamLogo: '', played: 28, won: 3, drawn: 5, lost: 20, goalsFor: 19, goalsAgainst: 55, goalDiff: -36, points: 14, form: ['L', 'L', 'D', 'L', 'L'] },
  ]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const league = searchParams.get('league') || 'premier-league'

  // Jika tidak ada API key, fallback ke mock
  if (!API_KEY) {
    return NextResponse.json({
      league: 'Premier League',
      season: '2024/25',
      standings: getMockStandings(),
      source: 'mock',
      message: 'Set FOOTBALL_API_KEY in Vercel Environment Variables for real standings',
    })
  }

  try {
    const leagueInfo = LEAGUES[league] || LEAGUES['premier-league']

    const response = await fetch(
      `${API_BASE}/standings?league=${leagueInfo.id}&season=${leagueInfo.season}`,
      {
        headers: { 'x-apisports-key': API_KEY },
        next: { revalidate: 300 },
      }
    )

    if (!response.ok) {
      throw new Error(`API-Football error: ${response.status}`)
    }

    const data = await response.json()
    const leagueData = data.response?.[0]

    if (!leagueData?.league?.standings?.[0]) {
      throw new Error('No standings data available')
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

    return NextResponse.json({
      league: leagueInfo.name,
      season: `${leagueInfo.season}/${leagueInfo.season + 1}`,
      standings,
      source: 'api-football',
    })
  } catch (error) {
    console.error('Error fetching standings from API-Football:', error)
    return NextResponse.json({
      league: 'Premier League',
      season: '2024/25',
      standings: getMockStandings(),
      source: 'mock',
      error: 'API fetch failed, showing sample data',
    })
  }
}
