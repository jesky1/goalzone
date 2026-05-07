import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

// ISR: cache selama 5 menit, auto-regenerate di background
export const revalidate = 300;

// ─── Types ──────────────────────────────────────────────────

interface MatchResultRow {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  match_date: string;
  league: string | null;
  season: number | null;
  venue: string | null;
  match_week: number | null;
  status: string;
  home_team_logo_url: string | null;
  away_team_logo_url: string | null;
  notes: string | null;
}

interface MatchResultAPI {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  league: string | null;
  season: number | null;
  venue: string | null;
  matchWeek: number | null;
  status: string;
  homeTeamLogoUrl: string | null;
  awayTeamLogoUrl: string | null;
  notes: string | null;
}

function mapMatch(row: MatchResultRow): MatchResultAPI {
  return {
    id: row.id,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    homeScore: row.home_score,
    awayScore: row.away_score,
    matchDate: row.match_date,
    league: row.league,
    season: row.season,
    venue: row.venue,
    matchWeek: row.match_week,
    status: row.status,
    homeTeamLogoUrl: row.home_team_logo_url,
    awayTeamLogoUrl: row.away_team_logo_url,
    notes: row.notes,
  };
}

// ─── Mock Data (fallback jika Supabase belum dikonfigurasi) ──

// Common team logo URLs from API-Football CDN
const TEAM_LOGOS: Record<string, string> = {
  'Arsenal': 'https://media.api-sports.io/football/teams/42.png',
  'Manchester City': 'https://media.api-sports.io/football/teams/50.png',
  'Liverpool': 'https://media.api-sports.io/football/teams/40.png',
  'Chelsea': 'https://media.api-sports.io/football/teams/49.png',
  'Real Madrid': 'https://media.api-sports.io/football/teams/541.png',
  'Barcelona': 'https://media.api-sports.io/football/teams/529.png',
  'AC Milan': 'https://media.api-sports.io/football/teams/489.png',
  'Inter Milan': 'https://media.api-sports.io/football/teams/505.png',
  'Juventus': 'https://media.api-sports.io/football/teams/496.png',
  'Napoli': 'https://media.api-sports.io/football/teams/492.png',
  'Bayern Munich': 'https://media.api-sports.io/football/teams/157.png',
  'Borussia Dortmund': 'https://media.api-sports.io/football/teams/165.png',
  'RB Leipzig': 'https://media.api-sports.io/football/teams/173.png',
  'PSG': 'https://media.api-sports.io/football/teams/85.png',
  'Marseille': 'https://media.api-sports.io/football/teams/81.png',
};

function getTeamLogo(teamName: string): string | null {
  return TEAM_LOGOS[teamName] || null;
}

