'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Loader2, RefreshCw, Zap, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { safeSrc } from '@/lib/safe-src';
<<<<<<< HEAD
=======
import EmptyState from '@/components/football/EmptyState';
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0

// ─── Types (exported for use in page.tsx) ────────────────────
export interface MatchEvent { type: string; minute: number; player: string; detail?: string; card?: string | null; }

export interface Match {
  id: string; league: string; leagueLogo?: string; leagueId?: number;
  leagueName?: string; // Maps from Supabase `league` column / league_name
  country?: string;    // Country from GOALZONE_LEAGUES mapping
  homeTeam: string; awayTeam: string; homeLogo?: string; awayLogo?: string;
  homeScore: number; awayScore: number; status: string; minute: number | null;
  matchDate?: string; // ISO date string untuk sorting & kickoff time display
  homeEvents: MatchEvent[]; awayEvents: MatchEvent[];
  isTopTier?: boolean; // Liga Top Tier GOALZONE
}

// ─── GOALZONE Top Tier & Favorite Leagues ────────────────────
const GOALZONE_LEAGUES: Record<number, { name: string; country: string; tier: 'top' | 'favorite' }> = {
  // ── Top Tier (Liga utama dunia) ──
  39:   { name: 'Premier League',       country: 'England',     tier: 'top' },
  40:   { name: 'Championship',         country: 'England',     tier: 'favorite' },
  140:  { name: 'La Liga',              country: 'Spain',       tier: 'top' },
  135:  { name: 'Serie A',              country: 'Italy',       tier: 'top' },
  78:   { name: 'Bundesliga',           country: 'Germany',     tier: 'top' },
  61:   { name: 'Ligue 1',              country: 'France',      tier: 'top' },
  88:   { name: 'Eredivisie',           country: 'Netherlands', tier: 'favorite' },
  94:   { name: 'Primeira Liga',        country: 'Portugal',    tier: 'favorite' },
  2:    { name: 'Champions League',     country: 'World',       tier: 'top' },
  3:    { name: 'Europa League',        country: 'World',       tier: 'top' },
  848:  { name: 'Conference League',    country: 'World',       tier: 'favorite' },
  // ── Americas ──
  71:   { name: 'Serie A Brazil',       country: 'Brazil',      tier: 'favorite' },
  253:  { name: 'Liga MX',              country: 'Mexico',      tier: 'favorite' },
  252:  { name: 'MLS',                  country: 'USA',         tier: 'favorite' },
  // ── Asia & Others ──
  307:  { name: 'Saudi Pro League',     country: 'Saudi Arabia',tier: 'favorite' },
  98:   { name: 'J-League',             country: 'Japan',       tier: 'favorite' },
  292:  { name: 'K-League 1',           country: 'South Korea', tier: 'favorite' },
  235:  { name: 'Liga 1 Indonesia',     country: 'Indonesia',   tier: 'top' }, // Home league = Top Tier!
  203:  { name: 'Süper Lig',            country: 'Turkey',      tier: 'favorite' },
  144:  { name: 'Scottish Premiership',  country: 'Scotland',    tier: 'favorite' },
  4:    { name: 'Euro Championship',    country: 'Europe',      tier: 'top' },
  1:    { name: 'World Cup',            country: 'World',       tier: 'top' },
  141:  { name: 'Segunda División',     country: 'Spain',       tier: 'favorite' },
  136:  { name: 'Serie B',              country: 'Italy',       tier: 'favorite' },
  79:   { name: '2. Bundesliga',        country: 'Germany',     tier: 'favorite' },
  62:   { name: 'Ligue 2',              country: 'France',      tier: 'favorite' },
  128:  { name: 'Argentine Primera',    country: 'Argentina',   tier: 'favorite' },
  297:  { name: 'Chinese Super League', country: 'China',       tier: 'favorite' },
}
const GOALZONE_LEAGUE_IDS = new Set(Object.keys(GOALZONE_LEAGUES).map(Number))

// --- Status Badge (Cyberpunk Neon) — exported for MatchDetailModal ---
export function MatchStatusBadge({ status, minute }: { status: string; minute: number | null }) {
  if (status === 'LIVE') return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      <span className="text-[11px] font-bold text-red-600 dark:text-red-400 tabular-nums">{minute ? `${minute}'` : 'LIVE'}</span>
    </div>
  );
  if (status === 'HT') return <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 text-[11px] font-bold text-amber-600 dark:text-amber-400">HT</span>;
  if (status === 'FT') return <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-gray-400">FT</span>;
  return <span className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-400/15 text-[11px] font-bold text-cyan-600 dark:text-cyan-400">{minute ? `${minute}'` : 'NS'}</span>;
}

