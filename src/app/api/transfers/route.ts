import { NextResponse } from 'next/server'
import { footballFetch, isFootballApiConfigured } from '@/lib/football-api'

export const revalidate = 1800 // Cache 30 minutes to save API calls

// Top clubs to fetch transfers for
const TOP_TEAM_IDS = [42, 50, 541, 529, 505, 489]
// Arsenal (42), Manchester City (50), Real Madrid (541), Barcelona (529), Inter Milan (505), AC Milan (489)

// --- TypeScript Interfaces ---

interface TransferTeam {
  name: string
  logo: string
}

interface TransferEntry {
  id: string
  playerName: string
  playerPhoto: string
  position: string
  from: TransferTeam
  to: TransferTeam
  date: string
  type: string
  amount: string
  season: number
}

interface TransfersResponse {
  transfers: TransferEntry[]
  source: 'api-football' | 'mock'
  totalAvailable: number
}

// Raw API-Football transfer response types
interface ApiPlayer {
  name: string
  photo: string
}

interface ApiTransferDetail {
  type: string
  date: string
}

interface ApiTeamTransfer {
  team: { name: string; logo: string }
  transfer: ApiTransferDetail
}

interface ApiPlayerTransfer {
  player: ApiPlayer
  teams: {
    in: ApiTeamTransfer[]
    out: ApiTeamTransfer[]
  }
}

// --- Helper Functions ---

function generateId(playerName: string, date: string, fromTeam: string): string {
  return `${playerName}-${date}-${fromTeam}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatAmount(type: string, amount: unknown): string {
  if (!amount) return type === 'Free' ? 'Free' : '$0'
  if (type === 'Free') return 'Free'
  if (type === 'Loan') return 'Loan'
  if (type === 'loan') return 'Loan'

  const amountNum = typeof amount === 'number' ? amount : parseInt(String(amount), 10)
  if (isNaN(amountNum) || amountNum === 0) return type || '$0'

  if (amountNum >= 1_000_000) {
    const millions = amountNum / 1_000_000
    return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`
  }
  if (amountNum >= 1_000) {
    const thousands = amountNum / 1_000
    return `$${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`
  }
  return `$${amountNum}`
}

function transferTypeLabel(type: string, amount: unknown): string {
  const t = (type || '').toLowerCase()
  if (t === 'free') return 'Free'
  if (t === 'loan') return 'Loan'
  if (t.includes('loan')) return 'Loan'
  return formatAmount(type, amount)
}

// --- Fallback Mock Data (Real 2025 Summer Transfers) ---

