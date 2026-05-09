'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trophy, RefreshCw, AlertCircle, Goal, Clock, Timer } from 'lucide-react';
import { safeSrc } from '@/lib/safe-src';

// ============================================================
// League Mapping
// ============================================================
const LEAGUES: Record<string, { id: number; name: string; season: number; logo: string }> = {
  'premier-league': { id: 39, name: 'Premier League', season: 2026, logo: 'https://media.api-sports.io/football/leagues/39.png' },
  'la-liga': { id: 140, name: 'La Liga', season: 2026, logo: 'https://media.api-sports.io/football/leagues/140.png' },
  'serie-a': { id: 135, name: 'Serie A', season: 2026, logo: 'https://media.api-sports.io/football/leagues/135.png' },
  'bundesliga': { id: 78, name: 'Bundesliga', season: 2026, logo: 'https://media.api-sports.io/football/leagues/78.png' },
  'ligue-1': { id: 61, name: 'Ligue 1', season: 2026, logo: 'https://media.api-sports.io/football/leagues/61.png' },
  'champions-league': { id: 2, name: 'Champions League', season: 2026, logo: 'https://media.api-sports.io/football/leagues/2.png' },
  'europa-league': { id: 3, name: 'Europa League', season: 2026, logo: 'https://media.api-sports.io/football/leagues/3.png' },
};

