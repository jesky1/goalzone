'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, MapPin, Trophy, Users, Swords, Shield,
  ChevronRight, RefreshCw, AlertTriangle, Star, Hash, Target,
  TrendingUp, Footprints, Clock, User, Zap, Flag,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// ─── Types ──────────────────────────────────────────────────

interface SquadPlayer {
  id: number;
  name: string;
  number: number;
  position: string;
  nationality: string;
  age: number;
  photo: string | null;
}

interface TeamLineup {
  formation: string;
  players: { name: string; number: number; position: string; gridArea: string }[];
}

interface TeamMatchResult {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  league: string | null;
  status: string;
  homeTeamLogoUrl: string | null;
  awayTeamLogoUrl: string | null;
  venue: string | null;
  matchWeek: number | null;
}

interface TeamProfile {
  name: string;
  slug: string;
  logoUrl: string | null;
  founded: number | null;
  stadium: string | null;
  stadiumCapacity: number | null;
  coach: string | null;
  league: string | null;
  country: string | null;
  season: number;
  primaryColor: string;
  secondaryColor: string;
  rank: number | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  squad: SquadPlayer[];
  lastLineup: TeamLineup | null;
  recentMatches: TeamMatchResult[];
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

function getPositionLabel(pos: string) {
  const labels: Record<string, string> = { GK: 'GK', DEF: 'DEF', MID: 'MID', FWD: 'FWD' };
  return labels[pos] || pos;
}

function getPositionColor(pos: string) {
  const colors: Record<string, string> = {
    GK: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    DEF: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    MID: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    FWD: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return colors[pos] || 'bg-white/5 text-gray-400 border-white/10';
}

function getMatchResult(team: string, match: TeamMatchResult): { label: string; color: string } {
  const isHome = match.homeTeam === team;
  const homeGoals = match.homeScore;
  const awayGoals = match.awayScore;
  if (match.status !== 'finished') return { label: 'VS', color: 'text-blue-400' };
  if (isHome) {
    if (homeGoals > awayGoals) return { label: 'W', color: 'text-emerald-400' };
    if (homeGoals === awayGoals) return { label: 'D', color: 'text-amber-400' };
    return { label: 'L', color: 'text-red-400' };
  } else {
    if (awayGoals > homeGoals) return { label: 'W', color: 'text-emerald-400' };
    if (awayGoals === homeGoals) return { label: 'D', color: 'text-amber-400' };
    return { label: 'L', color: 'text-red-400' };
  }
}

// ─── Team Logo Component ────────────────────────────────────

function TeamHeroLogo({ src, alt, accentColor }: { src: string | null; alt: string; accentColor: string }) {
  if (!src) {
    return (
      <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden flex items-center justify-center bg-white/[0.04] border border-white/[0.08]">
        <span className="text-3xl font-black text-muted-foreground/30">{alt.slice(0, 2).toUpperCase()}</span>
      </div>
    );
  }
  return (
    <motion.div
      className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      {/* Outer glow rings */}
      <div
        className="absolute -inset-4 rounded-[2rem] pointer-events-none animate-pulse"
        style={{
          boxShadow: `0 0 40px 8px ${accentColor}30, 0 0 80px 16px ${accentColor}15, 0 0 120px 24px ${accentColor}08`,
        }}
      />
      <div
        className="absolute -inset-2 rounded-[1.5rem] pointer-events-none"
        style={{
          boxShadow: `0 0 20px 4px ${accentColor}40`,
        }}
      />
      {/* Glass background */}
      <div className="absolute inset-0 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.1]" />
      {/* Logo */}
      <Image src={src} alt={alt} width={144} height={144} className="relative z-10 object-contain p-4 sm:p-5" unoptimized />
    </motion.div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, delay = 0 }: { icon: React.ElementType; label: string; value: string | number; color?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-3 sm:p-4 flex flex-col items-center gap-1.5 text-center"
    >
      <Icon className="w-4 h-4 text-muted-foreground/40" />
      <span className={`text-xl sm:text-2xl font-black tabular-nums ${color || 'neon-text'}`}>{value}</span>
      <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">{label}</span>
    </motion.div>
  );
}

// ─── Form Mini Badges (W/D/L) ───────────────────────────────

function FormBadges({ teamName, matches }: { teamName: string; matches: TeamMatchResult[] }) {
  const recent = matches.slice(0, 5);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mr-1">Form</span>
      {recent.map((m) => {
        const r = getMatchResult(teamName, m);
        const bg = r.label === 'W' ? 'bg-emerald-500/20 border-emerald-500/30' :
                   r.label === 'D' ? 'bg-amber-500/20 border-amber-500/30' :
                   r.label === 'L' ? 'bg-red-500/20 border-red-500/30' :
                   'bg-blue-500/20 border-blue-500/30';
        return (
          <span key={m.id} className={`w-6 h-6 rounded-md border flex items-center justify-center text-[10px] font-bold ${r.color} ${bg}`}>
            {r.label}
          </span>
        );
      })}
    </div>
  );
}

// ─── Lineup Football Field ──────────────────────────────────

function LineupField({ lineup, accentColor }: { lineup: TeamLineup; accentColor: string }) {
  const { formation, players } = lineup;

  // Grid template areas for different formations
  const gridAreas: Record<string, string> = {
    '4-3-3': `
      ". . gk . ."
      ". rb rcb lcb lb"
      ". . rcm lcm ."
      ". cdm cdm cdm cdm"
      ". . . . ."
      "rw . st . lw"
    `,
    '4-2-3-1': `
      ". . gk . ."
      ". rb rcb lcb lb"
      ". rcm lcm . ."
      ". ram cam lam"
      ". . . . ."
      ". . st . ."
    `,
    '4-4-2': `
      ". . gk . ."
      ". rb rcb lcb lb"
      "rm rcm lcm lm"
      ". . . . ."
      ". . . . ."
      ". st st . ."
    `,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative"
    >
      {/* Formation badge */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Footprints className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Formasi Terakhir</h3>
        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0">
          {formation}
        </Badge>
      </div>

      {/* Field */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.06]">
        {/* Glassmorphism field with accent color */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ background: `linear-gradient(135deg, ${accentColor}, transparent 60%)` }}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

        {/* Pitch lines (CSS) */}
        <div className="relative w-full aspect-[3/4] sm:aspect-[5/7] max-w-md mx-auto">
          {/* Grass texture gradient */}
          <div className="absolute inset-0" style={{
            background: `repeating-linear-gradient(
              0deg,
              rgba(34,197,94,0.03) 0px,
              rgba(34,197,94,0.06) 2px,
              transparent 2px,
              transparent 24px
            )`
          }} />

          {/* Pitch markings */}
          <div className="absolute inset-2 sm:inset-4 border border-white/[0.08] rounded-lg">
            {/* Center line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.08]" />
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-white/[0.08]" />
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/[0.15]" />
            {/* Top penalty area */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[45%] h-[18%] border-b border-l border-r border-white/[0.06]" />
            {/* Bottom penalty area */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[45%] h-[18%] border-t border-l border-r border-white/[0.06]" />
            {/* Top goal area */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[22%] h-[8%] border-b border-l border-r border-white/[0.06]" />
            {/* Bottom goal area */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[22%] h-[8%] border-t border-l border-r border-white/[0.06]" />

            {/* Player Grid */}
            <div
              className="absolute inset-0 grid gap-x-2 gap-y-1 sm:gap-x-3 sm:gap-y-2"
              style={{
                gridTemplateColumns: 'repeat(5, 1fr)',
                gridTemplateRows: 'repeat(6, 1fr)',
                gridTemplateAreas: gridAreas[formation] || gridAreas['4-3-3'],
                padding: '8px',
              }}
            >
              {players.map((player, idx) => (
                <motion.div
                  key={player.gridArea}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + idx * 0.04, type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center justify-center"
                  style={{ gridArea: player.gridArea }}
                >
                  {/* Player circle */}
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold backdrop-blur-md border transition-all duration-200 hover:scale-110 cursor-default"
                    style={{
                      backgroundColor: `${accentColor}20`,
                      borderColor: `${accentColor}50`,
                      color: accentColor,
                      boxShadow: `0 0 12px ${accentColor}25`,
                    }}
                  >
                    {player.number}
                  </div>
                  {/* Name */}
                  <span className="text-[8px] sm:text-[9px] font-semibold text-white/80 mt-0.5 text-center leading-tight truncate max-w-[60px] sm:max-w-[70px] drop-shadow-md">
                    {player.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Squad Table ────────────────────────────────────────────

function SquadTable({ squad, accentColor }: { squad: SquadPlayer[]; accentColor: string }) {
  const [posFilter, setPosFilter] = useState<string>('all');

  const filtered = posFilter === 'all' ? squad : squad.filter(p => p.position === posFilter);
  const groupedByPosition = {
    GK: filtered.filter(p => p.position === 'GK'),
    DEF: filtered.filter(p => p.position === 'DEF'),
    MID: filtered.filter(p => p.position === 'MID'),
    FWD: filtered.filter(p => p.position === 'FWD'),
  };

  const posFilters = [
    { id: 'all', label: 'Semua', count: squad.length },
    { id: 'GK', label: 'GK', count: squad.filter(p => p.position === 'GK').length },
    { id: 'DEF', label: 'DEF', count: squad.filter(p => p.position === 'DEF').length },
    { id: 'MID', label: 'MID', count: squad.filter(p => p.position === 'MID').length },
    { id: 'FWD', label: 'FWD', count: squad.filter(p => p.position === 'FWD').length },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Users className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Squad</h3>
        <span className="text-[10px] text-muted-foreground/40 ml-auto">{squad.length} pemain</span>
      </div>

      {/* Position filter pills */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
        {posFilters.map(f => (
          <button
            key={f.id}
            onClick={() => setPosFilter(f.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border whitespace-nowrap transition-all duration-200
              ${posFilter === f.id
                ? 'bg-neon/10 text-neon border-neon/20'
                : 'text-muted-foreground/60 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'}`}
          >
            {f.label}
            <span className="ml-0.5 text-[9px] opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Grouped players */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
        {(['GK', 'DEF', 'MID', 'FWD'] as const).map(pos => {
          const players = groupedByPosition[pos];
          if (!players || players.length === 0) return null;
          return (
            <div key={pos}>
              <div className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${pos === 'GK' ? 'bg-amber-400' : pos === 'DEF' ? 'bg-blue-400' : pos === 'MID' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {pos === 'GK' ? 'Penjaga Gawang' : pos === 'DEF' ? 'Bertahan' : pos === 'MID' ? 'Tengah' : 'Penyerang'} ({players.length})
              </div>
              <div className="space-y-1">
                {players.map((player, idx) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.02 * idx }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] hover:border-white/[0.06] transition-all duration-200 group"
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{
                        backgroundColor: `${accentColor}15`,
                        color: accentColor,
                        border: `1px solid ${accentColor}30`,
                      }}
                    >
                      {player.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs sm:text-sm font-medium text-white truncate block">{player.name}</span>
                      <span className="text-[10px] text-muted-foreground/40">{player.nationality} · {player.age} thn</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${getPositionColor(player.position)}`}>
                      {getPositionLabel(player.position)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Recent Match Card ──────────────────────────────────────

function RecentMatchCard({ match, teamName, accentColor, index }: { match: TeamMatchResult; teamName: string; accentColor: string; index: number }) {
  const result = getMatchResult(teamName, match);
  const isHome = match.homeTeam === teamName;
  const opponent = isHome ? match.awayTeam : match.homeTeam;
  const opponentLogo = isHome ? match.awayTeamLogoUrl : match.homeTeamLogoUrl;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
    >
      <Link
        href={`/matches/${match.id}`}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] hover:border-white/[0.06] transition-all duration-200 group"
      >
        {/* Result badge */}
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 border
          ${result.label === 'W' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
            result.label === 'D' ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' :
            result.label === 'L' ? 'bg-red-500/15 text-red-400 border-red-500/25' :
            'bg-blue-500/15 text-blue-400 border-blue-500/25'}`}
        >
          {match.status === 'finished' ? (isHome ? `${match.homeScore}-${match.awayScore}` : `${match.awayScore}-${match.homeScore}`) : 'VS'}
        </span>

        {/* Opponent */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {opponentLogo && (
            <img src={opponentLogo} alt={opponent} className="w-5 h-5 rounded-full shrink-0" loading="lazy" />
          )}
          <div className="min-w-0">
            <span className="text-xs font-medium text-white truncate block">{opponent}</span>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
              <span>{match.league}</span>
              {match.matchWeek && <span>· MD {match.matchWeek}</span>}
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="text-right shrink-0">
          <span className="text-[10px] text-muted-foreground/50 block">{formatDate(match.matchDate)}</span>
          <span className="text-[9px] text-muted-foreground/30 block">{getRelativeDay(match.matchDate)}</span>
        </div>

        <ChevronRight className="w-3 h-3 text-muted-foreground/20 group-hover:text-neon/50 transition-colors shrink-0" />
      </Link>
    </motion.div>
  );
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
        {/* Hero skeleton */}
        <div className="glass-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Skeleton className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white/5" />
            <div className="space-y-3 flex-1 text-center sm:text-left">
              <Skeleton className="h-7 w-48 bg-white/5 mx-auto sm:mx-0" />
              <Skeleton className="h-4 w-32 bg-white/5 mx-auto sm:mx-0" />
              <div className="flex gap-3 justify-center sm:justify-start">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-16 rounded-xl bg-white/5" />)}
              </div>
            </div>
          </div>
        </div>
        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-5 space-y-4">
            <Skeleton className="h-5 w-32 bg-white/5" />
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full bg-white/5" />)}
          </div>
          <div className="glass-card p-5 space-y-4">
            <Skeleton className="h-5 w-32 bg-white/5" />
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full bg-white/5" />)}
          </div>
        </div>
        <Skeleton className="h-80 w-full glass-card" />
      </main>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function TeamProfilePage() {
  const params = useParams<{ slug: string }>();
  const [team, setTeam] = useState<TeamProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState('');

  const fetchTeam = useCallback(async () => {
    if (!params.slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${params.slug}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(err.error || `HTTP ${res.status}`);
        return;
      }
      const json = await res.json();
      if (json.success && json.team) {
        setTeam(json.team);
        setSource(json.source || 'mock');
      } else {
        setError('Tim tidak ditemukan');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [params.slug]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  if (loading) return <PageSkeleton />;

  if (error || !team) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-deep-900 gap-4 p-4">
        <AlertTriangle className="w-12 h-12 text-amber-400/40" />
        <p className="text-sm text-muted-foreground">{error || 'Tim tidak ditemukan'}</p>
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/15 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const accentColor = team.primaryColor;
  const secondaryColor = team.secondaryColor;
  const goalDiff = team.goalsFor - team.goalsAgainst;

  return (
    <div className="min-h-screen flex flex-col bg-deep-900">
      {/* Decorative bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute top-0 left-1/3 w-[600px] h-[300px] rounded-full blur-[120px] opacity-[0.04]"
          style={{ background: accentColor }}
        />
        <div
          className="absolute bottom-1/4 right-0 w-[500px] h-[250px] rounded-full blur-[100px] opacity-[0.03]"
          style={{ background: secondaryColor }}
        />
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
              {team.league && (
                <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                  {team.league}
                </span>
              )}
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
          <span className="text-muted-foreground/60">{team.name}</span>
        </nav>

        {/* ─── Hero Section ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden mb-6"
        >
          {/* Top accent line */}
          <div className="h-[2px]" style={{ background: `linear-gradient(to right, transparent, ${accentColor}80, transparent)` }} />

          <div className="p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              {/* Logo */}
              <TeamHeroLogo src={team.logoUrl} alt={team.name} accentColor={accentColor} />

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                  {team.country && (
                    <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">{team.country}</span>
                  )}
                  {team.founded && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                      <span className="text-[10px] text-muted-foreground/40">{team.founded}</span>
                    </>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2" style={{ textShadow: `0 0 40px ${accentColor}30` }}>
                  {team.name}
                </h1>

                {/* Info pills */}
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-4">
                  {team.coach && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <User className="w-3 h-3 text-muted-foreground/40" />
                      <span className="text-[11px] text-muted-foreground/70">{team.coach}</span>
                    </div>
                  )}
                  {team.stadium && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <MapPin className="w-3 h-3 text-muted-foreground/40" />
                      <span className="text-[11px] text-muted-foreground/70">{team.stadium}</span>
                      {team.stadiumCapacity && (
                        <span className="text-[9px] text-muted-foreground/30">({team.stadiumCapacity.toLocaleString()})</span>
                      )}
                    </div>
                  )}
                  {team.rank && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <Trophy className="w-3 h-3 text-muted-foreground/40" />
                      <span className="text-[11px] text-muted-foreground/70">Peringkat #{team.rank}</span>
                    </div>
                  )}
                </div>

                {/* Form badges */}
                {team.recentMatches.length > 0 && (
                  <FormBadges teamName={team.name} matches={team.recentMatches} />
                )}
              </div>
            </div>

            {/* Stat cards row */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-6 pt-6 border-t border-white/[0.04]">
              <StatCard icon={Swords} label="Main" value={team.played} delay={0.1} />
              <StatCard icon={TrendingUp} label="Menang" value={team.wins} color="text-emerald-400" delay={0.15} />
              <StatCard icon={Shield} label="Seri" value={team.draws} color="text-amber-400" delay={0.2} />
              <StatCard icon={Target} label="Kalah" value={team.losses} color="text-red-400" delay={0.25} />
              <StatCard icon={Star} label="Poin" value={team.points} color="neon-text" delay={0.3} />
              <StatCard icon={Zap} label="Goal Diff" value={goalDiff > 0 ? `+${goalDiff}` : goalDiff} color={goalDiff >= 0 ? 'text-emerald-400' : 'text-red-400'} delay={0.35} />
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="h-[1px]" style={{ background: `linear-gradient(to right, transparent, ${accentColor}40, transparent)` }} />
        </motion.div>

        {/* ─── Two Column Layout: Squad + Results ───────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left: Squad */}
          <div className="glass-card p-4 sm:p-5">
            <SquadTable squad={team.squad} accentColor={accentColor} />
          </div>

          {/* Right: Recent Results */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-4 sm:p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Swords className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Pertandingan Terakhir</h3>
              <span className="text-[10px] text-muted-foreground/40 ml-auto">{team.recentMatches.length} pertandingan</span>
            </div>

            {team.recentMatches.length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                {team.recentMatches.map((match, idx) => (
                  <RecentMatchCard key={match.id} match={match} teamName={team.name} accentColor={accentColor} index={idx} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Swords className="w-10 h-10 text-muted-foreground/10 mb-3" />
                <p className="text-sm text-muted-foreground/50">Belum ada pertandingan</p>
                <p className="text-[10px] text-muted-foreground/30 mt-1">Data akan muncul setelah ditambahkan admin</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* ─── Lineup Section ────────────────────────────── */}
        {team.lastLineup && (
          <div className="glass-card p-4 sm:p-5 mb-6">
            <LineupField lineup={team.lastLineup} accentColor={accentColor} />
          </div>
        )}

        {/* ─── Goal Stats Bar ────────────────────────────── */}
        {team.goalsFor > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-4 sm:p-5 mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-neon/10 border border-neon/20">
                <Target className="w-3.5 h-3.5 text-neon" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Statistik Gol</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                <span className="text-2xl font-black neon-text tabular-nums">{team.goalsFor}</span>
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mt-1">Gol Dicetak</p>
              </div>
              <div className="px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                <span className="text-2xl font-black text-red-400 tabular-nums">{team.goalsAgainst}</span>
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mt-1">Gol Kemasukan</p>
              </div>
              <div className="px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                <span className="text-2xl font-black tabular-nums" style={{ color: accentColor }}>
                  {team.played > 0 ? (team.goalsFor / team.played).toFixed(1) : '0.0'}
                </span>
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mt-1">Gol / Pertandingan</p>
              </div>
              <div className="px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                <span className={`text-2xl font-black tabular-nums ${goalDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
                </span>
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mt-1">Selisih Gol</p>
              </div>
            </div>

            {/* Visual goal bar */}
            <div className="mt-4">
              <div className="flex h-3 rounded-full overflow-hidden bg-white/[0.04]">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500/60 to-emerald-500/30 rounded-l-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(team.goalsFor / Math.max(team.goalsFor + team.goalsAgainst, 1)) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                />
                <motion.div
                  className="h-full bg-gradient-to-l from-red-500/60 to-red-500/30 rounded-r-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(team.goalsAgainst / Math.max(team.goalsFor + team.goalsAgainst, 1)) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-emerald-400/60">Gol Dicetak ({team.goalsFor})</span>
                <span className="text-[10px] text-red-400/60">Gol Kemasukan ({team.goalsAgainst})</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Refresh + Back ───────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={fetchTeam} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.03] text-muted-foreground border border-white/[0.06] hover:bg-white/[0.06] hover:text-white transition-all">
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
