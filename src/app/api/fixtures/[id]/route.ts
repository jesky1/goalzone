import { NextResponse } from 'next/server'

export const revalidate = 60

const API_KEY = process.env.FOOTBALL_API_KEY || process.env.NEXT_PUBLIC_FOOTBALL_API_KEY
const API_BASE = 'https://v3.football.api-sports.io'

interface Player {
  id: number
  name: string
  number: number
  position: string
  grid: string | null
  rating: number | null
  photo: string
  events: {
    type: string
    detail: string
    time: number
  }[]
}

interface Coach {
  id: number
  name: string
  photo: string
}

interface TeamLineup {
  team: {
    id: number
    name: string
    logo: string
  }
  coach: Coach
  formation: string
  startXI: Player[]
  substitutes: Player[]
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const fixtureId = id

  if (!API_KEY) {
    return NextResponse.json({
      success: false,
      error: 'Fixture not found',
      source: 'none',
      message: 'Set FOOTBALL_API_KEY for real match details',
    })
  }

  try {
    const response = await fetch(`${API_BASE}/fixtures?id=${fixtureId}`, {
      headers: { 'x-apisports-key': API_KEY },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      throw new Error(`API-Football error: ${response.status}`)
    }

    const data = await response.json()
    const fixture = data.response?.[0]

    if (!fixture) {
      return NextResponse.json({
        success: false,
        error: 'Fixture not found',
        source: 'none',
      }, { status: 404 })
    }

    const homeLineup = parseLineup(fixture.lineups?.[0], fixture.events || [], fixture.teams.home.id)
    const awayLineup = parseLineup(fixture.lineups?.[1], fixture.events || [], fixture.teams.away.id)

    return NextResponse.json({
      fixture: {
        id: fixture.fixture.id,
        date: fixture.fixture.date,
        status: fixture.fixture.status.short,
        elapsed: fixture.fixture.status.elapsed,
        referee: fixture.fixture.referee,
        venue: fixture.fixture.venue?.name,
        venueCity: fixture.fixture.venue?.city,
        venueCapacity: fixture.fixture.venue?.capacity,
        venueId: fixture.fixture.venue?.id,
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        homeLogo: fixture.teams.home.logo,
        awayLogo: fixture.teams.away.logo,
        homeScore: fixture.goals.home,
        awayScore: fixture.goals.away,
        homeWinner: fixture.teams.home.winner,
        awayWinner: fixture.teams.away.winner,
        league: {
          name: fixture.league.name,
          country: fixture.league.country,
          logo: fixture.league.logo,
          round: fixture.league.round,
        },
        homeEvents: extractMatchEvents(fixture.events || [], fixture.teams.home.id),
        awayEvents: extractMatchEvents(fixture.events || [], fixture.teams.away.id),
        homeStatistics: fixture.statistics?.filter((s: any) => s.team.id === fixture.teams.home.id) || [],
        awayStatistics: fixture.statistics?.filter((s: any) => s.team.id === fixture.teams.away.id) || [],
      },
      homeLineup,
      awayLineup,
      source: 'api-football',
    })
  } catch (error) {
    console.error('Error fetching fixture detail:', error)
    return NextResponse.json({
      success: false,
      error: 'Fixture not found',
      source: 'none',
    })
  }
}

function parseLineup(lineup: any, events: any[], teamId: number): TeamLineup {
  if (!lineup) {
    return {
      team: { id: 0, name: 'Unknown', logo: '' },
      coach: { id: 0, name: 'Unknown', photo: '' },
      formation: '4-3-3',
      startXI: [],
      substitutes: [],
    }
  }

  const teamEvents = events.filter((e: any) => e.team.id === teamId)

  const parsePlayer = (p: any, isStarter: boolean): Player => {
    const playerEvents: any[] = teamEvents.filter(
      (e: any) => e.player?.id === p.player?.id
    )

    const playerId = p.player?.id || 0
    // Use API-Football photo if provided, otherwise construct CDN URL from player ID
    const rawPhoto = p.player?.photo || ''
    const photo = rawPhoto && rawPhoto.length > 5
      ? rawPhoto
      : playerId > 0
        ? `https://media.api-sports.io/football/players/${playerId}.png`
        : ''

    return {
      id: playerId,
      name: p.player?.name || 'Unknown',
      number: p.player?.number || 0,
      position: p.player?.pos || (isStarter ? 'N/A' : 'SUB'),
      grid: p.player?.grid || null,
      rating: p.player?.rating ? parseFloat(p.player.rating) : null,
      photo,
      events: playerEvents.map((e: any) => ({
        type: e.type,
        detail: e.detail,
        time: e.time?.elapsed || 0,
      })),
    }
  }

  return {
    team: {
      id: lineup.team?.id || 0,
      name: lineup.team?.name || '',
      logo: lineup.team?.logo || '',
    },
    coach: {
      id: lineup.coach?.id || 0,
      name: lineup.coach?.name || '',
      photo: lineup.coach?.photo || '',
    },
    formation: lineup.formation || '4-3-3',
    startXI: (lineup.startXI || []).map((p: any) => parsePlayer(p, true)),
    substitutes: (lineup.substitutes || []).map((p: any) => parsePlayer(p, false)),
  }
}

function extractMatchEvents(events: any[], teamId: number) {
  return events
    .filter((e: any) => e.team.id === teamId && (e.type === 'goal' || e.type === 'card'))
    .map((e: any) => {
      const playerId = e.player?.id || 0
      const rawPhoto = e.player?.photo || ''
      const photo = rawPhoto && rawPhoto.length > 5
        ? rawPhoto
        : playerId > 0
          ? `https://media.api-sports.io/football/players/${playerId}.png`
          : ''
      return {
        type: e.type,
        minute: e.time?.elapsed || 0,
        player: e.player?.name || '',
        playerId,
        playerPhoto: photo,
        detail: e.detail || '',
        card: e.cards?.[0]?.color || null,
      }
    })
}
