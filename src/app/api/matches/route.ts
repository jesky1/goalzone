<<<<<<< HEAD
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { footballFetch, isFootballApiConfigured } from '@/lib/football-api'

export const dynamic = 'force-dynamic'

// ─── GOALZONE Top Tier & Favorite Leagues ────────────────────
// Hanya liga-liga berikut yang ditampilkan di halaman utama.
// Filter dilakukan di sisi klien (frontend).
export const GOALZONE_LEAGUES: Record<number, { name: string; country: string; tier: 'top' | 'favorite' }> = {
  // ── Top Tier (Liga utama dunia) ──
  39:   { name: 'Premier League',       country: 'England',     tier: 'top' },
  40:   { name: 'Championship',         country: 'England',     tier: 'favorite' },
  140:  { name: 'La Liga',              country: 'Spain',       tier: 'top' },
  135:  { name: 'Serie A',              country: 'Italy',       tier: 'top' },
  78:   { name: 'Bundesliga',           country: 'Germany',     tier: 'top' },
  61:   { name: 'Ligue 1',              country: 'France',      tier: 'top' },
  88:   { name: 'Eredivisie',           country: 'Netherlands', tier: 'favorite' },
  94:   { name: 'Primeira Liga',        country: 'Portugal',    tier: 'favorite' },
  2:    { name: 'Champions League',     country: 'World',       tier: 'top' },
  3:    { name: 'Europa League',        country: 'World',       tier: 'top' },
  848:  { name: 'Conference League',    country: 'World',       tier: 'favorite' },
  // ── Americas ──
  71:   { name: 'Serie A Brazil',       country: 'Brazil',      tier: 'favorite' },
  253:  { name: 'Liga MX',              country: 'Mexico',      tier: 'favorite' },
  252:  { name: 'MLS',                  country: 'USA',         tier: 'favorite' },
  // ── Asia & Others ──
  307:  { name: 'Saudi Pro League',     country: 'Saudi Arabia',tier: 'favorite' },
  98:   { name: 'J-League',             country: 'Japan',       tier: 'favorite' },
  292:  { name: 'K-League 1',           country: 'South Korea', tier: 'favorite' },
  235:  { name: 'Liga 1 Indonesia',     country: 'Indonesia',   tier: 'top' }, // Home league = Top Tier!
  203:  { name: 'Süper Lig',            country: 'Turkey',      tier: 'favorite' },
  144:  { name: 'Scottish Premiership',  country: 'Scotland',    tier: 'favorite' },
  4:    { name: 'Euro Championship',    country: 'Europe',      tier: 'top' },
  1:    { name: 'World Cup',            country: 'World',       tier: 'top' },
  141:  { name: 'Segunda División',     country: 'Spain',       tier: 'favorite' },
  136:  { name: 'Serie B',              country: 'Italy',       tier: 'favorite' },
  79:   { name: '2. Bundesliga',        country: 'Germany',     tier: 'favorite' },
  62:   { name: 'Ligue 2',              country: 'France',      tier: 'favorite' },
  128:  { name: 'Argentine Primera',    country: 'Argentina',   tier: 'favorite' },
  297:  { name: 'Chinese Super League', country: 'China',       tier: 'favorite' },
}

// ─── Types ───────────────────────────────────────────────────
interface MatchEvent { type: string; minute: number; player: string; detail?: string; card?: string | null }

interface MatchAPI {
  id: string
  league: string
  leagueLogo: string
  leagueId: number
  homeTeam: string
  awayTeam: string
  homeLogo: string
  awayLogo: string
  homeScore: number
  awayScore: number
  status: string
  minute: number | null
  matchDate: string
  homeEvents: MatchEvent[]
  awayEvents: MatchEvent[]
  isTopTier?: boolean
}

