'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Swords, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// ─── Types ──────────────────────────────────────────────────

interface MatchResult {
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
  notes: string | null;
}

type StatusFilter = 'all' | 'finished' | 'scheduled';

interface FilterTab {
  id: StatusFilter;
  label: string;
  icon: React.ElementType;
  activeClass: string;
}

const FILTER_TABS: FilterTab[] = [
  { id: 'all', label: 'Semua', icon: Swords, activeClass: 'bg-neon/10 text-neon border-neon/20' },
  { id: 'finished', label: 'Selesai', icon: CheckCircle2, activeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'scheduled', label: 'Mendatang', icon: Clock, activeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
];

// ─── Team Logo Component (Cyan Neon Glow Glassmorphism) ────

function TeamLogo({
  src,
  alt,
  size = 32,
}: {
  src: string | null;
  alt: string;
  size?: number;
}) {
  if (!src) {
    return (
      <div
        className="relative shrink-0 rounded-full overflow-hidden flex items-center justify-center
          bg-white/[0.04] border border-white/[0.08]"
        style={{ width: size, height: size }}
      >
        <span className="text-[9px] font-bold text-muted-foreground/40">
          {alt.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      className="relative shrink-0 rounded-full overflow-hidden group/logo"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      {/* Glassmorphism backdrop ring */}
      <div
        className="absolute inset-0 rounded-full
          bg-white/[0.06] backdrop-blur-md border border-white/[0.1]
          group-hover/logo:bg-cyan-400/[0.08] group-hover/logo:border-cyan-400/30
          transition-all duration-300"
      />

      {/* Cyan neon glow on hover */}
      <div
        className="absolute -inset-1 rounded-full opacity-0 group-hover/logo:opacity-100
          transition-opacity duration-300 pointer-events-none
          shadow-[0_0_12px_2px_rgba(0,243,255,0.25),0_0_24px_4px_rgba(0,243,255,0.12)]
          group-hover/logo:shadow-[0_0_14px_3px_rgba(0,243,255,0.35),0_0_30px_6px_rgba(0,243,255,0.18)]"
      />

      {/* Pulsing outer ring on hover */}
      <div
        className="absolute -inset-[3px] rounded-full opacity-0 group-hover/logo:opacity-100
          transition-opacity duration-500 pointer-events-none
          animate-pulse"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(0,243,255,0.3) 25%, transparent 50%, rgba(0,243,255,0.2) 75%, transparent 100%)',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))',
        }}
      />

      {/* The actual logo image */}
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="relative z-10 object-contain p-[3px]"
        unoptimized
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    </motion.div>
  );
}

// ─── Helpers ────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

function getDaysUntil(dateStr: string): number {
  try {
    const target = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
    return diff;
  } catch {
    return 0;
  }
}

function getResultColor(home: number, away: number): { bg: string; text: string; border: string } {
  if (home > away) return { bg: 'bg-emerald-500/8', text: 'text-emerald-400', border: 'border-emerald-500/15' };
  if (home < away) return { bg: 'bg-red-500/8', text: 'text-red-400', border: 'border-red-500/15' };
  return { bg: 'bg-amber-500/8', text: 'text-amber-400', border: 'border-amber-500/15' };
}

function getScoreDisplayColor(status: string): string {
  switch (status) {
    case 'finished': return 'neon-text';
    case 'postponed': return 'text-amber-400';
    case 'cancelled': return 'text-red-400';
    default: return 'neon-text';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'finished': return 'FT';
    case 'postponed': return 'Postp.';
    case 'cancelled': return 'Cancel';
    case 'scheduled': return 'vs';
    default: return status;
  }
}

function getRelativeDay(dateStr: string): string {
  const days = getDaysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)} hari lalu`;
  if (days === 0) return 'Hari ini';
  if (days === 1) return 'Besok';
  return `${days} hari lagi`;
}

// ─── Finished Score Card ────────────────────────────────────

function FinishedCard({ match, index }: { match: MatchResult; index: number }) {
  const result = getResultColor(match.homeScore, match.awayScore);
  const scoreColor = getScoreDisplayColor(match.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="relative group"
    >
      <div className={`relative rounded-2xl overflow-hidden border transition-all duration-300
        ${result.border}
        glass-card glass-hover
        hover:shadow-[0_0_30px_-5px_var(--c-neon-glow)]`}>
        {/* Top gradient */}
        <div className={`absolute inset-x-0 top-0 h-[2px] opacity-60
          ${match.homeScore > match.awayScore ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent' :
            match.homeScore < match.awayScore ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent' :
            'bg-gradient-to-r from-transparent via-amber-500 to-transparent'}`} />

        <div className="p-4 sm:p-5">
          {/* League header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {match.league && (
                <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider truncate max-w-[160px] sm:max-w-none">
                  {match.league}
                </span>
              )}
              {match.matchWeek && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span className="text-[10px] text-muted-foreground/50 font-medium">MD {match.matchWeek}</span>
                </>
              )}
            </div>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-semibold ${result.bg} ${result.text} ${result.border} border`}>
              FT
            </Badge>
          </div>

          {/* Score Row with Logos */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4">
            {/* Home Team */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0 justify-end">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">{match.homeTeam}</h3>
              <TeamLogo src={match.homeTeamLogoUrl} alt={match.homeTeam} size={28} />
            </div>

            {/* Score */}
            <div className="shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] shadow-inner">
                <span className={`text-xl sm:text-2xl font-black tabular-nums min-w-[1.5rem] text-center ${scoreColor}`}>{match.homeScore}</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[8px] text-muted-foreground/40 uppercase tracking-widest">vs</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                </div>
                <span className={`text-xl sm:text-2xl font-black tabular-nums min-w-[1.5rem] text-center ${scoreColor}`}>{match.awayScore}</span>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
              <TeamLogo src={match.awayTeamLogoUrl} alt={match.awayTeam} size={28} />
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">{match.awayTeam}</h3>
            </div>
          </div>

          {/* Result pill */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${result.bg} ${result.text}`}>
              {match.homeScore > match.awayScore ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Home Win</>
              ) : match.homeScore < match.awayScore ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Away Win</>
              ) : (
                <><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Draw</>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <Calendar className="w-3 h-3" />
              {formatDate(match.matchDate)}
            </div>
            {match.venue && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40 max-w-[160px] sm:max-w-[200px]">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{match.venue}</span>
              </div>
            )}
          </div>

          {match.notes && (
            <div className="mt-2 px-2 py-1 rounded-md bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[10px] text-muted-foreground/50 italic truncate">{match.notes}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Scheduled (Upcoming) Card ─────────────────────────────

function UpcomingCard({ match, index }: { match: MatchResult; index: number }) {
  const daysUntil = getDaysUntil(match.matchDate);
  const isToday = daysUntil === 0;
  const isTomorrow = daysUntil === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="relative group"
    >
      <div className={`relative rounded-2xl overflow-hidden border transition-all duration-300
        border-blue-500/15
        glass-card glass-hover
        hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)]`}>
        {/* Top blue gradient */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60" />

        <div className="p-4 sm:p-5">
          {/* League header + countdown */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {match.league && (
                <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider truncate max-w-[160px] sm:max-w-none">
                  {match.league}
                </span>
              )}
              {match.matchWeek && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span className="text-[10px] text-muted-foreground/50 font-medium">MD {match.matchWeek}</span>
                </>
              )}
            </div>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-semibold
              ${isToday ? 'bg-blue-500/15 text-blue-400 border-blue-500/25' :
                isTomorrow ? 'bg-blue-500/8 text-blue-400/80 border-blue-500/15' :
                'bg-white/[0.03] text-muted-foreground/60 border-white/[0.08]'}`}>
              {isToday ? 'Hari ini' : isTomorrow ? 'Besok' : `${daysUntil} hari lagi`}
            </Badge>
          </div>

          {/* Match Row with Logos: Team | vs | Team */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4">
            {/* Home Team */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0 justify-end">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">{match.homeTeam}</h3>
              <TeamLogo src={match.homeTeamLogoUrl} alt={match.homeTeam} size={28} />
            </div>

            {/* VS */}
            <div className="shrink-0">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <span className="text-sm font-bold text-blue-400 uppercase tracking-widest">vs</span>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
              <TeamLogo src={match.awayTeamLogoUrl} alt={match.awayTeam} size={28} />
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">{match.awayTeam}</h3>
            </div>
          </div>

          {/* Date + time highlight */}
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <Calendar className="w-3.5 h-3.5 text-blue-400/70" />
              <span className="text-xs font-semibold text-blue-400/80">
                {formatDate(match.matchDate)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <Clock className="w-3 h-3" />
              {getRelativeDay(match.matchDate)}
            </div>
            {match.venue && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40 max-w-[160px] sm:max-w-[200px]">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{match.venue}</span>
              </div>
            )}
          </div>

          {match.notes && (
            <div className="mt-2 px-2 py-1 rounded-md bg-blue-500/[0.03] border border-blue-500/[0.06]">
              <p className="text-[10px] text-blue-400/50 italic truncate">{match.notes}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────

function ScoreCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] glass-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-3 w-24 bg-gray-200/50 dark:bg-white/5" />
        <Skeleton className="h-5 w-12 rounded-md bg-gray-200/50 dark:bg-white/5" />
      </div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 justify-end">
          <Skeleton className="h-5 w-28 bg-gray-200/50 dark:bg-white/5" />
          <Skeleton className="h-7 w-7 rounded-full bg-gray-200/50 dark:bg-white/5" />
        </div>
        <Skeleton className="h-12 w-20 rounded-xl bg-gray-200/50 dark:bg-white/5" />
        <div className="flex items-center gap-2 flex-1">
          <Skeleton className="h-7 w-7 rounded-full bg-gray-200/50 dark:bg-white/5" />
          <Skeleton className="h-5 w-28 bg-gray-200/50 dark:bg-white/5" />
        </div>
      </div>
      <div className="flex justify-center mb-3">
        <Skeleton className="h-4 w-16 rounded-md bg-gray-200/50 dark:bg-white/5" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-200/30 dark:border-white/[0.03]">
        <Skeleton className="h-3 w-24 bg-gray-200/50 dark:bg-white/5" />
        <Skeleton className="h-3 w-20 bg-gray-200/50 dark:bg-white/5" />
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function MatchResultsSection() {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');

  const fetchMatchResults = useCallback(async (status: StatusFilter = activeFilter) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: '20' });
      if (status !== 'all') params.set('status', status);

      const res = await fetch(`/api/match-results?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const list = json.matches || [];

      if (Array.isArray(list) && list.length > 0) {
        setMatches(list);
        setSource(json.source || '');
      } else {
        setMatches([]);
        setSource(json.source || '');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchMatchResults();
  }, [fetchMatchResults]);

  const handleFilterChange = (filter: StatusFilter) => {
    setActiveFilter(filter);
    fetchMatchResults(filter);
  };

  const activeTab = FILTER_TABS.find(t => t.id === activeFilter)!;

  return (
    <div>
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-neon/10 border border-neon/20">
            <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-neon" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Hasil &amp; Jadwal
              {source === 'mock' && (
                <Badge variant="outline" className="text-[9px] bg-amber-500/5 text-amber-400/70 border-amber-500/15 px-1.5 py-0">
                  Sample
                </Badge>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {activeFilter === 'all' ? 'Semua pertandingan dari liga-liga top Eropa' :
               activeFilter === 'finished' ? 'Skor pertandingan yang sudah selesai' :
               'Jadwal pertandingan yang akan datang'}
            </p>
          </div>
        </div>

        {!loading && (
          <button
            onClick={() => fetchMatchResults()}
            className="p-2 rounded-lg text-muted-foreground hover:text-neon hover:bg-neon/5 transition-colors self-start"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </motion.div>

      {/* ── Filter Tabs ─────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.id;
          const count = tab.id === activeFilter ? matches.length : undefined;

          return (
            <button
              key={tab.id}
              onClick={() => handleFilterChange(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 border
                ${isActive
                  ? tab.activeClass
                  : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {count !== undefined && (
                <span className="ml-1 px-1.5 py-0 rounded-md bg-white/[0.08] text-[10px] font-bold tabular-nums">
                  {count}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="match-results-tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-current opacity-40"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ScoreCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="glass-card p-8 sm:p-12 text-center">
          <Swords className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => fetchMatchResults()}
            className="mt-3 text-xs text-neon hover:text-neon/80 transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Lagi
          </button>
        </div>
      ) : matches.length === 0 ? (
        <div className="glass-card p-8 sm:p-12 text-center">
          <activeTab.icon className={`w-10 h-10 mx-auto mb-3 ${activeFilter === 'finished' ? 'text-emerald-500/20' : 'text-blue-500/20'}`} />
          <p className="text-sm text-muted-foreground">
            {activeFilter === 'all' ? 'Belum ada pertandingan' :
             activeFilter === 'finished' ? 'Belum ada hasil pertandingan' :
             'Belum ada jadwal mendatang'}
          </p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            {source === 'mock' ? 'Data sampel — tambahkan di panel admin' : 'Data akan muncul setelah ditambahkan admin'}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            {matches.map((match, idx) =>
              match.status === 'scheduled' ? (
                <UpcomingCard key={match.id} match={match} index={idx} />
              ) : (
                <FinishedCard key={match.id} match={match} index={idx} />
              )
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Footer count */}
      {!loading && matches.length > 0 && (
        <p className="text-xs text-muted-foreground/40 text-center mt-6">
          {matches.length} pertandingan
          {activeFilter !== 'all' && ` ${activeFilter === 'finished' ? 'selesai' : 'mendatang'}`}
          {source === 'mock' && ' · Data sampel'}
        </p>
      )}
    </div>
  );
}
