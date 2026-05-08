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
  referee: string | null;
  home_possession: number | null;
  away_possession: number | null;
  home_scorers: any[] | null;
  away_scorers: any[] | null;
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
  referee: string | null;
  homePossession: number | null;
  awayPossession: number | null;
  homeScorers: any[] | null;
  awayScorers: any[] | null;
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
    referee: row.referee,
    homePossession: row.home_possession,
    awayPossession: row.away_possession,
    homeScorers: row.home_scorers,
    awayScorers: row.away_scorers,
    notes: row.notes,
  };
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
      // Jika tabel belum ada atau RLS blokir, return empty
      console.warn(`[match-results] Table/RLS issue (${error.code}), returning empty`);
      return NextResponse.json({
        success: true,
        matches: [],
        total: 0,
        source: 'none',
      });
    }

    const matches = (data ?? []).map(mapMatch);

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
      matches: [],
      total: 0,
      source: 'none',
      error: error.message,
    });
  }
}