// --- Team Logo (memoized to prevent re-renders / image flicker) ---
// NOTE: loading="lazy" removed — tiny inline logos (20-24px) are always in viewport;
// lazy loading causes browser to unload/reload them during DOM updates → flicker.
const TeamLogo = memo(function TeamLogo({ src, name, size = 24 }: { src?: string; name: string; size?: number }) {
  if (!safeSrc(src)) return <div className="rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0" style={{ width: size, height: size }}><span className="text-[10px] text-gray-400 dark:text-white/30">⚽</span></div>;
  return <img src={safeSrc(src)!} alt={name} className="rounded-full shrink-0" style={{ width: size, height: size }} draggable={false} />;
});

// --- League Group Header (Cyberpunk Glassmorphism + Neon Cyan Glow) — memoized ---
// NOTE: loading="lazy" removed from league logo — small inline image always in viewport.
const LeagueHeader = memo(function LeagueHeader({ name, logo, matchCount, isTopTier, collapsed, onToggle, liveCount, country }: {
  name: string; logo?: string; matchCount: number; isTopTier?: boolean;
  collapsed: boolean; onToggle: () => void; liveCount: number; country?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-white dark:bg-blue-950/70 dark:backdrop-blur-2xl border border-slate-200 dark:border-cyan-400/15 shadow-sm hover:bg-slate-50 dark:hover:bg-blue-950/70 hover:border-slate-300 dark:hover:border-cyan-400/30 transition-all duration-300 group cursor-pointer select-none"
    >
      {/* League Logo with neon ring */}
      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-cyan-950/50 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-cyan-400/20">
        {safeSrc(logo) ? (
          <img src={safeSrc(logo)!} alt={name} className="w-6 h-6 object-contain" draggable={false} />
        ) : (
          <span className="text-sm">⚽</span>
        )}
      </div>

      {/* League Name + Country + Badges */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900 dark:text-cyan-100 truncate dark:drop-shadow-[0_0_8px_rgba(0,240,255,0.3)]">{name}</span>
          {isTopTier && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/30 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              <span className="text-[8px] font-extrabold text-amber-400 uppercase tracking-widest">TOP</span>
            </span>
          )}
          {liveCount > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 shrink-0 shadow-[0_0_12px_rgba(239,68,68,0.3),0_0_24px_rgba(239,68,68,0.15)] ring-1 ring-red-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-dot-pulse" />
              <span className="text-[9px] font-bold text-red-400 tabular-nums">{liveCount}</span>
            </span>
          )}
        </div>
        {country && (
          <span className="text-[10px] text-slate-400 dark:text-cyan-400/40 truncate mt-0.5">{country}</span>
        )}
      </div>

      {/* Match Count + Chevron Toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] font-medium text-slate-500 dark:text-cyan-400/50 tabular-nums">{matchCount} pertandingan</span>
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400 dark:text-cyan-400/50 group-hover:text-slate-600 dark:group-hover:text-cyan-300 transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </div>
    </button>
  );
});

// --- Kickoff Time Helper ---
function formatKickoff(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
  } catch { return '' }
}

// --- Match Row (Clickable - Cyberpunk Glassmorphism) — memoized ---
const MatchRow = memo(function MatchRow({ match, onClick }: { match: Match; onClick?: () => void }) {
  const isLive = match.status === 'LIVE'
  const isHT = match.status === 'HT'
  const isFT = match.status === 'FT'
  const isNS = match.status === 'NS'
  const isActive = isLive || isHT

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2 py-2.5 px-3 rounded-lg transition-all duration-200 cursor-pointer group
        ${isLive
          ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/15 hover:bg-red-100 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-500/25 dark:shadow-[0_0_12px_rgba(239,68,68,0.06)] dark:hover:shadow-[0_0_15px_rgba(0,240,255,0.1)]'
          : isHT
            ? 'bg-amber-50 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-950/25 hover:border-amber-300 dark:hover:border-amber-500/20 dark:hover:shadow-[0_0_15px_rgba(0,240,255,0.1)]'
            : 'bg-transparent border border-transparent hover:bg-slate-50 dark:hover:bg-blue-950/20 hover:border-slate-200 dark:hover:border-cyan-400/10 dark:hover:shadow-[0_0_15px_rgba(0,240,255,0.1)]'
        }
      `}
    >
      {/* LIVE: Prominent red pulsing dot + minute */}
      {isLive && (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 live-dot-pulse" />
          <span className="text-[11px] font-bold text-red-500 dark:text-red-400 tabular-nums">{match.minute ? `${match.minute}'` : 'LIVE'}</span>
        </div>
      )}
      {/* HT badge */}
      {isHT && (
        <div className="shrink-0">
          <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400">HT</span>
        </div>
      )}
      {/* FT badge */}
      {isFT && (
        <div className="shrink-0">
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-gray-500/15 text-[10px] font-bold text-slate-500 dark:text-gray-400">FT</span>
        </div>
      )}
      {/* NS: Kickoff time */}
      {isNS && (
        <div className="shrink-0 w-14 text-center">
          <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums dark:drop-shadow-[0_0_6px_rgba(0,240,255,0.3)]">{formatKickoff(match.matchDate)}</span>
        </div>
      )}

      {/* Score for LIVE/HT/FT — VS separator for NS */}
      {isNS ? (
        <div className="w-14 shrink-0 text-center">
          <span className="text-[11px] font-bold text-slate-400 dark:text-cyan-400/40 uppercase tracking-wider">vs</span>
        </div>
      ) : (
        <div className="w-14 shrink-0 text-center">
          <span className={`text-sm font-bold tabular-nums ${isActive ? 'text-slate-900 dark:text-white dark:drop-shadow-[0_0_6px_rgba(0,240,255,0.2)]' : 'text-slate-700 dark:text-gray-300'}`}>{match.homeScore} - {match.awayScore}</span>
        </div>
      )}

      {/* Home Team */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <TeamLogo src={match.homeLogo} name={match.homeTeam} size={20} />
        <span className={`text-sm truncate ${isActive ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-gray-300'}`}>{match.homeTeam}</span>
      </div>
      {/* Away Team */}
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className={`text-sm truncate text-right ${isActive ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-gray-300'}`}>{match.awayTeam}</span>
        <TeamLogo src={match.awayLogo} name={match.awayTeam} size={20} />
      </div>
      {/* Goal Events */}
      {(match.homeEvents?.filter(e => e.type === 'goal').length || match.awayEvents?.filter(e => e.type === 'goal').length) ? (
        <div className="w-5 shrink-0">
          <span className="text-[10px]">⚽</span>
        </div>
      ) : <div className="w-5 shrink-0" />}
      {/* Click indicator */}
      <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-cyan-400/30 opacity-0 group-hover:opacity-100 group-hover:text-slate-500 dark:group-hover:text-cyan-300 transition-all shrink-0" />
    </div>
  );
});

