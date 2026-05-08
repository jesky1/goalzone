import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export const revalidate = 300;

// ─── GET /api/matches/[id] ──────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('match_results')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      const d = data as any;
      const match = {
        id: d.id, homeTeam: d.home_team, awayTeam: d.away_team,
        homeScore: d.home_score, awayScore: d.away_score,
        matchDate: d.match_date, league: d.league, season: d.season,
        venue: d.venue, matchWeek: d.match_week, status: d.status,
        homeTeamLogoUrl: d.home_team_logo_url, awayTeamLogoUrl: d.away_team_logo_url,
        referee: d.referee,
        homePossession: d.home_possession, awayPossession: d.away_possession,
        homeScorers: (d.home_scorers as any[]) || [],
        awayScorers: (d.away_scorers as any[]) || [],
        notes: d.notes, createdAt: d.created_at, updatedAt: d.updated_at,
        homeShotsOnTarget: d.home_shots_on_target ?? null,
        awayShotsOnTarget: d.away_shots_on_target ?? null,
        homeTotalShots: d.home_total_shots ?? null,
        awayTotalShots: d.away_total_shots ?? null,
        homeCorners: d.home_corners ?? null,
        awayCorners: d.away_corners ?? null,
        homeYellowCards: d.home_yellow_cards ?? null,
        awayYellowCards: d.away_yellow_cards ?? null,
        homeRedCards: d.home_red_cards ?? null,
        awayRedCards: d.away_red_cards ?? null,
        homeFouls: d.home_fouls ?? null,
        awayFouls: d.away_fouls ?? null,
        homeOffsides: d.home_offsides ?? null,
        awayOffsides: d.away_offsides ?? null,
        homePasses: d.home_passes ?? null,
        awayPasses: d.away_passes ?? null,
        homePassAccuracy: d.home_pass_accuracy ?? null,
        awayPassAccuracy: d.away_pass_accuracy ?? null,
      };
      return NextResponse.json({ success: true, match, source: 'supabase' });
    }

    return NextResponse.json({
      success: false,
      error: 'Match not found',
      source: 'none',
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: 'Match not found',
      source: 'none',
    });
  }
}
