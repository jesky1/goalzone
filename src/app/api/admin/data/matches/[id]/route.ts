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
// PUT /api/admin/data/matches/[id] — Update match result
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = authenticate(request);
  if (!auth.valid) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const supabase = createServerSupabaseClient();

    // Check match exists
    const { data: existing } = await supabase
      .from('match_results')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Hasil pertandingan tidak ditemukan' }, { status: 404 });
    }

    // Build update object
    const { homeTeam, awayTeam, homeScore, awayScore, matchDate, league, season, venue, matchWeek, status, notes } = body;
    const updateData: Record<string, any> = {};
    if (homeTeam !== undefined) updateData.home_team = homeTeam;
    if (awayTeam !== undefined) updateData.away_team = awayTeam;
    if (homeScore !== undefined) updateData.home_score = Number(homeScore);
    if (awayScore !== undefined) updateData.away_score = Number(awayScore);
    if (matchDate !== undefined) updateData.match_date = matchDate;
    if (league !== undefined) updateData.league = league || null;
    if (season !== undefined) updateData.season = season ? Number(season) : null;
    if (venue !== undefined) updateData.venue = venue || null;
    if (matchWeek !== undefined) updateData.match_week = matchWeek ? Number(matchWeek) : null;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes || null;

    const { data: match, error } = await supabase
      .from('match_results')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[Admin Matches PUT Error]', JSON.stringify({ code: error.code, message: error.message }));
      return NextResponse.json({ success: false, error: 'Gagal mengupdate hasil pertandingan', debug: { code: error.code, message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Hasil pertandingan berhasil diupdate', data: { id: match.id } });
  } catch (error: any) {
    console.error('[Admin Matches PUT Error]', error.message);
    return NextResponse.json({ success: false, error: 'Gagal mengupdate hasil pertandingan' }, { status: 500 });
  }
}

// ============================================================
// DELETE /api/admin/data/matches/[id] — Delete match result
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = authenticate(request);
  if (!auth.valid) return auth.response;

  try {
    const { id } = await params;

    const supabase = createServerSupabaseClient();

    // Check match exists
    const { data: existing } = await supabase
      .from('match_results')
      .select('id, home_team, away_team')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Hasil pertandingan tidak ditemukan' }, { status: 404 });
    }

    const { error } = await supabase.from('match_results').delete().eq('id', id);

    if (error) {
      console.error('[Admin Matches DELETE Error]', JSON.stringify({ code: error.code, message: error.message }));
      return NextResponse.json({ success: false, error: 'Gagal menghapus hasil pertandingan', debug: { code: error.code, message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Pertandingan ${existing.home_team} vs ${existing.away_team} berhasil dihapus` });
  } catch (error: any) {
    console.error('[Admin Matches DELETE Error]', error.message);
    return NextResponse.json({ success: false, error: 'Gagal menghapus hasil pertandingan' }, { status: 500 });
  }
}
