'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, MapPin, Trophy, Swords, Shield,
  ChevronRight, RefreshCw, AlertTriangle, Star, Target,
  TrendingUp, Zap, Clock, Hash, Flag, Users, CircleDot,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// ─── Types ──────────────────────────────────────────────────

interface StandingTeam {
  rank: number; name: string; slug: string; logoUrl: string | null;
  played: number; wins: number; draws: number; losses: number;
  goalsFor: number; goalsAgainst: number; points: number;
  form: ('W' | 'D' | 'L')[];
}

interface LeagueMatch {
  id: string; homeTeam: string; awayTeam: string;
  homeScore: number; awayScore: number; matchDate: string;
  venue: string | null; matchWeek: number | null; status: string;
  homeTeamLogoUrl: string | null; awayTeamLogoUrl: string | null;
}

interface TopScorer {
  rank: number; name: string; team: string; teamSlug: string;
  goals: number; assists: number; teamLogoUrl: string | null;
}

interface LeagueProfile {
  name: string; slug: string; logoUrl: string | null;
  country: string; season: number; founded: number | null;
  teams: number; matchesPlayed: number; totalGoals: number;
  primaryColor: string; secondaryColor: string;
  standings: StandingTeam[];
  recentMatches: LeagueMatch[];
  topScorers: TopScorer[];
}

