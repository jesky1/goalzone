import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export const revalidate = 300;

// ─── Slug → Team Name Mapping ───────────────────────────────

const SLUG_MAP: Record<string, string> = {
  'manchester-city': 'Manchester City',
  'real-madrid': 'Real Madrid',
  'barcelona': 'Barcelona',
  'bayern-munich': 'Bayern Munich',
  'psg': 'PSG',
  'arsenal': 'Arsenal',
  'liverpool': 'Liverpool',
  'chelsea': 'Chelsea',
  'ac-milan': 'AC Milan',
  'inter-milan': 'Inter Milan',
  'juventus': 'Juventus',
  'napoli': 'Napoli',
  'borussia-dortmund': 'Borussia Dortmund',
  'rb-leipzig': 'RB Leipzig',
  'marseille': 'Marseille',
};

// ─── GET /api/teams/[slug] ──────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const teamName = SLUG_MAP[slug] || null;

  if (!teamName) {
    return NextResponse.json(
      { success: false, error: `Tim '${slug}' tidak ditemukan`, source: 'none' },
      { status: 404 }
    );
  }

  // Try Supabase first
  try {
    const supabase = createServerSupabaseClient();

    // Try to find matches involving this team
    const { data: matches, error } = await supabase
      .from('match_results')
      .select('*')
      .or(`home_team.ilike.%${teamName}%,away_team.ilike.%${teamName}%`)
      .order('match_date', { ascending: false })
      .limit(10);

    if (!error && matches && matches.length > 0) {
      // Build team profile from Supabase data
      const recentMatches = matches.map((m: any) => ({
        id: m.id,
        homeTeam: m.home_team,
        awayTeam: m.away_team,
        homeScore: m.home_score,
        awayScore: m.away_score,
        matchDate: m.match_date,
        league: m.league,
        status: m.status,
        homeTeamLogoUrl: m.home_team_logo_url,
        awayTeamLogoUrl: m.away_team_logo_url,
        venue: m.venue,
        matchWeek: m.match_week,
      }));

      // Calculate stats from matches
      let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0, played = 0;
      for (const m of matches) {
        played++;
        const isHome = m.home_team.toLowerCase().includes(teamName.toLowerCase());
        const scored = isHome ? m.home_score : m.away_score;
        const conceded = isHome ? m.away_score : m.home_score;
        goalsFor += scored;
        goalsAgainst += conceded;
        if (scored > conceded) wins++;
        else if (scored === conceded) draws++;
        else losses++;
      }

      const team = {
        name: teamName,
        slug,
        logoUrl: null,
        founded: null,
        stadium: null,
        stadiumCapacity: null,
        coach: null,
        league: null,
        country: null,
        season: 2025,
        primaryColor: '#00F3FF',
        secondaryColor: '#0099CC',
        rank: null,
        played,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        points: wins * 3 + draws,
        squad: [],
        lastLineup: null,
        recentMatches,
      };

      return NextResponse.json({
        success: true,
        team,
        source: 'supabase',
      });
    }
  } catch (err: any) {
    console.warn(`[teams/${slug}] Supabase error: ${err.message}`);
  }

  // No real data available
  return NextResponse.json({
    success: false,
    error: 'Data tim tidak tersedia',
    source: 'none',
  });
}
