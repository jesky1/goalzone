import { NextResponse } from 'next/server'

export const revalidate = 3600

const API_KEY = process.env.FOOTBALL_API_KEY || process.env.NEXT_PUBLIC_FOOTBALL_API_KEY
const API_BASE = 'https://v3.football.api-sports.io'

interface RefereeProfile {
  name: string
  photo: string
  age: number
  nationality: string
  countryFlag: string
  residence: string
  federation: string
  rating: number
  totalMatches: number
  yellowCards: number
  redCards: number
  penalties: number
  varReviews: number
  foulsPerGame: number
  cardsPerGame: number
  seasonsActive: number
  debutYear: number
  biggestMatch: string
  specialties: string[]
}

// Known referee profiles with realistic mock stats
const REFEREE_DATABASE: Record<string, Partial<RefereeProfile>> = {
  'michael oliver': {
    name: 'Michael Oliver',
    photo: '/referees/michael-oliver.png',
    age: 39,
    nationality: 'England',
    countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    residence: 'Northumberland, England',
    federation: 'The Football Association',
    rating: 8.2,
    totalMatches: 387,
    yellowCards: 1543,
    redCards: 42,
    penalties: 89,
    varReviews: 67,
    foulsPerGame: 23.4,
    cardsPerGame: 4.1,
    seasonsActive: 17,
    debutYear: 2007,
    biggestMatch: 'UEFA Euro 2024 Final · Spain vs England',
    specialties: ['VAR Expert', 'FIFA Listed', 'Elite Category', 'Champions League'],
  },
  'anthony taylor': {
    name: 'Anthony Taylor',
    photo: '/referees/anthony-taylor.png',
    age: 46,
    nationality: 'England',
    countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    residence: 'Manchester, England',
    federation: 'The Football Association',
    rating: 7.6,
    totalMatches: 412,
    yellowCards: 1687,
    redCards: 38,
    penalties: 94,
    varReviews: 58,
    foulsPerGame: 24.1,
    cardsPerGame: 4.3,
    seasonsActive: 20,
    debutYear: 2004,
    biggestMatch: 'UEFA Europa League Final 2023',
    specialties: ['FIFA Listed', 'Europa League', 'Set-Piece Expert', 'EPL Elite'],
  },
  'clement turpin': {
    name: 'Clément Turpin',
    photo: '/referees/clement-turpin.png',
    age: 42,
    nationality: 'France',
    countryFlag: '🇫🇷',
    residence: 'Paris, France',
    federation: 'Fédération Française de Football',
    rating: 7.9,
    totalMatches: 348,
    yellowCards: 1392,
    redCards: 36,
    penalties: 76,
    varReviews: 72,
    foulsPerGame: 22.8,
    cardsPerGame: 3.9,
    seasonsActive: 16,
    debutYear: 2008,
    biggestMatch: 'UEFA Champions League Final 2022',
    specialties: ['UEFA Elite', 'VAR Pioneer', 'FIFA World Cup', 'Champions League'],
  },
  'daniele orsato': {
    name: 'Daniele Orsato',
    photo: '/referees/daniele-orsato.png',
    age: 48,
    nationality: 'Italy',
    countryFlag: '🇮🇹',
    residence: 'Venice, Italy',
    federation: 'Federazione Italiana Giuoco Calcio',
    rating: 8.0,
    totalMatches: 395,
    yellowCards: 1623,
    redCards: 45,
    penalties: 91,
    varReviews: 61,
    foulsPerGame: 24.5,
    cardsPerGame: 4.2,
    seasonsActive: 21,
    debutYear: 2003,
    biggestMatch: 'UEFA Champions League Final 2023 · Man City vs Inter',
    specialties: ['UEFA Elite', 'World Cup Final 2022', 'FIFA Listed', 'Serie A Top'],
  },
  'felix brych': {
    name: 'Felix Brych',
    photo: '/referees/felix-brych.png',
    age: 49,
    nationality: 'Germany',
    countryFlag: '🇩🇪',
    residence: 'Munich, Germany',
    federation: 'Deutscher Fußball-Bund',
    rating: 7.7,
    totalMatches: 421,
    yellowCards: 1782,
    redCards: 51,
    penalties: 103,
    varReviews: 55,
    foulsPerGame: 25.2,
    cardsPerGame: 4.4,
    seasonsActive: 22,
    debutYear: 2002,
    biggestMatch: 'UEFA Champions League Final 2020 · Bayern vs PSG',
    specialties: ['DFB Elite', 'Champions League', 'VAR Specialist', 'FIFA Listed'],
  },
  'szymon marciniak': {
    name: 'Szymon Marciniak',
    photo: '/referees/szymon-marciniak.png',
    age: 43,
    nationality: 'Poland',
    countryFlag: '🇵🇱',
    residence: 'Płock, Poland',
    federation: 'Polski Związek Piłki Nożnej',
    rating: 8.4,
    totalMatches: 356,
    yellowCards: 1412,
    redCards: 39,
    penalties: 82,
    varReviews: 64,
    foulsPerGame: 23.1,
    cardsPerGame: 3.8,
    seasonsActive: 17,
    debutYear: 2007,
    biggestMatch: 'FIFA World Cup Final 2022 · Argentina vs France',
    specialties: ['FIFA WC Final Referee', 'UEFA Elite', 'Card Management', 'High-Pressure'],
  },
  'mateu lahoz': {
    name: 'Antonio Mateu Lahoz',
    photo: '/referees/antonio-mateu-lahoz.png',
    age: 47,
    nationality: 'Spain',
    countryFlag: '🇪🇸',
    residence: 'Valencia, Spain',
    federation: 'Real Federación Española de Fútbol',
    rating: 6.8,
    totalMatches: 389,
    yellowCards: 1945,
    redCards: 62,
    penalties: 108,
    varReviews: 89,
    foulsPerGame: 27.3,
    cardsPerGame: 5.2,
    seasonsActive: 19,
    debutYear: 2005,
    biggestMatch: 'FIFA World Cup QF 2022 · Netherlands vs Argentina',
    specialties: ['Card Heavy', 'La Liga Top', 'Entertaining Style', 'FIFA Listed'],
  },
  'daniele dundar': {
    name: 'Daniele Doveri',
    photo: '/referees/daniele-doveri.png',
    age: 44,
    nationality: 'Italy',
    countryFlag: '🇮🇹',
    residence: 'Rome, Italy',
    federation: 'Federazione Italiana Giuoco Calcio',
    rating: 7.3,
    totalMatches: 312,
    yellowCards: 1287,
    redCards: 33,
    penalties: 71,
    varReviews: 48,
    foulsPerGame: 22.6,
    cardsPerGame: 4.0,
    seasonsActive: 15,
    debutYear: 2009,
    biggestMatch: 'Serie A Derby d\'Italia · Juventus vs Inter',
    specialties: ['Serie A Elite', 'Advantage Play', 'Discipline Control'],
  },
}

