import { NextResponse } from 'next/server'

export const revalidate = 3600 // Cache player data for 1 hour

const API_KEY = process.env.FOOTBALL_API_KEY || process.env.NEXT_PUBLIC_FOOTBALL_API_KEY
const API_BASE = 'https://v3.football.api-sports.io'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const playerId = parseInt(id, 10)

  if (isNaN(playerId)) {
    return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 })
  }

  if (!API_KEY) {
    return NextResponse.json(getMockPlayer(playerId))
  }

  try {
    const response = await fetch(`${API_BASE}/players?id=${playerId}&season=2024`, {
      headers: { 'x-apisports-key': API_KEY },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`API-Football error: ${response.status}`)
    }

    const data = await response.json()
    const playerData = data.response?.[0]

    if (!playerData) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const player = playerData.player
    const statistics = playerData.statistics?.[0]
    const team = statistics?.team

    return NextResponse.json({
      id: player.id,
      name: player.name,
      firstname: player.firstname,
      lastname: player.lastname,
      photo: player.photo,
      age: player.age,
      birth: player.birth,
      nationality: player.nationality,
      height: player.height,
      weight: player.weight,
      injured: player.injured,
      position: statistics?.games?.position || player.position,
      team: team ? {
        id: team.id,
        name: team.name,
        logo: team.logo,
      } : null,
      league: statistics?.league ? {
        id: statistics.league.id,
        name: statistics.league.name,
        logo: statistics.league.logo,
        country: statistics.league.country,
      } : null,
      statistics: statistics ? {
        appearances: statistics.games?.appearences || 0,
        minutes: statistics.games?.minutes || 0,
        goals: statistics.goals?.total || 0,
        assists: statistics.goals?.assists || 0,
        yellowCards: statistics.cards?.yellow || 0,
        redCards: statistics.cards?.red || 0,
        rating: statistics.games?.rating || null,
        passes: statistics.passes?.total || 0,
        tackles: statistics.tackles?.total || 0,
        saves: statistics.goals?.saves || 0,
      } : null,
      source: 'api-football',
    })
  } catch (error) {
    console.error('Error fetching player:', error)
    return NextResponse.json(getMockPlayer(playerId))
  }
}

function getMockPlayer(id: number) {
  return {
    id,
    name: 'Demo Player',
    firstname: 'Demo',
    lastname: 'Player',
    photo: `https://media.api-sports.io/football/players/${id}.png`,
    age: 27,
    birth: {
      date: '1997-05-15',
      place: 'London',
      country: 'England',
    },
    nationality: 'England',
    height: '183 cm',
    weight: '76 kg',
    injured: false,
    position: 'Midfielder',
    team: {
      id: 42,
      name: 'Arsenal',
      logo: 'https://media.api-sports.io/football/teams/42.png',
    },
    league: {
      id: 39,
      name: 'Premier League',
      logo: 'https://media.api-sports.io/football/leagues/39.png',
      country: 'England',
    },
    statistics: {
      appearances: 28,
      minutes: 2340,
      goals: 8,
      assists: 5,
      yellowCards: 3,
      redCards: 0,
      rating: '7.2',
      passes: 1245,
      tackles: 42,
      saves: 0,
    },
    source: 'mock',
    message: 'Set FOOTBALL_API_KEY for real player data',
  }
}