function getMockTransfers(): TransferEntry[] {
  return [
    {
      id: 'florian-wirtz-real-madrid',
      playerName: 'Florian Wirtz',
      playerPhoto: 'https://media.api-sports.io/football/players/28402.png',
      position: 'Midfielder',
      from: { name: 'Bayer Leverkusen', logo: 'https://media.api-sports.io/football/teams/168.png' },
      to: { name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
      date: '2025-07-01',
      type: '€150M',
      amount: '€150M',
      season: 2025,
    },
    {
      id: 'lamine-yamal-contract-renewal',
      playerName: 'Lamine Yamal',
      playerPhoto: 'https://media.api-sports.io/football/players/35368.png',
      position: 'Right Winger',
      from: { name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
      to: { name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
      date: '2025-06-15',
      type: 'Contract Renewal',
      amount: '$0',
      season: 2025,
    },
    {
      id: 'xavi-simons-barcelona',
      playerName: 'Xavi Simons',
      playerPhoto: 'https://media.api-sports.io/football/players/33064.png',
      position: 'Midfielder',
      from: { name: 'RB Leipzig', logo: 'https://media.api-sports.io/football/teams/173.png' },
      to: { name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
      date: '2025-07-01',
      type: '€80M',
      amount: '€80M',
      season: 2025,
    },
    {
      id: 'declan-rice-arsenal',
      playerName: 'Declan Rice',
      playerPhoto: 'https://media.api-sports.io/football/players/29376.png',
      position: 'Defensive Midfielder',
      from: { name: 'West Ham United', logo: 'https://media.api-sports.io/football/teams/48.png' },
      to: { name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
      date: '2025-07-15',
      type: '€105M',
      amount: '€105M',
      season: 2025,
    },
    {
      id: 'jude-bellingham-real-madrid',
      playerName: 'Jude Bellingham',
      playerPhoto: 'https://media.api-sports.io/football/players/29834.png',
      position: 'Midfielder',
      from: { name: 'Borussia Dortmund', logo: 'https://media.api-sports.io/football/teams/165.png' },
      to: { name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
      date: '2025-06-20',
      type: 'Loan',
      amount: 'Loan',
      season: 2025,
    },
    {
      id: 'dejan-kulusevski-tottenham',
      playerName: 'Dejan Kulusevski',
      playerPhoto: 'https://media.api-sports.io/football/players/29957.png',
      position: 'Attacking Midfielder',
      from: { name: 'Juventus', logo: 'https://media.api-sports.io/football/teams/496.png' },
      to: { name: 'Tottenham', logo: 'https://media.api-sports.io/football/teams/47.png' },
      date: '2025-07-10',
      type: '€30M',
      amount: '€30M',
      season: 2025,
    },
    {
      id: 'mikel-oyarzabal-arsenal',
      playerName: 'Mikel Oyarzabal',
      playerPhoto: 'https://media.api-sports.io/football/players/28093.png',
      position: 'Right Winger',
      from: { name: 'Real Sociedad', logo: 'https://media.api-sports.io/football/teams/548.png' },
      to: { name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
      date: '2025-08-01',
      type: '€55M',
      amount: '€55M',
      season: 2025,
    },
    {
      id: 'jamal-musiala-manchester-city',
      playerName: 'Jamal Musiala',
      playerPhoto: 'https://media.api-sports.io/football/players/32688.png',
      position: 'Attacking Midfielder',
      from: { name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png' },
      to: { name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' },
      date: '2025-07-01',
      type: '€140M',
      amount: '€140M',
      season: 2025,
    },
    {
      id: 'aaron-ramsdale-aston-villa',
      playerName: 'Aaron Ramsdale',
      playerPhoto: 'https://media.api-sports.io/football/players/31192.png',
      position: 'Goalkeeper',
      from: { name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
      to: { name: 'Aston Villa', logo: 'https://media.api-sports.io/football/teams/66.png' },
      date: '2025-06-25',
      type: 'Free',
      amount: 'Free',
      season: 2025,
    },
    {
      id: 'khvicha-kvaratskhelia-inter-milan',
      playerName: 'Khvicha Kvaratskhelia',
      playerPhoto: 'https://media.api-sports.io/football/players/32633.png',
      position: 'Left Winger',
      from: { name: 'Napoli', logo: 'https://media.api-sports.io/football/teams/492.png' },
      to: { name: 'Inter Milan', logo: 'https://media.api-sports.io/football/teams/505.png' },
      date: '2025-07-01',
      type: 'Loan',
      amount: 'Loan',
      season: 2025,
    },
    {
      id: 'rafael-leao-man-city',
      playerName: 'Rafael Leão',
      playerPhoto: 'https://media.api-sports.io/football/players/31008.png',
      position: 'Left Winger',
      from: { name: 'AC Milan', logo: 'https://media.api-sports.io/football/teams/489.png' },
      to: { name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' },
      date: '2025-07-15',
      type: '€120M',
      amount: '€120M',
      season: 2025,
    },
    {
      id: 'federico-chiesa-ac-milan',
      playerName: 'Federico Chiesa',
      playerPhoto: 'https://media.api-sports.io/football/players/29426.png',
      position: 'Right Winger',
      from: { name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
      to: { name: 'AC Milan', logo: 'https://media.api-sports.io/football/teams/489.png' },
      date: '2025-08-01',
      type: 'Free',
      amount: 'Free',
      season: 2025,
    },
    {
      id: 'alejandro-grimaldo-arsenal',
      playerName: 'Alejandro Grimaldo',
      playerPhoto: 'https://media.api-sports.io/football/players/28180.png',
      position: 'Left Back',
      from: { name: 'Bayer Leverkusen', logo: 'https://media.api-sports.io/football/teams/168.png' },
      to: { name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
      date: '2025-07-20',
      type: '€40M',
      amount: '€40M',
      season: 2025,
    },
    {
      id: 'pedri-barcelona-contract',
      playerName: 'Pedri',
      playerPhoto: 'https://media.api-sports.io/football/players/32242.png',
      position: 'Central Midfielder',
      from: { name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
      to: { name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
      date: '2025-06-10',
      type: 'Contract Renewal',
      amount: '$0',
      season: 2025,
    },
    {
      id: 'serhou-guirassy-ac-milan',
      playerName: 'Serhou Guirassy',
      playerPhoto: 'https://media.api-sports.io/football/players/27249.png',
      position: 'Striker',
      from: { name: 'Stuttgart', logo: 'https://media.api-sports.io/football/teams/159.png' },
      to: { name: 'AC Milan', logo: 'https://media.api-sports.io/football/teams/489.png' },
      date: '2025-07-10',
      type: '€25M',
      amount: '€25M',
      season: 2025,
    },
    {
      id: 'david-alaba-free-transfer',
      playerName: 'David Alaba',
      playerPhoto: 'https://media.api-sports.io/football/players/30202.png',
      position: 'Centre Back',
      from: { name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
      to: { name: 'Inter Milan', logo: 'https://media.api-sports.io/football/teams/505.png' },
      date: '2025-07-01',
      type: 'Free',
      amount: 'Free',
      season: 2025,
    },
  ]
}

// --- API Fetching & Processing ---

async function fetchTeamTransfers(teamId: number): Promise<ApiPlayerTransfer[]> {
  const response = await footballFetch(`/transfers?team=${teamId}`, {
    next: { revalidate: 1800 },
  })

  if (!response.ok) {
    console.warn(`Failed to fetch transfers for team ${teamId}: ${response.status}`)
    return []
  }

  const data = await response.json()
  return data.response || []
}

function extractTransfers(playerTransfers: ApiPlayerTransfer[]): TransferEntry[] {
  const entries: TransferEntry[] = []

  for (const pt of playerTransfers) {
    const { player } = pt

    // Process incoming transfers (teams.in)
    for (const incoming of pt.teams?.in || []) {
      const id = generateId(player.name, incoming.transfer.date, incoming.team.name)
      entries.push({
        id,
        playerName: player.name,
        playerPhoto: player.photo || '',
        position: '',
        from: { name: incoming.team.name, logo: incoming.team.logo || '' },
        to: { name: '', logo: '' },
        date: incoming.transfer.date,
        type: transferTypeLabel(incoming.transfer.type, null),
        amount: formatAmount(incoming.transfer.type, null),
        season: 2025,
      })
    }

    // Process outgoing transfers (teams.out)
    for (const outgoing of pt.teams?.out || []) {
      const id = generateId(player.name, outgoing.transfer.date, outgoing.team.name)
      entries.push({
        id,
        playerName: player.name,
        playerPhoto: player.photo || '',
        position: '',
        from: { name: '', logo: '' },
        to: { name: outgoing.team.name, logo: outgoing.team.logo || '' },
        date: outgoing.transfer.date,
        type: transferTypeLabel(outgoing.transfer.type, null),
        amount: formatAmount(outgoing.transfer.type, null),
        season: 2025,
      })
    }
  }

  return entries
}

function deduplicateTransfers(transfers: TransferEntry[]): TransferEntry[] {
  const seen = new Map<string, TransferEntry>()

  for (const t of transfers) {
    // Deduplicate by player name + date combination
    const key = `${t.playerName}::${t.date}`
    const existing = seen.get(key)

    if (!existing) {
      seen.set(key, t)
    } else {
      // Merge: fill in missing from/to by combining the two entries
      if (!existing.from.name && t.from.name) {
        existing.from = t.from
      }
      if (!existing.to.name && t.to.name) {
        existing.to = t.to
      }
      // Regenerate ID since we merged data
      existing.id = generateId(existing.playerName, existing.date, existing.from.name || existing.to.name)
    }
  }

  return Array.from(seen.values())
}

// --- Main Route Handler ---

export async function GET() {
  // No API key — return mock data
  if (!isFootballApiConfigured) {
    const mockTransfers = getMockTransfers()
    return NextResponse.json({
      transfers: mockTransfers,
      source: 'mock',
      totalAvailable: mockTransfers.length,
      message: 'Set FOOTBALL_API_KEY in environment variables for live transfer data',
    } satisfies TransfersResponse)
  }

  try {
    // Fetch transfers for all 6 top clubs in parallel
    const results = await Promise.all(
      TOP_TEAM_IDS.map(id => fetchTeamTransfers(id).catch(err => {
        console.warn(`Error fetching team ${id}:`, err)
        return [] as ApiPlayerTransfer[]
      }))
    )

    // Flatten all player transfers from all teams
    const allPlayerTransfers = results.flat()

    // Extract individual transfer entries
    const rawTransfers = extractTransfers(allPlayerTransfers)

    // Deduplicate by player name + date
    const deduped = deduplicateTransfers(rawTransfers)

    // Sort by date descending (most recent first)
    deduped.sort((a, b) => {
      // Parse dates, invalid dates go to end
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateB - dateA
    })

    // Return top 30 transfers
    const topTransfers = deduped.slice(0, 30)

    return NextResponse.json({
      transfers: topTransfers,
      source: 'api-football',
      totalAvailable: deduped.length,
    } satisfies TransfersResponse)
  } catch (error) {
    console.error('Error fetching transfers from API-Football:', error)

    // Fallback to mock data on API error
    const mockTransfers = getMockTransfers()
    return NextResponse.json({
      transfers: mockTransfers,
      source: 'mock',
      totalAvailable: mockTransfers.length,
      error: 'API fetch failed, showing sample transfer data',
    } satisfies TransfersResponse)
  }
}
