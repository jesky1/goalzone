import { NextResponse } from 'next/server'
<<<<<<< HEAD
import { footballFetch, isFootballApiConfigured } from '@/lib/football-api'
=======
import { footballFetch, isFootballApiConfigured } from '@/lib/football'
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0

export const dynamic = 'force-dynamic'

// ─── Types ─────────────────────────────────────────────────
interface Player {
  id: number
  name: string
  number: number
  position: string
  grid: string | null
  rating: number | null
  photo: string
  events: { type: string; detail: string; time: number }[]
}

interface Coach {
  id: number
  name: string
  photo: string
}

interface TeamLineup {
  team: { id: number; name: string; logo: string }
  coach: Coach
  formation: string
  startXI: Player[]
  substitutes: Player[]
}

// ─── GET: Last finished match with lineups ─────────────────
export async function GET() {
  if (!isFootballApiConfigured) {
    return NextResponse.json(getMockLastLineup())
  }

  try {
    // 1. Get recent finished matches from a top league
    const leagueIds = [39, 140, 135, 78, 61, 2] // PL, La Liga, Serie A, Bundesliga, Ligue 1, UCL
    const today = new Date()
    const threeDaysAgo = new Date(today.getTime() - 3 * 86400000)
    const dateStr = threeDaysAgo.toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]

    let fixtureData: any = null

    // Try each league until we find a finished match with lineups
    for (const leagueId of leagueIds) {
      const response = await footballFetch(
        `/fixtures?league=${leagueId}&season=2024&from=${dateStr}&to=${todayStr}&timezone=Asia/Jakarta`,
        { next: { revalidate: 300 } }
      )

      if (!response.ok) continue

      const data = await response.json()
      const fixtures: any[] = data.response || []

      // Find a finished match
      const finishedMatch = fixtures.find(
        (f: any) => f.fixture.status.short === 'FT'
      )

      if (finishedMatch) {
        fixtureData = finishedMatch
        break
      }
    }

    // 2. If no finished match found from recent dates, try yesterday broadly
    if (!fixtureData) {
      const yesterday = new Date(today.getTime() - 86400000)
        .toISOString()
        .split('T')[0]
      const response = await footballFetch(
        `/fixtures?date=${yesterday}&timezone=Asia/Jakarta`,
        { next: { revalidate: 300 } }
      )

      if (response.ok) {
        const data = await response.json()
        const fixtures: any[] = data.response || []
        const topLeagueIds = new Set(leagueIds)
        fixtureData =
          fixtures.find(
            (f: any) =>
              f.fixture.status.short === 'FT' &&
              topLeagueIds.has(f.league.id)
          ) || fixtures.find((f: any) => f.fixture.status.short === 'FT')
      }
    }

    if (!fixtureData) {
      return NextResponse.json(getMockLastLineup())
    }

    // 3. Get lineups for this fixture
    const fixtureId = fixtureData.fixture.id
    const lineupRes = await footballFetch(
      `/fixtures?id=${fixtureId}`,
      { next: { revalidate: 300 } }
    )

    if (!lineupRes.ok) {
      return NextResponse.json(getMockLastLineup())
    }

    const lineupData = await lineupRes.json()
    const fullFixture = lineupData.response?.[0]

    if (!fullFixture?.lineups?.length) {
      return NextResponse.json(getMockLastLineup())
    }

    const homeLineup = parseLineup(
      fullFixture.lineups[0],
      fullFixture.events || [],
      fullFixture.teams.home.id
    )
    const awayLineup = parseLineup(
      fullFixture.lineups[1],
      fullFixture.events || [],
      fullFixture.teams.away.id
    )

    return NextResponse.json({
      fixture: {
        id: fullFixture.fixture.id,
        date: fullFixture.fixture.date,
        status: fullFixture.fixture.status.short,
        referee: fullFixture.fixture.referee,
        venue: fullFixture.fixture.venue?.name,
        venueCity: fullFixture.fixture.venue?.city,
        homeTeam: fullFixture.teams.home.name,
        awayTeam: fullFixture.teams.away.name,
        homeLogo: fullFixture.teams.home.logo,
        awayLogo: fullFixture.teams.away.logo,
        homeScore: fullFixture.goals.home,
        awayScore: fullFixture.goals.away,
        league: {
          name: fullFixture.league.name,
          country: fullFixture.league.country,
          logo: fullFixture.league.logo,
          round: fullFixture.league.round,
        },
      },
      homeLineup,
      awayLineup,
      source: 'api-football',
    })
  } catch (error) {
    console.error('Error fetching last lineup:', error)
    return NextResponse.json(getMockLastLineup())
  }
}

