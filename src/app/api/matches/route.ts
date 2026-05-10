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
  return events
    .filter((e: any) => e.team.id === teamId && (e.type === 'goal' || e.type === 'card'))
    .map((e: any) => ({
      type: e.type === 'goal' ? 'goal' : 'card',
      minute: e.time.elapsed,
      player: e.player.name,
      detail: e.detail || undefined,
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
}
