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
    notes: row.notes,
  };
}

// ─── Mock Data (fallback jika Supabase belum dikonfigurasi) ──

function getMockResults(): MatchResultAPI[] {
  return [
    {
      id: 'mock-1',
      homeTeam: 'Arsenal',
      awayTeam: 'Manchester City',
      homeScore: 2,
      awayScore: 1,
      matchDate: new Date().toISOString().split('T')[0],
      league: 'Premier League',
      season: 2025,
      venue: 'Emirates Stadium',
      matchWeek: 28,
      status: 'finished',
      notes: null,
    },
    {
      id: 'mock-2',
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      homeScore: 3,
      awayScore: 3,
      matchDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      league: 'La Liga',
      season: 2025,
      venue: 'Santiago Bernabéu',
      matchWeek: 30,
      status: 'finished',
      notes: 'El Clásico',
    },
    {
      id: 'mock-3',
      homeTeam: 'AC Milan',
      awayTeam: 'Inter Milan',
      homeScore: 1,
      awayScore: 2,
      matchDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      league: 'Serie A',
      season: 2025,
      venue: 'San Siro',
      matchWeek: 29,
      status: 'finished',
      notes: 'Derby della Madonnina',
    },
    {
      id: 'mock-4',
      homeTeam: 'Bayern Munich',
      awayTeam: 'Borussia Dortmund',
      homeScore: 4,
      awayScore: 2,
      matchDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      league: 'Bundesliga',
      season: 2025,
      venue: 'Allianz Arena',
      matchWeek: 26,
      status: 'finished',
      notes: null,
    },
    {
      id: 'mock-5',
      homeTeam: 'Liverpool',
      awayTeam: 'Chelsea',
      homeScore: 0,
      awayScore: 0,
      matchDate: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
      league: 'Premier League',
      season: 2025,
      venue: 'Anfield',
      matchWeek: 27,
      status: 'postponed',
      notes: 'Ditunda karena cuaca buruk',
    },
    {
      id: 'mock-6',
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      homeScore: 2,
      awayScore: 0,
      matchDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      league: 'Ligue 1',
      season: 2025,
      venue: 'Parc des Princes',
      matchWeek: 25,
      status: 'finished',
      notes: 'Le Classique',
    },
  ];
}

// ─── GET /api/match-results ──────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') || '20'), 50);

  try {
    const supabase = createServerSupabaseClient();

    const { data, error, count } = await supabase
      .from('match_results')
      .select('*', { count: 'exact' })
      .eq('status', 'finished')
      .order('match_date', { ascending: false })
      .limit(limit);

    if (error) {
      // Jika tabel belum ada atau RLS blokir, fallback ke mock
      if (error.code === '42P01' || error.code === '42501') {
        console.warn(`[match-results] Table/RLS issue (${error.code}), using mock data`);
        return NextResponse.json({
          success: true,
          matches: getMockResults(),
          total: getMockResults().length,
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
        matches: getMockResults(),
        total: getMockResults().length,
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
      matches: getMockResults(),
      total: getMockResults().length,
      source: 'mock',
      error: error.message,
    });
  }
}
