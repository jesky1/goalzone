import { NextResponse } from 'next/server'

export const revalidate = 60

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
  homeScore: number
  awayScore: number
  status: 'LIVE' | 'HT' | 'FT' | 'NS'
  minute: number | null
  homeEvents: LiveMatchEvent[]
  awayEvents: LiveMatchEvent[]
}

const liveMatches: LiveMatch[] = [
  {
    id: 'match-1',
    league: 'Premier League',
    leagueLogo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    homeTeam: 'Arsenal',
    awayTeam: 'Manchester City',
    homeScore: 2,
    awayScore: 1,
    status: 'LIVE',
    minute: 67,
    homeEvents: [
      { type: 'goal', minute: 12, player: 'Saka' },
      { type: 'goal', minute: 45, player: 'Havertz' },
    ],
    awayEvents: [
      { type: 'goal', minute: 38, player: 'Haaland' },
    ],
  },
  {
    id: 'match-2',
    league: 'Premier League',
    leagueLogo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    homeTeam: 'Liverpool',
    awayTeam: 'Chelsea',
    homeScore: 1,
    awayScore: 1,
    status: 'HT',
    minute: 45,
    homeEvents: [
      { type: 'goal', minute: 23, player: 'Salah' },
    ],
    awayEvents: [
      { type: 'goal', minute: 34, player: 'Palmer' },
    ],
  },
  {
    id: 'match-3',
    league: 'Premier League',
    leagueLogo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    homeTeam: 'Tottenham',
    awayTeam: 'Aston Villa',
    homeScore: 0,
    awayScore: 0,
    status: 'NS',
    minute: null,
    homeEvents: [],
    awayEvents: [],
  },
  {
    id: 'match-4',
    league: 'La Liga',
    leagueLogo: '🇪🇸',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeScore: 3,
    awayScore: 2,
    status: 'LIVE',
    minute: 82,
    homeEvents: [
      { type: 'goal', minute: 15, player: 'Vinícius Jr.' },
      { type: 'goal', minute: 55, player: 'Bellingham' },
      { type: 'goal', minute: 78, player: 'Mbappé' },
    ],
    awayEvents: [
      { type: 'goal', minute: 30, player: 'Lewandowski' },
      { type: 'goal', minute: 64, player: 'Yamal' },
    ],
  },
  {
    id: 'match-5',
    league: 'La Liga',
    leagueLogo: '🇪🇸',
    homeTeam: 'Atlético Madrid',
    awayTeam: 'Sevilla',
    homeScore: 2,
    awayScore: 0,
    status: 'FT',
    minute: 90,
    homeEvents: [
      { type: 'goal', minute: 42, player: 'Griezmann' },
      { type: 'goal', minute: 71, player: 'Álvarez' },
      { type: 'card', minute: 88, player: 'Savic' },
    ],
    awayEvents: [
      { type: 'card', minute: 56, player: 'Ocampos' },
    ],
  },
  {
    id: 'match-6',
    league: 'Champions League',
    leagueLogo: '⭐',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Inter Milan',
    homeScore: 1,
    awayScore: 1,
    status: 'LIVE',
    minute: 53,
    homeEvents: [
      { type: 'goal', minute: 18, player: 'Kane' },
    ],
    awayEvents: [
      { type: 'goal', minute: 44, player: 'Lautaro Martínez' },
    ],
  },
  {
    id: 'match-7',
    league: 'Champions League',
    leagueLogo: '⭐',
    homeTeam: 'Paris Saint-Germain',
    awayTeam: 'Borussia Dortmund',
    homeScore: 3,
    awayScore: 1,
    status: 'FT',
    minute: 90,
    homeEvents: [
      { type: 'goal', minute: 11, player: 'Dembélé' },
      { type: 'goal', minute: 59, player: 'Barcola' },
      { type: 'goal', minute: 84, player: 'Asensio' },
    ],
    awayEvents: [
      { type: 'goal', minute: 36, player: 'Brandt' },
    ],
  },
  {
    id: 'match-8',
    league: 'Serie A',
    leagueLogo: '🇮🇹',
    homeTeam: 'AC Milan',
    awayTeam: 'Juventus',
    homeScore: 0,
    awayScore: 0,
    status: 'HT',
    minute: 45,
    homeEvents: [
      { type: 'card', minute: 22, player: 'Tomori' },
    ],
    awayEvents: [
      { type: 'card', minute: 40, player: 'Bremer' },
    ],
  },
  {
    id: 'match-9',
    league: 'Serie A',
    leagueLogo: '🇮🇹',
    homeTeam: 'Napoli',
    awayTeam: 'AS Roma',
    homeScore: 1,
    awayScore: 0,
    status: 'LIVE',
    minute: 31,
    homeEvents: [
      { type: 'goal', minute: 28, player: 'Osimhen' },
    ],
    awayEvents: [],
  },
  {
    id: 'match-10',
    league: 'Champions League',
    leagueLogo: '⭐',
    homeTeam: 'Liverpool',
    awayTeam: 'Real Madrid',
    homeScore: 0,
    awayScore: 0,
    status: 'NS',
    minute: null,
    homeEvents: [],
    awayEvents: [],
  },
]

export async function GET() {
  try {
    return NextResponse.json({ matches: liveMatches })
  } catch (error) {
    console.error('Error fetching live scores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live scores' },
      { status: 500 }
    )
  }
}
