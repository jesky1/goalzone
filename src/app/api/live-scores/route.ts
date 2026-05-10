import { NextResponse } from 'next/server'
import { footballFetch, isFootballApiConfigured } from '@/lib/football'

export const revalidate = 60 // Cache 60 detik

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
  // Jika API key belum dikonfigurasi, kembalikan error
  if (!isFootballApiConfigured) {
    return NextResponse.json({
      matches: [],
      source: 'none',
      error: 'FOOTBALL_API_KEY belum dikonfigurasi. Tambahkan FOOTBALL_API_KEY di .env atau Vercel Environment Variables.',
    }, { status: 503 })
  }

  try {
    const today = new Date().toISOString().split('T')[0]

    const response = await footballFetch(
      `/fixtures?date=${today}&timezone=Asia/Jakarta`,
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
    return NextResponse.json({
      matches: [],
      source: 'none',
      error: 'Gagal mengambil data live scores. Coba lagi nanti.',
    }, { status: 500 })
  }
}
