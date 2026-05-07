'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface PitchPlayerEvent {
  type: string
  detail: string
  time: number
}

interface PitchPlayer {
  id: number
  name: string
  number: number
  position: string // G, D, M, F, SUB
  grid: string | null // "col:row" from API-Football (e.g. "1:1", "2:3")
  rating: number | null
  photo: string
  events: PitchPlayerEvent[]
}

interface TeamLineup {
  team: { id: number; name: string; logo: string }
  coach: { id: number; name: string; photo: string }
  formation: string
  startXI: PitchPlayer[]
  substitutes: PitchPlayer[]
}

export interface PitchViewProps {
  homeLineup: TeamLineup
  awayLineup: TeamLineup
  homeScore: number
  awayScore: number
  homeTeam: string
  awayTeam: string
  homeLogo: string
  awayLogo: string
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

type PositionCategory = 'G' | 'D' | 'M' | 'F'

const POSITION_COLORS: Record<PositionCategory, { main: string; glow: string; bg: string }> = {
  G: { main: '#eab308', glow: 'rgba(234, 179, 8, 0.4)', bg: 'rgba(234, 179, 8, 0.12)' },
  D: { main: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', bg: 'rgba(59, 130, 246, 0.12)' },
  M: { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)', bg: 'rgba(34, 197, 94, 0.12)' },
  F: { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)', bg: 'rgba(239, 68, 68, 0.12)' },
}

const POSITION_LABELS: Record<PositionCategory, string> = {
  G: 'GK',
  D: 'DEF',
  M: 'MID',
  F: 'FWD',
}

function categorizePosition(pos: string): PositionCategory {
  const upper = pos.toUpperCase()
  if (upper.startsWith('G')) return 'G'
  if (upper.startsWith('D')) return 'D'
  if (upper.startsWith('M')) return 'M'
  return 'F'
}

interface ComputedPosition {
  x: number // 0-100 percent
  y: number // 0-100 percent
}

/**
 * Parse the API-Football grid string ("line:positionWithinLine")
 * and map it to pitch coordinates.
 */
function computePlayerPosition(
  player: PitchPlayer,
  side: 'home' | 'away',
  allPlayers: PitchPlayer[],
): ComputedPosition {
  if (player.grid) {
    const parts = player.grid.split(':')
    const line = parseInt(parts[0], 10)
    const sameLine = allPlayers.filter((p) => {
      if (!p.grid) return false
      return parseInt(p.grid.split(':')[0], 10) === line
    })
    const countInLine = sameLine.length

    const sorted = [...sameLine].sort(
      (a, b) => parseInt(a.grid!.split(':')[1], 10) - parseInt(b.grid!.split(':')[1], 10),
    )
    const indexInLine = sorted.findIndex((p) => p.id === player.id)
    const x = ((indexInLine + 1) / (countInLine + 1)) * 100

    const yMapHome: Record<number, number> = { 1: 88, 2: 72, 3: 52, 4: 30, 5: 15 }
    const yMapAway: Record<number, number> = { 1: 12, 2: 28, 3: 48, 4: 70, 5: 85 }
    const yMap = side === 'home' ? yMapHome : yMapAway
    const y = yMap[line] ?? (side === 'home' ? 52 : 48)

    return { x, y }
  }

  // Fallback: position by category
  const cat = categorizePosition(player.position)
  const lineMap: Record<PositionCategory, number> = { G: 1, D: 2, M: 3, F: 4 }
  const line = lineMap[cat] ?? 3

  const sameCat = allPlayers.filter((p) => categorizePosition(p.position) === cat)
  const countInLine = sameCat.length
  const indexInLine = sameCat.findIndex((p) => p.id === player.id)
  const x = countInLine > 0 ? ((indexInLine + 1) / (countInLine + 1)) * 100 : 50

  const yMapHome: Record<number, number> = { 1: 88, 2: 72, 3: 52, 4: 30 }
  const yMapAway: Record<number, number> = { 1: 12, 2: 28, 3: 48, 4: 70 }
  const yMap = side === 'home' ? yMapHome : yMapAway
  const y = yMap[line] ?? (side === 'home' ? 52 : 48)

  return { x, y }
}

// ──────────────────────────────────────────────
// PlayerNode Component (Photo + Number + Name)
// ──────────────────────────────────────────────

interface PlayerNodeProps {
  player: PitchPlayer
  pos: ComputedPosition
  index: number
  isHome: boolean
}

function PlayerNode({ player, pos, index, isHome }: PlayerNodeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const cat = categorizePosition(player.position)
  const colors = POSITION_COLORS[cat]
  const lastName = player.name.split(' ').pop() || player.name

  const hasGoal = player.events.some(
    (e) =>
      e.type.toLowerCase() === 'goal' ||
      e.detail.toLowerCase() === 'goal' ||
      e.detail.toLowerCase() === 'penalty' ||
      e.detail.toLowerCase() === 'own goal',
  )
  const hasYellow = player.events.some((e) => e.detail.toLowerCase() === 'yellow card')
  const hasRed = player.events.some((e) => e.detail.toLowerCase() === 'red card')
  const goalEvents = player.events.filter(
    (e) =>
      e.type.toLowerCase() === 'goal' ||
      e.detail.toLowerCase() === 'goal' ||
      e.detail.toLowerCase() === 'penalty' ||
      e.detail.toLowerCase() === 'own goal',
  )

  const hasPhoto = player.photo && player.photo.length > 10

  return (
    <motion.div
      className="absolute flex flex-col items-center z-10"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0, scale: 0, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: 0.3 + index * 0.035,
        type: 'spring',
        stiffness: 280,
        damping: 18,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Event indicators above player */}
      <div className="absolute -top-2 flex gap-0.5 z-20">
        {hasGoal &&
          goalEvents.map((e, i) => (
            <motion.span
              key={i}
              className="text-[10px] leading-none drop-shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 + index * 0.035 }}
            >
              ⚽
            </motion.span>
          ))}
        {hasYellow && (
          <motion.span
            className="block w-[8px] h-[10px] rounded-[1px] bg-yellow-400 border border-yellow-600 shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7 + index * 0.035 }}
          />
        )}
        {hasRed && (
          <motion.span
            className="block w-[8px] h-[10px] rounded-[1px] bg-red-500 border border-red-700 shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7 + index * 0.035 }}
          />
        )}
      </div>

      {/* Player Avatar Container */}
      <motion.div
        className="relative group cursor-pointer"
        animate={{
          scale: isHovered ? 1.15 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Glow ring on hover */}
        <motion.div
          className="absolute inset-[-3px] rounded-full"
          animate={{
            boxShadow: isHovered
              ? `0 0 16px ${colors.glow}, 0 0 32px ${colors.glow}`
              : `0 0 6px ${colors.glow}`,
          }}
          transition={{ duration: 0.3 }}
          style={{
            background: isHovered ? `linear-gradient(135deg, ${colors.main}60, transparent)` : 'transparent',
          }}
        />

        {/* Player Photo Circle */}
        <div
          className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden"
          style={{
            border: `2.5px solid ${colors.main}`,
            boxShadow: `0 0 8px ${colors.glow}`,
            background: colors.bg,
          }}
        >
          {hasPhoto ? (
            <img
              src={player.photo}
              alt={player.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          {/* Fallback initials */}
          <div
            className={`absolute inset-0 flex items-center justify-center ${hasPhoto ? 'hidden' : ''}`}
            style={{ backgroundColor: `${colors.main}30` }}
          >
            <span className="text-[10px] sm:text-xs font-bold" style={{ color: colors.main }}>
              {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
        </div>

        {/* Number Badge */}
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-lg z-20 border-2 border-white dark:border-gray-900"
          style={{ backgroundColor: colors.main }}
        >
          <span className="text-[9px] sm:text-[10px] font-black text-white leading-none">
            {player.number}
          </span>
        </div>
      </motion.div>

      {/* Player Name */}
      <div className="mt-1 text-center max-w-[64px] sm:max-w-[72px]">
        <span className="text-[9px] sm:text-[10px] font-semibold text-white leading-tight block truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {lastName}
        </span>
      </div>

      {/* ── Hover Stats Card ── */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`absolute z-30 w-48 rounded-xl p-3 shadow-2xl border pointer-events-none ${
              isHome
                ? 'top-full mt-2 left-1/2 -translate-x-1/2'
                : 'bottom-full mb-2 left-1/2 -translate-x-1/2'
            }`}
            style={{
              background: 'linear-gradient(135deg, rgba(15, 15, 26, 0.97), rgba(22, 22, 37, 0.97))',
              borderColor: `${colors.main}40`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 16px ${colors.glow}`,
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Stats Header */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0" style={{ border: `2px solid ${colors.main}` }}>
                {hasPhoto ? (
                  <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${colors.main}30` }}>
                    <span className="text-[10px] font-bold" style={{ color: colors.main }}>
                      {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-white truncate">{player.name}</p>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${colors.main}20`, color: colors.main }}
                  >
                    {POSITION_LABELS[cat]}
                  </span>
                  <span className="text-[10px] text-gray-400">#{player.number}</span>
                </div>
              </div>
              {/* Rating */}
              {player.rating && (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: player.rating >= 7 ? 'rgba(34, 197, 94, 0.15)' : player.rating >= 6 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${player.rating >= 7 ? 'rgba(34, 197, 94, 0.3)' : player.rating >= 6 ? 'rgba(234, 179, 8, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  }}
                >
                  <span
                    className="text-[11px] font-black tabular-nums"
                    style={{ color: player.rating >= 7 ? '#22c55e' : player.rating >= 6 ? '#eab308' : '#ef4444' }}
                  >
                    {player.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Events Summary */}
            {player.events.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2 border-t border-white/5">
                {goalEvents.map((e, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 text-[9px] bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-md font-medium"
                  >
                    ⚽ {e.time}&apos;
                  </span>
                ))}
                {hasYellow && (
                  <span className="flex items-center gap-1 text-[9px] bg-yellow-500/15 text-yellow-400 px-1.5 py-0.5 rounded-md font-medium">
                    🟨 Kartu Kuning
                  </span>
                )}
                {hasRed && (
                  <span className="flex items-center gap-1 text-[9px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-md font-medium">
                    🟥 Kartu Merah
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ──────────────────────────────────────────────
// SVG Pitch Lines (Enhanced Stadium Look)
// ──────────────────────────────────────────────

function PitchLines() {
  const lineColor = 'var(--pitch-line-color, rgba(255,255,255,0.35))'
  const accentColor = 'var(--pitch-line-accent, rgba(255,255,255,0.5))'

  return (
    <svg
      viewBox="0 0 100 66.67"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer glow */}
      <rect
        x="0.5"
        y="0.5"
        width="99"
        height="65.67"
        fill="none"
        stroke={accentColor}
        strokeWidth="0.5"
        rx="0.5"
        opacity="0.3"
      />

      {/* Pitch outline */}
      <rect
        x="2"
        y="2"
        width="96"
        height="62.67"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.3"
      />

      {/* Halfway line */}
      <line
        x1="50"
        y1="2"
        x2="50"
        y2="64.67"
        stroke={lineColor}
        strokeWidth="0.3"
      />

      {/* Center circle */}
      <circle
        cx="50"
        cy="33.33"
        r="9"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.3"
      />
      {/* Center spot */}
      <circle
        cx="50"
        cy="33.33"
        r="0.6"
        fill={accentColor}
      />

      {/* ── Top penalty area (away GK) ── */}
      <rect
        x="18"
        y="2"
        width="64"
        height="13"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.3"
      />
      {/* Top 6-yard box */}
      <rect
        x="32"
        y="2"
        width="36"
        height="5"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.3"
      />
      {/* Top penalty spot */}
      <circle cx="50" cy="10.5" r="0.4" fill={accentColor} />
      {/* Top penalty arc */}
      <path
        d="M 43 15 A 9 9 0 0 0 57 15"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.3"
      />
      {/* Top goal */}
      <rect
        x="40"
        y="0"
        width="20"
        height="2"
        fill="none"
        stroke={accentColor}
        strokeWidth="0.25"
        rx="0.5"
      />

      {/* ── Bottom penalty area (home GK) ── */}
      <rect
        x="18"
        y="51.67"
        width="64"
        height="13"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.3"
      />
      {/* Bottom 6-yard box */}
      <rect
        x="32"
        y="59.67"
        width="36"
        height="5"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.3"
      />
      {/* Bottom penalty spot */}
      <circle cx="50" cy="56.17" r="0.4" fill={accentColor} />
      {/* Bottom penalty arc */}
      <path
        d="M 43 51.67 A 9 9 0 0 1 57 51.67"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.3"
      />
      {/* Bottom goal */}
      <rect
        x="40"
        y="64.67"
        width="20"
        height="2"
        fill="none"
        stroke={accentColor}
        strokeWidth="0.25"
        rx="0.5"
      />

      {/* ── Corner arcs ── */}
      <path d="M 2 4.5 A 2.5 2.5 0 0 0 4.5 2" fill="none" stroke={lineColor} strokeWidth="0.25" />
      <path d="M 95.5 2 A 2.5 2.5 0 0 0 98 4.5" fill="none" stroke={lineColor} strokeWidth="0.25" />
      <path d="M 2 62.17 A 2.5 2.5 0 0 1 4.5 64.67" fill="none" stroke={lineColor} strokeWidth="0.25" />
      <path d="M 95.5 64.67 A 2.5 2.5 0 0 1 98 62.17" fill="none" stroke={lineColor} strokeWidth="0.25" />
    </svg>
  )
}

// ──────────────────────────────────────────────
// Formation Badge
// ──────────────────────────────────────────────

function FormationBadge({ formation }: { formation: string }) {
  return (
    <span className="text-neon text-xs sm:text-sm font-mono font-semibold tracking-wider">
      {formation}
    </span>
  )
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

export default function PitchView({
  homeLineup,
  awayLineup,
  homeScore,
  awayScore,
  homeTeam,
  awayTeam,
  homeLogo,
  awayLogo,
}: PitchViewProps) {
  // Compute positions for all players
  const homePlayers = useMemo(
    () =>
      homeLineup.startXI.map((p) => ({
        player: p,
        pos: computePlayerPosition(p, 'home', homeLineup.startXI),
      })),
    [homeLineup.startXI],
  )

  const awayPlayers = useMemo(
    () =>
      awayLineup.startXI.map((p) => ({
        player: p,
        pos: computePlayerPosition(p, 'away', awayLineup.startXI),
      })),
    [awayLineup.startXI],
  )

  return (
    <AnimatePresence>
      <motion.div
        className="w-full max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* ── Header: Teams + Score + Formation ── */}
        <div className="flex items-center justify-between px-1 sm:px-4 mb-3 sm:mb-4">
          {/* Home team */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
            <div className="text-right">
              <p className="text-gray-900 dark:text-white text-xs sm:text-sm font-bold leading-tight truncate max-w-[100px] sm:max-w-[180px]">
                {homeTeam}
              </p>
              <FormationBadge formation={homeLineup.formation} />
            </div>
            <img
              src={homeLogo}
              alt={homeTeam}
              className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>

          {/* Score */}
          <div className="flex items-center gap-2 sm:gap-3 mx-2 sm:mx-4 flex-shrink-0">
            <span className="text-gray-900 dark:text-white text-xl sm:text-2xl lg:text-3xl font-black tabular-nums">
              {homeScore}
            </span>
            <span className="text-gray-400 dark:text-gray-500 text-sm sm:text-lg font-light">
              –
            </span>
            <span className="text-gray-900 dark:text-white text-xl sm:text-2xl lg:text-3xl font-black tabular-nums">
              {awayScore}
            </span>
          </div>

          {/* Away team */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-start">
            <img
              src={awayLogo}
              alt={awayTeam}
              className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div>
              <p className="text-gray-900 dark:text-white text-xs sm:text-sm font-bold leading-tight truncate max-w-[100px] sm:max-w-[180px]">
                {awayTeam}
              </p>
              <FormationBadge formation={awayLineup.formation} />
            </div>
          </div>
        </div>

        {/* ── Pitch Surface ── */}
        <div
          className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl"
          style={{
            background: 'linear-gradient(180deg, #14532d 0%, #166534 15%, #15803d 30%, #166534 50%, #15803d 65%, #166534 80%, #14532d 100%)',
            boxShadow: `
              0 0 40px rgba(0, 0, 0, 0.4),
              0 4px 20px rgba(0, 0, 0, 0.3),
              inset 0 0 60px rgba(0, 0, 0, 0.2)
            `,
          }}
        >
          {/* Grass stripe pattern */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(
                180deg,
                transparent,
                transparent 8.33%,
                rgba(255,255,255,0.03) 8.33%,
                rgba(255,255,255,0.03) 16.66%
              )`,
            }}
          />

          {/* Grass texture (subtle noise) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Pitch lines */}
          <PitchLines />

          {/* Aspect ratio wrapper */}
          <div className="relative w-full" style={{ paddingBottom: '66.67%' }} />

          {/* ── Player Overlay ── */}
          <div className="absolute inset-0">
            {/* Away players (top half) */}
            {awayPlayers.map(({ player, pos }, idx) => (
              <PlayerNode
                key={player.id}
                player={player}
                pos={pos}
                index={idx}
                isHome={false}
              />
            ))}

            {/* Home players (bottom half) */}
            {homePlayers.map(({ player, pos }, idx) => (
              <PlayerNode
                key={player.id}
                player={player}
                pos={pos}
                index={awayPlayers.length + idx}
                isHome={true}
              />
            ))}
          </div>

          {/* Vignette + atmosphere */}
          <div
            className="absolute inset-0 pointer-events-none rounded-xl sm:rounded-2xl"
            style={{
              boxShadow: 'inset 0 0 80px rgba(0,0,0,0.35)',
            }}
          />

          {/* Stadium light effect (top) */}
          <div
            className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)',
            }}
          />
        </div>

        {/* ── Footer: Coaches ── */}
        <div className="flex items-center justify-between px-2 sm:px-4 mt-3 sm:mt-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            <span className="text-gray-400 dark:text-gray-500 text-[10px] sm:text-xs font-medium">
              {homeLineup.coach.name}
            </span>
          </div>
          <span className="text-gray-300 dark:text-gray-600 text-[9px] sm:text-[10px] uppercase tracking-widest font-mono">
            Manager
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-gray-400 dark:text-gray-500 text-[10px] sm:text-xs font-medium">
              {awayLineup.coach.name}
            </span>
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