function getMockResults(statusFilter: string = 'all'): MatchResultAPI[] {
  const all: MatchResultAPI[] = [
    // ── Scheduled (Upcoming) ──
    {
      id: 'mock-up1',
      homeTeam: 'Liverpool',
      awayTeam: 'Arsenal',
      homeScore: 0, awayScore: 0,
      matchDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      league: 'Premier League', season: 2025, venue: 'Anfield', matchWeek: 31,
      status: 'scheduled',
      homeTeamLogoUrl: getTeamLogo('Liverpool'),
      awayTeamLogoUrl: getTeamLogo('Arsenal'),
      notes: 'Big Match',
    },
    {
      id: 'mock-up2',
      homeTeam: 'Juventus',
      awayTeam: 'Napoli',
      homeScore: 0, awayScore: 0,
      matchDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      league: 'Serie A', season: 2025, venue: 'Allianz Stadium', matchWeek: 30,
      status: 'scheduled',
      homeTeamLogoUrl: getTeamLogo('Juventus'),
      awayTeamLogoUrl: getTeamLogo('Napoli'),
      notes: null,
    },
    {
      id: 'mock-up3',
      homeTeam: 'Bayern Munich',
      awayTeam: 'RB Leipzig',
      homeScore: 0, awayScore: 0,
      matchDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      league: 'Bundesliga', season: 2025, venue: 'Allianz Arena', matchWeek: 27,
      status: 'scheduled',
      homeTeamLogoUrl: getTeamLogo('Bayern Munich'),
      awayTeamLogoUrl: getTeamLogo('RB Leipzig'),
      notes: null,
    },
    // ── Finished ──
    {
      id: 'mock-1',
      homeTeam: 'Arsenal',
      awayTeam: 'Manchester City',
      homeScore: 2, awayScore: 1,
      matchDate: new Date().toISOString().split('T')[0],
      league: 'Premier League', season: 2025, venue: 'Emirates Stadium', matchWeek: 28,
      status: 'finished',
      homeTeamLogoUrl: getTeamLogo('Arsenal'),
      awayTeamLogoUrl: getTeamLogo('Manchester City'),
      notes: null,
    },
    {
      id: 'mock-2',
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      homeScore: 3, awayScore: 3,
      matchDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      league: 'La Liga', season: 2025, venue: 'Santiago Bernabéu', matchWeek: 30,
      status: 'finished',
      homeTeamLogoUrl: getTeamLogo('Real Madrid'),
      awayTeamLogoUrl: getTeamLogo('Barcelona'),
      notes: 'El Clásico',
    },
    {
      id: 'mock-3',
      homeTeam: 'AC Milan',
      awayTeam: 'Inter Milan',
      homeScore: 1, awayScore: 2,
      matchDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      league: 'Serie A', season: 2025, venue: 'San Siro', matchWeek: 29,
      status: 'finished',
      homeTeamLogoUrl: getTeamLogo('AC Milan'),
      awayTeamLogoUrl: getTeamLogo('Inter Milan'),
      notes: 'Derby della Madonnina',
    },
    {
      id: 'mock-4',
      homeTeam: 'Bayern Munich',
      awayTeam: 'Borussia Dortmund',
      homeScore: 4, awayScore: 2,
      matchDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      league: 'Bundesliga', season: 2025, venue: 'Allianz Arena', matchWeek: 26,
      status: 'finished',
      homeTeamLogoUrl: getTeamLogo('Bayern Munich'),
      awayTeamLogoUrl: getTeamLogo('Borussia Dortmund'),
      notes: null,
    },
    {
      id: 'mock-5',
      homeTeam: 'Liverpool',
      awayTeam: 'Chelsea',
      homeScore: 0, awayScore: 0,
      matchDate: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
      league: 'Premier League', season: 2025, venue: 'Anfield', matchWeek: 27,
      status: 'postponed',
      homeTeamLogoUrl: getTeamLogo('Liverpool'),
      awayTeamLogoUrl: getTeamLogo('Chelsea'),
      notes: 'Ditunda karena cuaca buruk',
    },
    {
      id: 'mock-6',
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      homeScore: 2, awayScore: 0,
      matchDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      league: 'Ligue 1', season: 2025, venue: 'Parc des Princes', matchWeek: 25,
      status: 'finished',
      homeTeamLogoUrl: getTeamLogo('PSG'),
      awayTeamLogoUrl: getTeamLogo('Marseille'),
      notes: 'Le Classique',
    },
  ];

  if (statusFilter === 'all') return all;
  return all.filter(m => m.status === statusFilter);
}

// ─── GET /api/match-results ──────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') || '20'), 50);
  const statusFilter = searchParams.get('status') || 'finished';

  try {
    const supabase = createServerSupabaseClient();

    let query = supabase
      .from('match_results')
      .select('*', { count: 'exact' })
      .order('match_date', { ascending: false })
      .limit(limit);

    // Status filter: 'all' = no filter, specific status = .eq()
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      // Jika tabel belum ada atau RLS blokir, fallback ke mock
      if (error.code === '42P01' || error.code === '42501') {
        console.warn(`[match-results] Table/RLS issue (${error.code}), using mock data`);
        return NextResponse.json({
          success: true,
          matches: getMockResults(statusFilter),
          total: getMockResults(statusFilter).length,
          source: 'mock',
        });
      }
      throw error;
    }

    const matches = (data ?? []).map(mapMatch);

    // Jika kosong, fallback ke mock agar UI tetap menampilkan sesuatu
    if (matches.length === 0) {
      return NextResponse.json({
        success: true,
        matches: getMockResults(statusFilter),
        total: getMockResults(statusFilter).length,
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      matches,
      total: count ?? matches.length,
      source: 'supabase',
    });
  } catch (error: any) {
    console.error('[match-results GET Error]', error.message);
    return NextResponse.json({
      success: true,
      matches: getMockResults(statusFilter),
      total: getMockResults(statusFilter).length,
      source: 'mock',
      error: error.message,
    });
  }
}