// ─── Helpers ───────────────────────────────────────────────
function parseLineup(
  lineup: any,
  events: any[],
  teamId: number
): TeamLineup {
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
    substitutes: (lineup.substitutes || []).map(
      (p: any) => parsePlayer(p, false)
    ),
  }
}

function getMockLastLineup() {
  const pp = (pid: number) =>
    `https://media.api-sports.io/football/players/${pid}.png`

  return {
    fixture: {
      id: 1001,
      date: new Date().toISOString(),
      status: 'FT',
      referee: 'Michael Oliver',
      venue: 'Emirates Stadium',
      venueCity: 'London',
      homeTeam: 'Arsenal',
      awayTeam: 'Manchester City',
      homeLogo: 'https://media.api-sports.io/football/teams/42.png',
      awayLogo: 'https://media.api-sports.io/football/teams/50.png',
      homeScore: 2,
      awayScore: 1,
      league: {
        name: 'Premier League',
        country: 'England',
        logo: 'https://media.api-sports.io/football/leagues/39.png',
        round: 'Regular Season - 28',
      },
    },
    homeLineup: {
      team: {
        id: 42,
        name: 'Arsenal',
        logo: 'https://media.api-sports.io/football/teams/42.png',
      },
      coach: { id: 1, name: 'Mikel Arteta', photo: '' },
      formation: '4-3-3',
      startXI: [
        { id: 154, name: 'D. Raya', number: 22, position: 'G', grid: '1:1', rating: 7.2, photo: pp(154), events: [] },
        { id: 514, name: 'B. White', number: 4, position: 'D', grid: '2:1', rating: 7.0, photo: pp(514), events: [] },
        { id: 2930, name: 'G. Saliba', number: 2, position: 'D', grid: '2:2', rating: 7.5, photo: pp(2930), events: [] },
        { id: 2932, name: 'W. Saliba', number: 6, position: 'D', grid: '2:3', rating: 7.3, photo: pp(2932), events: [] },
        { id: 883, name: 'O. Zinchenko', number: 35, position: 'D', grid: '2:4', rating: 6.8, photo: pp(883), events: [] },
        { id: 475, name: 'T. Partey', number: 5, position: 'M', grid: '3:1', rating: 6.9, photo: pp(475), events: [] },
        { id: 289, name: 'M. Rice', number: 41, position: 'M', grid: '3:2', rating: 7.6, photo: pp(289), events: [{ type: 'card', detail: 'Yellow Card', time: 34 }] },
        { id: 882, name: 'M. Ødegaard', number: 8, position: 'M', grid: '3:3', rating: 8.1, photo: pp(882), events: [] },
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
      team: {
        id: 50,
        name: 'Manchester City',
        logo: 'https://media.api-sports.io/football/teams/50.png',
      },
      coach: { id: 2, name: 'Pep Guardiola', photo: '' },
      formation: '4-4-2',
      startXI: [
        { id: 694, name: 'E. Ederson', number: 31, position: 'G', grid: '1:1', rating: 6.5, photo: pp(694), events: [] },
        { id: 300, name: 'K. Walker', number: 2, position: 'D', grid: '2:1', rating: 6.3, photo: pp(300), events: [] },
        { id: 302, name: 'R. Dias', number: 3, position: 'D', grid: '2:2', rating: 6.8, photo: pp(302), events: [] },
        { id: 20919, name: 'M. Akanji', number: 25, position: 'D', grid: '2:3', rating: 6.6, photo: pp(20919), events: [] },
        { id: 862, name: 'N. Aké', number: 6, position: 'D', grid: '2:4', rating: 6.4, photo: pp(862), events: [] },
        { id: 469, name: 'M. Grealish', number: 10, position: 'M', grid: '3:1', rating: 6.7, photo: pp(469), events: [] },
        { id: 92, name: 'R. De Bruyne', number: 17, position: 'M', grid: '3:2', rating: 7.2, photo: pp(92), events: [] },
        { id: 866, name: 'B. Silva', number: 20, position: 'M', grid: '3:3', rating: 7.0, photo: pp(866), events: [] },
        { id: 47731, name: 'R. Lewis', number: 82, position: 'M', grid: '3:4', rating: 6.5, photo: pp(47731), events: [] },
        { id: 304, name: 'P. Foden', number: 47, position: 'F', grid: '4:1', rating: 6.9, photo: pp(304), events: [] },
        { id: 8822, name: 'E. Haaland', number: 9, position: 'F', grid: '4:2', rating: 7.9, photo: pp(8822), events: [{ type: 'goal', detail: 'Normal Goal', time: 38 }] },
      ],
      substitutes: [
        { id: 284682, name: 'J. Doku', number: 11, position: 'SUB', grid: null, rating: 6.2, photo: pp(284682), events: [] },
      ],
    },
    source: 'mock',
  }
}
