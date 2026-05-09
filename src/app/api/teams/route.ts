import { NextRequest, NextResponse } from 'next/server';
import { footballFetch, isFootballApiConfigured } from '@/lib/football-api';

// ============================================================
// GOALZONE — Team Profile API
// ============================================================
// GET /api/teams?slug=real-madrid
// GET /api/teams?id=541
// GET /api/teams?name=Real+Madrid
//
// Returns: team info, squad, standings, recent fixtures
// All data comes from API-Football when API key is configured.
// ============================================================

export const revalidate = 1800; // 30 min cache
export const dynamic = 'force-dynamic';

// ─── Team slug → API-Football team ID mapping ───────────────
const TEAM_SLUG_MAP: Record<string, { id: number; name: string; season: number }> = {
  'manchester-city': { id: 50, name: 'Manchester City', season: 2024 },
  'real-madrid': { id: 541, name: 'Real Madrid', season: 2024 },
  'barcelona': { id: 529, name: 'Barcelona', season: 2024 },
  'bayern-munich': { id: 157, name: 'Bayern Munich', season: 2024 },
  'psg': { id: 85, name: 'Paris Saint Germain', season: 2024 },
  'liverpool': { id: 40, name: 'Liverpool', season: 2024 },
  'manchester-united': { id: 33, name: 'Manchester United', season: 2024 },
  'arsenal': { id: 42, name: 'Arsenal', season: 2024 },
  'chelsea': { id: 49, name: 'Chelsea', season: 2024 },
  'juventus': { id: 496, name: 'Juventus', season: 2024 },
  'ac-milan': { id: 489, name: 'AC Milan', season: 2024 },
  'inter-milan': { id: 505, name: 'Inter', season: 2024 },
  'atletico-madrid': { id: 530, name: 'Atletico Madrid', season: 2024 },
  'borussia-dortmund': { id: 165, name: 'Borussia Dortmund', season: 2024 },
  'napoli': { id: 492, name: 'Napoli', season: 2024 },
  'tottenham': { id: 47, name: 'Tottenham', season: 2024 },
  'roma': { id: 497, name: 'Roma', season: 2024 },
  'benfica': { id: 211, name: 'Benfica', season: 2024 },
  'ajax': { id: 194, name: 'Ajax', season: 2024 },
  'porto': { id: 212, name: 'Porto', season: 2024 },
  'west-ham': { id: 48, name: 'West Ham', season: 2024 },
  'aston-villa': { id: 66, name: 'Aston Villa', season: 2024 },
  'newcastle': { id: 34, name: 'Newcastle', season: 2024 },
  'brighton': { id: 51, name: 'Brighton', season: 2024 },
  'wolverhampton': { id: 39, name: 'Wolverhampton', season: 2024 },
  'crystal-palace': { id: 52, name: 'Crystal Palace', season: 2024 },
  'fulham': { id: 36, name: 'Fulham', season: 2024 },
  'bournemouth': { id: 35, name: 'Bournemouth', season: 2024 },
  'nottingham-forest': { id: 65, name: 'Nottingham Forest', season: 2024 },
  'brentford': { id: 55, name: 'Brentford', season: 2024 },
  'everton': { id: 45, name: 'Everton', season: 2024 },
  'sevilla': { id: 536, name: 'Sevilla', season: 2024 },
  'villarreal': { id: 533, name: 'Villarreal', season: 2024 },
  'real-sociedad': { id: 548, name: 'Real Sociedad', season: 2024 },
  'roma': { id: 497, name: 'Roma', season: 2024 },
  'lazio': { id: 487, name: 'Lazio', season: 2024 },
  'fiorentina': { id: 502, name: 'Fiorentina', season: 2024 },
  'atalanta': { id: 499, name: 'Atalanta', season: 2024 },
  'rb-leipzig': { id: 173, name: 'RB Leipzig', season: 2024 },
  'bayer-leverkusen': { id: 168, name: 'Bayer Leverkusen', season: 2024 },
  'stuttgart': { id: 172, name: 'Stuttgart', season: 2024 },
  'eintracht-frankfurt': { id: 169, name: 'Eintracht Frankfurt', season: 2024 },
  'marseille': { id: 81, name: 'Marseille', season: 2024 },
  'lyon': { id: 80, name: 'Lyon', season: 2024 },
  'monaco': { id: 91, name: 'Monaco', season: 2024 },
  'lisboa': { id: 211, name: 'Benfica', season: 2024 },
  'sporting-cp': { id: 228, name: 'Sporting CP', season: 2024 },
  'psv': { id: 197, name: 'PSV', season: 2024 },
  'feyenoord': { id: 215, name: 'Feyenoord', season: 2024 },
  'celtic': { id: 247, name: 'Celtic', season: 2024 },
  'rangers': { id: 257, name: 'Rangers', season: 2024 },
  'galatasaray': { id: 645, name: 'Galatasaray', season: 2024 },
  'fenerbahce': { id: 611, name: 'Fenerbahce', season: 2024 },
  'flamengo': { id: 127, name: 'Flamengo', season: 2024 },
  'palmeiras': { id: 123, name: 'Palmeiras', season: 2024 },
  'corinthians': { id: 97, name: 'Corinthians', season: 2024 },
  'river-plate': { id: 435, name: 'River Plate', season: 2024 },
  'boca-juniors': { id: 437, name: 'Boca Juniors', season: 2024 },
  'la-galaxy': { id: 1595, name: 'LA Galaxy', season: 2024 },
  'inter-miami': { id: 1591, name: 'Inter Miami', season: 2024 },
  'al-hilal': { id: 2930, name: 'Al Hilal', season: 2024 },
  'al-nassr': { id: 2932, name: 'Al Nassr', season: 2024 },
  'al-ittihad': { id: 2936, name: 'Al Ittihad', season: 2024 },
  'urawa-red-diamonds': { id: 294, name: 'Urawa Red Diamonds', season: 2024 },
  'fc-tokyo': { id: 308, name: 'FC Tokyo', season: 2024 },
  'jeonbuk-hyundai': { id: 295, name: 'Jeonbuk Hyundai', season: 2024 },
};