// ─── Supabase query helper ──────────────────────────────────
async function fetchFromSupabase(): Promise<MatchAPI[] | null> {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseKey) return null

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true })

    if (error || !data || !Array.isArray(data)) return null

    return data.map((row: any) => {
      const lid = Number(row.league_id || row.leagueId || 0)
      const leagueInfo = GOALZONE_LEAGUES[lid]
      return {
        id: row.id || row.external_id || String(row.fixture_id || ''),
        league: row.league || row.competition || leagueInfo?.name || 'Unknown',
        leagueLogo: row.league_logo || row.leagueLogo || '',
        leagueId: lid,
        homeTeam: row.home_team || row.homeTeam || '',
        awayTeam: row.away_team || row.awayTeam || '',
        homeLogo: row.home_logo || row.homeLogo || '',
        awayLogo: row.away_logo || row.awayLogo || '',
        homeScore: Number(row.home_score ?? row.homeScore ?? 0),
        awayScore: Number(row.away_score ?? row.awayScore ?? 0),
        status: mapStatus(row.status || 'NS'),
        minute: row.minute ?? row.elapsed ?? null,
        matchDate: row.match_date || row.matchDate || '',
        homeEvents: safeParseJSON<MatchEvent[]>(row.home_events || row.homeEvents || '[]', []),
        awayEvents: safeParseJSON<MatchEvent[]>(row.away_events || row.awayEvents || '[]', []),
        isTopTier: leagueInfo?.tier === 'top',
      }
    })
  } catch {
    return null
  }
}

// ─── Prisma fallback ─────────────────────────────────────────
async function fetchFromPrisma(): Promise<MatchAPI[] | null> {
  try {
    const rows = await db.match.findMany({
      orderBy: { matchDate: 'asc' },
    })

    if (!rows || rows.length === 0) return null

    return rows.map((row) => {
      const lid = row.leagueId || 0
      const leagueInfo = GOALZONE_LEAGUES[lid]
      return {
        id: row.externalId || row.id,
        league: row.league,
        leagueLogo: row.leagueLogo || '',
        leagueId: lid,
        homeTeam: row.homeTeam,
        awayTeam: row.awayTeam,
        homeLogo: row.homeLogo || '',
        awayLogo: row.awayLogo || '',
        homeScore: row.homeScore,
        awayScore: row.awayScore,
        status: mapStatus(row.status),
        minute: row.minute,
        matchDate: row.matchDate.toISOString(),
        homeEvents: safeParseJSON<MatchEvent[]>(row.homeEvents, []),
        awayEvents: safeParseJSON<MatchEvent[]>(row.awayEvents, []),
        isTopTier: leagueInfo?.tier === 'top',
      }
    })
  } catch {
    return null
  }
}

// ─── API-Football: /fixtures?date=today (SINGLE CALL) ───────
// Menggunakan endpoint /fixtures dengan parameter date (hari ini)
// untuk menarik SELURUH pertandingan dunia dalam SATU API call.
// Filter liga dilakukan di sisi klien (frontend).
async function fetchFromAPIFootball(): Promise<MatchAPI[] | null> {
  if (!isFootballApiConfigured) return null

  try {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // ── SINGLE CALL: fetch semua pertandingan hari ini ──
    const [todayRes, tomorrowRes] = await Promise.allSettled([
      footballFetch(
        `/fixtures?date=${today}&timezone=Asia/Jakarta`,
        { next: { revalidate: 60 } }
      ),
      footballFetch(
        `/fixtures?date=${tomorrowStr}&timezone=Asia/Jakarta`,
        { next: { revalidate: 60 } }
      ),
    ])

    let allFixtures: MatchAPI[] = []

    // Process today's fixtures
    if (todayRes.status === 'fulfilled' && todayRes.value.ok) {
      const data = await todayRes.value.json()
      const fixtures: any[] = data.response || []
      allFixtures.push(...fixtures.map((f: any) => transformFixture(f)))
    }

    // Process tomorrow's fixtures (untuk tab "Akan Datang")
    if (tomorrowRes.status === 'fulfilled' && tomorrowRes.value.ok) {
      const data = await tomorrowRes.value.json()
      const fixtures: any[] = data.response || []
      allFixtures.push(...fixtures.map((f: any) => transformFixture(f)))
    }

    if (allFixtures.length === 0) return null

    // ── Sort: LIVE/HT → FT → NS, then by matchDate ──
    allFixtures.sort((a, b) => {
      const statusOrder: Record<string, number> = { LIVE: 0, HT: 1, FT: 2, NS: 3 }
      const sa = statusOrder[a.status] ?? 4
      const sb = statusOrder[b.status] ?? 4
      if (sa !== sb) return sa - sb
      return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
    })

    return allFixtures
  } catch {
    return null
  }
}

