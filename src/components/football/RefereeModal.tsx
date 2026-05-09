'use client'

import { useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { X, Shield, MapPin, Calendar, TrendingUp, Award, Flag, Star, ChevronRight } from 'lucide-react'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface RefereeData {
  name: string
  photo: string
  age: number
  nationality: string
  countryFlag: string // emoji flag or ISO code
  residence: string
  federation: string
  rating: number // 1-10
  totalMatches: number
  yellowCards: number
  redCards: number
  penalties: number
  varReviews: number
  foulsPerGame: number
  cardsPerGame: number
  seasonsActive: number
  debutYear: number
  biggestMatch: string
  specialties: string[]
}

export interface RefereeModalProps {
  referee: RefereeData | null
  open: boolean
  onClose: () => void
}

// ──────────────────────────────────────────────
// Hexagonal SVG Pattern (football pattern)
// ──────────────────────────────────────────────

function HexPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <pattern id="hexPattern" x="0" y="0" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
          {/* Pentagon / Hexagon football pattern */}
          <path d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100" fill="none" stroke="var(--c-neon)" strokeWidth="0.5" opacity="0.06" />
          <path d="M28 66L0 50" fill="none" stroke="var(--c-neon)" strokeWidth="0.3" opacity="0.04" />
          <path d="M28 66L56 50" fill="none" stroke="var(--c-neon)" strokeWidth="0.3" opacity="0.04" />
        </pattern>
        <radialGradient id="hexGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="var(--c-neon)" stopOpacity="0.03" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexPattern)" />
      <rect width="100%" height="100%" fill="url(#hexGlow)" />
    </svg>
  )
}

// ──────────────────────────────────────────────
// Stat Ring (Circular Progress)
// ──────────────────────────────────────────────

function StatRing({ value, max, size = 64, strokeWidth = 4, label, color }: {
  value: number; max: number; size?: number; strokeWidth?: number; label: string; color: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min((value / max) * 100, 100)

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--glass-border)" strokeWidth={strokeWidth} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (progress / 100) * circumference }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">
            {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
          </span>
        </div>
      </div>
      <span className="text-[9px] sm:text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  )
}

// ──────────────────────────────────────────────
// Stat Bar (Horizontal Progress)
// ──────────────────────────────────────────────

function StatBar({ label, value, max, color, icon: Icon, delay = 0 }: {
  label: string; value: number; max: number; color: string; icon?: React.ElementType; delay?: number
}) {
  const progress = Math.min((value / max) * 100, 100)

  return (
    <motion.div
      className="space-y-1.5"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.8 + delay }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3 h-3" style={{ color }} />}
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">{label}</span>
        </div>
        <span className="text-[11px] font-black text-gray-900 dark:text-white tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--glass-bg)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.9 + delay }}
        />
      </div>
    </motion.div>
  )
}

// ──────────────────────────────────────────────
// Specialty Tag
// ──────────────────────────────────────────────

function SpecialtyTag({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border"
      style={{
        background: 'var(--c-neon-glow)',
        color: 'var(--c-neon)',
        borderColor: 'var(--c-neon)',
        borderWidth: '1px',
        opacity: 0.5,
      }}
      initial={{ opacity: 0, scale: 0.8, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 1.2 + delay }}
    >
      <Star className="w-2.5 h-2.5" />
      {label}
    </motion.span>
  )
}

// ──────────────────────────────────────────────
// Main Referee Modal Component
// ──────────────────────────────────────────────

