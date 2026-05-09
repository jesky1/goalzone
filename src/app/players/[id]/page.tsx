'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Ruler, Weight, User, Flag, Shield, Calendar, TrendingUp, Target, Award, Activity } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface PlayerData {
  id: number
  name: string
  firstname: string
  lastname: string
  photo: string
  age: number
  birth: {
    date: string
    place: string | null
    country: string | null
  }
  nationality: string
  height: string | null
  weight: string | null
  injured: boolean
  position: string | null
  team: {
    id: number
    name: string
    logo: string
  } | null
  league: {
    id: number
    name: string
    logo: string
    country: string
  } | null
  statistics: {
    appearances: number
    minutes: number
    goals: number
    assists: number
    yellowCards: number
    redCards: number
    rating: string | null
    passes: number
    tackles: number
    saves: number
  } | null
  source: string
}

// ──────────────────────────────────────────────
// Stat Card Component
// ──────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  delay = 0,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string | number | null
  delay?: number
  accent?: string
}) {
  const displayValue = value ?? '-'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="group relative overflow-hidden rounded-xl p-4 sm:p-5
        backdrop-blur-xl bg-white/30 dark:bg-white/10
        border border-gray-200 dark:border-white/20
        shadow-xl hover:shadow-2xl transition-all duration-300
        hover:scale-[1.02] hover:border-neon/30"
      style={{
        boxShadow: accent ? `0 0 20px ${accent}15` : undefined,
      }}
    >
      {/* Glow accent */}
      {accent && (
        <div
          className="absolute top-0 left-0 w-full h-1 opacity-60"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />
      )}

      <div className="flex items-start gap-3">
        <div
          className="shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-white/5"
          style={accent ? { color: accent } : undefined}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
            {displayValue}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ──────────────────────────────────────────────
// Performance Stat Bar
// ──────────────────────────────────────────────

function PerformanceBar({
  label,
  value,
  max,
  delay = 0,
}: {
  label: string
  value: number
  max: number
  delay?: number
}) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: delay + 0.2, duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-neon-dim to-neon"
        />
      </div>
    </motion.div>
  )
}

// ──────────────────────────────────────────────
// Position Badge
// ──────────────────────────────────────────────

