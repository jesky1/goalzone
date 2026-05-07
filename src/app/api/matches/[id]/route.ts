import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export const revalidate = 300;

// ─── Types ──────────────────────────────────────────────────

interface MatchStats {
  homeShotsOnTarget: number | null;
  awayShotsOnTarget: number | null;
  homeTotalShots: number | null;
  awayTotalShots: number | null;
  homeCorners: number | null;
  awayCorners: number | null;
  homeYellowCards: number | null;
  awayYellowCards: number | null;
  homeRedCards: number | null;
  awayRedCards: number | null;
  homeFouls: number | null;
  awayFouls: number | null;
  homeOffsides: number | null;
  awayOffsides: number | null;
  homePasses: number | null;
  awayPasses: number | null;
  homePassAccuracy: number | null;
  awayPassAccuracy: number | null;
}

interface MatchDetailAPI {
  success: boolean;
  match: {
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
    createdAt: string;
    updatedAt: string;
  } & MatchStats;
  source: 'supabase' | 'mock';
}

// ─── Team Logos ─────────────────────────────────────────────

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

// ─── Rich Mock Data ─────────────────────────────────────────

const MOCK_MATCHES: Record<string, MatchDetailAPI['match']> = {
  'mock-1': {
    id: 'mock-1',
    homeTeam: 'Arsenal', awayTeam: 'Manchester City',
    homeScore: 2, awayScore: 1,
    matchDate: new Date().toISOString().split('T')[0],
    league: 'Premier League', season: 2025, venue: 'Emirates Stadium', matchWeek: 28,
    status: 'finished',
    homeTeamLogoUrl: TEAM_LOGOS['Arsenal'], awayTeamLogoUrl: TEAM_LOGOS['Manchester City'],
    referee: 'Michael Oliver',
    homePossession: 54, awayPossession: 46,
    homeScorers: [
      { player: 'Bukayo Saka', minute: 23, type: 'goal', assist: 'Martin Ødegaard' },
      { player: 'Gabriel Jesus', minute: 67, type: 'goal', assist: 'Declan Rice' },
    ],
    awayScorers: [
      { player: 'Erling Haaland', minute: 41, type: 'penalty', assist: null },
    ],
    notes: 'Pertandingan dramatis di Emirates Stadium',
    homeShotsOnTarget: 7, awayShotsOnTarget: 4,
    homeTotalShots: 15, awayTotalShots: 11,
    homeCorners: 6, awayCorners: 4,
    homeYellowCards: 2, awayYellowCards: 3,
    homeRedCards: 0, awayRedCards: 0,
    homeFouls: 9, awayFouls: 13,
    homeOffsides: 3, awayOffsides: 2,
    homePasses: 487, awayPasses: 412,
    homePassAccuracy: 89, awayPassAccuracy: 85,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'mock-2': {
    id: 'mock-2',
    homeTeam: 'Real Madrid', awayTeam: 'Barcelona',
    homeScore: 3, awayScore: 3,
    matchDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    league: 'La Liga', season: 2025, venue: 'Santiago Bernabéu', matchWeek: 30,
    status: 'finished',
    homeTeamLogoUrl: TEAM_LOGOS['Real Madrid'], awayTeamLogoUrl: TEAM_LOGOS['Barcelona'],
    referee: 'Antonio Mateu Lahoz',
    homePossession: 48, awayPossession: 52,
    homeScorers: [
      { player: 'Vinícius Jr.', minute: 12, type: 'goal', assist: 'Jude Bellingham' },
      { player: 'Jude Bellingham', minute: 55, type: 'goal', assist: null },
      { player: 'Kylian Mbappé', minute: 78, type: 'goal', assist: 'Federico Valverde' },
    ],
    awayScorers: [
      { player: 'Robert Lewandowski', minute: 28, type: 'goal', assist: 'Pedri' },
      { player: 'Lamine Yamal', minute: 61, type: 'goal', assist: 'Raphinha' },
      { player: 'Raphinha', minute: 88, type: 'goal', assist: 'Lamine Yamal' },
    ],
    notes: 'El Clásico — 6 gol dalam laga seru',
    homeShotsOnTarget: 8, awayShotsOnTarget: 7,
    homeTotalShots: 18, awayTotalShots: 16,
    homeCorners: 5, awayCorners: 7,
    homeYellowCards: 4, awayYellowCards: 3,
    homeRedCards: 0, awayRedCards: 1,
    homeFouls: 14, awayFouls: 11,
    homeOffsides: 4, awayOffsides: 3,
    homePasses: 501, awayPasses: 548,
    homePassAccuracy: 87, awayPassAccuracy: 91,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  'mock-3': {
    id: 'mock-3',
    homeTeam: 'AC Milan', awayTeam: 'Inter Milan',
    homeScore: 1, awayScore: 2,
    matchDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    league: 'Serie A', season: 2025, venue: 'San Siro', matchWeek: 29,
    status: 'finished',
    homeTeamLogoUrl: TEAM_LOGOS['AC Milan'], awayTeamLogoUrl: TEAM_LOGOS['Inter Milan'],
    referee: 'Daniele Orsato',
    homePossession: 47, awayPossession: 53,
    homeScorers: [
      { player: 'Rafael Leão', minute: 34, type: 'goal', assist: 'Theo Hernández' },
    ],
    awayScorers: [
      { player: 'Lautaro Martínez', minute: 19, type: 'goal', assist: 'Hakan Çalhanoğlu' },
      { player: 'Marcus Thuram', minute: 72, type: 'goal', assist: 'Nicolò Barella' },
    ],
    notes: 'Derby della Madonnina',
    homeShotsOnTarget: 5, awayShotsOnTarget: 6,
    homeTotalShots: 12, awayTotalShots: 14,
    homeCorners: 4, awayCorners: 5,
    homeYellowCards: 3, awayYellowCards: 2,
    homeRedCards: 0, awayRedCards: 0,
    homeFouls: 12, awayFouls: 10,
    homeOffsides: 2, awayOffsides: 4,
    homePasses: 423, awayPasses: 478,
    homePassAccuracy: 84, awayPassAccuracy: 88,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  'mock-4': {
    id: 'mock-4',
    homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund',
    homeScore: 4, awayScore: 2,
    matchDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    league: 'Bundesliga', season: 2025, venue: 'Allianz Arena', matchWeek: 26,
    status: 'finished',
    homeTeamLogoUrl: TEAM_LOGOS['Bayern Munich'], awayTeamLogoUrl: TEAM_LOGOS['Borussia Dortmund'],
    referee: 'Felix Zwayer',
    homePossession: 61, awayPossession: 39,
    homeScorers: [
      { player: 'Harry Kane', minute: 8, type: 'penalty', assist: null },
      { player: 'Harry Kane', minute: 35, type: 'goal', assist: 'Jamal Musiala' },
      { player: 'Leroy Sané', minute: 56, type: 'goal', assist: 'Thomas Müller' },
      { player: 'Jamal Musiala', minute: 80, type: 'goal', assist: 'Harry Kane' },
    ],
    awayScorers: [
      { player: 'Niclas Füllkrug', minute: 43, type: 'goal', assist: 'Julian Brandt' },
      { player: 'Marco Reus', minute: 65, type: 'goal', assist: null },
    ],
    notes: 'Der Klassiker — Kane brace menghantam Dortmund',
    homeShotsOnTarget: 10, awayShotsOnTarget: 3,
    homeTotalShots: 22, awayTotalShots: 8,
    homeCorners: 8, awayCorners: 3,
    homeYellowCards: 1, awayYellowCards: 4,
    homeRedCards: 0, awayRedCards: 0,
    homeFouls: 8, awayFouls: 16,
    homeOffsides: 2, awayOffsides: 5,
    homePasses: 612, awayPasses: 345,
    homePassAccuracy: 92, awayPassAccuracy: 79,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  'mock-6': {
    id: 'mock-6',
    homeTeam: 'PSG', awayTeam: 'Marseille',
    homeScore: 2, awayScore: 0,
    matchDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    league: 'Ligue 1', season: 2025, venue: 'Parc des Princes', matchWeek: 25,
    status: 'finished',
    homeTeamLogoUrl: TEAM_LOGOS['PSG'], awayTeamLogoUrl: TEAM_LOGOS['Marseille'],
    referee: 'Clément Turpin',
    homePossession: 65, awayPossession: 35,
    homeScorers: [
      { player: 'Ousmane Dembélé', minute: 29, type: 'goal', assist: 'Vitinha' },
      { player: 'Bradley Barcola', minute: 71, type: 'goal', assist: 'Ousmane Dembélé' },
    ],
    awayScorers: [],
    notes: 'Le Classique — PSG dominan di kandang',
    homeShotsOnTarget: 9, awayShotsOnTarget: 2,
    homeTotalShots: 20, awayTotalShots: 6,
    homeCorners: 7, awayCorners: 2,
    homeYellowCards: 1, awayYellowCards: 5,
    homeRedCards: 0, awayRedCards: 0,
    homeFouls: 7, awayFouls: 15,
    homeOffsides: 3, awayOffsides: 1,
    homePasses: 580, awayPasses: 298,
    homePassAccuracy: 93, awayPassAccuracy: 76,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  'mock-up1': {
    id: 'mock-up1',
    homeTeam: 'Liverpool', awayTeam: 'Arsenal',
    homeScore: 0, awayScore: 0,
    matchDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    league: 'Premier League', season: 2025, venue: 'Anfield', matchWeek: 31,
    status: 'scheduled',
    homeTeamLogoUrl: TEAM_LOGOS['Liverpool'], awayTeamLogoUrl: TEAM_LOGOS['Arsenal'],
    referee: null,
    homePossession: null, awayPossession: null,
    homeScorers: [], awayScorers: [],
    notes: 'Big Match — pertandingan krusial perebutan puncak klasemen',
    homeShotsOnTarget: null, awayShotsOnTarget: null,
    homeTotalShots: null, awayTotalShots: null,
    homeCorners: null, awayCorners: null,
    homeYellowCards: null, awayYellowCards: null,
    homeRedCards: null, awayRedCards: null,
    homeFouls: null, awayFouls: null,
    homeOffsides: null, awayOffsides: null,
    homePasses: null, awayPasses: null,
    homePassAccuracy: null, awayPassAccuracy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

function getDefaultMock(id: string): MatchDetailAPI['match'] {
  return {
    id, homeTeam: 'Team A', awayTeam: 'Team B',
    homeScore: 0, awayScore: 0,
    matchDate: new Date().toISOString().split('T')[0],
    league: null, season: null, venue: null, matchWeek: null,
    status: 'scheduled',
    homeTeamLogoUrl: null, awayTeamLogoUrl: null, referee: null,
    homePossession: null, awayPossession: null,
    homeScorers: [], awayScorers: [], notes: null,
    homeShotsOnTarget: null, awayShotsOnTarget: null,
    homeTotalShots: null, awayTotalShots: null,
    homeCorners: null, awayCorners: null,
    homeYellowCards: null, awayYellowCards: null,
    homeRedCards: null, awayRedCards: null,
    homeFouls: null, awayFouls: null,
    homeOffsides: null, awayOffsides: null,
    homePasses: null, awayPasses: null,
    homePassAccuracy: null, awayPassAccuracy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

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

    const mock = MOCK_MATCHES[id] || getDefaultMock(id);
    return NextResponse.json({ success: true, match: mock, source: 'mock' });
  } catch {
    const mock = MOCK_MATCHES[id] || getDefaultMock(id);
    return NextResponse.json({ success: true, match: mock, source: 'mock' });
  }
}