// ─── Helpers ────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function getRelativeDay(dateStr: string): string {
  try {
    const target = new Date(dateStr + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)} hari lalu`;
    if (diff === 0) return 'Hari ini';
    if (diff === 1) return 'Besok';
    return `${diff} hari lagi`;
  } catch { return ''; }
}

// ─── Loading Skeleton ───────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-deep-900">
      <header className="border-b border-white/[0.04] bg-deep-900/70 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <Skeleton className="h-4 w-20 bg-white/5" />
          <Skeleton className="h-4 w-16 bg-white/5" />
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        <div className="glass-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-white/5" />
            <div className="space-y-3 flex-1 text-center sm:text-left">
              <Skeleton className="h-7 w-48 bg-white/5 mx-auto sm:mx-0" />
              <Skeleton className="h-4 w-32 bg-white/5 mx-auto sm:mx-0" />
              <div className="flex gap-3 justify-center sm:justify-start">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-20 rounded-xl bg-white/5" />)}
              </div>
            </div>
          </div>
        </div>
        <Skeleton className="h-96 w-full glass-card" />
      </main>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function LeagueProfilePage() {
  const params = useParams<{ slug: string }>();
  const [league, setLeague] = useState<LeagueProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState('');

  const fetchLeague = useCallback(async () => {
    if (!params.slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leagues/${params.slug}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(err.error || `HTTP ${res.status}`);
        return;
      }
      const json = await res.json();
      if (json.success && json.league) {
        setLeague(json.league);
        setSource(json.source || 'mock');
      } else {
        setError('Liga tidak ditemukan');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [params.slug]);

  useEffect(() => { fetchLeague(); }, [fetchLeague]);

  if (loading) return <PageSkeleton />;

  if (error || !league) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-deep-900 gap-4 p-4">
        <AlertTriangle className="w-12 h-12 text-amber-400/40" />
        <p className="text-sm text-muted-foreground">{error || 'Liga tidak ditemukan'}</p>
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/15 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const accentColor = league.primaryColor;
  const secondaryColor = league.secondaryColor;
  const avgGoals = league.matchesPlayed > 0 ? (league.totalGoals / league.matchesPlayed).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen flex flex-col bg-deep-900">
      {/* Decorative bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/3 w-[600px] h-[300px] rounded-full blur-[120px] opacity-[0.04]" style={{ background: accentColor }} />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[250px] rounded-full blur-[100px] opacity-[0.03]" style={{ background: secondaryColor }} />
      </div>

      {/* ─── Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-deep-900/70 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors group">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Beranda</span>
            </Link>
            <div className="flex items-center gap-2">
              {source === 'mock' && (
                <Badge variant="outline" className="text-[9px] bg-amber-500/5 text-amber-400/70 border-amber-500/15 px-1.5 py-0">
                  Sample
                </Badge>
              )}
              <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                {league.country}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main ───────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground/40 mb-6">
          <Link href="/" className="hover:text-cyan-400/60 transition-colors">Beranda</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-muted-foreground/60">{league.name}</span>
        </nav>

        {/* ─── Hero Section ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden mb-6"
        >
          <div className="h-[2px]" style={{ background: `linear-gradient(to right, transparent, ${accentColor}80, transparent)` }} />

          <div className="p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              {/* Logo */}
              <motion.div
                className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <div className="absolute -inset-4 rounded-[2rem] pointer-events-none animate-pulse"
                  style={{ boxShadow: `0 0 40px 8px ${accentColor}30, 0 0 80px 16px ${accentColor}15` }} />
                <div className="absolute inset-0 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.1]" />
                {league.logoUrl ? (
                  <Image src={league.logoUrl} alt={league.name} width={128} height={128} className="relative z-10 object-contain p-4 sm:p-5" unoptimized />
                ) : (
                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
              </motion.div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                  <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">{league.country}</span>
                  {league.founded && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                      <span className="text-[10px] text-muted-foreground/40">Since {league.founded}</span>
                    </>
                  )}
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                  <span className="text-[10px] text-muted-foreground/40">Season {league.season}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2"
                  style={{ textShadow: `0 0 40px ${accentColor}30` }}>
                  {league.name}
                </h1>

                <p className="text-sm text-muted-foreground/60 mb-4">
                  {league.teams} tim · {league.matchesPlayed} pertandingan · {league.totalGoals} gol
                </p>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6 pt-6 border-t border-white/[0.04]">
              {[
                { icon: Users, label: 'Tim', value: league.teams },
                { icon: Swords, label: 'Pertandingan', value: league.matchesPlayed },
                { icon: Target, label: 'Total Gol', value: league.totalGoals },
                { icon: TrendingUp, label: 'Gol / Match', value: avgGoals },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  className="glass-card p-3 flex flex-col items-center gap-1 text-center"
                >
                  <stat.icon className="w-4 h-4 text-muted-foreground/40" />
                  <span className="text-lg sm:text-xl font-black tabular-nums neon-text">{stat.value}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="h-[1px]" style={{ background: `linear-gradient(to right, transparent, ${accentColor}40, transparent)` }} />
        </motion.div>

        {/* ─── Standings Table ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card overflow-hidden mb-6"
        >
          <div className="p-4 sm:p-5 pb-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Klasemen</h2>
            </div>
            <span className="text-[10px] text-muted-foreground/40">{league.standings.length} tim</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm mt-3">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider w-10">#</th>
                  <th className="text-left py-2.5 px-2 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider">Tim</th>
                  <th className="text-center py-2.5 px-2 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider w-10">M</th>
                  <th className="text-center py-2.5 px-2 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider w-10">M</th>
                  <th className="text-center py-2.5 px-2 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider w-10">S</th>
                  <th className="text-center py-2.5 px-2 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider w-10">K</th>
                  <th className="text-center py-2.5 px-2 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider hidden sm:table-cell w-12">SG</th>
                  <th className="text-center py-2.5 px-2 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider hidden sm:table-cell w-12">GK</th>
                  <th className="text-center py-2.5 px-2 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider w-10">Form</th>
                  <th className="text-center py-2.5 px-4 text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider w-12">Pts</th>
                </tr>
              </thead>
              <tbody>
                {league.standings.map((team, idx) => {
                  const gd = team.goalsFor - team.goalsAgainst;
                  const isTop = team.rank <= 4;
                  const isBottom = team.rank > league.standings.length - 3;
                  return (
                    <motion.tr
                      key={team.name}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 * idx }}
                      className={`border-b border-white/[0.02] hover:bg-white/[0.03] transition-colors group ${isTop ? 'border-l-2 border-l-emerald-500/50' : isBottom ? 'border-l-2 border-l-red-500/50' : ''}`}
                    >
                      <td className="py-2.5 px-4">
                        <span className={`text-xs font-bold tabular-nums ${isTop ? 'text-emerald-400' : isBottom ? 'text-red-400' : 'text-muted-foreground/40'}`}>
                          {team.rank}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <Link href={`/teams/${team.slug}`} className="flex items-center gap-2 hover:text-cyan-400 transition-colors cursor-pointer">
                          {team.logoUrl && (
                            <img src={team.logoUrl} alt={team.name} className="w-5 h-5 rounded-full shrink-0" loading="lazy" />
                          )}
                          <span className="text-xs font-medium text-white truncate max-w-[120px] sm:max-w-none">{team.name}</span>
                        </Link>
                      </td>
                      <td className="text-center py-2.5 px-2 text-xs text-muted-foreground/60 tabular-nums">{team.played}</td>
                      <td className="text-center py-2.5 px-2 text-xs text-emerald-400 tabular-nums font-medium">{team.wins}</td>
                      <td className="text-center py-2.5 px-2 text-xs text-amber-400 tabular-nums">{team.draws}</td>
                      <td className="text-center py-2.5 px-2 text-xs text-red-400 tabular-nums">{team.losses}</td>
                      <td className="text-center py-2.5 px-2 text-xs text-muted-foreground/50 tabular-nums hidden sm:table-cell">
                        <span className={gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : ''}>{gd > 0 ? '+' : ''}{gd}</span>
                      </td>
                      <td className="text-center py-2.5 px-2 text-[10px] text-muted-foreground/40 tabular-nums hidden sm:table-cell">{team.goalsFor}:{team.goalsAgainst}</td>
                      <td className="text-center py-2.5 px-2">
                        <div className="flex items-center gap-0.5 justify-center">
                          {team.form.map((f, fi) => (
                            <span key={fi} className={`w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center
                              ${f === 'W' ? 'bg-emerald-500/20 text-emerald-400' : f === 'D' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="text-center py-2.5 px-4">
                        <span className="text-sm font-bold neon-text tabular-nums">{team.points}</span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 flex items-center gap-4 text-[10px] text-muted-foreground/30 border-t border-white/[0.03]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-emerald-500/50" /> Champions / Europa League
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-red-500/50" /> Degradasi
            </div>
          </div>
        </motion.div>

        {/* ─── Two Column: Recent Matches + Top Scorers ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Matches */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-4 sm:p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Swords className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hasil Terbaru</h3>
            </div>

            {league.recentMatches.length > 0 ? (
              <div className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                {league.recentMatches.map((match, idx) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * idx }}
                  >
                    <Link
                      href={`/matches/${match.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] hover:border-white/[0.06] transition-all duration-200 group"
                    >
                      {/* Score */}
                      <div className="shrink-0 w-14 text-center">
                        <span className="text-sm font-black neon-text tabular-nums">{match.homeScore} - {match.awayScore}</span>
                      </div>
                      {/* Teams */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {match.homeTeamLogoUrl && <img src={match.homeTeamLogoUrl} alt="" className="w-4 h-4 rounded-full shrink-0" loading="lazy" />}
                          <span className="text-xs font-medium text-white truncate">{match.homeTeam}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {match.awayTeamLogoUrl && <img src={match.awayTeamLogoUrl} alt="" className="w-4 h-4 rounded-full shrink-0" loading="lazy" />}
                          <span className="text-xs font-medium text-white truncate">{match.awayTeam}</span>
                        </div>
                      </div>
                      {/* Date */}
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-muted-foreground/50 block">{formatDate(match.matchDate)}</span>
                        {match.matchWeek && <span className="text-[9px] text-muted-foreground/30 block">MD {match.matchWeek}</span>}
                      </div>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/20 group-hover:text-neon/50 transition-colors shrink-0" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Swords className="w-10 h-10 text-muted-foreground/10 mb-3" />
                <p className="text-sm text-muted-foreground/50">Belum ada hasil pertandingan</p>
              </div>
            )}
          </motion.div>

          {/* Top Scorers */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4 sm:p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Target className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top Skor</h3>
            </div>

            {league.topScorers.length > 0 ? (
              <div className="space-y-2">
                {league.topScorers.map((scorer, idx) => (
                  <motion.div
                    key={scorer.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-all duration-200"
                  >
                    {/* Rank */}
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0
                      ${idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        idx === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/20' :
                        idx === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        'bg-white/[0.04] text-muted-foreground/40 border border-white/[0.06]'}`}>
                      {scorer.rank}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-medium text-white truncate">{scorer.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {scorer.teamLogoUrl && <img src={scorer.teamLogoUrl} alt="" className="w-3.5 h-3.5 rounded-full shrink-0" loading="lazy" />}
                        <Link href={`/teams/${scorer.teamSlug}`} className="text-[10px] text-muted-foreground/40 hover:text-cyan-400 transition-colors truncate">{scorer.team}</Link>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <CircleDot className="w-3 h-3 text-amber-400/60" />
                          <span className="text-sm font-bold text-amber-400 tabular-nums">{scorer.goals}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground/30">gol</span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Flag className="w-3 h-3 text-muted-foreground/30" />
                          <span className="text-xs font-medium text-muted-foreground/50 tabular-nums">{scorer.assists}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground/30">assist</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="w-10 h-10 text-muted-foreground/10 mb-3" />
                <p className="text-sm text-muted-foreground/50">Data top skor belum tersedia</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* ─── Actions ──────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={fetchLeague} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.03] text-muted-foreground border border-white/[0.06] hover:bg-white/[0.06] hover:text-white transition-all">
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </button>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-cyan-500/[0.06] text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all duration-300">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
        </motion.div>
      </main>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-white/[0.03] bg-deep-900/50 backdrop-blur-sm mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground/30">
            <span>GOALZONE &mdash; Portal Berita Sepak Bola</span>
            <div className="flex items-center gap-3">
              <Link href="/" className="hover:text-cyan-400/60 transition-colors">Beranda</Link>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
              <Link href="/privacy-policy" className="hover:text-cyan-400/60 transition-colors">Privasi</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