function getPositionInfo(pos: string | null) {
  if (!pos) return { label: 'N/A', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' }

  const upper = pos.toUpperCase()
  if (upper.includes('G') && (upper.length <= 3 || upper.includes('GOAL') || upper.includes('KEEP')))
    return { label: 'Goalkeeper', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
  if (upper.includes('D') && (upper.length <= 3 || upper.includes('DEF') || upper.includes('BACK')))
    return { label: 'Defender', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' }
  if (upper.includes('M') && (upper.length <= 3 || upper.includes('MID')))
    return { label: 'Midfielder', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' }
  if (upper.includes('F') && (upper.length <= 3 || upper.includes('FORW') || upper.includes('STRI') || upper.includes('ATT')))
    return { label: 'Forward', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' }

  return { label: pos, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' }
}

// ──────────────────────────────────────────────
// Loading Skeleton
// ──────────────────────────────────────────────

function PlayerDetailSkeleton() {
  return (
    <div className="min-h-screen bg-deep-900 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Player Hero */}
      <div className="px-6 py-8 flex flex-col items-center gap-4">
        <Skeleton className="w-28 h-28 rounded-full" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Stats Grid */}
      <div className="px-6 grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Performance Section */}
      <div className="px-6 mt-8 space-y-4">
        <Skeleton className="h-6 w-40" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Main Player Detail Page
// ──────────────────────────────────────────────

export default function PlayerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const playerId = params.id as string

  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (!playerId) return

    let cancelled = false
    const loadPlayer = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/players/${playerId}`)
        if (!res.ok) {
          if (res.status === 404) throw new Error('Pemain tidak ditemukan')
          throw new Error('Gagal memuat data pemain')
        }
        const data = await res.json()
        if (!cancelled) setPlayer(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadPlayer()
    return () => { cancelled = true }
  }, [playerId])

  if (loading) return <PlayerDetailSkeleton />

  if (error || !player) {
    return (
      <div className="min-h-screen bg-deep-900 flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-6xl opacity-20">⚽</div>
        <p className="text-gray-500 dark:text-gray-400 text-center">{error || 'Pemain tidak ditemukan'}</p>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon/10 text-neon border border-neon/20 hover:bg-neon/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </button>
      </div>
    )
  }

  const posInfo = getPositionInfo(player.position)
  const stats = player.statistics

  // Calculate max values for performance bars
  const maxGoals = Math.max(stats?.goals || 0, 20)
  const maxAssists = Math.max(stats?.assists || 0, 10)
  const maxAppearances = Math.max(stats?.appearances || 0, 38)
  const maxMinutes = Math.max(stats?.minutes || 0, 3000)

  return (
    <div className="min-h-screen bg-deep-900 flex flex-col">
      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-white/5 border-b border-gray-200 dark:border-white/5"
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3 p-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate">{player.name}</h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">Profil Pemain</p>
          </div>
          {player.team && (
            <img
              src={player.team.logo}
              alt={player.team.name}
              className="w-8 h-8 rounded-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
        </div>
      </motion.header>

      <main className="flex-1 max-w-3xl mx-auto w-full pb-12">
        {/* ── Player Hero ── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative px-6 pt-8 pb-6"
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${posInfo.color}12 0%, transparent 70%)`,
            }}
          />

          <div className="relative flex flex-col items-center text-center">
            {/* Player Photo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              className="relative mb-4"
            >
              <div
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden"
                style={{
                  border: `3px solid ${posInfo.color}`,
                  boxShadow: `0 0 30px ${posInfo.color}30, 0 0 60px ${posInfo.color}15`,
                }}
              >
                {player.photo && !imgError ? (
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="w-full h-full object-cover bg-gray-200 dark:bg-deep-700"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: `${posInfo.color}20` }}
                  >
                    <User className="w-12 h-12" style={{ color: posInfo.color }} />
                  </div>
                )}
              </div>

              {/* Rating Badge */}
              {stats?.rating && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 280 }}
                  className="absolute -bottom-1 -right-1 w-11 h-11 rounded-full flex items-center justify-center border-2 border-white dark:border-deep-900 shadow-lg font-black text-white text-sm tabular-nums"
                  style={{
                    backgroundColor: parseFloat(stats.rating) >= 7 ? '#22c55e' : parseFloat(stats.rating) >= 6 ? '#f59e0b' : '#ef4444',
                  }}
                >
                  {parseFloat(stats.rating).toFixed(1)}
                </motion.div>
              )}
            </motion.div>

            {/* Name */}
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1"
            >
              {player.name}
            </motion.h1>

            {/* Team */}
            {player.team && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex items-center gap-2 mb-3"
              >
                <img
                  src={player.team.logo}
                  alt=""
                  className="w-5 h-5 rounded-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{player.team.name}</span>
              </motion.div>
            )}

            {/* Position Badge */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
              style={{
                backgroundColor: posInfo.bg,
                color: posInfo.color,
                borderColor: `${posInfo.color}30`,
              }}
            >
              <Shield className="w-3.5 h-3.5" />
              {posInfo.label}
            </motion.div>
          </div>
        </motion.section>

        {/* ── Physical Stats Grid (Glassmorphism) ── */}
        <section className="px-6 mt-2">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4"
          >
            Data Fisik
          </motion.h2>

          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={User}
              label="Usia"
              value={player.age ? `${player.age} tahun` : '-'}
              delay={0.35}
              accent={posInfo.color}
            />
            <StatCard
              icon={Shield}
              label="Posisi"
              value={posInfo.label}
              delay={0.4}
              accent={posInfo.color}
            />
            <StatCard
              icon={Ruler}
              label="Tinggi"
              value={player.height || '-'}
              delay={0.45}
              accent="#22c55e"
            />
            <StatCard
              icon={Weight}
              label="Berat"
              value={player.weight || '-'}
              delay={0.5}
              accent="#f59e0b"
            />
          </div>

          {/* Additional Info Row */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <StatCard
              icon={Flag}
              label="Kebangsaan"
              value={player.nationality || '-'}
              delay={0.55}
              accent="#8b5cf6"
            />
            <StatCard
              icon={Calendar}
              label="Tanggal Lahir"
              value={player.birth?.date
                ? new Date(player.birth.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '-'}
              delay={0.6}
              accent="#06b6d4"
            />
          </div>
        </section>

        {/* ── Performance Stats ── */}
        {stats && (
          <section className="px-6 mt-8">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-neon" />
              Statistik Musim 2024/25
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5 }}
              className="glass-card p-5 sm:p-6 space-y-5"
            >
              <PerformanceBar label="Penampilan" value={stats.appearances} max={maxAppearances} delay={0.7} />
              <PerformanceBar label="Menit Bermain" value={stats.minutes} max={maxMinutes} delay={0.75} />
              <PerformanceBar label="Gol" value={stats.goals} max={maxGoals} delay={0.8} />
              <PerformanceBar label="Assist" value={stats.assists} max={maxAssists} delay={0.85} />

              {/* Cards row */}
              <div className="flex items-center gap-6 pt-2 border-t border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-4 rounded-sm bg-yellow-400 border border-yellow-600" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Kartu Kuning</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{stats.yellowCards}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-4 rounded-sm bg-red-500 border border-red-700" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Kartu Merah</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{stats.redCards}</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="glass-card p-3 sm:p-4 text-center"
              >
                <Target className="w-4 h-4 mx-auto mb-1.5 text-neon" />
                <p className="text-lg font-black text-gray-900 dark:text-white tabular-nums">{stats.goals}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">Gol</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.95 }}
                className="glass-card p-3 sm:p-4 text-center"
              >
                <Award className="w-4 h-4 mx-auto mb-1.5 text-neon" />
                <p className="text-lg font-black text-gray-900 dark:text-white tabular-nums">{stats.assists}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">Assist</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="glass-card p-3 sm:p-4 text-center"
              >
                <Activity className="w-4 h-4 mx-auto mb-1.5 text-neon" />
                <p className="text-lg font-black text-gray-900 dark:text-white tabular-nums">{stats.appearances}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">Main</p>
              </motion.div>
            </div>
          </section>
        )}

        {/* ── League Info ── */}
        {player.league && (
          <section className="px-6 mt-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="glass-card p-4 flex items-center gap-3"
            >
              <img
                src={player.league.logo}
                alt={player.league.name}
                className="w-10 h-10 rounded-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{player.league.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{player.league.country}</p>
              </div>
            </motion.div>
          </section>
        )}

        {/* ── Data Source Badge ── */}
        {player.source === 'mock' && (
          <section className="px-6 mt-6">
            <div className="text-center">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5">
                ⚠️ Data demo — Set FOOTBALL_API_KEY untuk data pemain asli
              </span>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
