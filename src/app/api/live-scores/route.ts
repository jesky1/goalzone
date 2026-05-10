import { NextResponse } from 'next/server'
<<<<<<< HEAD
import { footballFetch, isFootballApiConfigured } from '@/lib/football-api'

export const revalidate = 60 // Cache 60 detik


=======
import { footballFetch, isFootballApiConfigured } from '@/lib/football'

export const revalidate = 60 // Cache 60 detik

>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
interface LiveMatchEvent {
  type: 'goal' | 'card'
  minute: number
  player: string
}

interface LiveMatch {
  id: string
  league: string
  leagueLogo: string
  homeTeam: string
  awayTeam: string
  homeLogo: string
  awayLogo: string
  homeScore: number
  awayScore: number
  status: 'LIVE' | 'HT' | 'FT' | 'NS'
  minute: number | null
  homeEvents: LiveMatchEvent[]
  awayEvents: LiveMatchEvent[]
}

// Liga utama yang ditampilkan
const LEAGUE_IDS = [39, 140, 135, 78, 61, 2] // PL, La Liga, Serie A, Bundesliga, Ligue 1, UCL

function mapStatus(status: string): LiveMatch['status'] {
  const s = status.toLowerCase()
  if (s === '1h' || s === '2h' || s === 'et' || s === 'bt' || s === 'p' || s === 'live') return 'LIVE'
  if (s === 'ht') return 'HT'
  if (s === 'ft' || s === 'aft' || s === 'awd' || s === 'wo') return 'FT'
  return 'NS'
}

function extractEvents(events: any[], teamId: number): LiveMatchEvent[] {
  if (!events) return []
  return events
    .filter((e: any) => e.team.id === teamId && (e.type === 'goal' || e.type === 'card'))
    .map((e: any) => ({
      type: e.type === 'goal' ? 'goal' as const : 'card' as const,
      minute: e.time.elapsed,
      player: e.player.name,
    }))
}

export async function GET() {
<<<<<<< HEAD
  // Jika tidak ada API key, fallback ke mock data
  if (!isFootballApiConfigured) {
    const date = new Date().toISOString().split('T')[0]
    return NextResponse.json({
      matches: getMockMatches(),
      source: 'mock',
      message: 'Set FOOTBALL_API_KEY in Vercel Environment Variables for real live scores',
    })
=======
  // Jika API key belum dikonfigurasi, kembalikan error
  if (!isFootballApiConfigured) {
    return NextResponse.json({
      matches: [],
      source: 'none',
      error: 'FOOTBALL_API_KEY belum dikonfigurasi. Tambahkan FOOTBALL_API_KEY di .env atau Vercel Environment Variables.',
    }, { status: 503 })
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
  }

  try {
    const today = new Date().toISOString().split('T')[0]

    const response = await footballFetch(
      `/fixtures?date=${today}&timezone=Asia/Jakarta`,
<<<<<<< HEAD
      {
        next: { revalidate: 60 },
      }
    )

    if (!response.ok) {
=======
      { next: { revalidate: 60 } }
    )

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json({
          matches: [],
          source: 'api-football',
          error: 'Limit API habis. Data sedang diperbarui, coba lagi nanti.',
          rateLimited: true,
        });
      }
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
      throw new Error(`API-Football error: ${response.status}`)
    }

    const data = await response.json()
    const fixtures: any[] = data.response || []

    // Filter hanya liga utama dan match yang sedang berlangsung/hari ini
    const matches: LiveMatch[] = fixtures
      .filter((f: any) => LEAGUE_IDS.includes(f.league.id))
      .map((f: any) => {
        const homeEvents = extractEvents(f.events || [], f.teams.home.id)
        const awayEvents = extractEvents(f.events || [], f.teams.away.id)

        return {
          id: String(f.fixture.id),
          league: f.league.name,
          leagueLogo: f.league.logo || '',
          homeTeam: f.teams.home.name,
          awayTeam: f.teams.away.name,
          homeLogo: f.teams.home.logo || '',
          awayLogo: f.teams.away.logo || '',
          homeScore: f.goals.home ?? 0,
          awayScore: f.goals.away ?? 0,
          status: mapStatus(f.fixture.status.short),
          minute: f.fixture.status.elapsed || null,
          homeEvents,
          awayEvents,
        }
      })

    // Sort: LIVE dulu, lalu NS, lalu FT
    const statusOrder = { LIVE: 0, HT: 1, NS: 2, FT: 3 }
    matches.sort((a, b) => (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4))

    return NextResponse.json({ matches, source: 'api-football' })
  } catch (error) {
    console.error('Error fetching live scores from API-Football:', error)
<<<<<<< HEAD
    // Fallback ke mock data kalau API error
    return NextResponse.json({
      matches: getMockMatches(),
      source: 'mock',
      error: 'API fetch failed, showing sample data',
    })
  }
}

function getMockMatches(): LiveMatch[] {
  return [
    {
      id: 'mock-1', league: 'Premier League', leagueLogo: 'https://media.api-sports.io/football/leagues/39.png',
      homeTeam: 'Arsenal', awayTeam: 'Manchester City',
      homeLogo: 'https://media.api-sports.io/football/teams/42.png',
      awayLogo: 'https://media.api-sports.io/football/teams/50.png',
      homeScore: 2, awayScore: 1, status: 'LIVE', minute: 67,
      homeEvents: [{ type: 'goal', minute: 12, player: 'Saka' }, { type: 'goal', minute: 45, player: 'Havertz' }],
      awayEvents: [{ type: 'goal', minute: 38, player: 'Haaland' }],
    },
    {
      id: 'mock-2', league: 'La Liga', leagueLogo: 'https://media.api-sports.io/football/leagues/140.png',
      homeTeam: 'Real Madrid', awayTeam: 'Barcelona',
      homeLogo: 'https://media.api-sports.io/football/teams/541.png',
      awayLogo: 'https://media.api-sports.io/football/teams/529.png',
      homeScore: 3, awayScore: 2, status: 'HT', minute: 45,
      homeEvents: [{ type: 'goal', minute: 15, player: 'Vinícius Jr.' }, { type: 'goal', minute: 55, player: 'Bellingham' }],
      awayEvents: [{ type: 'goal', minute: 30, player: 'Lewandowski' }],
    },
    {
      id: 'mock-3', league: 'Champions League', leagueLogo: 'https://media.api-sports.io/football/leagues/2.png',
      homeTeam: 'Liverpool', awayTeam: 'Real Madrid',
      homeLogo: 'https://media.api-sports.io/football/teams/40.png',
      awayLogo: 'https://media.api-sports.io/football/teams/541.png',
      homeScore: 0, awayScore: 0, status: 'NS', minute: null,
      homeEvents: [], awayEvents: [],
    },
  ]
}
=======
    return NextResponse.json({
      matches: [],
      source: 'none',
      error: 'Gagal mengambil data live scores. Coba lagi nanti.',
    }, { status: 500 })
  }
}
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
