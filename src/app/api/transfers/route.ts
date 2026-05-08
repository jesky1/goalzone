import { NextResponse } from 'next/server'

export const revalidate = 1800 // Cache 30 minutes to save API calls

const API_KEY = process.env.FOOTBALL_API_KEY || process.env.NEXT_PUBLIC_FOOTBALL_API_KEY
const API_BASE = 'https://v3.football.api-sports.io'

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
  source: 'api-football' | 'none'
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

// --- API Fetching & Processing ---

async function fetchTeamTransfers(teamId: number): Promise<ApiPlayerTransfer[]> {
  const response = await fetch(`${API_BASE}/transfers?team=${teamId}`, {
    headers: { 'x-apisports-key': API_KEY! },
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
    for (const incoming of pt.teams.in || []) {
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
    for (const outgoing of pt.teams.out || []) {
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
  // No API key — return empty
  if (!API_KEY) {
    return NextResponse.json({
      transfers: [],
      source: 'none',
      totalAvailable: 0,
      message: 'Configure FOOTBALL_API_KEY in environment variables for live transfer data',
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

    return NextResponse.json({
      transfers: [],
      source: 'none',
      totalAvailable: 0,
      error: 'API fetch failed',
    } satisfies TransfersResponse)
  }
}
