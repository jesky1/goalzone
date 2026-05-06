import { NextResponse } from 'next/server'

export const revalidate = 300 // Cache 5 menit

const API_KEY = process.env.FOOTBALL_API_KEY || process.env.NEXT_PUBLIC_FOOTBALL_API_KEY
const API_BASE = 'https://v3.football.api-sports.io'

interface TopScorer {
  rank: number
  name: string
  team: string
  teamLogo: string
  goals: number
  assists: number
  minutesPlayed: number
}

// Liga yang didukung
const LEAGUES: Record<string, { id: number; name: string; season: number }> = {
  'premier-league': { id: 39, name: 'Premier League', season: 2024 },
  'la-liga': { id: 140, name: 'La Liga', season: 2024 },
  'serie-a': { id: 135, name: 'Serie A', season: 2024 },
  'bundesliga': { id: 78, name: 'Bundesliga', season: 2024 },
  'ligue-1': { id: 61, name: 'Ligue 1', season: 2024 },
  'champions-league': { id: 2, name: 'Champions League', season: 2024 },
}

function getMockTopScorers(): TopScorer[] {
  return [
    { rank: 1, name: 'Mohamed Salah', team: 'Liverpool', teamLogo: '', goals: 22, assists: 14, minutesPlayed: 2430 },
    { rank: 2, name: 'Erling Haaland', team: 'Manchester City', teamLogo: '', goals: 21, assists: 5, minutesPlayed: 2250 },
    { rank: 3, name: 'Alexander Isak', team: 'Newcastle United', teamLogo: '', goals: 18, assists: 4, minutesPlayed: 2190 },
    { rank: 4, name: 'Bukayo Saka', team: 'Arsenal', teamLogo: '', goals: 16, assists: 11, minutesPlayed: 2310 },
    { rank: 5, name: 'Bryan Mbeumo', team: 'Brentford', teamLogo: '', goals: 15, assists: 3, minutesPlayed: 2340 },
    { rank: 6, name: 'Cole Palmer', team: 'Chelsea', teamLogo: '', goals: 15, assists: 6, minutesPlayed: 2160 },
    { rank: 7, name: 'Chris Wood', team: 'Nottingham Forest', teamLogo: '', goals: 14, assists: 3, minutesPlayed: 2280 },
    { rank: 8, name: 'Kai Havertz', team: 'Arsenal', teamLogo: '', goals: 13, assists: 5, minutesPlayed: 2100 },
    { rank: 9, name: 'Matheus Cunha', team: 'Wolverhampton', teamLogo: '', goals: 12, assists: 7, minutesPlayed: 2220 },
    { rank: 10, name: 'Dominic Solanke', team: 'Tottenham', teamLogo: '', goals: 12, assists: 4, minutesPlayed: 2070 },
  ]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const league = searchParams.get('league') || 'premier-league'

  // Jika tidak ada API key, fallback ke mock
  if (!API_KEY) {
    return NextResponse.json({
      topScorers: getMockTopScorers(),
      league: 'Premier League',
      source: 'mock',
      message: 'Set FOOTBALL_API_KEY in Vercel Environment Variables for real top scorers',
    })
  }

  try {
    const leagueInfo = LEAGUES[league] || LEAGUES['premier-league']

    const response = await fetch(
      `${API_BASE}/players/topscorers?league=${leagueInfo.id}&season=${leagueInfo.season}`,
      {
        headers: { 'x-apisports-key': API_KEY },
        next: { revalidate: 300 },
      }
    )

    if (!response.ok) {
      throw new Error(`API-Football error: ${response.status}`)
    }

    const data = await response.json()
    const players: any[] = data.response || []

    const topScorers: TopScorer[] = players.slice(0, 20).map((p: any, idx: number) => ({
      rank: idx + 1,
      name: p.player.name,
      team: p.statistics[0]?.team?.name || '-',
      teamLogo: p.statistics[0]?.team?.logo || '',
      goals: p.statistics[0]?.goals?.total || 0,
      assists: p.statistics[0]?.goals?.assists || 0,
      minutesPlayed: p.statistics[0]?.games?.minutes || 0,
    }))

    return NextResponse.json({
      topScorers,
      league: leagueInfo.name,
      source: 'api-football',
    })
  } catch (error) {
    console.error('Error fetching top scorers from API-Football:', error)
    return NextResponse.json({
      topScorers: getMockTopScorers(),
      league: 'Premier League',
      source: 'mock',
      error: 'API fetch failed, showing sample data',
    })
  }
}