export default function RefereeModal({ referee, open, onClose }: RefereeModalProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), { stiffness: 150, damping: 20 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), { stiffness: 150, damping: 20 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }, [mouseX, mouseY])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
  }, [mouseX, mouseY])

  // ESC to close
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!referee) return null

  const neonColor = 'var(--c-neon)'

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* ── Backdrop: Blur + Dark Overlay + Color Shift ── */}
          <motion.div
            className="absolute inset-0"
            style={{
              backdropFilter: 'blur(16px) saturate(0.3) brightness(0.2)',
              WebkitBackdropFilter: 'blur(16px) saturate(0.3) brightness(0.2)',
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onClick={onClose}
          />

          {/* ── Ambient light rays from modal ── */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              background: 'radial-gradient(ellipse at center, var(--c-neon-glow) 0%, transparent 60%)',
              opacity: 0.15,
            }}
          />

          {/* ── Modal Card: FIFA-style Digital ID ── */}
          <motion.div
            className="relative w-full max-w-md sm:max-w-lg z-10 cursor-default select-none"
            initial={{ opacity: 0, scale: 0.6, rotateX: 15, rotateY: -5, y: 40 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, rotateY: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, rotateX: -8, rotateY: 3, y: 30 }}
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1], // custom cubic-bezier: fast start, smooth settle
            }}
            style={{
              perspective: 1200,
              rotateX,
              rotateY,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Outer glow border */}
            <div
              className="absolute -inset-[2px] rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${neonColor}, transparent 40%, transparent 60%, ${neonColor})`,
                opacity: 0.5,
                filter: `blur(1px)`,
              }}
            />
            <div
              className="absolute -inset-[1px] rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${neonColor}, transparent 30%, transparent 70%, ${neonColor})`,
                opacity: 0.25,
              }}
            />

            {/* Card body */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(165deg, rgba(15,15,26,0.95) 0%, rgba(10,10,18,0.98) 50%, rgba(15,15,26,0.95) 100%)',
                boxShadow: `
                  0 0 40px var(--c-neon-glow),
                  0 0 80px rgba(0,0,0,0.5),
                  0 25px 60px rgba(0,0,0,0.6),
                  inset 0 1px 0 rgba(255,255,255,0.05)
                `,
              }}
            >
              {/* Hex pattern overlay */}
              <HexPattern />

              {/* Scanline effect */}
              <div className="scanline absolute inset-0 pointer-events-none" />

              {/* Top edge glow line */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${neonColor}, transparent)`,
                  opacity: 0.8,
                }}
              />

              {/* Content */}
              <div className="relative p-5 sm:p-6">
                {/* ── Close Button ── */}
                <motion.button
                  onClick={onClose}
                  className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4 text-gray-400" />
                </motion.button>

                {/* ── Header: Badge + Role ── */}
                <motion.div
                  className="flex items-center justify-between mb-5"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" style={{ color: neonColor }} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: neonColor }}>
                      Match Official
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{
                    background: `${neonColor}15`,
                    border: `1px solid ${neonColor}30`,
                  }}>
                    <span className="text-[10px] font-black tabular-nums" style={{ color: neonColor }}>
                      {referee.rating.toFixed(1)}
                    </span>
                    <span className="text-[8px] font-medium text-gray-500 dark:text-gray-400">RATING</span>
                  </div>
                </motion.div>

                {/* ── Profile Section ── */}
                <div className="flex items-start gap-4 sm:gap-5 mb-6">
                  {/* Avatar */}
                  <motion.div
                    className="relative shrink-0"
                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.4, type: 'spring', stiffness: 200 }}
                  >
                    {/* Avatar glow ring */}
                    <div
                      className="absolute -inset-[3px] rounded-2xl"
                      style={{
                        background: `conic-gradient(from 0deg, ${neonColor}, transparent 25%, transparent 50%, ${neonColor} 75%, transparent)`,
                        opacity: 0.6,
                        filter: 'blur(2px)',
                        animation: 'spin 8s linear infinite',
                      }}
                    />
                    <div
                      className="absolute -inset-[1px] rounded-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${neonColor}, transparent)`,
                        opacity: 0.4,
                      }}
                    />

                    {/* Photo */}
                    <div className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden" style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                    }}>
                      {referee.photo ? (
                        <img
                          src={referee.photo}
                          alt={referee.name}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl sm:text-4xl font-black" style={{ color: neonColor }}>
                            {referee.name.charAt(0)}
                          </span>
                        </div>
                      )}

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                      {/* Country flag badge */}
                      <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-sm" style={{
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(8px)',
                      }}>
                        {referee.countryFlag}
                      </div>
                    </div>
                  </motion.div>

                  {/* Name + Info */}
                  <motion.div
                    className="flex-1 min-w-0 pt-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <h2 className="text-lg sm:text-xl font-black text-white leading-tight mb-1.5 tracking-tight">
                      {referee.name}
                    </h2>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Flag className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{referee.nationality}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{referee.residence}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                          Active since {referee.debutYear} · {referee.seasonsActive} seasons
                        </span>
                      </div>
                    </div>

                    {/* Federation badge */}
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-md" style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <Award className="w-3 h-3" style={{ color: neonColor }} />
                      <span className="text-[10px] font-semibold text-gray-300 dark:text-gray-400">{referee.federation}</span>
                    </div>
                  </motion.div>
                </div>

                {/* ── Divider ── */}
                <motion.div
                  className="h-px mb-5"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  style={{
                    background: `linear-gradient(90deg, transparent, ${neonColor}40, transparent)`,
                  }}
                />

                {/* ── Stats Rings Row ── */}
                <motion.div
                  className="flex items-center justify-around mb-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <StatRing value={referee.totalMatches} max={500} size={68} strokeWidth={4} label="Matches" color="#22c55e" />
                  <StatRing value={referee.yellowCards} max={200} size={68} strokeWidth={4} label="Yellows" color="#eab308" />
                  <StatRing value={referee.redCards} max={50} size={68} strokeWidth={4} label="Reds" color="#ef4444" />
                  <StatRing value={referee.penalties} max={60} size={68} strokeWidth={4} label="Penalties" color={neonColor} />
                </motion.div>

                {/* ── Stat Bars ── */}
                <div className="space-y-3 mb-5">
                  <StatBar
                    label="Fouls per Game"
                    value={referee.foulsPerGame}
                    max={30}
                    color="#f97316"
                    icon={TrendingUp}
                    delay={0}
                  />
                  <StatBar
                    label="Cards per Game"
                    value={referee.cardsPerGame}
                    max={8}
                    color="#ef4444"
                    icon={Shield}
                    delay={0.05}
                  />
                  <StatBar
                    label="VAR Reviews"
                    value={referee.varReviews}
                    max={50}
                    color={neonColor}
                    icon={Shield}
                    delay={0.1}
                  />
                </div>

                {/* ── Divider ── */}
                <motion.div
                  className="h-px mb-4"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  style={{
                    background: `linear-gradient(90deg, transparent, ${neonColor}40, transparent)`,
                  }}
                />

                {/* ── Specialties ── */}
                <motion.div
                  className="flex flex-wrap gap-1.5 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.1 }}
                >
                  {referee.specialties.map((s, i) => (
                    <SpecialtyTag key={s} label={s} delay={i * 0.08} />
                  ))}
                </motion.div>

                {/* ── Biggest Match ── */}
                <motion.div
                  className="flex items-center gap-2 p-3 rounded-xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.3 }}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <Trophy className="w-4 h-4 shrink-0" style={{ color: neonColor }} />
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: neonColor, opacity: 0.7 }}>
                      Biggest Match
                    </span>
                    <span className="text-[11px] font-semibold text-gray-300 dark:text-gray-400 truncate block">
                      {referee.biggestMatch}
                    </span>
                  </div>
                </motion.div>

                {/* ── Bottom: FIFA-style card chip ── */}
                <motion.div
                  className="flex items-center justify-center mt-5 gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.4 }}
                >
                  {/* Chip decoration */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div className="w-5 h-4 rounded-sm" style={{
                      background: `linear-gradient(135deg, ${neonColor}30, ${neonColor}10)`,
                      border: `1px solid ${neonColor}20`,
                    }} />
                    <span className="text-[9px] font-mono font-bold tracking-[0.3em] text-gray-600 dark:text-gray-500 uppercase">
                      FIFA Official
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Bottom edge glow */}
              <div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${neonColor}60, transparent)`,
                  opacity: 0.4,
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ── Inline Trophy Icon ──
function Trophy({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}
