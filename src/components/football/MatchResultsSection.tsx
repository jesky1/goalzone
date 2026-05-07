'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Loader2, Swords, RefreshCw } from 'lucide-react';
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
  notes: string | null;
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

function getResultColor(home: number, away: number): { bg: string; text: string; border: string; label: string } {
  if (home > away) return { bg: 'bg-emerald-500/8', text: 'text-emerald-400', border: 'border-emerald-500/15', label: 'W' };
  if (home < away) return { bg: 'bg-red-500/8', text: 'text-red-400', border: 'border-red-500/15', label: 'L' };
  return { bg: 'bg-amber-500/8', text: 'text-amber-400', border: 'border-amber-500/15', label: 'D' };
}

function getScoreDisplayColor(status: string): string {
  switch (status) {
    case 'finished': return 'neon-text';
    case 'postponed': return 'text-amber-400';
    case 'cancelled': return 'text-red-400';
    case 'abandoned': return 'text-gray-400';
    default: return 'neon-text';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'finished': return 'FT';
    case 'postponed': return 'Postp.';
    case 'cancelled': return 'Cancel';
    case 'abandoned': return 'Aband.';
    default: return status;
  }
}

// ─── Single Score Card ──────────────────────────────────────

function ScoreCard({ match, index }: { match: MatchResult; index: number }) {
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
      {/* Glass card with glow border */}
      <div className={`relative rounded-2xl overflow-hidden border transition-all duration-300
        ${result.border}
        glass-card glass-hover
        hover:shadow-[0_0_30px_-5px_var(--c-neon-glow)]`}>
        {/* Subtle top gradient */}
        <div className={`absolute inset-x-0 top-0 h-[2px] opacity-60
          ${match.homeScore > match.awayScore ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent' :
            match.homeScore < match.awayScore ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent' :
            'bg-gradient-to-r from-transparent via-amber-500 to-transparent'}`} />

        <div className="p-4 sm:p-5">
          {/* League & Date Header */}
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
                  <span className="text-[10px] text-muted-foreground/50 font-medium">
                    MD {match.matchWeek}
                  </span>
                </>
              )}
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 h-5 font-semibold ${result.bg} ${result.text} ${result.border} border`}
            >
              {getStatusLabel(match.status)}
            </Badge>
          </div>

          {/* Score Row */}
          <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4">
            {/* Home Team */}
            <div className="flex-1 min-w-0 text-right">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                {match.homeTeam}
              </h3>
            </div>

            {/* Score Box */}
            <div className="shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/[0.04] dark:bg-white/[0.04] border border-white/[0.06] shadow-inner">
                <span className={`text-xl sm:text-2xl font-black tabular-nums min-w-[1.5rem] text-center ${scoreColor}`}>
                  {match.homeScore}
                </span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[8px] text-muted-foreground/40 uppercase tracking-widest">vs</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                </div>
                <span className={`text-xl sm:text-2xl font-black tabular-nums min-w-[1.5rem] text-center ${scoreColor}`}>
                  {match.awayScore}
                </span>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex-1 min-w-0 text-left">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                {match.awayTeam}
              </h3>
            </div>
          </div>

          {/* Result indicator dots */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${result.bg} ${result.text}`}>
              {match.homeScore > match.awayScore ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Home Win
                </>
              ) : match.homeScore < match.awayScore ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Away Win
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Draw
                </>
              )}
            </div>
          </div>

          {/* Footer: Date + Venue */}
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

          {/* Notes */}
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

// ─── Loading Skeleton ───────────────────────────────────────

function ScoreCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] glass-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-3 w-24 bg-gray-200/50 dark:bg-white/5" />
        <Skeleton className="h-5 w-12 rounded-md bg-gray-200/50 dark:bg-white/5" />
      </div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <Skeleton className="h-5 w-28 bg-gray-200/50 dark:bg-white/5" />
        <Skeleton className="h-12 w-20 rounded-xl bg-gray-200/50 dark:bg-white/5" />
        <Skeleton className="h-5 w-28 bg-gray-200/50 dark:bg-white/5" />
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

  const fetchMatchResults = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/match-results?limit=20');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const list = json.matches || [];

      if (Array.isArray(list) && list.length > 0) {
        setMatches(list);
        setSource(json.source || '');
      } else {
        setError('Tidak ada data pertandingan');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatchResults();
  }, [fetchMatchResults]);

  return (
    <div>
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-center justify-between mb-6 sm:mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-neon/10 border border-neon/20">
            <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-neon" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Hasil Pertandingan
              {source === 'mock' && (
                <Badge variant="outline" className="text-[9px] bg-amber-500/5 text-amber-400/70 border-amber-500/15 px-1.5 py-0">
                  Sample
                </Badge>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Skor pertandingan terbaru dari liga-liga top Eropa
            </p>
          </div>
        </div>

        {!loading && (
          <button
            onClick={fetchMatchResults}
            className="p-2 rounded-lg text-muted-foreground hover:text-neon hover:bg-neon/5 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </motion.div>

      {/* Content */}
      {loading ? (
        /* ── Loading Grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ScoreCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        /* ── Error State ── */
        <div className="glass-card p-8 sm:p-12 text-center">
          <Swords className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchMatchResults}
            className="mt-3 text-xs text-neon hover:text-neon/80 transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Lagi
          </button>
        </div>
      ) : (
        /* ── Match Cards Grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {matches.map((match, idx) => (
            <ScoreCard key={match.id} match={match} index={idx} />
          ))}
        </div>
      )}

      {/* Footer count */}
      {!loading && matches.length > 0 && (
        <p className="text-xs text-muted-foreground/40 text-center mt-6">
          {matches.length} pertandingan terbaru
          {source === 'mock' && ' · Data sampel — tambahkan hasil di panel admin'}
        </p>
      )}
    </div>
  );
}
