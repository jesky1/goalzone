import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export const revalidate = 300;

// ─── Slug → League Name ────────────────────────────────────

const SLUG_MAP: Record<string, string> = {
  'premier-league': 'Premier League',
  'la-liga': 'La Liga',
  'serie-a': 'Serie A',
  'bundesliga': 'Bundesliga',
  'ligue-1': 'Ligue 1',
};

// ─── GET /api/leagues/[slug] ────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const leagueName = SLUG_MAP[slug] || null;

  if (!leagueName) {
    return NextResponse.json(
      { success: false, error: `Liga '${slug}' tidak ditemukan`, source: 'none' },
      { status: 404 }
    );
  }

  // Try Supabase for recent matches
  try {
    const supabase = createServerSupabaseClient();
    const { data: matches, error } = await supabase
      .from('match_results')
      .select('*')
      .eq('league', leagueName)
      .order('match_date', { ascending: false })
      .limit(8);

    if (!error && matches && matches.length > 0) {
      const recentMatches = matches.map((m: any) => ({
        id: m.id, homeTeam: m.home_team, awayTeam: m.away_team,
        homeScore: m.home_score, awayScore: m.away_score,
        matchDate: m.match_date, venue: m.venue, matchWeek: m.match_week,
        status: m.status, homeTeamLogoUrl: m.home_team_logo_url, awayTeamLogoUrl: m.away_team_logo_url,
      }));

      const profile = {
        name: leagueName,
        slug,
        logoUrl: null,
        country: '-',
        season: 2025,
        founded: null,
        teams: 0,
        matchesPlayed: 0,
        totalGoals: 0,
        primaryColor: '#00F3FF',
        secondaryColor: '#0099CC',
        standings: [],
        recentMatches,
        topScorers: [],
      };

      return NextResponse.json({ success: true, league: profile, source: 'supabase' });
    }
  } catch (err: any) {
    console.warn(`[leagues/${slug}] Supabase error: ${err.message}`);
  }

  // No real data available
  return NextResponse.json({
    success: false,
    error: 'Data liga tidak tersedia',
    source: 'none',
  });
}