function getDefaultReferee(name: string): RefereeProfile {
  // Try to generate plausible stats from name length as seed
  const seed = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const rand = (min: number, max: number) => min + (seed * (max - min)) % 100 / 100 * (max - min)

  return {
    name,
    photo: '',
    age: Math.round(rand(32, 50)),
    nationality: 'International',
    countryFlag: '🌐',
    residence: 'Europe',
    federation: 'FIFA / UEFA',
    rating: Math.round(rand(6.5, 8.5) * 10) / 10,
    totalMatches: Math.round(rand(200, 450)),
    yellowCards: Math.round(rand(800, 1800)),
    redCards: Math.round(rand(25, 55)),
    penalties: Math.round(rand(60, 100)),
    varReviews: Math.round(rand(30, 80)),
    foulsPerGame: Math.round(rand(20, 28) * 10) / 10,
    cardsPerGame: Math.round(rand(3.5, 5.0) * 10) / 10,
    seasonsActive: Math.round(rand(10, 22)),
    debutYear: 2024 - Math.round(rand(10, 22)),
    biggestMatch: 'UEFA Champions League',
    specialties: ['FIFA Listed', 'UEFA Category'],
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: 'Referee name is required' }, { status: 400 })
  }

  const decodedName = decodeURIComponent(name.trim().toLowerCase())

  // Check our database first
  const knownReferee = REFEREE_DATABASE[decodedName]
  if (knownReferee) {
    return NextResponse.json({
      referee: { ...getDefaultReferee(decodedName), ...knownReferee },
      source: 'database',
    })
  }

  // Try API-Football referees endpoint
  if (API_KEY) {
    try {
      const response = await fetch(`${API_BASE}/referees?search=${encodeURIComponent(decodedName)}`, {
        headers: { 'x-apisports-key': API_KEY },
        next: { revalidate: 3600 },
      })

      if (response.ok) {
        const data = await response.json()
        const found = data.response?.[0]
        if (found) {
          const profile: RefereeProfile = {
            ...getDefaultReferee(decodedName),
            name: found.name || decodedName,
            photo: found.photo || '',
            nationality: found.country?.name || 'International',
            countryFlag: found.country?.flag || '🌐',
          }
          return NextResponse.json({ referee: profile, source: 'api-football' })
        }
      }
    } catch {
      // Fallback to default
    }
  }

  // Fallback: generate from name
  return NextResponse.json({
    referee: getDefaultReferee(decodedName),
    source: 'generated',
  })
}