// ============================================
// MATCH SECTION COMPONENT
// ============================================
export default function MatchSection({ onMatchClick, autoOpenMatchId }: {
  onMatchClick: (match: Match) => void;
  autoOpenMatchId?: string;
}) {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchTab, setMatchTab] = useState<'all' | 'live' | 'finished' | 'upcoming'>('all');

  const [collapsedLeagues, setCollapsedLeagues] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  // Ref to store previous match IDs for change detection (prevents unnecessary re-renders / flicker)
  const prevMatchIdsRef = useRef<string>('');
  // Ref to prevent re-triggering auto-open
  const autoOpenedRef = useRef(false);

  /** Only update liveMatches if data actually changed (compare IDs + scores + statuses) */
  const updateMatchesIfChanged = useCallback((newMatches: Match[]) => {
    const signature = newMatches.map(m => `${m.id}:${m.status}:${m.homeScore}:${m.awayScore}:${m.minute}`).join('|');
    if (signature !== prevMatchIdsRef.current) {
      prevMatchIdsRef.current = signature;
      setLiveMatches(newMatches);
    }
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/sync-matches');
      const data = await res.json();
      if (data.success) {
        setSyncResult(`✅ Synced ${data.totalFetched} fixtures dari ${data.leagues?.length || 0} liga`);
        // Reload matches after sync
        const matchRes = await fetch('/api/matches');
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          const all = matchData.matches || [];
          if (Array.isArray(all)) {
            const enriched = all.map((m: Match) => {
              const leagueInfo = GOALZONE_LEAGUES[m.leagueId || 0];
              return { ...m, leagueName: m.leagueName || m.league, country: m.country || leagueInfo?.country };
            });
            updateMatchesIfChanged(enriched);
          }
        }
      } else {
        setSyncResult(`❌ ${data.error || 'Sync gagal'}`);
      }
    } catch {
      setSyncResult('❌ Gagal menghubungi server');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncResult(null), 5000);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadMatches = async () => {
      try {
        // Fetch dari /api/matches — Supabase (tanpa filter liga) → Prisma → API-Football → mock
        const res = await fetch('/api/matches');
        if (res.ok && !cancelled) {
          const data = await res.json();
          const all = data.matches || [];
          if (Array.isArray(all)) {
            // Enrich with country & leagueName from GOALZONE_LEAGUES mapping
            const enriched = all.map((m: Match) => {
              const leagueInfo = GOALZONE_LEAGUES[m.leagueId || 0];
              return {
                ...m,
                leagueName: m.leagueName || m.league,
                country: m.country || leagueInfo?.country,
              };
            });
            updateMatchesIfChanged(enriched);
          }
        }
      } catch { /* silent */ }
      finally { if (!cancelled) setMatchesLoading(false); }
    };
    loadMatches();
    const interval = setInterval(loadMatches, 120000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [updateMatchesIfChanged]);

  // Auto-open match from URL param
  useEffect(() => {
    if (autoOpenMatchId && !autoOpenedRef.current && liveMatches.length > 0) {
      const found = liveMatches.find(m => m.id === autoOpenMatchId);
      if (found) {
        autoOpenedRef.current = true;
        onMatchClick(found);
      }
    }
  }, [autoOpenMatchId, liveMatches, onMatchClick]);

  return (
    <section id="live" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 live-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Jadwal <span className="neon-text">Pertandingan</span></h2>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neon/10 text-neon border border-neon/20 hover:bg-neon/20 transition-all disabled:opacity-40"
            title="Sinkronkan data pertandingan dari API"
          >
            {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Klik pertandingan untuk lihat lineup & statistik · Data real-time dari GOALZONE</p>
        {/* Sync result toast */}
        {syncResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 ${
              syncResult.startsWith('✅') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            <Zap className="w-3 h-3" />
            {syncResult}
          </motion.div>
        )}
      </motion.div>

      {/* ── Tab Filter + League Filter Toggle ── */}
      {!matchesLoading && liveMatches.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          {/* Tab Filter */}
          <div className="flex items-center gap-1.5 p-1 glass rounded-xl w-fit">
            {([
              { key: 'all' as const, label: 'Semua Liga', icon: null },
              { key: 'live' as const, label: 'Live', icon: <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" /> },
              { key: 'finished' as const, label: 'Selesai', icon: null },
              { key: 'upcoming' as const, label: 'Akan Datang', icon: null },
            ]).map((tab) => {
              const isActive = matchTab === tab.key
              // Count for badge — filtered by GOALZONE leagues
              const goalzoneMatches = liveMatches.filter(m => GOALZONE_LEAGUE_IDS.has(m.leagueId || 0))
              const count = tab.key === 'all'
                ? goalzoneMatches.length
                : tab.key === 'live'
                  ? goalzoneMatches.filter(m => m.status === 'LIVE' || m.status === 'HT').length
                  : tab.key === 'finished'
                    ? goalzoneMatches.filter(m => m.status === 'FT').length
                    : goalzoneMatches.filter(m => m.status === 'NS').length
              return (
                <button
                  key={tab.key}
                  onClick={() => setMatchTab(tab.key)}
                  className={`
                    relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200
                    ${isActive
                      ? 'bg-neon/15 text-neon neon-glow shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                    }
                  `}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-neon/20 text-neon' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                    }`}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {matchesLoading ? (
        <div className="glass-card p-4 space-y-4">
          {[1,2,3].map(i => <div key={i} className="flex items-center gap-2 py-2"><Skeleton className="h-4 w-10 bg-gray-100 dark:bg-white/5" /><Skeleton className="h-4 w-12 bg-gray-100 dark:bg-white/5" /><Skeleton className="h-4 w-32 bg-gray-100 dark:bg-white/5" /><Skeleton className="h-4 w-32 bg-gray-100 dark:bg-white/5" /></div>)}
        </div>
      ) : (() => {
        // ── Client-side filter: hanya liga GOALZONE ──
        const leagueFiltered = liveMatches.filter(m => GOALZONE_LEAGUE_IDS.has(m.leagueId || 0))

        // Filter by tab
        const filtered = matchTab === 'all'
          ? leagueFiltered
          : matchTab === 'live'
            ? leagueFiltered.filter(m => m.status === 'LIVE' || m.status === 'HT')
            : matchTab === 'finished'
              ? leagueFiltered.filter(m => m.status === 'FT')
              : leagueFiltered.filter(m => m.status === 'NS')

        // Group matches by league with country info
        const leagueMap = new Map<string, { league: string; logo?: string; leagueId?: number; isTopTier?: boolean; country?: string; matches: Match[] }>();
        filtered.forEach(m => {
          const leagueInfo = GOALZONE_LEAGUES[m.leagueId || 0];
          if (!leagueMap.has(m.league)) leagueMap.set(m.league, {
            league: m.league,
            logo: m.leagueLogo,
            leagueId: m.leagueId,
            isTopTier: m.isTopTier ?? leagueInfo?.tier === 'top',
            country: m.country || leagueInfo?.country,
            matches: []
          });
          leagueMap.get(m.league)!.matches.push(m);
        });
        const leagues = [...leagueMap.values()];
        // Sort matches within each league: LIVE/HT → FT → NS, then by matchDate
        leagues.forEach(lg => {
          const statusOrder: Record<string, number> = { LIVE: 0, HT: 1, FT: 2, NS: 3 }
          lg.matches.sort((a, b) => {
            const sa = statusOrder[a.status] ?? 4
            const sb = statusOrder[b.status] ?? 4
            if (sa !== sb) return sa - sb
            return new Date(a.matchDate || 0).getTime() - new Date(b.matchDate || 0).getTime()
          })
        })
        // Sort leagues: ⭐ Top Tier first, then ones with LIVE matches, then by earliest matchDate
        leagues.sort((a, b) => {
          // Top Tier leagues always first
          if (a.isTopTier && !b.isTopTier) return -1;
          if (!a.isTopTier && b.isTopTier) return 1;
          // Within same tier, LIVE matches first
          const aLive = a.matches.some(m => m.status === 'LIVE' || m.status === 'HT');
          const bLive = b.matches.some(m => m.status === 'LIVE' || m.status === 'HT');
          if (aLive && !bLive) return -1;
          if (!aLive && bLive) return 1;
          const aDate = a.matches[0]?.matchDate ? new Date(a.matches[0].matchDate).getTime() : 0
          const bDate = b.matches[0]?.matchDate ? new Date(b.matches[0].matchDate).getTime() : 0
          return aDate - bDate
        });
        return (
          <div className="space-y-2.5">
            {leagues.map((league) => {
              // Use stable key based on leagueId (falls back to league name)
              const leagueKey = league.leagueId || league.league;
              const isCollapsed = collapsedLeagues.has(String(leagueKey))
              const liveCount = league.matches.filter(m => m.status === 'LIVE' || m.status === 'HT').length
              return (
                <motion.div key={leagueKey} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="overflow-hidden">
                  {/* Glassmorphism League Header (clickable toggle) */}
                  <LeagueHeader
                    name={league.league}
                    logo={league.logo}
                    matchCount={league.matches.length}
                    isTopTier={league.isTopTier}
                    collapsed={isCollapsed}
                    liveCount={liveCount}
                    country={league.country}
                    onToggle={() => {
                      setCollapsedLeagues(prev => {
                        const next = new Set(prev)
                        const key = String(leagueKey)
                        if (next.has(key)) next.delete(key)
                        else next.add(key)
                        return next
                      })
                    }}
                  />
                  {/* Match List (collapsible with smooth animation) */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1.5 divide-y divide-slate-100 dark:divide-cyan-400/5 rounded-lg overflow-hidden bg-white dark:bg-blue-950/20 dark:backdrop-blur-sm border border-slate-200 dark:border-cyan-400/10">
                          {league.matches.map((match) => (
                            <MatchRow key={match.id} match={match} onClick={() => onMatchClick(match)} />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
            {filtered.length === 0 && (
<<<<<<< HEAD
              <div className="glass-card p-8 text-center neon-glow">
                <div className="text-4xl mb-3 neon-text">⚽</div>
                <p className="text-base font-semibold neon-text">Sedang memuat jadwal pertandingan terbaru...</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Data akan otomatis update ketika ada pertandingan</p>
=======
              <div className="glass-card p-6">
                <EmptyState
                  icon="empty"
                  title="Data sedang diperbarui"
                  message="Belum ada jadwal pertandingan tersedia saat ini. Klik Sync Data atau coba lagi nanti."
                  onRetry={handleSync}
                  retrying={syncing}
                />
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
              </div>
            )}
          </div>
        );
      })()}
    </section>
  );
}
