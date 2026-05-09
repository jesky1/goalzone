'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Trophy,
  Target,
  Swords,
  Shield,
  Users,
  Calendar,
  MapPin,
  Flag,
  Loader2,
  AlertCircle,
  UserCircle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { safeSrc } from '@/lib/safe-src';

// ============================================================
// Club Accent Colors (slug → color scheme)
// ============================================================
const CLUB_ACCENTS: Record<string, { primary: string; secondary: string; glow: string; gradient: string; label: string }> = {
  'real-madrid': {
    primary: '#FFD700',
    secondary: '#FFFFFF',
    glow: 'rgba(255, 215, 0, 0.4)',
    gradient: 'from-yellow-500/20 via-white/10 to-yellow-500/20',
    label: 'Blancos',
  },
  'barcelona': {
    primary: '#A50044',
    secondary: '#004D98',
    glow: 'rgba(165, 0, 68, 0.4)',
    gradient: 'from-red-800/20 via-blue-800/10 to-red-800/20',
    label: 'Blaugrana',
  },
  'manchester-city': {
    primary: '#6CABDD',
    secondary: '#1C2C5B',
    glow: 'rgba(108, 171, 221, 0.4)',
    gradient: 'from-sky-500/20 via-sky-900/10 to-sky-500/20',
    label: 'Citizens',
  },
  'bayern-munich': {
    primary: '#DC052D',
    secondary: '#0066B2',
    glow: 'rgba(220, 5, 45, 0.4)',
    gradient: 'from-red-600/20 via-blue-800/10 to-red-600/20',
    label: 'Die Roten',
  },
  'psg': {
    primary: '#004170',
    secondary: '#DA291C',
    glow: 'rgba(0, 65, 112, 0.4)',
    gradient: 'from-blue-900/20 via-red-600/10 to-blue-900/20',
    label: 'Les Parisiens',
  },
  'liverpool': {
    primary: '#C8102E',
    secondary: '#F5F5F5',
    glow: 'rgba(200, 16, 46, 0.4)',
    gradient: 'from-red-700/20 via-red-400/10 to-red-700/20',
    label: 'The Reds',
  },
  'arsenal': {
    primary: '#EF0107',
    secondary: '#023474',
    glow: 'rgba(239, 1, 7, 0.4)',
    gradient: 'from-red-600/20 via-red-400/10 to-red-600/20',
    label: 'Gunners',
  },
  'chelsea': {
    primary: '#034694',
    secondary: '#D4AF37',
    glow: 'rgba(3, 70, 148, 0.4)',
    gradient: 'from-blue-800/20 via-yellow-500/10 to-blue-800/20',
    label: 'Blues',
  },
  'juventus': {
    primary: '#000000',
    secondary: '#FFFFFF',
    glow: 'rgba(255, 255, 255, 0.3)',
    gradient: 'from-white/10 via-white/5 to-white/10',
    label: 'Bianconeri',
  },
  'ac-milan': {
    primary: '#FB090B',
    secondary: '#000000',
    glow: 'rgba(251, 9, 11, 0.4)',
    gradient: 'from-red-600/20 via-red-400/10 to-red-600/20',
    label: 'Rossoneri',
  },
  'inter-milan': {
    primary: '#0068A8',
    secondary: '#000000',
    glow: 'rgba(0, 104, 168, 0.4)',
    gradient: 'from-blue-600/20 via-blue-400/10 to-blue-600/20',
    label: 'Nerazzurri',
  },
  'atletico-madrid': {
    primary: '#CB3524',
    secondary: '#FFFFFF',
    glow: 'rgba(203, 53, 36, 0.4)',
    gradient: 'from-red-700/20 via-red-400/10 to-red-700/20',
    label: 'Colchoneros',
  },
  'manchester-united': {
    primary: '#DA291C',
    secondary: '#FBE122',
    glow: 'rgba(218, 41, 28, 0.4)',
    gradient: 'from-red-700/20 via-yellow-400/10 to-red-700/20',
    label: 'Red Devils',
  },
  'borussia-dortmund': {
    primary: '#FDE100',
    secondary: '#000000',
    glow: 'rgba(253, 225, 0, 0.4)',
    gradient: 'from-yellow-400/20 via-yellow-300/10 to-yellow-400/20',
    label: 'Schwarze Gelbe',
  },
  'tottenham': {
    primary: '#132257',
    secondary: '#FFFFFF',
    glow: 'rgba(19, 34, 87, 0.4)',
    gradient: 'from-blue-900/20 via-blue-600/10 to-blue-900/20',
    label: 'Spurs',
  },
  'napoli': {
    primary: '#12A0D7',
    secondary: '#FFFFFF',
    glow: 'rgba(18, 160, 215, 0.4)',
    gradient: 'from-sky-500/20 via-sky-300/10 to-sky-500/20',
    label: 'Partenopei',
  },
};

