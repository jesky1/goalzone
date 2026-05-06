import { NextResponse } from 'next/server'

export const revalidate = 300

interface TopScorer {
  rank: number
  name: string
  team: string
  goals: number
  assists: number
  minutesPlayed: number
}

const topScorers: TopScorer[] = [
  { rank: 1, name: 'Mohamed Salah', team: 'Liverpool', goals: 22, assists: 14, minutesPlayed: 2430 },
  { rank: 2, name: 'Erling Haaland', team: 'Manchester City', goals: 21, assists: 5, minutesPlayed: 2250 },
  { rank: 3, name: 'Alexander Isak', team: 'Newcastle United', goals: 18, assists: 4, minutesPlayed: 2190 },
  { rank: 4, name: 'Bukayo Saka', team: 'Arsenal', goals: 16, assists: 11, minutesPlayed: 2310 },
  { rank: 5, name: 'Bryan Mbeumo', team: 'Brentford', goals: 15, assists: 3, minutesPlayed: 2340 },
  { rank: 6, name: 'Cole Palmer', team: 'Chelsea', goals: 15, assists: 6, minutesPlayed: 2160 },
  { rank: 7, name: 'Chris Wood', team: 'Nottingham Forest', goals: 14, assists: 3, minutesPlayed: 2280 },
  { rank: 8, name: 'Kai Havertz', team: 'Arsenal', goals: 13, assists: 5, minutesPlayed: 2100 },
  { rank: 9, name: 'Matheus Cunha', team: 'Wolverhampton', goals: 12, assists: 7, minutesPlayed: 2220 },
  { rank: 10, name: 'Dominic Solanke', team: 'Tottenham', goals: 12, assists: 4, minutesPlayed: 2070 },
]

export async function GET() {
  try {
    return NextResponse.json({ topScorers })
  } catch (error) {
    console.error('Error fetching top scorers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top scorers' },
      { status: 500 }
    )
  }
}
