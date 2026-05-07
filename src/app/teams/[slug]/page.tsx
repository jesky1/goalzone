'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Calendar, Trophy, Users, Hash, ChevronRight,
  Shield, Swords, Target, RefreshCw, AlertTriangle, Star, Clock,
  CircleDot, TrendingUp,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// ─── Types ──────────────────────────────────────────────────

interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

interface TeamInfo {
  id: string; name: string; slug: string; logo: string;
  country: string; founded: number | null; venue: string | null;
  venueCapacity: number | null; league: string | null;
}

interface TeamStats {
  standing: number | null; played: number; won: number; drawn: number; lost: number;
  goalsFor: number; goalsAgainst: number; points: number; form: ('W' | 'D' | 'L')[];
}

interface SquadPlayer {
  name: string; number: number | null; position: string; age: number;
  nationality: string; photo: string | null;
}

interface RecentMatch {
  id: string; homeTeam: string; awayTeam: string; homeScore: number; awayScore: number;
  date: string; status: string; league: string | null;
  homeLogo: string | null; awayLogo: string | null; isHome: boolean;
}

interface LineupPlayer {
  name: string; number: number | null; position: string; photo: string | null;
  gridX: string; gridY: string;
}

interface TeamData {
  team: TeamInfo;
  stats: TeamStats;
  squad: SquadPlayer[];
  recentMatches: RecentMatch[];
  lineup: LineupPlayer[];
  formation: string;
  colors: TeamColors;
  source: string;
}

// ─── Helpers ────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function getPositionLabel(pos: string) {
  const labels: Record<string, string> = { G: 'GK', D: 'DEF', M: 'MID', F: 'FWD' };
  return labels[pos] || pos || 'N/A';
}

function getPositionColor(pos: string) {
  const colors: Record<string, string> = {
    G: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    D: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    M: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    F: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return colors[pos] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

function getMatchResult(isHome: boolean, homeScore: number, awayScore: number): { label: string; color: string } {
  const myScore = isHome ? homeScore : awayScore;
  const oppScore = isHome ? awayScore : homeScore;
  if (myScore > oppScore) return { label: 'W', color: 'bg-emerald-500 text-white' };
  if (myScore < oppScore) return { label: 'L', color: 'bg-red-500 text-white' };
  return { label: 'D', color: 'bg-amber-500 text-white' };
}

// ─── Page Skeleton ──────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-deep-900">
      <header className="border-b border-white/[0.04] bg-deep-900/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center">
          <Skeleton className="h-4 w-24 bg-white/5" />
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Hero */}
        <div className="glass-card p-6 sm:p-10 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Skeleton className="w-28 h-28 rounded-full bg-white/5" />
            <div className="flex-1 text-center md:text-left space-y-3 w-full">
              <Skeleton className="h-7 w-48 mx-auto md:mx-0 bg-white/5" />
              <Skeleton className="h-4 w-32 mx-auto md:mx-0 bg-white/5" />
              <div className="flex gap-3 justify-center md:justify-start">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-20 rounded-xl bg-white/5" />)}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 glass-card" />
          <Skeleton className="h-96 glass-card" />
        </div>
      </main>
    </div>
  );
}

// ─── Formation Pitch ────────────────────────────────────────