// ─── Transform API-Football fixture ─────────────────────────
function transformFixture(f: any): MatchAPI {
  const lid = f.league.id || 0
  const leagueInfo = GOALZONE_LEAGUES[lid]
  return {
    id: String(f.fixture.id),
    league: f.league.name,
    leagueLogo: f.league.logo || '',
    leagueId: lid,
    homeTeam: f.teams.home.name,
    awayTeam: f.teams.away.name,
    homeLogo: f.teams.home.logo || '',
    awayLogo: f.teams.away.logo || '',
    homeScore: f.goals.home ?? 0,
    awayScore: f.goals.away ?? 0,
    status: mapStatusAPI(f.fixture.status.short),
    minute: f.fixture.status.elapsed || null,
    matchDate: f.fixture.date || '',
    homeEvents: extractEvents(f.events || [], f.teams.home.id),
    awayEvents: extractEvents(f.events || [], f.teams.away.id),
    isTopTier: leagueInfo?.tier === 'top',
  }
}

// ─── Helpers ─────────────────────────────────────────────────
function mapStatus(s: string): string {
  const lower = s.toLowerCase()
  if (lower === 'live' || lower === '1h' || lower === '2h' || lower === 'et' || lower === 'bt' || lower === 'p') return 'LIVE'
  if (lower === 'ht') return 'HT'
  if (lower === 'ft' || lower === 'aft' || lower === 'awd' || lower === 'wo' || lower === 'finished') return 'FT'
  return 'NS'
}

function mapStatusAPI(s: string): string {
  const lower = s.toLowerCase()
  if (lower === '1h' || lower === '2h' || lower === 'et' || lower === 'bt' || lower === 'p' || lower === 'live') return 'LIVE'
  if (lower === 'ht') return 'HT'
  if (lower === 'ft' || lower === 'aft' || lower === 'awd' || lower === 'wo') return 'FT'
  return 'NS'
}

