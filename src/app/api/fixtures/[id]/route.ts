import { NextResponse } from 'next/server'
import { footballFetch, isFootballApiConfigured } from '@/lib/football'

export const revalidate = 60

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

  if (!isFootballApiConfigured) {
    return NextResponse.json(getMockFixtureDetail(fixtureId))
  }

  try {
    const response = await footballFetch(`/fixtures?id=${fixtureId}`, {
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      throw new Error(`API-Football error: ${response.status}`)
    }

    const data = await response.json()
    const fixture = data.response?.[0]

    if (!fixture) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
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
    return NextResponse.json(getMockFixtureDetail(fixtureId))
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

    return {
      id: p.player?.id || 0,
      name: p.player?.name || 'Unknown',
      number: p.player?.number || 0,
      position: p.player?.pos || (isStarter ? 'N/A' : 'SUB'),
      grid: p.player?.grid || null,
      rating: p.player?.rating ? parseFloat(p.player.rating) : null,
      photo: p.player?.photo || '',
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
    .map((e: any) => ({
      type: e.type,
      minute: e.time?.elapsed || 0,
      player: e.player?.name || '',
      detail: e.detail || '',
      card: e.cards?.[0]?.color || null,
    }))
}

function getMockFixtureDetail(id: string) {
  const pp = (pid: number) => `https://media.api-sports.io/football/players/${pid}.png`

  return {
    fixture: {
      id: parseInt(id) || 0,
      date: new Date().toISOString(),
      status: 'LIVE',
      elapsed: 67,
      referee: 'Michael Oliver',
      venue: 'Emirates Stadium',
      venueCity: 'London',
      venueCapacity: 60704,
      venueId: 555,
      homeTeam: 'Arsenal',
      awayTeam: 'Manchester City',
      homeLogo: 'https://media.api-sports.io/football/teams/42.png',
      awayLogo: 'https://media.api-sports.io/football/teams/50.png',
      homeScore: 2,
      awayScore: 1,
      homeWinner: true,
      awayWinner: false,
      league: {
        name: 'Premier League',
        country: 'England',
        logo: 'https://media.api-sports.io/football/leagues/39.png',
        round: 'Regular Season - 28',
      },
      homeEvents: [
        { type: 'goal', minute: 12, player: 'B. Saka', detail: 'Normal Goal', card: null },
        { type: 'goal', minute: 45, player: 'K. Havertz', detail: 'Normal Goal', card: null },
        { type: 'card', minute: 34, player: 'M. Rice', detail: 'Yellow Card', card: 'yellow' },
      ],
      awayEvents: [
        { type: 'goal', minute: 38, player: 'E. Haaland', detail: 'Normal Goal', card: null },
      ],
      homeStatistics: [
        { type: 'Total Shots', value: 14 },
        { type: 'Shots on Goal', value: 6 },
        { type: 'Ball Possession', value: '52%' },
        { type: 'Corners', value: 5 },
        { type: 'Fouls', value: 9 },
      ],
      awayStatistics: [
        { type: 'Total Shots', value: 11 },
        { type: 'Shots on Goal', value: 3 },
        { type: 'Ball Possession', value: '48%' },
        { type: 'Corners', value: 7 },
        { type: 'Fouls', value: 12 },
      ],
    },
    homeLineup: {
      team: { id: 42, name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
      coach: { id: 1, name: 'Mikel Arteta', photo: 'https://media.api-sports.io/football/coachs/1.png' },
      formation: '4-3-3',
      startXI: [
        { id: 154, name: 'D. Raya', number: 22, position: 'G', grid: '1:1', rating: 7.2, photo: pp(154), events: [] },
        { id: 514, name: 'B. White', number: 4, position: 'D', grid: '2:1', rating: 7.0, photo: pp(514), events: [] },
        { id: 2930, name: 'G. Saliba', number: 2, position: 'D', grid: '2:2', rating: 7.5, photo: pp(2930), events: [] },
        { id: 2932, name: 'W. Saliba', number: 6, position: 'D', grid: '2:3', rating: 7.3, photo: pp(2932), events: [] },
        { id: 883, name: 'O. Zinchenko', number: 35, position: 'D', grid: '2:4', rating: 6.8, photo: pp(883), events: [] },
        { id: 289, name: 'M. Rice', number: 41, position: 'M', grid: '3:2', rating: 7.6, photo: pp(289), events: [{ type: 'card', detail: 'Yellow Card', time: 34 }] },
        { id: 882, name: 'M. Ødegaard', number: 8, position: 'M', grid: '3:3', rating: 8.1, photo: pp(882), events: [] },
        { id: 475, name: 'T. Partey', number: 5, position: 'M', grid: '3:1', rating: 6.9, photo: pp(475), events: [] },
        { id: 873, name: 'B. Saka', number: 7, position: 'F', grid: '4:1', rating: 8.5, photo: pp(873), events: [{ type: 'goal', detail: 'Normal Goal', time: 12 }] },
        { id: 860, name: 'K. Havertz', number: 29, position: 'F', grid: '4:2', rating: 7.8, photo: pp(860), events: [{ type: 'goal', detail: 'Normal Goal', time: 45 }] },
        { id: 874, name: 'G. Martinelli', number: 11, position: 'F', grid: '4:3', rating: 6.7, photo: pp(874), events: [] },
      ],
      substitutes: [
        { id: 884, name: 'L. Trossard', number: 19, position: 'SUB', grid: null, rating: 7.0, photo: pp(884), events: [] },
        { id: 19310, name: 'E. Nwaneri', number: 53, position: 'SUB', grid: null, rating: 6.5, photo: pp(19310), events: [] },
      ],
    },
    awayLineup: {
      team: { id: 50, name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' },
      coach: { id: 2, name: 'Pep Guardiola', photo: 'https://media.api-sports.io/football/coachs/2.png' },
      formation: '4-3-3',
      startXI: [
        { id: 694, name: 'E. Ederson', number: 31, position: 'G', grid: '1:1', rating: 6.5, photo: pp(694), events: [] },
        { id: 300, name: 'K. Walker', number: 2, position: 'D', grid: '2:1', rating: 6.3, photo: pp(300), events: [] },
        { id: 302, name: 'R. Dias', number: 3, position: 'D', grid: '2:2', rating: 6.8, photo: pp(302), events: [] },
        { id: 20919, name: 'M. Akanji', number: 25, position: 'D', grid: '2:3', rating: 6.6, photo: pp(20919), events: [] },
        { id: 862, name: 'N. Aké', number: 6, position: 'D', grid: '2:4', rating: 6.4, photo: pp(862), events: [] },
        { id: 92, name: 'R. De Bruyne', number: 17, position: 'M', grid: '3:2', rating: 7.2, photo: pp(92), events: [] },
        { id: 866, name: 'B. Silva', number: 20, position: 'M', grid: '3:3', rating: 7.0, photo: pp(866), events: [] },
        { id: 47731, name: 'R. Lewis', number: 82, position: 'M', grid: '3:1', rating: 6.5, photo: pp(47731), events: [] },
        { id: 304, name: 'P. Foden', number: 47, position: 'F', grid: '4:2', rating: 6.9, photo: pp(304), events: [] },
        { id: 469, name: 'M. Grealish', number: 10, position: 'F', grid: '4:1', rating: 6.7, photo: pp(469), events: [] },
        { id: 882, name: 'E. Haaland', number: 9, position: 'F', grid: '4:3', rating: 7.9, photo: pp(882), events: [{ type: 'goal', detail: 'Normal Goal', time: 38 }] },
      ],
      substitutes: [
        { id: 284682, name: 'J. Doku', number: 11, position: 'SUB', grid: null, rating: 6.2, photo: pp(284682), events: [] },
        { id: 9282, name: 'O. Bobb', number: 52, position: 'SUB', grid: null, rating: 6.0, photo: pp(9282), events: [] },
      ],
    },
    source: 'mock',
    message: 'Set FOOTBALL_API_KEY for real match details',
  }
}
