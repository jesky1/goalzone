'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Trophy,
  Hash,
  Clock,
  Swords,
  User,
  Target,
  Percent,
  CircleDot,
  Info,
  ChevronRight,
  Zap,
  Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ─── Types ──────────────────────────────────────────────────

interface Scorer {
  player?: string;
  minute?: number;
  type?: string;
  assist?: string;
  [key: string]: any;
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
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getDaysUntil(dateStr: string): number {
  try {
    const target = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
  } catch {
    return 0;
  }
}

function getRelativeDay(dateStr: string): string {
  const days = getDaysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)} hari lalu`;
  if (days === 0) return 'Hari ini';
  if (days === 1) return 'Besok';
  return `${days} hari lagi`;
}

function getStatusInfo(status: string): { label: string; color: string; dot: string; bg: string } {
  switch (status) {
    case 'finished': return { label: 'Selesai', color: 'text-emerald-400', dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    case 'scheduled': return { label: 'Mendatang', color: 'text-blue-400', dot: 'bg-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' };
    case 'postponed': return { label: 'Ditunda', color: 'text-amber-400', dot: 'bg-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
    case 'cancelled': return { label: 'Dibatalkan', color: 'text-red-400', dot: 'bg-red-400', bg: 'bg-red-500/10 border-red-500/20' };
    case 'abandoned': return { label: 'Dihentikan', color: 'text-gray-400', dot: 'bg-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' };
    default: return { label: status, color: 'text-muted-foreground', dot: 'bg-muted-foreground', bg: 'bg-white/[0.03] border-white/[0.06]' };
  }
}

function getResultLabel(home: number, away: number): { text: string; color: string; bg: string } {
  if (home > away) return { text: 'Home Win', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  if (home < away) return { text: 'Away Win', color: 'text-red-400', bg: 'bg-red-500/10' };
  return { text: 'Draw', color: 'text-amber-400', bg: 'bg-amber-500/10' };
}

// ─── Team Logo Component ────────────────────────────────────

function TeamLogo({
  src,
  alt,
  size = 80,
}: {
  src: string | null;
  alt: string;
  size?: number;
}) {
  if (!src) {
    return (
      <div
        className="relative shrink-0 rounded-2xl overflow-hidden flex items-center justify-center
          bg-white/[0.04] border border-white/[0.08]"
        style={{ width: size, height: size }}
      >
        <span className="text-xl font-black text-muted-foreground/30">
          {alt.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative shrink-0 rounded-2xl overflow-hidden"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute -inset-1.5 rounded-3xl pointer-events-none
          shadow-[0_0_24px_4px_rgba(0,240,255,0.12),0_0_48px_8px_rgba(0,240,255,0.05)]"
      />
      <div className="absolute inset-0 rounded-2xl bg-white/[0.05] backdrop-blur-md border border-cyan-500/20" />
      <Image src={src} alt={alt} width={size} height={size} className="relative z-10 object-contain p-3" unoptimized />
    </div>
  );
}

// ─── Possession Bar ──────────────────────────────────────────

function PossessionBar({ home, away, homeTeam, awayTeam }: { home: number; away: number; homeTeam: string; awayTeam: string }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1.5">
        <Percent className="w-3 h-3" /> Penguasaan Bola
      </h4>
      <div className="space-y-2">
        {/* Home bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-medium">{homeTeam}</span>
            <span className="font-bold neon-text tabular-nums">{home}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-neon/80 to-neon/40"
              initial={{ width: 0 }}
              animate={{ width: `${home}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </div>
        {/* Away bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-medium">{awayTeam}</span>
            <span className="font-bold text-blue-400 tabular-nums">{away}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500/40 to-blue-500/80"
              initial={{ width: 0 }}
              animate={{ width: `${away}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Scorers List ───────────────────────────────────────────

function ScorersList({
  scorers,
  team,
  color,
}: {
  scorers: Scorer[];
  team: string;
  color: 'home' | 'away';
}) {
  if (!scorers || scorers.length === 0) return null;

  const accentColor = color === 'home' ? 'text-emerald-400' : 'text-red-400';
  const dotColor = color === 'home' ? 'bg-emerald-400' : 'bg-red-400';
  const bgColor = color === 'home' ? 'bg-emerald-500/[0.04] border-emerald-500/10' : 'bg-red-500/[0.04] border-red-500/10';

  return (
    <div className={`rounded-xl p-3.5 border ${bgColor}`}>
      <h4 className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} inline-block mr-1.5 -translate-y-px`} />
        {team}
      </h4>
      <div className="space-y-2">
        {scorers.map((scorer, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: color === 'home' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * idx + 0.2 }}
            className="flex items-center gap-2.5"
          >
            <Target className="w-3 h-3 text-muted-foreground/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${accentColor}`}>
                {scorer.player || 'Pemain tidak diketahui'}
              </span>
              {scorer.assist && (
                <span className="text-xs text-muted-foreground/40 ml-1">
                  (assist: {scorer.assist})
                </span>
              )}
            </div>
            {scorer.minute && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-white/60 tabular-nums">{scorer.minute}&apos;</span>
                {scorer.type && scorer.type !== 'goal' && (
                  <span className="text-[9px] text-muted-foreground/40 uppercase">{scorer.type}</span>
                )}
              </div>
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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
    >
      <div className="w-8 h-8 rounded-lg bg-neon/[0.06] border border-neon/10 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-neon/60" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-300 truncate">{value}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Content ──────────────────────────────────────────

export default function MatchDetailContent({ match }: { match: MatchDetail }) {
  const [showAllHome, setShowAllHome] = useState(false);
  const [showAllAway, setShowAllAway] = useState(false);

  const isFinished = match.status === 'finished';
  const isScheduled = match.status === 'scheduled';
  const statusInfo = getStatusInfo(match.status);
  const result = isFinished ? getResultLabel(match.homeScore, match.awayScore) : null;
  const hasPossession = match.homePossession !== null && match.awayPossession !== null;
  const hasScorers = (match.homeScorers?.length || 0) > 0 || (match.awayScorers?.length || 0) > 0;

  const homeScorersDisplay = showAllHome ? match.homeScorers : match.homeScorers.slice(0, 3);
  const awayScorersDisplay = showAllAway ? match.awayScorers : match.awayScorers.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-deep-900">
      {/* Decorative bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-neon/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[250px] bg-emerald-500/[0.02] rounded-full blur-[100px]" />
      </div>

      {/* ─── Header ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-deep-900/70 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-neon transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Beranda</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main ─────────────────────────────────────────── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground/40 mb-6">
          <Link href="/" className="hover:text-neon/60 transition-colors">Beranda</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-muted-foreground/60">Pertandingan</span>
        </nav>

        {/* ─── Score Hero ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden mb-6"
        >
          {/* Top gradient */}
          <div className={`h-[2px] ${isFinished
            ? 'bg-gradient-to-r from-transparent via-neon to-transparent'
            : 'bg-gradient-to-r from-transparent via-blue-500 to-transparent'}`} />

          <div className="p-5 sm:p-8">
            {/* League & Matchday */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 min-w-0">
                <Trophy className="w-3.5 h-3.5 text-neon/50 shrink-0" />
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
              {/* Home */}
              <div className="flex-1 min-w-0 text-center sm:text-right">
                <div className="flex justify-center sm:justify-end mb-3">
                  <TeamLogo src={match.homeTeamLogoUrl} alt={match.homeTeam} size={isScheduled ? 72 : 80} />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">{match.homeTeam}</h1>
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mt-0.5">Kandang</p>
              </div>

              {/* Score */}
              <div className="shrink-0 flex flex-col items-center gap-2">
                {isFinished ? (
                  <div className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-3 sm:py-4 rounded-2xl
                    bg-white/[0.04] border border-white/[0.06] shadow-[0_0_30px_rgba(0,240,255,0.06)]">
                    <span className="text-4xl sm:text-5xl font-black tabular-nums min-w-[2.5rem] text-center neon-text">
                      {match.homeScore}
                    </span>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.2em]">vs</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                    </div>
                    <span className="text-4xl sm:text-5xl font-black tabular-nums min-w-[2.5rem] text-center neon-text">
                      {match.awayScore}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center px-6 py-4 rounded-2xl
                    bg-blue-500/[0.06] border border-blue-500/15">
                    <span className="text-xl font-black text-blue-400 uppercase tracking-[0.3em]">vs</span>
                  </div>
                )}

                {/* Result pill */}
                {isFinished && result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold uppercase ${result.bg} ${result.color}`}
                  >
                    <CircleDot className="w-3 h-3" />
                    {result.text}
                  </motion.div>
                )}

                {/* Status badge */}
                <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-semibold ${statusInfo.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot} mr-1`} />
                  {statusInfo.label}
                </Badge>
              </div>

              {/* Away */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex justify-center sm:justify-start mb-3">
                  <TeamLogo src={match.awayTeamLogoUrl} alt={match.awayTeam} size={isScheduled ? 72 : 80} />
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
              <Clock className="w-3.5 h-3.5" />
              <span>{getRelativeDay(match.matchDate)}</span>
            </div>
          </div>

          <div className={`h-[2px] ${isFinished
            ? 'bg-gradient-to-r from-transparent via-neon/30 to-transparent'
            : 'bg-gradient-to-r from-transparent via-blue-500/30 to-transparent'}`} />
        </motion.div>

        {/* ─── Scorers Section ──────────────────────────── */}
        {hasScorers && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-neon/60" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Pencetak Gol</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Home scorers */}
              {match.homeScorers && match.homeScorers.length > 0 && (
                <ScorersList scorers={homeScorersDisplay} team={match.homeTeam} color="home" />
              )}
              {/* Away scorers */}
              {match.awayScorers && match.awayScorers.length > 0 && (
                <ScorersList scorers={awayScorersDisplay} team={match.awayTeam} color="away" />
              )}
            </div>
            {/* Show more buttons */}
            {match.homeScorers.length > 3 && (
              <button
                onClick={() => setShowAllHome(!showAllHome)}
                className="mt-2 text-[11px] text-neon/60 hover:text-neon transition-colors"
              >
                {showAllHome ? 'Tutup' : `+${match.homeScorers.length - 3} gol lagi`}
              </button>
            )}
            {match.awayScorers.length > 3 && (
              <button
                onClick={() => setShowAllAway(!showAllAway)}
                className="mt-2 text-[11px] text-neon/60 hover:text-neon transition-colors"
              >
                {showAllAway ? 'Tutup' : `+${match.awayScorers.length - 3} gol lagi`}
              </button>
            )}
          </motion.div>
        )}

        {/* ─── Possession Section ─────────────────────────── */}
        {hasPossession && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-4 sm:p-5 mb-6"
          >
            <PossessionBar
              home={match.homePossession!}
              away={match.awayPossession!}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
            />
          </motion.div>
        )}

        {/* ─── Match Info Grid ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-neon/60" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Informasi Pertandingan</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {match.league && (
              <InfoRow icon={Trophy} label="Liga / Kompetisi" value={match.league} delay={0.2} />
            )}
            {match.season && (
              <InfoRow icon={Hash} label="Musim" value={`${match.season}`} delay={0.25} />
            )}
            {match.matchWeek && (
              <InfoRow icon={Swords} label="Matchday" value={`Pekan ${match.matchWeek}`} delay={0.3} />
            )}
            {match.venue && (
              <InfoRow icon={MapPin} label="Stadion / Venue" value={match.venue} delay={0.35} />
            )}
            {match.referee && (
              <InfoRow icon={User} label="Wasit" value={match.referee} delay={0.4} />
            )}
            <InfoRow icon={Calendar} label="Tanggal" value={formatDate(match.matchDate)} delay={0.45} />
          </div>
        </motion.div>

        {/* ─── Notes ─────────────────────────────────────── */}
        {match.notes && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-4 sm:p-5 mb-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-neon/60" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catatan</h2>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{match.notes}</p>
          </motion.div>
        )}

        {/* ─── Back Button ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
              bg-neon/[0.06] text-neon border border-neon/20
              hover:bg-neon/[0.1] hover:border-neon/30
              hover:shadow-[0_0_20px_rgba(0,240,255,0.1)]
              transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </motion.div>
      </main>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-white/[0.03] bg-deep-900/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground/30">
            <span>GOALZONE &mdash; Portal Berita Sepak Bola</span>
            <div className="flex items-center gap-3">
              <Link href="/" className="hover:text-neon/60 transition-colors">Beranda</Link>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
              <Link href="/privacy-policy" className="hover:text-neon/60 transition-colors">Privasi</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