function FormationPitch({
  lineup,
  formation,
  teamName,
  accentColor,
}: {
  lineup: LineupPlayer[];
  formation: string;
  teamName: string;
  accentColor: string;
}) {
  if (!lineup || lineup.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="glass-card overflow-hidden"
    >
      <div className="p-4 sm:p-5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: accentColor }} />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Formasi Terakhir</h3>
          <Badge variant="outline" className="ml-auto text-xs font-bold" style={{ borderColor: `${accentColor}40`, color: accentColor }}>
            {formation}
          </Badge>
        </div>
      </div>

      {/* Pitch */}
      <div className="relative mx-4 sm:mx-5 mb-4 sm:mb-5 mt-4 rounded-xl overflow-hidden" style={{ paddingBottom: '120%' }}>
        {/* Background gradient (glass pitch) */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(180deg, ${accentColor}08 0%, ${accentColor}04 50%, ${accentColor}10 100%)`,
            backdropFilter: 'blur(12px)',
            border: `1px solid ${accentColor}20`,
          }}
        />

        {/* Pitch lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Outline */}
          <rect x="2" y="2" width="96" height="96" rx="1" fill="none" stroke={`${accentColor}18`} strokeWidth="0.3" />
          {/* Center line */}
          <line x1="2" y1="50" x2="98" y2="50" stroke={`${accentColor}18`} strokeWidth="0.3" />
          {/* Center circle */}
          <circle cx="50" cy="50" r="12" fill="none" stroke={`${accentColor}18`} strokeWidth="0.3" />
          {/* Center dot */}
          <circle cx="50" cy="50" r="1" fill={`${accentColor}30`} />
          {/* Top penalty area */}
          <rect x="25" y="2" width="50" height="18" fill="none" stroke={`${accentColor}18`} strokeWidth="0.3" />
          {/* Top goal area */}
          <rect x="38" y="2" width="24" height="8" fill="none" stroke={`${accentColor}18`} strokeWidth="0.3" />
          {/* Bottom penalty area */}
          <rect x="25" y="80" width="50" height="18" fill="none" stroke={`${accentColor}18`} strokeWidth="0.3" />
          {/* Bottom goal area */}
          <rect x="38" y="90" width="24" height="8" fill="none" stroke={`${accentColor}18`} strokeWidth="0.3" />
          {/* Corner arcs */}
          <path d="M 2 5 A 3 3 0 0 1 5 2" fill="none" stroke={`${accentColor}15`} strokeWidth="0.2" />
          <path d="M 95 2 A 3 3 0 0 1 98 5" fill="none" stroke={`${accentColor}15`} strokeWidth="0.2" />
          <path d="M 2 95 A 3 3 0 0 0 5 98" fill="none" stroke={`${accentColor}15`} strokeWidth="0.2" />
          <path d="M 95 98 A 3 3 0 0 0 98 95" fill="none" stroke={`${accentColor}15`} strokeWidth="0.2" />
        </svg>

        {/* Players */}
        {lineup.map((player, idx) => (
          <motion.div
            key={player.name}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + idx * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${player.gridX}%`, top: `${player.gridY}%` }}
          >
            {/* Player dot */}
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold shadow-lg"
              style={{
                backgroundColor: `${accentColor}CC`,
                color: '#fff',
                boxShadow: `0 0 12px ${accentColor}50, 0 2px 8px rgba(0,0,0,0.3)`,
                border: `1.5px solid ${accentColor}`,
              }}
            >
              {player.number || '?'}
            </div>
            {/* Name */}
            <div className="text-[7px] sm:text-[8px] font-semibold text-gray-900 dark:text-white text-center leading-tight max-w-[40px] sm:max-w-[50px] truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {player.name.split(' ').pop()}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function TeamProfilePage() {
  const params = useParams<{ slug: string }>();
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    if (!params.slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${params.slug}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.team) {
        setData(json);
      } else {
        setError('Klub tidak ditemukan');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [params.slug]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  if (loading) return <PageSkeleton />;
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-deep-900 gap-4 p-4">
        <AlertTriangle className="w-12 h-12 text-amber-400/40" />
        <p className="text-sm text-muted-foreground">{error || 'Klub tidak ditemukan'}</p>
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/15 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const { team, stats, squad, recentMatches, lineup, formation, colors, source } = data;
  const accentColor = colors.accent || '#00f0ff';
  const primaryColor = colors.primary || '#ffffff';
  const goalDiff = stats.goalsFor - stats.goalsAgainst;

  return (
    <div className="min-h-screen flex flex-col bg-deep-900">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full blur-[150px]" style={{ backgroundColor: `${accentColor}06` }} />
        <div className="absolute bottom-1/3 right-0 w-[500px] h-[300px] rounded-full blur-[120px]" style={{ backgroundColor: `${primaryColor}04` }} />
      </div>

      {/* ─── Header ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-deep-900/70 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors group">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Beranda</span>
            </Link>
            {source === 'mock' && (
              <Badge variant="outline" className="text-[9px] bg-amber-500/5 text-amber-400/70 border-amber-500/15 px-1.5 py-0">Sample</Badge>
            )}
          </div>
        </div>
      </header>

      {/* ─── Main ─────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground/40 mb-6">
          <Link href="/" className="hover:text-cyan-400/60 transition-colors">Beranda</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-muted-foreground/60">Klub</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-muted-foreground/80 font-medium">{team.name}</span>
        </nav>

        {/* ─── HERO SECTION ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden mb-8"
        >
          {/* Top accent line */}
          <div className="h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

          <div className="p-5 sm:p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
              {/* Logo with glow */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="relative shrink-0"
              >
                {/* Outer glow rings */}
                <div
                  className="absolute -inset-4 rounded-full animate-pulse"
                  style={{
                    background: `conic-gradient(from 0deg, transparent 0%, ${accentColor}25 25%, transparent 50%, ${accentColor}18 75%, transparent 100%)`,
                    mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
                    WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
                  }}
                />
                {/* Neon glow */}
                <div
                  className="absolute -inset-3 rounded-full blur-xl"
                  style={{ backgroundColor: `${accentColor}20` }}
                />
                <div
                  className="absolute -inset-2 rounded-full blur-md"
                  style={{ backgroundColor: `${accentColor}15` }}
                />
                {/* Logo container */}
                <div
                  className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}08)`,
                    backdropFilter: 'blur(16px)',
                    border: `2px solid ${accentColor}30`,
                    boxShadow: `0 0 30px ${accentColor}15, 0 0 60px ${accentColor}08, inset 0 0 20px ${accentColor}05`,
                  }}
                >
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={96}
                    height={96}
                    className="relative z-10 object-contain p-3"
                    unoptimized
                  />
                </div>
              </motion.div>

              {/* Team Info */}
              <div className="flex-1 text-center md:text-left min-w-0">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2"
                >
                  {team.name}
                </motion.h1>

                {/* Meta tags */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 mb-5"
                >
                  {team.league && (
                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: accentColor }}>
                      <Trophy className="w-3.5 h-3.5" /> {team.league}
                    </span>
                  )}
                  {team.country && (
                    <span className="text-xs text-muted-foreground/60">{team.country}</span>
                  )}
                  {team.founded && (
                    <span className="text-xs text-muted-foreground/40">Est. {team.founded}</span>
                  )}
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3"
                >
                  {stats.standing !== null && (
                    <div
                      className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl"
                      style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}
                    >
                      <Hash className="w-3.5 h-3.5" style={{ color: `${accentColor}80` }} />
                      <span className="text-xl sm:text-2xl font-black tabular-nums" style={{ color: accentColor }}>
                        {stats.standing}
                      </span>
                      <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase">Ranking</span>
                    </div>
                  )}
                  <div
                    className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl"
                    style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400/70" />
                    <span className="text-xl sm:text-2xl font-black tabular-nums text-emerald-400">{stats.won}</span>
                    <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase">Menang</span>
                  </div>
                  <div
                    className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl"
                    style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}
                  >
                    <CircleDot className="w-3.5 h-3.5 text-amber-400/70" />
                    <span className="text-xl sm:text-2xl font-black tabular-nums text-amber-400">{stats.drawn}</span>
                    <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase">Seri</span>
                  </div>
                  <div
                    className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl"
                    style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}
                  >
                    <Shield className="w-3.5 h-3.5 text-red-400/70" />
                    <span className="text-xl sm:text-2xl font-black tabular-nums text-red-400">{stats.lost}</span>
                    <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase">Kalah</span>
                  </div>
                  <div
                    className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl"
                    style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}
                  >
                    <Star className="w-3.5 h-3.5" style={{ color: `${accentColor}80` }} />
                    <span className="text-xl sm:text-2xl font-black tabular-nums" style={{ color: accentColor }}>
                      {stats.points}
                    </span>
                    <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase">Poin</span>
                  </div>
                </motion.div>

                {/* Form mini */}
                {stats.form.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-2 mt-4 justify-center md:justify-start"
                  >
                    <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider mr-1">Form</span>
                    {stats.form.map((f, i) => (
                      <span
                        key={i}
                        className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${
                          f === 'W' ? 'bg-emerald-500 text-white' : f === 'D' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground/40">
                      {stats.played} main · {stats.goalsFor}/{stats.goalsAgainst} gol · GD {goalDiff > 0 ? '+' : ''}{goalDiff}
                    </span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Venue info */}
            {team.venue && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex items-center gap-2 mt-5 pt-5 border-t border-white/[0.04]"
              >
                <MapPin className="w-3.5 h-3.5" style={{ color: `${accentColor}60` }} />
                <span className="text-xs text-muted-foreground/60">{team.venue}</span>
                {team.venueCapacity && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                    <span className="text-xs text-muted-foreground/40">{team.venueCapacity.toLocaleString()} kursi</span>
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* Bottom accent line */}
          <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)` }} />
        </motion.div>

        {/* ─── LINEUP / FORMATION ─────────────────────────── */}
        {lineup && lineup.length > 0 && (
          <div className="mb-8">
            <FormationPitch
              lineup={lineup}
              formation={formation}
              teamName={team.name}
              accentColor={accentColor}
            />
          </div>
        )}

        {/* ─── TWO COLUMN: Squad + Recent Matches ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left: Squad Table */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card overflow-hidden"
          >
            <div className="p-4 sm:p-5 border-b border-white/[0.04]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: accentColor }} />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Daftar Pemain</h3>
                <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 font-semibold text-muted-foreground/50 border-white/[0.08]">
                  {squad.length} pemain
                </Badge>
              </div>
            </div>
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <th className="py-2.5 px-3 text-center w-12">#</th>
                    <th className="py-2.5 px-3 text-left">Nama</th>
                    <th className="py-2.5 px-3 text-center w-12">Pos</th>
                    <th className="py-2.5 px-3 text-center w-10 hidden sm:table-cell">Umur</th>
                    <th className="py-2.5 px-3 text-right hidden md:table-cell">Negara</th>
                  </tr>
                </thead>
                <tbody>
                  {squad
                    .sort((a, b) => {
                      const order: Record<string, number> = { G: 0, D: 1, M: 2, F: 3 };
                      return (order[a.position] || 4) - (order[b.position] || 4) || (a.number || 99) - (b.number || 99);
                    })
                    .map((player, idx) => (
                    <motion.tr
                      key={`${player.name}-${idx}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.02 * idx + 0.35 }}
                      className="border-t border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-2 px-3 text-center">
                        <span className="text-xs font-bold tabular-nums text-muted-foreground/50">{player.number ?? '-'}</span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-white/[0.04] flex items-center justify-center">
                            {player.photo ? (
                              <Image src={player.photo} alt={player.name} width={24} height={24} className="object-cover w-full h-full" unoptimized />
                            ) : (
                              <span className="text-[7px] font-bold text-muted-foreground/30">{player.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                            )}
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{player.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${getPositionColor(player.position)}`}>
                          {getPositionLabel(player.position)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center hidden sm:table-cell">
                        <span className="text-xs text-muted-foreground/40 tabular-nums">{player.age}</span>
                      </td>
                      <td className="py-2 px-3 text-right hidden md:table-cell">
                        <span className="text-[11px] text-muted-foreground/40">{player.nationality}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {squad.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground/40">Data pemain belum tersedia</div>
              )}
            </div>
          </motion.div>

          {/* Right: Recent Matches */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card overflow-hidden"
          >
            <div className="p-4 sm:p-5 border-b border-white/[0.04]">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4" style={{ color: accentColor }} />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Hasil Terakhir</h3>
              </div>
            </div>
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-2">
              {recentMatches.map((match, idx) => {
                const result = getMatchResult(match.isHome, match.homeScore, match.awayScore);
                const opponent = match.isHome ? match.awayTeam : match.homeTeam;
                const opponentLogo = match.isHome ? match.awayLogo : match.homeLogo;
                const myScore = match.isHome ? match.homeScore : match.awayScore;
                const oppScore = match.isHome ? match.awayScore : match.homeScore;

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * idx + 0.45 }}
                    className="rounded-xl border border-white/[0.04] p-3 sm:p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Result badge + date */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${result.color}`}>
                          {result.label}
                        </span>
                        {match.league && (
                          <span className="text-[10px] text-muted-foreground/40 truncate max-w-[120px]">{match.league}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/30">
                        <Calendar className="w-3 h-3" />
                        {formatDate(match.date)}
                      </div>
                    </div>

                    {/* Match row */}
                    <div className="flex items-center gap-2">
                      {/* Team logo */}
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-white/[0.04] flex items-center justify-center">
                        {opponentLogo ? (
                          <Image src={opponentLogo} alt={opponent} width={28} height={28} className="object-contain p-0.5 w-full h-full" unoptimized />
                        ) : (
                          <span className="text-[8px] font-bold text-muted-foreground/30">{opponent.slice(0, 2)}</span>
                        )}
                      </div>

                      {/* Opponent name + score */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-muted-foreground/50">{match.isHome ? 'vs' : '@'}</span>
                          <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">{opponent}</span>
                        </div>
                      </div>

                      {/* Score */}
                      <div
                        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                        style={{
                          background: `${accentColor}08`,
                          border: `1px solid ${accentColor}15`,
                        }}
                      >
                        <span className="text-sm font-black tabular-nums" style={{ color: accentColor }}>{myScore}</span>
                        <span className="w-px h-3 bg-muted-foreground/15" />
                        <span className="text-sm font-bold tabular-nums text-muted-foreground/50">{oppScore}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {recentMatches.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground/40">Belum ada hasil pertandingan</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ─── Additional Info Cards ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8"
        >
          <div className="glass-card p-3.5 text-center">
            <Target className="w-4 h-4 mx-auto mb-1.5 text-emerald-400/60" />
            <span className="text-xl font-black tabular-nums text-emerald-400 block">{stats.goalsFor}</span>
            <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase">Gol Dicetak</span>
          </div>
          <div className="glass-card p-3.5 text-center">
            <Shield className="w-4 h-4 mx-auto mb-1.5 text-red-400/60" />
            <span className="text-xl font-black tabular-nums text-red-400 block">{stats.goalsAgainst}</span>
            <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase">Gol Kemasukan</span>
          </div>
          <div className="glass-card p-3.5 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1.5" style={{ color: `${accentColor}60` }} />
            <span className={`text-xl font-black tabular-nums block ${goalDiff > 0 ? 'text-emerald-400' : goalDiff < 0 ? 'text-red-400' : 'text-amber-400'}`}>
              {goalDiff > 0 ? '+' : ''}{goalDiff}
            </span>
            <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase">Goal Difference</span>
          </div>
          <div className="glass-card p-3.5 text-center">
            <Clock className="w-4 h-4 mx-auto mb-1.5" style={{ color: `${accentColor}60` }} />
            <span className="text-xl font-black tabular-nums block" style={{ color: accentColor }}>{stats.played}</span>
            <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase">Pertandingan</span>
          </div>
        </motion.div>

        {/* ─── Actions ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
        >
          <button
            onClick={fetchTeam}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.03] text-muted-foreground border border-white/[0.06] hover:bg-white/[0.06] hover:text-white transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </button>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-all text-white" style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
        </motion.div>
      </main>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-white/[0.03] bg-deep-900/50 backdrop-blur-sm mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