// ─── Position normalization ──────────────────────────────────
function normalizePosition(pos: string): string {
  const p = (pos || '').toLowerCase().trim();
  if (p.includes('goalkeeper') || p === 'gk') return 'GK';
  if (p.includes('defender') || p === 'def') return 'DEF';
  if (p.includes('midfield') || p === 'mid') return 'MID';
  if (p.includes('attack') || p.includes('forward') || p === 'fwd') return 'FWD';
  return p.toUpperCase().substring(0, 3);
}

// ─── Player photo URL from API-Football ──────────────────────
function playerPhotoUrl(playerId: number): string {
  return `https://media.api-sports.io/football/players/${playerId}.png`;
}

// ─── Country → League ID mapping (for standings lookup) ──────
const COUNTRY_LEAGUE_MAP: Record<string, number> = {
  'England': 39, 'Spain': 140, 'Germany': 78, 'France': 61,
  'Italy': 135, 'Portugal': 94, 'Netherlands': 88, 'Turkey': 203,
  'Brazil': 71, 'Argentina': 128, 'USA': 253, 'Saudi-Arabia': 307,
  'Japan': 98, 'South-Korea': 292, 'Scotland': 179, 'Belgium': 144,
  'Mexico': 262, 'Colombia': 239, 'Chile': 265, 'Uruguay': 274,
  'Ecuador': 263, 'Paraguay': 271, 'Peru': 275, 'Venezuela': 276,
  'China': 169, 'Australia': 188, 'Indonesia': 235,
  'World': 2, 'Europe': 2,
};