function extractEvents(events: any[], teamId: number): MatchEvent[] {
  if (!events) return []
=======
import { NextResponse } from 'next/server';
import { footballFetch, isFootballApiConfigured } from '@/lib/football';

// ============================================================
// GOALZONE — Matches API (Real Data dari Football API)
// ============================================================
// GET /api/matches
// GET /api/matches?date=2024-01-15
// GET /api/matches?league=39&season=2024
// GET /api/matches?team=85
//
// Mengembalikan data pertandingan dari API-Football.
// Jika API key belum dikonfigurasi, mengembalikan array kosong
// dengan pesan error.
// ============================================================

export const revalidate = 60; // Cache 1 menit
export const dynamic = 'force-dynamic';

// ─── GOALZONE League IDs ──────────────────────────────────────
const GOALZONE_LEAGUE_IDS = [
  39, 40, 140, 141, 135, 136, 78, 79, 61, 62,
  88, 94, 2, 3, 848,
  71, 253, 252, 128,
  307, 98, 292, 297, 235, 203, 144, 4, 1,
];

// ─── Status mapping ────────────────────────────────────────────
function mapStatus(short: string): string {
  const s = short.toLowerCase();
  if (['1h', '2h', 'et', 'bt', 'p', 'live'].includes(s)) return 'LIVE';
  if (s === 'ht') return 'HT';
  if (['ft', 'aft', 'awd', 'wo'].includes(s)) return 'FT';
  return 'NS';
}

// ─── Extract events ────────────────────────────────────────────
function extractEvents(events: any[], teamId: number) {
  if (!events) return [];
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
  return events
    .filter((e: any) => e.team.id === teamId && (e.type === 'goal' || e.type === 'card'))
    .map((e: any) => ({
      type: e.type === 'goal' ? 'goal' : 'card',
      minute: e.time.elapsed,
      player: e.player.name,
      detail: e.detail || undefined,
<<<<<<< HEAD
      card: e.detail === 'Red Card' ? 'red' : e.detail === 'Yellow Card' ? 'yellow' : null,
    }))
}

function safeParseJSON<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

// ─── Mock data (fallback ketika semua sumber gagal) ──────────
function getMockMatches(): MatchAPI[] {
  const now = new Date()
  const makeDate = (offsetMs: number) => new Date(now.getTime() + offsetMs).toISOString()

  return [
    {
      id: 'mock-1', league: 'Premier League', leagueLogo: 'https://media.api-sports.io/football/leagues/39.png',
      leagueId: 39, isTopTier: true,
      homeTeam: 'Arsenal', awayTeam: 'Manchester City',
      homeLogo: 'https://media.api-sports.io/football/teams/42.png',
      awayLogo: 'https://media.api-sports.io/football/teams/50.png',
      homeScore: 2, awayScore: 1, status: 'LIVE', minute: 67,
      matchDate: makeDate(-3600000),
      homeEvents: [{ type: 'goal', minute: 12, player: 'Saka' }, { type: 'goal', minute: 45, player: 'Havertz' }],
      awayEvents: [{ type: 'goal', minute: 38, player: 'Haaland' }],
    },
    {
      id: 'mock-2', league: 'La Liga', leagueLogo: 'https://media.api-sports.io/football/leagues/140.png',
      leagueId: 140, isTopTier: true,
      homeTeam: 'Real Madrid', awayTeam: 'Barcelona',
      homeLogo: 'https://media.api-sports.io/football/teams/541.png',
      awayLogo: 'https://media.api-sports.io/football/teams/529.png',
      homeScore: 3, awayScore: 2, status: 'HT', minute: 45,
      matchDate: makeDate(-5400000),
      homeEvents: [{ type: 'goal', minute: 15, player: 'Vinícius Jr.' }, { type: 'goal', minute: 55, player: 'Bellingham' }],
      awayEvents: [{ type: 'goal', minute: 30, player: 'Lewandowski' }],
    },
    {
      id: 'mock-7', league: 'Liga 1 Indonesia', leagueLogo: 'https://media.api-sports.io/football/leagues/235.png',
      leagueId: 235, isTopTier: true,
      homeTeam: 'Persija Jakarta', awayTeam: 'Persib Bandung',
      homeLogo: '', awayLogo: '',
      homeScore: 2, awayScore: 1, status: 'LIVE', minute: 55,
      matchDate: makeDate(-1800000),
      homeEvents: [{ type: 'goal', minute: 12, player: 'Marko Simic' }, { type: 'goal', minute: 48, player: 'Marc Klok' }],
      awayEvents: [{ type: 'goal', minute: 34, player: 'Ciro Alves' }],
    },
    {
      id: 'mock-4', league: 'Serie A', leagueLogo: 'https://media.api-sports.io/football/leagues/135.png',
      leagueId: 135, isTopTier: true,
      homeTeam: 'Inter Milan', awayTeam: 'AC Milan',
      homeLogo: 'https://media.api-sports.io/football/teams/505.png',
      awayLogo: 'https://media.api-sports.io/football/teams/489.png',
      homeScore: 1, awayScore: 0, status: 'FT', minute: null,
      matchDate: makeDate(-7200000),
      homeEvents: [{ type: 'goal', minute: 72, player: 'Lautaro Martínez' }],
      awayEvents: [],
    },
    {
      id: 'mock-6', league: 'Ligue 1', leagueLogo: 'https://media.api-sports.io/football/leagues/61.png',
      leagueId: 61, isTopTier: true,
      homeTeam: 'PSG', awayTeam: 'Marseille',
      homeLogo: 'https://media.api-sports.io/football/teams/85.png',
      awayLogo: 'https://media.api-sports.io/football/teams/81.png',
      homeScore: 2, awayScore: 2, status: 'FT', minute: null,
      matchDate: makeDate(-9000000),
      homeEvents: [{ type: 'goal', minute: 10, player: 'Dembélé' }, { type: 'goal', minute: 60, player: 'Barcola' }],
      awayEvents: [{ type: 'goal', minute: 35, player: 'Aubameyang' }, { type: 'goal', minute: 78, player: 'Guendouzi' }],
    },
    {
      id: 'mock-3', league: 'Champions League', leagueLogo: 'https://media.api-sports.io/football/leagues/2.png',
      leagueId: 2, isTopTier: true,
      homeTeam: 'Liverpool', awayTeam: 'PSG',
      homeLogo: 'https://media.api-sports.io/football/teams/40.png',
      awayLogo: 'https://media.api-sports.io/football/teams/85.png',
      homeScore: 0, awayScore: 0, status: 'NS', minute: null,
      matchDate: makeDate(7200000),
      homeEvents: [], awayEvents: [],
    },
    {
      id: 'mock-5', league: 'Bundesliga', leagueLogo: 'https://media.api-sports.io/football/leagues/78.png',
      leagueId: 78, isTopTier: true,
      homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund',
      homeLogo: 'https://media.api-sports.io/football/teams/157.png',
      awayLogo: 'https://media.api-sports.io/football/teams/165.png',
      homeScore: 0, awayScore: 0, status: 'NS', minute: null,
      matchDate: makeDate(10800000),
      homeEvents: [], awayEvents: [],
    },
    {
      id: 'mock-8', league: 'Eredivisie', leagueLogo: 'https://media.api-sports.io/football/leagues/88.png',
      leagueId: 88, isTopTier: false,
      homeTeam: 'Ajax', awayTeam: 'PSV Eindhoven',
      homeLogo: 'https://media.api-sports.io/football/teams/194.png',
      awayLogo: 'https://media.api-sports.io/football/teams/197.png',
      homeScore: 0, awayScore: 0, status: 'NS', minute: null,
      matchDate: makeDate(14400000),
      homeEvents: [], awayEvents: [],
    },
    {
      id: 'mock-9', league: 'Saudi Pro League', leagueLogo: 'https://media.api-sports.io/football/leagues/307.png',
      leagueId: 307, isTopTier: false,
      homeTeam: 'Al Hilal', awayTeam: 'Al Nassr',
      homeLogo: 'https://media.api-sports.io/football/teams/2939.png',
      awayLogo: 'https://media.api-sports.io/football/teams/2937.png',
      homeScore: 0, awayScore: 0, status: 'NS', minute: null,
      matchDate: makeDate(18000000),
      homeEvents: [], awayEvents: [],
    },
    {
      id: 'mock-10', league: 'J-League', leagueLogo: 'https://media.api-sports.io/football/leagues/98.png',
      leagueId: 98, isTopTier: false,
      homeTeam: 'Tokyo Verdy', awayTeam: 'Yokohama F. Marinos',
      homeLogo: '', awayLogo: '',
      homeScore: 0, awayScore: 0, status: 'NS', minute: null,
      matchDate: makeDate(21600000),
      homeEvents: [], awayEvents: [],
    },
    {
      id: 'mock-11', league: 'Primeira Liga', leagueLogo: 'https://media.api-sports.io/football/leagues/94.png',
      leagueId: 94, isTopTier: false,
      homeTeam: 'Benfica', awayTeam: 'Porto',
      homeLogo: 'https://media.api-sports.io/football/teams/211.png',
      awayLogo: 'https://media.api-sports.io/football/teams/212.png',
      homeScore: 1, awayScore: 1, status: 'FT', minute: null,
      matchDate: makeDate(-10800000),
      homeEvents: [{ type: 'goal', minute: 22, player: 'Pavlidis' }],
      awayEvents: [{ type: 'goal', minute: 67, player: 'Taremi' }],
    },
    {
      id: 'mock-12', league: 'Süper Lig', leagueLogo: 'https://media.api-sports.io/football/leagues/203.png',
      leagueId: 203, isTopTier: false,
      homeTeam: 'Galatasaray', awayTeam: 'Fenerbahçe',
      homeLogo: 'https://media.api-sports.io/football/teams/645.png',
      awayLogo: 'https://media.api-sports.io/football/teams/644.png',
      homeScore: 0, awayScore: 0, status: 'NS', minute: null,
      matchDate: makeDate(25200000),
      homeEvents: [], awayEvents: [],
    },
    // ── Liga non-GOALZONE (akan di-filter di klien) ──
    {
      id: 'mock-13', league: 'Veikkausliiga', leagueLogo: '',
      leagueId: 244, isTopTier: false,
      homeTeam: 'HJK Helsinki', awayTeam: 'KuPS',
      homeLogo: '', awayLogo: '',
      homeScore: 1, awayScore: 0, status: 'FT', minute: null,
      matchDate: makeDate(-7200000),
      homeEvents: [{ type: 'goal', minute: 55, player: 'Riski' }],
      awayEvents: [],
    },
  ].sort((a, b) => {
    const statusOrder: Record<string, number> = { LIVE: 0, HT: 1, FT: 2, NS: 3 }
    const sa = statusOrder[a.status] ?? 4
    const sb = statusOrder[b.status] ?? 4
    if (sa !== sb) return sa - sb
    return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
  })
}

// ─── GET handler ─────────────────────────────────────────────
export async function GET() {
  // 1. Try Supabase first
  const supabaseMatches = await fetchFromSupabase()
  if (supabaseMatches && supabaseMatches.length > 0) {
    return NextResponse.json({
      matches: supabaseMatches,
      source: 'supabase',
      goalzoneLeagueIds: Object.keys(GOALZONE_LEAGUES).map(Number),
    })
  }

  // 2. Try Prisma (SQLite local DB)
  const prismaMatches = await fetchFromPrisma()
  if (prismaMatches && prismaMatches.length > 0) {
    return NextResponse.json({
      matches: prismaMatches,
      source: 'prisma',
      goalzoneLeagueIds: Object.keys(GOALZONE_LEAGUES).map(Number),
    })
  }

  // 3. Try API-Football: /fixtures?date=today (SINGLE CALL for all world matches)
  const apiMatches = await fetchFromAPIFootball()
  if (apiMatches && apiMatches.length > 0) {
    return NextResponse.json({
      matches: apiMatches,
      source: 'api-football',
      goalzoneLeagueIds: Object.keys(GOALZONE_LEAGUES).map(Number),
      totalFetched: apiMatches.length,
      goalzoneMatchCount: apiMatches.filter(m => GOALZONE_LEAGUES[m.leagueId]).length,
    })
  }

  // 4. Fallback mock data
  return NextResponse.json({
    matches: getMockMatches(),
    source: 'mock',
    goalzoneLeagueIds: Object.keys(GOALZONE_LEAGUES).map(Number),
    message: 'Data dari sample. Set FOOTBALL_API_KEY untuk data real-time dari /fixtures?date=today.',
  })
=======
      card: e.detail?.toLowerCase().includes('red') ? 'red' :
            e.detail?.toLowerCase().includes('yellow') ? 'yellow' : null,
    }));
}

