import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import MatchDetailContent from './match-detail-content';

// ─── SEO Metadata (dynamic) ──────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://goalzone.vercel.app';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: match } = await supabase
    .from('match_results')
    .select('home_team, away_team, home_score, away_score, league, match_date, status, venue')
    .eq('id', id)
    .single();

  if (!match) {
    return { title: 'Pertandingan Tidak Ditemukan | GOALZONE' };
  }

  const title = `${match.home_team} ${match.home_score} - ${match.away_score} ${match.away_team} | GOALZONE`;
  const description = match.league
    ? `Hasil pertandingan ${match.league}: ${match.home_team} vs ${match.away_team} ${match.home_score}-${match.away_score}`
    : `Hasil pertandingan: ${match.home_team} vs ${match.away_team} ${match.home_score}-${match.away_score}`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/match/${id}` },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE_URL}/match/${id}`,
    },
  };
}

// ─── ISR: cache 5 minutes ────────────────────────────────────

export const revalidate = 300;

// ─── Data Fetching ───────────────────────────────────────────

async function fetchMatchDetail(id: string) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('match_results')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    homeTeam: data.home_team,
    awayTeam: data.away_team,
    homeScore: data.home_score,
    awayScore: data.away_score,
    matchDate: data.match_date,
    league: data.league,
    season: data.season,
    venue: data.venue,
    matchWeek: data.match_week,
    status: data.status,
    homeTeamLogoUrl: data.home_team_logo_url,
    awayTeamLogoUrl: data.away_team_logo_url,
    referee: data.referee,
    homePossession: data.home_possession,
    awayPossession: data.away_possession,
    homeScorers: (data.home_scorers as any[]) || [],
    awayScorers: (data.away_scorers as any[]) || [],
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// ─── Page Component ──────────────────────────────────────────

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await fetchMatchDetail(id);

  if (!match) {
    notFound();
  }

  return <MatchDetailContent match={match} />;
}