// ─── GET Handler ────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const teamId = searchParams.get('id');
  const teamName = searchParams.get('name');

  // ─── Resolve team ID ────────────────────────────────────
  let resolvedId: number | null = teamId ? parseInt(teamId) : null;
  let resolvedSlug = slug || '';
  let resolvedName = '';
  let season = 2024;

  if (slug && TEAM_SLUG_MAP[slug]) {
    resolvedId = TEAM_SLUG_MAP[slug].id;
    resolvedName = TEAM_SLUG_MAP[slug].name;
    season = TEAM_SLUG_MAP[slug].season;
  }

  if (!resolvedId && !isFootballApiConfigured) {
    return NextResponse.json({
      success: false,
      error: 'FOOTBALL_API_KEY belum dikonfigurasi. Tambahkan FOOTBALL_API_KEY di .env atau Vercel Environment Variables.',
      hint: 'Dapatkan API key dari https://www.api-football.com/ atau https://rapidapi.com/api-sports/api/api-football',
    }, { status: 503 });
  }

  if (!resolvedId && isFootballApiConfigured) {
    // Try to find team by name via search
    if (teamName || slug) {
      const searchName = teamName || (slug || '').replace(/-/g, ' ');
      try {
        const searchRes = await footballFetch(`/teams?search=${encodeURIComponent(searchName)}`, {
          next: { revalidate: 86400 },
        });
        const searchData = await searchRes.json();
        const firstResult = searchData?.response?.[0]?.team;
        if (firstResult) {
          resolvedId = firstResult.id;
          resolvedName = firstResult.name;
          resolvedSlug = resolvedSlug || firstResult.name.toLowerCase().replace(/\s+/g, '-');
        }
      } catch {
        // Search failed
      }
    }
  }

  if (!resolvedId) {
    return NextResponse.json({ success: false, error: 'Team tidak ditemukan' }, { status: 404 });
  }

  try {
    // ─── 1. Team Info ─────────────────────────────────────
    const teamRes = await footballFetch(`/teams?id=${resolvedId}`, {
      next: { revalidate: 3600 },
    });
    const teamData = await teamRes.json();
    const teamRaw = teamData?.response?.[0]?.team;
    const venueRaw = teamData?.response?.[0]?.venue;

    if (!teamRaw) {
      return NextResponse.json({ success: false, error: `Team dengan ID ${resolvedId} tidak ditemukan di API` }, { status: 404 });
    }

    const teamInfo = {
      id: teamRaw.id,
      name: teamRaw.name,
      slug: resolvedSlug || teamRaw.name.toLowerCase().replace(/\s+/g, '-'),
      logo: teamRaw.logo,
      country: teamRaw.country,
      founded: teamRaw.founded,
      venue: venueRaw?.name || 'Unknown',
      venueCapacity: venueRaw?.capacity || 0,
    };

    // ─── 2. Squad (from /players/squads) ──────────────────
    let squad: any[] = [];
    try {
      const squadRes = await footballFetch(`/players/squads?team=${resolvedId}`, {
        next: { revalidate: 3600 },
      });
      const squadData = await squadRes.json();
      const squadList = squadData?.response?.[0]?.players || [];
      squad = squadList.map((p: any) => ({
        id: p.id,
        name: p.name,
        number: p.number || '-',
        position: normalizePosition(p.position),
        photo: playerPhotoUrl(p.id),
      }));
    } catch (err: any) {
      console.warn('[Team API] Squad endpoint failed:', err?.message || err);
    }

    // ─── 3. Standings (league rank + W/D/L + form) ───────
    let standings = null;
    try {
      // Determine league from team country
      const leagueId = COUNTRY_LEAGUE_MAP[teamRaw.country] || 39;

      const standingsRes = await footballFetch(`/standings?league=${leagueId}&season=${season}`, {
        next: { revalidate: 1800 },
      });
      const standingsData = await standingsRes.json();
      const allStandings = standingsData?.response?.[0]?.league?.standings?.[0] || [];

      const teamStanding = allStandings.find((s: any) => s.team?.id === resolvedId);
      if (teamStanding) {
        standings = {
          rank: teamStanding.rank,
          played: teamStanding.all?.played,
          won: teamStanding.all?.win,
          drawn: teamStanding.all?.draw,
          lost: teamStanding.all?.lose,
          goalsFor: teamStanding.all?.goals?.for,
          goalsAgainst: teamStanding.all?.goals?.against,
          points: teamStanding.points,
          form: (teamStanding.form || '').split('').map((c: string) => c === 'W' ? 'W' : c === 'D' ? 'D' : 'L'),
          league: standingsData?.response?.[0]?.league?.name,
          leagueLogo: standingsData?.response?.[0]?.league?.logo,
        };
      }
    } catch (err: any) {
      console.warn('[Team API] Standings failed:', err?.message || err);
    }

    // ─── 4. Recent Fixtures (last 5) ──────────────────────
    let fixtures: any[] = [];
    try {
      const fixturesRes = await footballFetch(`/fixtures?team=${resolvedId}&last=5`, {
        next: { revalidate: 1800 },
      });
      const fixturesData = await fixturesRes.json();

      fixtures = (fixturesData?.response || []).map((f: any) => ({
        id: f.fixture?.id,
        homeTeam: f.teams?.home?.name,
        awayTeam: f.teams?.away?.name,
        homeLogo: f.teams?.home?.logo,
        awayLogo: f.teams?.away?.logo,
        homeScore: f.goals?.home,
        awayScore: f.goals?.away,
        status: f.fixture?.status?.short,
        date: f.fixture?.date,
        league: f.league?.name,
        leagueLogo: f.league?.logo,
        minute: f.fixture?.status?.elapsed || null,
      }));
    } catch (err: any) {
      console.warn('[Team API] Fixtures failed:', err?.message || err);
    }

    return NextResponse.json({
      success: true,
      info: teamInfo,
      standings,
      squad,
      fixtures,
      source: 'api-football',
    });
  } catch (err: any) {
    console.error('[Team API Error]', err.message);
    return NextResponse.json({
      success: false,
      error: `Gagal mengambil data tim: ${err.message}`,
    }, { status: 500 });
  }
}