const DEFAULT_ACCENT = {
  primary: '#00f0ff',
  secondary: '#ffffff',
  glow: 'rgba(0, 240, 255, 0.4)',
  gradient: 'from-cyan-500/20 via-cyan-300/10 to-cyan-500/20',
  label: '',
};

// ============================================================
// Types
// ============================================================
interface TeamInfo {
  id: number;
  name: string;
  slug: string;
  logo: string;
  country: string;
  founded: number;
  venue: string;
  venueCapacity: number;
}

interface Standings {
  rank: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
  league?: string;
  leagueLogo?: string;
}

interface SquadPlayer {
  id: number;
  name: string;
  number: number | string;
  position: string;
  photo: string | null;
}

interface Fixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  date: string;
  league: string;
  leagueLogo?: string;
  minute?: number | null;
}

interface TeamData {
  success: boolean;
  info: TeamInfo;
  standings: Standings | null;
  squad: SquadPlayer[];
  fixtures: Fixture[];
  source: string;
}

// ─── Position order for sorting ─────────────────────────────
const POS_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
const POS_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  GK:  { bg: 'bg-amber-500/15',  text: 'text-amber-400',  border: 'border-amber-500/20',  label: 'Goalkeeper' },
  DEF: { bg: 'bg-blue-500/15',   text: 'text-blue-400',   border: 'border-blue-500/20',   label: 'Defender' },
  MID: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Midfielder' },
  FWD: { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/20',    label: 'Forward' },
};

