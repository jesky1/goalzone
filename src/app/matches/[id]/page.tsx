'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, MapPin, Trophy, Hash, Swords, User, Target,
  Percent, CircleDot, Shield, ChevronRight, Zap, TrendingUp,
  Crosshair, Square, TriangleAlert, Flag, Footprints, RefreshCw,
  AlertTriangle, Ban,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// ─── Types ──────────────────────────────────────────────────

interface Scorer {
  player?: string;
  minute?: number;
  type?: string;
  assist?: string;
}

interface MatchDetail {
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
  homeScorers: Scorer[];
  awayScorers: Scorer[];
  notes: string | null;
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

// ─── Helpers ────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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

function getStatusInfo(status: string) {
  switch (status) {
    case 'finished': return { label: 'Selesai', color: 'text-emerald-400', dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    case 'scheduled': return { label: 'Mendatang', color: 'text-blue-400', dot: 'bg-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' };
    case 'postponed': return { label: 'Ditunda', color: 'text-amber-400', dot: 'bg-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
    case 'cancelled': return { label: 'Dibatalkan', color: 'text-red-400', dot: 'bg-red-400', bg: 'bg-red-500/10 border-red-500/20' };
    default: return { label: status, color: 'text-muted-foreground', dot: 'bg-muted-foreground', bg: 'bg-white/[0.03] border-white/[0.06]' };
  }
}

function getResultLabel(home: number, away: number) {
  if (home > away) return { text: 'Home Win', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  if (home < away) return { text: 'Away Win', color: 'text-red-400', bg: 'bg-red-500/10' };
  return { text: 'Draw', color: 'text-amber-400', bg: 'bg-amber-500/10' };
}

// ─── Team Logo ──────────────────────────────────────────────

function TeamLogo({ src, alt, size = 80 }: { src: string | null; alt: string; size?: number }) {
  if (!src) {
    return (
      <div className="relative shrink-0 rounded-2xl overflow-hidden flex items-center justify-center bg-white/[0.04] border border-white/[0.08]" style={{ width: size, height: size }}>
        <span className="text-xl font-black text-muted-foreground/30">{alt.slice(0, 2).toUpperCase()}</span>
      </div>
    );
  }
  return (
    <div className="relative shrink-0 rounded-2xl overflow-hidden" style={{ width: size, height: size }}>
      <div className="absolute -inset-1.5 rounded-3xl pointer-events-none shadow-[0_0_24px_4px_rgba(0,240,255,0.12),0_0_48px_8px_rgba(0,240,255,0.05)]" />
      <div className="absolute inset-0 rounded-2xl bg-white/[0.05] backdrop-blur-md border border-cyan-500/20" />
      <Image src={src} alt={alt} width={size} height={size} className="relative z-10 object-contain p-3" unoptimized />
    </div>
  );
}

// ─── Stat Comparison Bar ────────────────────────────────────

function StatBar({
  home, away, label, icon: Icon, delay = 0, unit = '%',
}: {
  home: number; away: number;
  label: string;
  icon: React.ElementType;
  delay?: number;
  unit?: string;
}) {
  const total = home + away || 1;
  const homePct = (home / total) * 100;
  const awayPct = (away / total) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">{label}</span>
      </div>

      {/* Dual bar */}
      <div className="flex gap-1.5 h-3 rounded-full overflow-hidden bg-white/[0.04]">
        <motion.div
          className="h-full rounded-l-full bg-gradient-to-r from-cyan-400/60 to-cyan-400/30"
          initial={{ width: 0 }}
          animate={{ width: `${homePct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.2 }}
        />
        <motion.div
          className="h-full rounded-r-full bg-gradient-to-l from-blue-400/60 to-blue-400/30"
          initial={{ width: 0 }}
          animate={{ width: `${awayPct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.3 }}
        />
      </div>

      {/* Values */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-bold neon-text tabular-nums">{home}{unit}</span>
        <span className="text-sm font-bold text-blue-400 tabular-nums">{away}{unit}</span>
      </div>
    </motion.div>
  );
}

// ─── Stat Card (discrete values) ────────────────────────────

function StatCard({
  home, away, label, icon: Icon, homeColor = 'text-cyan-400', awayColor = 'text-blue-400',
  delay = 0,
}: {
  home: number; away: number;
  label: string;
  icon: React.ElementType;
  homeColor?: string;
  awayColor?: string;
  delay?: number;
}) {
  const winner = home > away ? 'home' : away > home ? 'away' : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="glass-card p-3.5 flex flex-col items-center gap-2 text-center"
    >
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground/40" />
        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xl font-black tabular-nums ${homeColor} ${winner === 'home' ? 'opacity-100' : 'opacity-60'}`}>
          {home}
        </span>
        <span className="w-px h-4 bg-white/[0.06]" />
        <span className={`text-xl font-black tabular-nums ${awayColor} ${winner === 'away' ? 'opacity-100' : 'opacity-60'}`}>
          {away}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Scorers List ───────────────────────────────────────────

function ScorersList({ scorers, team, color }: { scorers: Scorer[]; team: string; color: 'home' | 'away' }) {
  if (!scorers || scorers.length === 0) return null;
  const accent = color === 'home' ? 'text-emerald-400' : 'text-red-400';
  const dotColor = color === 'home' ? 'bg-emerald-400' : 'bg-red-400';
  const bg = color === 'home' ? 'bg-emerald-500/[0.04] border-emerald-500/10' : 'bg-red-500/[0.04] border-red-500/10';

  return (
    <div className={`rounded-xl p-3.5 border ${bg}`}>
      <h4 className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} inline-block mr-1.5 -translate-y-px`} />
        {team}
      </h4>
      <div className="space-y-2">
        {scorers.map((s, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, x: color === 'home' ? -10 : 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * idx + 0.2 }} className="flex items-center gap-2.5">
            <Target className="w-3 h-3 text-muted-foreground/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${accent}`}>{s.player || 'Pemain tidak diketahui'}</span>
              {s.assist && <span className="text-xs text-muted-foreground/40 ml-1">(assist: {s.assist})</span>}
            </div>
            {s.minute && (
              <span className="text-xs font-bold text-white/60 tabular-nums shrink-0">
                {s.minute}&apos;
                {s.type && s.type !== 'goal' && <span className="text-[9px] text-muted-foreground/40 ml-1">{s.type}</span>}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Info Row ───────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, delay = 0 }: { icon: React.ElementType; label: string; value: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <div className="w-8 h-8 rounded-lg bg-cyan-500/[0.06] border border-cyan-500/10 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-cyan-400/60" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-300 truncate">{value}</p>
      </div>
    </motion.div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-deep-900">
      <header className="border-b border-white/[0.04] bg-deep-900/70 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <Skeleton className="h-4 w-20 bg-white/5" />
          <Skeleton className="h-4 w-16 bg-white/5" />
        </div>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <Skeleton className="h-3 w-40 bg-white/5 mb-6" />
        <div className="glass-card p-8 mb-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex-1 flex flex-col items-center gap-3">
              <Skeleton className="w-16 h-16 rounded-2xl bg-white/5" />
              <Skeleton className="h-5 w-24 bg-white/5" />
            </div>
            <Skeleton className="h-16 w-28 rounded-2xl bg-white/5" />
            <div className="flex-1 flex flex-col items-center gap-3">
              <Skeleton className="w-16 h-16 rounded-2xl bg-white/5" />
              <Skeleton className="h-5 w-24 bg-white/5" />
            </div>
          </div>
          <Skeleton className="h-4 w-48 mx-auto bg-white/5" />
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 glass-card mb-4" />)}
      </main>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function MatchDetailPage() {
  const params = useParams<{ id: string }>();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatchDetail = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${params.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.match) {
        setMatch(json.match);
      } else {
        setError('Pertandingan tidak ditemukan');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchMatchDetail(); }, [fetchMatchDetail]);

  if (loading) return <PageSkeleton />;
  if (error || !match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-deep-900 gap-4 p-4">
        <AlertTriangle className="w-12 h-12 text-amber-400/40" />
        <p className="text-sm text-muted-foreground">{error || 'Pertandingan tidak ditemukan'}</p>
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/15 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const isFinished = match.status === 'finished';
  const statusInfo = getStatusInfo(match.status);
  const result = isFinished ? getResultLabel(match.homeScore, match.awayScore) : null;
  const hasPossession = match.homePossession !== null && match.awayPossession !== null;
  const hasShots = match.homeTotalShots !== null && match.awayTotalShots !== null;
  const hasShotsOnTarget = match.homeShotsOnTarget !== null && match.awayShotsOnTarget !== null;
  const hasPasses = match.homePasses !== null && match.awayPasses !== null;
  const hasPassAccuracy = match.homePassAccuracy !== null && match.awayPassAccuracy !== null;
  const hasCorners = match.homeCorners !== null && match.awayCorners !== null;
  const hasYellowCards = match.homeYellowCards !== null && match.awayYellowCards !== null;
  const hasRedCards = match.homeRedCards !== null && match.awayRedCards !== null;
  const hasFouls = match.homeFouls !== null && match.awayFouls !== null;
  const hasOffsides = match.homeOffsides !== null && match.awayOffsides !== null;
  const hasScorers = (match.homeScorers?.length || 0) > 0 || (match.awayScorers?.length || 0) > 0;
  const hasAnyStats = hasPossession || hasShots || hasShotsOnTarget || hasPasses || hasYellowCards;

  return (
    <div className="min-h-screen flex flex-col bg-deep-900">
      {/* Decorative bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-cyan-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[250px] bg-emerald-500/[0.02] rounded-full blur-[100px]" />
      </div>

      {/* ─── Header ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-deep-900/70 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors group">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Beranda</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main ─────────────────────────────────────────── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground/40 mb-6">
          <Link href="/" className="hover:text-cyan-400/60 transition-colors">Beranda</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-muted-foreground/60">Pertandingan</span>
        </nav>

        {/* ─── Score Hero ──────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden mb-6">
          <div className={`h-[2px] ${isFinished ? 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-500 to-transparent'}`} />
          <div className="p-5 sm:p-8">
            {/* League */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 min-w-0">
                <Trophy className="w-3.5 h-3.5 text-cyan-400/50 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-muted-foreground/70 uppercase tracking-wider truncate">
                  {match.league || 'Liga Tidak Diketahui'}
                </span>
              </div>
              {match.matchWeek && (
                <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 font-semibold bg-white/[0.03] text-muted-foreground/60 border-white/[0.06]">
                  MD {match.matchWeek}
                </Badge>
              )}
            </div>

            {/* Teams + Score */}
            <div className="flex items-center justify-between gap-4 sm:gap-6 mb-6">
              <div className="flex-1 min-w-0 text-center sm:text-right">
                <div className="flex justify-center sm:justify-end mb-3">
                  <TeamLogo src={match.homeTeamLogoUrl} alt={match.homeTeam} size={isFinished ? 80 : 72} />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">{match.homeTeam}</h1>
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mt-0.5">Kandang</p>
              </div>

              <div className="shrink-0 flex flex-col items-center gap-2">
                {isFinished ? (
                  <div className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-3 sm:py-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] shadow-[0_0_30px_rgba(0,240,255,0.06)]">
                    <span className="text-4xl sm:text-5xl font-black tabular-nums min-w-[2.5rem] text-center neon-text">{match.homeScore}</span>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.2em]">vs</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                    </div>
                    <span className="text-4xl sm:text-5xl font-black tabular-nums min-w-[2.5rem] text-center neon-text">{match.awayScore}</span>
                  </div>
                ) : (
                  <div className="flex items-center px-6 py-4 rounded-2xl bg-blue-500/[0.06] border border-blue-500/15">
                    <span className="text-xl font-black text-blue-400 uppercase tracking-[0.3em]">vs</span>
                  </div>
                )}
                {isFinished && result && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold uppercase ${result.bg} ${result.color}`}>
                    <CircleDot className="w-3 h-3" />{result.text}
                  </motion.div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex justify-center sm:justify-start mb-3">
                  <TeamLogo src={match.awayTeamLogoUrl} alt={match.awayTeam} size={isFinished ? 80 : 72} />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">{match.awayTeam}</h1>
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mt-0.5">Tandang</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/50 border-t border-white/[0.04] pt-4">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(match.matchDate)}</span>
              <span className="text-muted-foreground/20 mx-1">·</span>
              <span>{getRelativeDay(match.matchDate)}</span>
            </div>
          </div>
          <div className={`h-[2px] ${isFinished ? 'bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-500/30 to-transparent'}`} />
        </motion.div>

        {/* ─── Scorers ──────────────────────────────────── */}
        {hasScorers && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-cyan-400/60" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Pencetak Gol</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {match.homeScorers && match.homeScorers.length > 0 && <ScorersList scorers={match.homeScorers} team={match.homeTeam} color="home" />}
              {match.awayScorers && match.awayScorers.length > 0 && <ScorersList scorers={match.awayScorers} team={match.awayTeam} color="away" />}
            </div>
          </motion.div>
        )}

        {/* ─── Statistics Section ───────────────────────── */}
        {hasAnyStats && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-cyan-400/60" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Statistik Pertandingan</h2>
            </div>

            {/* Team labels */}
            <div className="flex items-center justify-between px-1 mb-3">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">{match.homeTeam}</span>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{match.awayTeam}</span>
            </div>

            {/* Comparison Bars */}
            <div className="space-y-3 mb-4">
              {hasPossession && <StatBar home={match.homePossession!} away={match.awayPossession!} label="Penguasaan Bola" icon={Percent} delay={0.2} />}
              {hasTotalShotsInline() && <StatBar home={match.homeTotalShots!} away={match.awayTotalShots!} label="Total Tembakan" icon={Crosshair} delay={0.25} />}
              {hasShotsOnTarget && <StatBar home={match.homeShotsOnTarget!} away={match.awayShotsOnTarget!} label="Tembakan Tepat Sasaran" icon={Target} delay={0.3} />}
              {hasPassAccuracy && <StatBar home={match.homePassAccuracy!} away={match.awayPassAccuracy!} label="Akurasi Umpan" icon={Footprints} delay={0.35} />}
            </div>

            {/* Discrete Stat Cards Grid */}
            {(hasCorners || hasYellowCards || hasRedCards || hasFouls || hasOffsides || hasPasses) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hasCorners && <StatCard home={match.homeCorners!} away={match.awayCorners!} label="Sepak Pojok" icon={Flag} delay={0.4} />}
                {hasYellowCards && <StatCard home={match.homeYellowCards!} away={match.awayYellowCards!} label="Kartu Kuning" icon={Square} homeColor="text-amber-400" awayColor="text-amber-300" delay={0.45} />}
                {hasRedCards && <StatCard home={match.homeRedCards!} away={match.awayRedCards!} label="Kartu Merah" icon={Ban} homeColor="text-red-400" awayColor="text-red-300" delay={0.5} />}
                {hasFouls && <StatCard home={match.homeFouls!} away={match.awayFouls!} label="Pelanggaran" icon={AlertTriangle} delay={0.55} />}
                {hasOffsides && <StatCard home={match.homeOffsides!} away={match.awayOffsides!} label="Offside" icon={TriangleAlert} delay={0.6} />}
                {hasPasses && <StatCard home={match.homePasses!} away={match.awayPasses!} label="Total Umpan" icon={Footprints} delay={0.65} />}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Match Info ───────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-cyan-400/60" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Informasi Pertandingan</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {match.league && <InfoRow icon={Trophy} label="Liga / Kompetisi" value={match.league} delay={0.7} />}
            {match.season && <InfoRow icon={Hash} label="Musim" value={`${match.season}`} delay={0.75} />}
            {match.matchWeek && <InfoRow icon={Swords} label="Matchday" value={`Pekan ${match.matchWeek}`} delay={0.8} />}
            {match.venue && <InfoRow icon={MapPin} label="Stadion / Venue" value={match.venue} delay={0.85} />}
            {match.referee && <InfoRow icon={User} label="Wasit" value={match.referee} delay={0.9} />}
            <InfoRow icon={Calendar} label="Tanggal" value={formatDate(match.matchDate)} delay={0.95} />
          </div>
        </motion.div>

        {/* ─── Notes ─────────────────────────────────────── */}
        {match.notes && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="glass-card p-4 sm:p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-cyan-400/60" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catatan</h2>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{match.notes}</p>
          </motion.div>
        )}

        {/* ─── Refresh + Back ───────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={fetchMatchDetail} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.03] text-muted-foreground border border-white/[0.06] hover:bg-white/[0.06] hover:text-white transition-all">
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </button>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-cyan-500/[0.06] text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all duration-300">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
        </motion.div>
      </main>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-white/[0.03] bg-deep-900/50 backdrop-blur-sm mt-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

  function hasTotalShotsInline() {
    return match.homeTotalShots !== null && match.awayTotalShots !== null;
  }
}