// ─── GET Handler ───────────────────────────────────────────────
export async function GET(request: Request) {
  // Jika API key belum dikonfigurasi
  if (!isFootballApiConfigured) {
    return NextResponse.json({
      matches: [],
      source: 'none',
      error: 'FOOTBALL_API_KEY belum dikonfigurasi. Tambahkan FOOTBALL_API_KEY di .env atau Vercel Environment Variables.',
      hint: 'Dapatkan API key dari https://www.api-football.com/',
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const leagueParam = searchParams.get('league');
    const seasonParam = searchParams.get('season');
    const teamParam = searchParams.get('team');
    const lastParam = searchParams.get('last');
    const nextParam = searchParams.get('next');

    // ─── Build query params ──────────────────────────────────
    const query = new URLSearchParams();
    query.set('timezone', 'Asia/Jakarta');

    if (dateParam) {
      query.set('date', dateParam);
    } else if (teamParam) {
      // Jika ada team param, cari pertandingan tim tertentu
      query.set('team', teamParam);
      if (lastParam) query.set('last', lastParam);
      else if (nextParam) query.set('next', nextParam);
      else query.set('last', '10');
    } else if (leagueParam) {
      // Jika ada league param
      query.set('league', leagueParam);
      if (seasonParam) query.set('season', seasonParam);
      else query.set('season', String(new Date().getFullYear()));
      if (lastParam) query.set('last', lastParam);
      else query.set('last', '20');
    } else {
      // Default: hari ini + besok
      const today = new Date().toISOString().split('T')[0];
      query.set('date', today);
    }

    // ─── Fetch dari Football API ────────────────────────────
    const response = await footballFetch(`/fixtures?${query.toString()}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      // Handle rate limit (429) gracefully
      if (response.status === 429) {
        console.warn('[Matches API] Rate limit hit (429)');
        return NextResponse.json({
          matches: [],
          source: 'api-football',
          error: 'Limit API habis. Data sedang diperbarui, coba lagi nanti.',
          rateLimited: true,
        });
      }
      throw new Error(`Football API error: ${response.status}`);
    }

    const data = await response.json();
    const fixtures: any[] = data.response || [];

    // ─── Map fixtures ke format GOALZONE ────────────────────
    const matches = fixtures.map((f: any) => {
      const homeEvents = extractEvents(f.events || [], f.teams.home.id);
      const awayEvents = extractEvents(f.events || [], f.teams.away.id);
      const isGoalzoneLeague = GOALZONE_LEAGUE_IDS.includes(f.league.id);

      return {
        id: String(f.fixture.id),
        league: f.league.name,
        leagueLogo: f.league.logo || '',
        leagueId: f.league.id,
        leagueName: f.league.name,
        country: f.league.country || '',
        homeTeam: f.teams.home.name,
        awayTeam: f.teams.away.name,
        homeLogo: f.teams.home.logo || '',
        awayLogo: f.teams.away.logo || '',
        homeScore: f.goals.home ?? 0,
        awayScore: f.goals.away ?? 0,
        status: mapStatus(f.fixture.status.short),
        minute: f.fixture.status.elapsed || null,
        matchDate: f.fixture.date,
        isTopTier: isGoalzoneLeague,
        homeEvents,
        awayEvents,
      };
    });

    // ─── Sort: LIVE → HT → NS → FT ─────────────────────────
    const statusOrder: Record<string, number> = { LIVE: 0, HT: 1, NS: 2, FT: 3 };
    matches.sort((a, b) => {
      const sa = statusOrder[a.status] ?? 4;
      const sb = statusOrder[b.status] ?? 4;
      if (sa !== sb) return sa - sb;
      return new Date(a.matchDate || 0).getTime() - new Date(b.matchDate || 0).getTime();
    });

    return NextResponse.json({
      matches,
      source: 'api-football',
      total: matches.length,
    });
  } catch (error: any) {
    console.error('[Matches API] Error:', error.message);
    return NextResponse.json({
      matches: [],
      source: 'none',
      error: `Gagal mengambil data pertandingan: ${error.message}`,
    }, { status: 500 });
  }
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
}