// ============================================================
// Types
// ============================================================
interface Standing {
  position: number;
  team: string;
  teamLogo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

interface Scorer {
  rank: number;
  name: string;
  photo: string;
  team: string;
  teamLogo: string;
  goals: number;
  assists: number;
  minutesPlayed: number;
}

// ============================================================
// Loading Skeletons
// ============================================================
function StandingsSkeleton() {
  return (
    <div className="glass-card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-5 w-5 rounded ml-auto" />
      </div>
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TopScorersSkeleton() {
  return (
    <div className="glass-card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-5 rounded ml-auto" />
      </div>
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-5 w-6 ml-auto" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// League Detail Page
// ============================================================
export default function LeagueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const leagueInfo = LEAGUES[slug];

  const [standings, setStandings] = useState<Standing[]>([]);
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [seasonLabel, setSeasonLabel] = useState('');
  const [scorersSeasonLabel, setScorersSeasonLabel] = useState('');
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [scorersLoading, setScorersLoading] = useState(true);
  const [standingsRefreshing, setStandingsRefreshing] = useState(false);
  const [scorersRefreshing, setScorersRefreshing] = useState(false);

  // ─── Fetch Standings ──────────────────────────────────────
  const loadStandings = async (showRefresh = false) => {
    if (showRefresh && standingsRefreshing) return;
    if (showRefresh) setStandingsRefreshing(true);
    try {
      const res = await fetch(`/api/standings?league=${slug}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.standings)) setStandings(data.standings);
        if (data.season) setSeasonLabel(data.season);
      }
    } catch {
      // silently fail
    } finally {
      setStandingsLoading(false);
      setStandingsRefreshing(false);
    }
  };

  // ─── Fetch Top Scorers ────────────────────────────────────
  const loadScorers = async (showRefresh = false) => {
    if (showRefresh && scorersRefreshing) return;
    if (showRefresh) setScorersRefreshing(true);
    try {
      const res = await fetch(`/api/top-scorers?league=${slug}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.topScorers || data.scorers || [];
        if (Array.isArray(list)) setScorers(list);
        if (data.season) setScorersSeasonLabel(data.season);
      }
    } catch {
      // silently fail
    } finally {
      setScorersLoading(false);
      setScorersRefreshing(false);
    }
  };

  useEffect(() => {
    if (!leagueInfo) return;
    loadStandings();
    loadScorers();
  }, [slug]);

  // ─── Invalid League Slug ──────────────────────────────────
  if (!leagueInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Liga tidak ditemukan</h1>
          <p className="text-sm text-slate-400 mb-6">
            Liga &quot;{slug}&quot; tidak tersedia. Periksa kembali URL Anda.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neon hover:underline transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </motion.div>
      </div>
    );
  }

  const maxGoals = scorers.length > 0 ? scorers[0].goals : 1;

  function getRankStyle(rank: number) {
    switch (rank) {
      case 1: return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 2: return 'text-gray-300 bg-gray-300/10 border-gray-300/20';
      case 3: return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-muted-foreground bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10';
    }
  }

  function getRankIcon(rank: number) {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  }

  return (
    <div className="min-h-screen">
      {/* ═══════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-neon/5 via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-transparent to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Beranda
          </Link>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            {/* League Logo with neon glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative shrink-0"
            >
              <div
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/[0.1] flex items-center justify-center p-4"
                style={{ boxShadow: '0 0 30px rgba(0, 240, 255, 0.2), 0 0 60px rgba(0, 240, 255, 0.08)' }}
              >
                {safeSrc(leagueInfo.logo) ? (
                  <img
                    src={safeSrc(leagueInfo.logo)!}
                    alt={leagueInfo.name}
                    className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                  />
                ) : (
                  <Trophy className="w-12 h-12 text-neon" />
                )}
              </div>
              {/* Glow ring */}
              <div
                className="absolute -inset-1 rounded-2xl opacity-40 -z-10"
                style={{ boxShadow: '0 0 40px rgba(0, 240, 255, 0.3), inset 0 0 40px rgba(0, 240, 255, 0.1)' }}
              />
            </motion.div>

            {/* League Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-center sm:text-left flex-1"
            >
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1">
                {leagueInfo.name}
              </h1>
              <p className="text-sm font-semibold text-neon mb-3 neon-text">
                Musim {seasonLabel || `${leagueInfo.season}/${leagueInfo.season + 1}`}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-lg px-3 py-1.5">
                  <Trophy className="w-3.5 h-3.5 text-neon" />
                  {standings.length} Tim
                </span>
                <span className="flex items-center gap-1.5 bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-lg px-3 py-1.5">
                  <Goal className="w-3.5 h-3.5 text-neon" />
                  {scorers.length} Top Skor
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CONTENT: STANDINGS + TOP SCORERS
          ═══════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ─── LEFT: Standings Table ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            {standingsLoading ? (
              <StandingsSkeleton />
            ) : (
              <div className="glass-card p-4 sm:p-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Klasemen <span className="neon-text">{leagueInfo.name}</span>
                  </h2>
                  <button
                    onClick={() => loadStandings(true)}
                    disabled={standingsRefreshing}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
                    aria-label="Refresh Standings"
                  >
                    <RefreshCw className={`w-4 h-4 text-muted-foreground ${standingsRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mb-3">Musim {seasonLabel}</p>

                <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200 dark:border-white/5 hover:bg-transparent">
                        <TableHead className="w-8 text-center text-xs">#</TableHead>
                        <TableHead className="text-xs">Tim</TableHead>
                        <TableHead className="w-8 text-center text-xs hidden sm:table-cell">P</TableHead>
                        <TableHead className="w-8 text-center text-xs hidden sm:table-cell">M</TableHead>
                        <TableHead className="w-8 text-center text-xs hidden sm:table-cell">S</TableHead>
                        <TableHead className="w-8 text-center text-xs hidden sm:table-cell">K</TableHead>
                        <TableHead className="w-9 text-center text-xs">SG</TableHead>
                        <TableHead className="w-10 text-center text-xs font-bold">Pts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings.map((row) => {
                        const isChampionsLeague = row.position <= 4;
                        const isEuropaLeague = row.position === 5 || row.position === 6;
                        const isRelegation = row.position > standings.length - 3;
                        const zoneClass = isChampionsLeague
                          ? 'bg-green-500/5'
                          : isEuropaLeague
                            ? 'bg-blue-500/5'
                            : isRelegation
                              ? 'bg-red-500/5'
                              : '';

                        return (
                          <TableRow
                            key={row.position}
                            className={`border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${zoneClass}`}
                          >
                            <TableCell className="text-center text-xs font-bold text-muted-foreground">
                              <span
                                className={
                                  isChampionsLeague
                                    ? 'text-green-400'
                                    : isEuropaLeague
                                      ? 'text-blue-400'
                                      : isRelegation
                                        ? 'text-red-400'
                                        : ''
                                }
                              >
                                {row.position}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm font-medium text-gray-900 dark:text-white">
                              <div className="flex items-center gap-1.5">
                                {safeSrc(row.teamLogo) && (
                                  <img src={safeSrc(row.teamLogo)!} alt={row.team} className="w-4 h-4 rounded-full object-contain shrink-0" />
                                )}
                                <span className="truncate">{row.team}</span>
                                {/* Form indicators (visible on md+) */}
                                {row.form && row.form.length > 0 && (
                                  <div className="hidden md:flex items-center gap-0.5 ml-2">
                                    {row.form.map((f, i) => (
                                      <span
                                        key={i}
                                        className={`w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center ${
                                          f === 'W' ? 'bg-emerald-500/20 text-emerald-400' :
                                          f === 'D' ? 'bg-yellow-500/20 text-yellow-400' :
                                          'bg-red-500/20 text-red-400'
                                        }`}
                                      >
                                        {f}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground hidden sm:table-cell">
                              {row.played}
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground hidden sm:table-cell">
                              {row.won}
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground hidden sm:table-cell">
                              {row.drawn}
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground hidden sm:table-cell">
                              {row.lost}
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground">
                              {row.goalDiff > 0 ? '+' : ''}{row.goalDiff}
                            </TableCell>
                            <TableCell className="text-center text-xs font-bold neon-text">
                              {row.points}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {!standingsLoading && standings.length === 0 && (
                    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                      Tidak ada data klasemen tersedia
                    </div>
                  )}
                </div>

                {/* Zone Legend */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-white/5 text-[10px] text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-green-500/30 border border-green-500/30" />
                    Champions League
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-blue-500/30 border border-blue-500/30" />
                    Europa League
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-red-500/30 border border-red-500/30" />
                    Degradasi
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* ─── RIGHT: Top Scorers ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            {scorersLoading ? (
              <TopScorersSkeleton />
            ) : (
              <div className="glass-card p-4 sm:p-6">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-neon" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Top <span className="neon-text">Skor</span>
                    </h2>
                  </div>
                  <button
                    onClick={() => loadScorers(true)}
                    disabled={scorersRefreshing}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
                    aria-label="Refresh Top Scorers"
                  >
                    <RefreshCw className={`w-4 h-4 text-muted-foreground ${scorersRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mb-4">Musim {scorersSeasonLabel}</p>

                <div className="max-h-[600px] overflow-y-auto custom-scrollbar space-y-1.5">
                  {scorers.map((scorer, index) => {
                    const progressWidth = maxGoals > 0 ? (scorer.goals / maxGoals) * 100 : 0;

                    return (
                      <motion.div
                        key={scorer.rank}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                      >
                        {/* Rank */}
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold border shrink-0 ${getRankStyle(scorer.rank)}`}
                        >
                          {getRankIcon(scorer.rank) || scorer.rank}
                        </div>

                        {/* Player Photo */}
                        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                          {safeSrc(scorer.photo) ? (
                            <img src={safeSrc(scorer.photo)!} alt={scorer.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 dark:text-gray-600">?</div>
                          )}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-neon transition-colors">
                              {scorer.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {safeSrc(scorer.teamLogo) && (
                              <img src={safeSrc(scorer.teamLogo)!} alt="" className="w-3 h-3 rounded-full object-contain" />
                            )}
                            <span className="truncate">{scorer.team}</span>
                          </div>
                          {/* Progress Bar */}
                          <div className="mt-1 h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${progressWidth}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
                              className="h-full rounded-full bg-gradient-to-r from-neon/60 to-neon"
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="text-right">
                            <div className="text-lg font-bold neon-text tabular-nums">
                              {scorer.goals}
                            </div>
                            <div className="text-[10px] text-muted-foreground">GOL</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-300 tabular-nums">
                              {scorer.assists}
                            </div>
                            <div className="text-[10px] text-muted-foreground">ASS</div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {!scorersLoading && scorers.length === 0 && (
                    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                      Tidak ada data top skor tersedia
                    </div>
                  )}
                </div>

                {/* Minutes info for top scorer */}
                {scorers.length > 0 && scorers[0].minutesPlayed > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Timer className="w-3 h-3" />
                      <span>
                        {scorers[0].name} bermain {scorers[0].minutesPlayed.toLocaleString()} menit
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
