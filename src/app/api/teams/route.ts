import { NextRequest, NextResponse } from 'next/server';
import { footballFetch, isFootballApiConfigured } from '@/lib/football-api';

// ============================================================
// GOALZONE — Team Profile API
// ============================================================
// GET /api/teams?slug=real-madrid
// GET /api/teams?id=541
//
// Returns: team info, squad, standings, recent fixtures
// ============================================================

export const revalidate = 1800; // 30 min cache

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
};

// ─── Position normalization ──────────────────────────────────
// API-Football /players/squads returns positions like "Goalkeeper", "Defender", etc.
// We normalize them to short codes for UI consistency.
function normalizePosition(pos: string): string {
  const p = (pos || '').toLowerCase().trim();
  if (p.includes('goalkeeper') || p === 'gk') return 'GK';
  if (p.includes('defender') || p === 'def') return 'DEF';
  if (p.includes('midfield') || p === 'mid') return 'MID';
  if (p.includes('attack') || p.includes('forward') || p === 'fwd') return 'FWD';
  return p.toUpperCase().substring(0, 3);
}

// ─── Map API position to player photo path ──────────────────
// API-Football player photos follow a predictable URL pattern:
// https://media.api-sports.io/football/players/{playerId}.png
function playerPhotoUrl(playerId: number): string {
  return `https://media.api-sports.io/football/players/${playerId}.png`;
}

// ─── Mock Data ──────────────────────────────────────────────
function getMockTeam(slug: string) {
  const info = TEAM_SLUG_MAP[slug] || { id: 0, name: slug.replace(/-/g, ' '), season: 2024 };
  return {
    info: {
      id: info.id,
      name: info.name,
      slug,
      logo: `https://media.api-sports.io/football/teams/${info.id}.png`,
      country: 'World',
      founded: 1900,
      venue: 'Stadium',
      venueCapacity: 50000,
    },
    standings: { rank: 1, played: 30, won: 20, drawn: 5, lost: 5, goalsFor: 65, goalsAgainst: 25, points: 65, form: ['W','W','D','W','L'] },
    squad: [],
    fixtures: [
      { id: 100, homeTeam: info.name, awayTeam: 'Opponent FC', homeScore: 2, awayScore: 1, status: 'FT', date: '2025-01-15', league: 'League' },
      { id: 101, homeTeam: 'Rival FC', awayTeam: info.name, homeScore: 0, awayScore: 3, status: 'FT', date: '2025-01-10', league: 'League' },
      { id: 102, homeTeam: info.name, awayTeam: 'Guest FC', homeScore: 1, awayScore: 1, status: 'FT', date: '2025-01-05', league: 'Cup' },
      { id: 103, homeTeam: 'Away FC', awayTeam: info.name, homeScore: 2, awayScore: 0, status: 'FT', date: '2024-12-28', league: 'League' },
      { id: 104, homeTeam: info.name, awayTeam: 'Visitor FC', homeScore: 4, awayScore: 2, status: 'FT', date: '2024-12-22', league: 'League' },
    ],
    source: 'mock',
  };
}

// ─── GET Handler ────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const teamId = searchParams.get('id');

  // Resolve team ID from slug or direct ID
  let resolvedId: number | null = teamId ? parseInt(teamId) : null;
  let resolvedSlug = slug || '';
  let season = 2024;

  if (slug && TEAM_SLUG_MAP[slug]) {
    resolvedId = TEAM_SLUG_MAP[slug].id;
    season = TEAM_SLUG_MAP[slug].season;
  }

  if (!resolvedId) {
    return NextResponse.json({ success: false, error: 'Team tidak ditemukan' }, { status: 404 });
  }

  // If API not configured, return mock (empty squad — no fake players)
  if (!isFootballApiConfigured) {
    return NextResponse.json({ success: true, ...getMockTeam(resolvedSlug || `team-${resolvedId}`) });
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
      // API returned no results — fall back to mock
      return NextResponse.json({ success: true, ...getMockTeam(resolvedSlug || `team-${resolvedId}`), source: 'mock-fallback' });
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
    // This endpoint returns the current squad with real player names,
    // numbers, and positions. Photo URLs are constructed from player IDs.
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
    } catch (err) {
      console.warn('[Team API] Squad endpoint failed:', err);
      // Squad endpoint may not be available on all plans
    }

    // ─── 3. Standings (league rank + W/D/L) ──────────────
    let standings = null;
    try {
      // Find league from team's country — try major leagues first
      const leagueMap: Record<string, number> = {
        'England': 39, 'Spain': 140, 'Germany': 78, 'France': 61,
        'Italy': 135, 'Portugal': 94, 'Netherlands': 88, 'Turkey': 203,
        'Brazil': 71, 'Argentina': 128, 'USA': 253, 'Saudi-Arabia': 307,
        'Japan': 98, 'South-Korea': 292, 'Scotland': 179, 'Belgium': 144,
      };

      // Determine league ID from country
      let leagueId = leagueMap[teamRaw.country] || 39;

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
    } catch {
      // Standings may not be available
    }

    // ─── 4. Recent Fixtures ───────────────────────────────
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
    } catch {
      // Fixtures may not be available
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
    return NextResponse.json({ success: true, ...getMockTeam(resolvedSlug || `team-${resolvedId}`), source: 'mock-fallback' });
  }
}
