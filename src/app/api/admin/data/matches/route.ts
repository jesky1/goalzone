import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createServerSupabaseClient } from '@/lib/supabase/client';

const JWT_SECRET = process.env.JWT_SECRET || 'goalzone-admin-secret-2025';

function authenticate(request: NextRequest): { valid: true; decoded: any } | { valid: false; response: NextResponse } {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  try {
    const decoded = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET);
    return { valid: true, decoded };
  } catch {
    return { valid: false, response: NextResponse.json({ success: false, error: 'Token tidak valid atau expired' }, { status: 401 }) };
  }
}

// ============================================================
// GET /api/admin/data/matches — List match results
// ============================================================
export async function GET(request: NextRequest) {
  const auth = authenticate(request);
  if (!auth.valid) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const league = searchParams.get('league') || '';
    const status = searchParams.get('status') || '';
    const limit = Number(searchParams.get('limit') || '100');
    const offset = Number(searchParams.get('offset') || '0');

    const supabase = createServerSupabaseClient();

    let query = supabase
      .from('match_results')
      .select('*', { count: 'exact' })
      .order('match_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`home_team.ilike.%${search}%,away_team.ilike.%${search}%`);
    }
    if (league) {
      query = query.eq('league', league);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: matches, count: total, error } = await query;

    if (error) {
      console.error('[Admin Matches GET Error]', JSON.stringify({ code: error.code, message: error.message }));
      return NextResponse.json({ success: false, error: 'Gagal mengambil hasil pertandingan', debug: { code: error.code, message: error.message } }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        matches: (matches ?? []).map((m: any) => ({
          id: m.id,
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          homeScore: m.home_score,
          awayScore: m.away_score,
          matchDate: m.match_date,
          league: m.league,
          season: m.season,
          venue: m.venue,
          matchWeek: m.match_week,
          status: m.status,
          homeTeamLogoUrl: m.home_team_logo_url,
          awayTeamLogoUrl: m.away_team_logo_url,
          referee: m.referee,
          homePossession: m.home_possession,
          awayPossession: m.away_possession,
          homeScorers: m.home_scorers,
          awayScorers: m.away_scorers,
          notes: m.notes,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
        })),
        total: total ?? 0,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error('[Admin Matches GET Error]', error.message);
    return NextResponse.json({ success: false, error: 'Gagal mengambil hasil pertandingan' }, { status: 500 });
  }
}

// ============================================================
// POST /api/admin/data/matches — Create match result
// ============================================================
export async function POST(request: NextRequest) {
  const auth = authenticate(request);
  if (!auth.valid) return auth.response;

  try {
    const body = await request.json();
    const { homeTeam, awayTeam, homeScore, awayScore, matchDate, league, season, venue, matchWeek, status, homeTeamLogoUrl, awayTeamLogoUrl, referee, homePossession, awayPossession, homeScorers, awayScorers, notes } = body;

    if (!homeTeam || !awayTeam || homeScore === undefined || awayScore === undefined || !matchDate) {
      return NextResponse.json({ success: false, error: 'homeTeam, awayTeam, homeScore, awayScore, dan matchDate wajib diisi' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: match, error } = await supabase
      .from('match_results')
      .insert({
        home_team: homeTeam,
        away_team: awayTeam,
        home_score: Number(homeScore),
        away_score: Number(awayScore),
        match_date: matchDate,
        league: league || null,
        season: season ? Number(season) : null,
        venue: venue || null,
        match_week: matchWeek ? Number(matchWeek) : null,
        status: status || 'finished',
        home_team_logo_url: homeTeamLogoUrl || null,
        away_team_logo_url: awayTeamLogoUrl || null,
        referee: referee || null,
        home_possession: homePossession ? Number(homePossession) : null,
        away_possession: awayPossession ? Number(awayPossession) : null,
        home_scorers: homeScorers || [],
        away_scorers: awayScorers || [],
        notes: notes || null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[Admin Matches POST Error]', JSON.stringify({ code: error.code, message: error.message, hint: error.hint, details: error.details }));
      let msg = 'Gagal menambah hasil pertandingan';
      if (error.code === '42501') {
        msg = 'RLS memblokir insert. Pastikan tabel match_results memiliki policy untuk service_role.';
      } else if (error.code === '42P01') {
        msg = 'Tabel match_results belum ada. Jalankan migration di Supabase SQL Editor.';
      } else if (error.code === '23514') {
        msg = 'Skor tidak boleh negatif.';
      }
      return NextResponse.json({ success: false, error: msg, debug: { code: error.code, message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Hasil pertandingan berhasil ditambahkan', data: { id: match.id } }, { status: 201 });
  } catch (error: any) {
    console.error('[Admin Matches POST Error]', error.message);
    return NextResponse.json({ success: false, error: 'Gagal menambah hasil pertandingan' }, { status: 500 });
  }
}