// ============================================================
// Squad Skeleton Loader
// ============================================================
function SquadSkeleton() {
  return (
    <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.08] flex items-center gap-2">
        <Users className="w-4 h-4 text-slate-600" />
        <Skeleton className="h-4 w-14 bg-white/[0.06]" />
        <Skeleton className="h-3 w-16 bg-white/[0.04] ml-auto" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-6 bg-white/[0.06] shrink-0" />
            <Skeleton className="w-8 h-8 rounded-full bg-white/[0.06] shrink-0" />
            <Skeleton className="h-4 flex-1 bg-white/[0.06]" />
            <Skeleton className="h-5 w-12 rounded bg-white/[0.06] shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Fixtures Skeleton Loader
// ============================================================
function FixturesSkeleton() {
  return (
    <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.08] flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-600" />
        <Skeleton className="h-4 w-36 bg-white/[0.06]" />
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20 bg-white/[0.06]" />
              <Skeleton className="h-3 w-12 bg-white/[0.04]" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded bg-white/[0.06] shrink-0" />
              <Skeleton className="h-4 flex-1 bg-white/[0.06]" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded bg-white/[0.06] shrink-0" />
              <Skeleton className="h-4 flex-1 bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Player Photo with Error Fallback
// ============================================================
function PlayerPhoto({ src, name }: { src: string | null; name: string }) {
  const [imgError, setImgError] = useState(false);

  // Show initial letter fallback if no photo or image fails to load
  if (!src || imgError) {
    return (
      <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
        <span className="text-[11px] font-bold text-slate-500">{name.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="w-8 h-8 rounded-full object-cover bg-white/[0.06] border border-white/[0.08] shrink-0"
      onError={() => setImgError(true)}
      loading="lazy"
    />
  );
}

// ============================================================
// Team Page Component
// ============================================================
export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const accent = CLUB_ACCENTS[slug] || DEFAULT_ACCENT;

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetch(`/api/teams?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setTeam(data);
        } else {
          setError(data.error || 'Gagal memuat data tim');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Tidak dapat terhubung ke server');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug]);

  const sortedSquad = team
    ? [...team.squad].sort((a, b) => (POS_ORDER[a.position] ?? 9) - (POS_ORDER[b.position] ?? 9))
    : [];

  // Group squad by position for section headers
  const positionGroups: { key: string; label: string; players: SquadPlayer[] }[] = [];
  const groupOrder = ['GK', 'DEF', 'MID', 'FWD'];
  for (const pos of groupOrder) {
    const players = sortedSquad.filter(p => p.position === pos);
    if (players.length > 0) {
      const posInfo = POS_COLORS[pos];
      positionGroups.push({ key: pos, label: posInfo?.label || pos, players });
    }
  }
  // Any remaining players with unknown positions
  const remaining = sortedSquad.filter(p => !groupOrder.includes(p.position));
  if (remaining.length > 0) {
    positionGroups.push({ key: 'OTHER', label: 'Lainnya', players: remaining });
  }

  // ─── Full Loading State ────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen">
        {/* Hero skeleton */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
            <Skeleton className="h-3 w-20 bg-white/[0.06] mb-8" />
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
              <Skeleton className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-white/[0.06]" />
              <div className="flex-1 space-y-3 text-center sm:text-left w-full">
                <Skeleton className="h-8 w-48 bg-white/[0.06] mx-auto sm:mx-0" />
                <Skeleton className="h-4 w-24 bg-white/[0.06] mx-auto sm:mx-0" />
                <div className="flex gap-3 justify-center sm:justify-start">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-20 rounded-xl bg-white/[0.06]" />)}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Content skeleton */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3"><SquadSkeleton /></div>
            <div className="lg:col-span-2"><FixturesSkeleton /></div>
          </div>
        </section>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────
  if (error || !team) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-sm text-red-400 mb-4">{error || 'Tim tidak ditemukan'}</p>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-neon hover:underline"
          >
            ← Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const { info, standings, squad, fixtures } = team;

  return (
    <div className="min-h-screen">
      {/* ═══════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background gradient with club accent */}
        <div
          className={`absolute inset-0 bg-gradient-to-b ${accent.gradient} opacity-60`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-transparent to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Kembali
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            {/* Logo with neon glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative shrink-0"
            >
              <div
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/[0.1] flex items-center justify-center p-4"
                style={{ boxShadow: `0 0 30px ${accent.glow}, 0 0 60px ${accent.glow.replace('0.4', '0.15')}` }}
              >
                {safeSrc(info.logo) ? (
                  <img
                    src={safeSrc(info.logo)!}
                    alt={info.name}
                    className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">{info.name.charAt(0)}</span>
                )}
              </div>
              {/* Glow ring */}
              <div
                className="absolute -inset-1 rounded-2xl opacity-40 -z-10"
                style={{ boxShadow: `0 0 40px ${accent.glow}, inset 0 0 40px ${accent.glow.replace('0.4', '0.1')}` }}
              />
            </motion.div>

            {/* Club Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-center sm:text-left flex-1"
            >
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1">
                {info.name}
              </h1>
              {accent.label && (
                <p
                  className="text-sm font-semibold mb-3"
                  style={{ color: accent.primary }}
                >
                  {accent.label}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-400 mb-5">
                {info.country && (
                  <span className="flex items-center gap-1">
                    <Flag className="w-3 h-3" /> {info.country}
                  </span>
                )}
                {info.founded && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Est. {info.founded}
                  </span>
                )}
                {info.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {info.venue}
                    {info.venueCapacity ? ` (${info.venueCapacity.toLocaleString()})` : ''}
                  </span>
                )}
              </div>

              {/* Stat Cards */}
              {standings && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  {[
                    { icon: Trophy, label: 'Peringkat', value: `#${standings.rank}`, color: accent.primary },
                    { icon: Target, label: 'Menang', value: standings.won, color: '#22c55e' },
                    { icon: Swords, label: 'Seri', value: standings.drawn, color: '#eab308' },
                    { icon: Shield, label: 'Kalah', value: standings.lost, color: '#ef4444' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-xl px-4 py-2.5 text-center min-w-[80px]"
                    >
                      <stat.icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: stat.color }} />
                      <div className="text-lg font-bold text-white">{stat.value}</div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Form */}
              {standings?.form && standings.form.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3 justify-center sm:justify-start">
                  <span className="text-[10px] text-slate-500 mr-1">Form:</span>
                  {standings.form.map((f, i) => (
                    <span
                      key={i}
                      className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CONTENT: SQUAD + FIXTURES (Two columns)
          ═══════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ─── LEFT: Squad Table ──────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.08] flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: accent.primary }} />
                <h2 className="text-sm font-bold text-white">Squad</h2>
                {squad.length > 0 && (
                  <span className="text-[10px] text-slate-500 ml-auto">{squad.length} pemain</span>
                )}
                {team.source === 'api-football' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-2">LIVE DATA</span>
                )}
              </div>

              {squad.length === 0 ? (
                <div className="text-center py-16">
                  <UserCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-medium mb-1">Data squad belum tersedia</p>
                  <p className="text-xs text-slate-600">
                    {team.source === 'mock'
                      ? 'Hubungkan Football API untuk melihat data pemain asli'
                      : 'Squad data tidak dapat dimuat dari API'}
                  </p>
                </div>
              ) : (
                <div className="max-h-[580px] overflow-y-auto custom-scrollbar">
                  {positionGroups.map((group) => {
                    const posColor = POS_COLORS[group.key] || POS_COLORS.MID;
                    return (
                      <div key={group.key}>
                        {/* Position section header */}
                        <div className="sticky z-10 px-5 py-2 bg-white/[0.03] border-b border-white/[0.06] border-t border-t-white/[0.04]">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${posColor.bg} ${posColor.text} border ${posColor.border}`}>
                              {group.key}
                            </span>
                            <span className="text-[11px] text-slate-500">{group.label} ({group.players.length})</span>
                          </div>
                        </div>
                        {/* Player rows */}
                        {group.players.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors group"
                          >
                            {/* Number */}
                            <span className="text-xs text-slate-500 font-mono w-7 text-center shrink-0">
                              {player.number || '-'}
                            </span>
                            {/* Photo */}
                            <PlayerPhoto src={player.photo} name={player.name} />
                            {/* Name (clickable) */}
                            <Link
                              href={`/players/${player.id}`}
                              className="text-sm text-slate-200 hover:text-cyan-400 transition-colors font-medium truncate flex-1"
                            >
                              {player.name}
                            </Link>
                            {/* Position badge */}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${posColor.bg} ${posColor.text} border ${posColor.border} shrink-0`}>
                              {player.position}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* ─── RIGHT: Recent Fixtures ─────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.08] flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: accent.primary }} />
                <h2 className="text-sm font-bold text-white">Pertandingan Terakhir</h2>
              </div>

              {fixtures.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Belum ada pertandingan</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04] max-h-[520px] overflow-y-auto custom-scrollbar">
                  {fixtures.map((fx, i) => {
                    const isHome = fx.homeTeam === info.name;
                    const teamScored = isHome ? fx.homeScore : fx.awayScore;
                    const oppScored = isHome ? fx.awayScore : fx.homeScore;
                    const isWin = teamScored !== null && teamScored > oppScored;
                    const isLoss = teamScored !== null && teamScored < oppScored;
                    const isDraw = teamScored !== null && teamScored === oppScored;
                    const resultColor = isWin ? 'text-emerald-400' : isLoss ? 'text-red-400' : 'text-yellow-400';
                    const resultBg = isWin ? 'bg-emerald-500/10' : isLoss ? 'bg-red-500/10' : 'bg-yellow-500/10';
                    const resultLabel = isWin ? 'W' : isLoss ? 'L' : 'D';

                    return (
                      <div key={fx.id || i} className="px-4 py-3.5 hover:bg-white/[0.03] transition-colors">
                        {/* League + Date */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            {safeSrc(fx.leagueLogo) && (
                              <img src={safeSrc(fx.leagueLogo)!} alt="" className="w-3.5 h-3.5 object-contain" />
                            )}
                            <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{fx.league}</span>
                          </div>
                          <span className="text-[10px] text-slate-600">
                            {fx.date ? new Date(fx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                          </span>
                        </div>

                        {/* Score Row */}
                        <div className="flex items-center gap-2">
                          {/* Result badge */}
                          <span className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${resultBg} ${resultColor}`}>
                            {resultLabel}
                          </span>

                          {/* Match info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {safeSrc(fx.homeLogo) && (
                                <img src={safeSrc(fx.homeLogo)!} alt="" className="w-4 h-4 object-contain shrink-0" />
                              )}
                              <span className={`text-xs truncate ${isHome ? 'font-semibold text-white' : 'text-slate-400'}`}>
                                {fx.homeTeam}
                              </span>
                              <span className={`text-xs font-bold ml-auto shrink-0 ${isHome && isWin ? 'text-emerald-400' : isHome && isLoss ? 'text-red-400' : 'text-white'}`}>
                                {fx.homeScore ?? '-'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {safeSrc(fx.awayLogo) && (
                                <img src={safeSrc(fx.awayLogo)!} alt="" className="w-4 h-4 object-contain shrink-0" />
                              )}
                              <span className={`text-xs truncate ${!isHome ? 'font-semibold text-white' : 'text-slate-400'}`}>
                                {fx.awayTeam}
                              </span>
                              <span className={`text-xs font-bold ml-auto shrink-0 ${!isHome && isWin ? 'text-emerald-400' : !isHome && isLoss ? 'text-red-400' : 'text-white'}`}>
                                {fx.awayScore ?? '-'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Live indicator */}
                        {fx.status && ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(fx.status) && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] text-red-400 font-medium">
                              LIVE{fx.minute ? ` ${fx.minute}'` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ─── Standings Summary Card ────────────────────── */}
            {standings && (
              <div className="mt-4 bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4" style={{ color: accent.primary }} />
                  <h3 className="text-xs font-bold text-white">Klasemen</h3>
                  {standings.league && (
                    <span className="text-[10px] text-slate-500 ml-auto">{standings.league}</span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'MP', value: standings.played },
                    { label: 'GF', value: standings.goalsFor },
                    { label: 'GA', value: standings.goalsAgainst },
                    { label: 'PTS', value: standings.points },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/[0.04] rounded-lg py-2 border border-white/[0.06]">
                      <div className="text-sm font-bold text-white">{s.value}</div>
                      <div className="text-[9px] text-slate-500 uppercase">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
