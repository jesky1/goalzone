'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
<<<<<<< HEAD
import { safeSrc } from '@/lib/safe-src'
=======
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0

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
  position: string
  grid: string | null
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

const POSITION_LABELS: Record<PositionCategory, string> = {
  G: 'GK',
  D: 'DEF',
  M: 'MID',
  F: 'FWD',
}

const HOME_COLOR = '#ef4444'
const AWAY_COLOR = '#3b82f6'

function categorizePosition(pos: string): PositionCategory {
  const upper = pos.toUpperCase()
  if (upper.startsWith('G')) return 'G'
  if (upper.startsWith('D')) return 'D'
  if (upper.startsWith('M')) return 'M'
  return 'F'
}

interface ComputedPosition {
  x: number
  y: number
}

/**
 * Parse the API-Football grid string ("line:positionWithinLine")
 * and map it to pitch coordinates with CLEAR team separation.
 *
 * Away team: top 42% of pitch (y: 6% to 44%)
 * Home team: bottom 42% of pitch (y: 56% to 94%)
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

    // AWAY team (top half) - GK at top, forwards near center
    const yMapAway: Record<number, number> = {
      1: 7,   // GK - at the very top
      2: 20,  // DEF - upper area
      3: 33,  // MID - middle-upper
      4: 43,  // FWD - just below center line
      5: 43,
    }
    // HOME team (bottom half) - GK at bottom, forwards near center
    const yMapHome: Record<number, number> = {
      1: 93,  // GK - at the very bottom
      2: 80,  // DEF - lower area
      3: 67,  // MID - middle-lower
      4: 57,  // FWD - just above center line
      5: 57,
    }

    const yMap = side === 'home' ? yMapHome : yMapAway
    const y = yMap[line] ?? (side === 'home' ? 67 : 33)

    return { x, y }
  }

  // Fallback
  const cat = categorizePosition(player.position)
  const lineMap: Record<PositionCategory, number> = { G: 1, D: 2, M: 3, F: 4 }
  const line = lineMap[cat] ?? 3

  const sameCat = allPlayers.filter((p) => categorizePosition(p.position) === cat)
  const countInLine = sameCat.length
  const indexInLine = sameCat.findIndex((p) => p.id === player.id)
  const x = countInLine > 0 ? ((indexInLine + 1) / (countInLine + 1)) * 100 : 50

  const yMapHome: Record<number, number> = { 1: 93, 2: 80, 3: 67, 4: 57 }
  const yMapAway: Record<number, number> = { 1: 7, 2: 20, 3: 33, 4: 43 }
  const yMap = side === 'home' ? yMapHome : yMapAway
  const y = yMap[line] ?? (side === 'home' ? 67 : 33)

  return { x, y }
}

// ──────────────────────────────────────────────
// PlayerNode Component
// ──────────────────────────────────────────────

interface PlayerNodeProps {
  player: PitchPlayer
  pos: ComputedPosition
  index: number
  isHome: boolean
  teamLogo: string
}

function PlayerNode({ player, pos, index, isHome, teamLogo }: PlayerNodeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imgError, setImgError] = useState(false)
  const cat = categorizePosition(player.position)
  const teamColor = isHome ? HOME_COLOR : AWAY_COLOR
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

  const hasPhoto = player.photo && player.photo.length > 10 && !imgError
  const hasTeamLogo = teamLogo && teamLogo.length > 10

  const initials = player.name
    .split(' ')
    .filter(n => n.length > 0 && n[0] === n[0].toUpperCase())
    .map(n => n[0])
    .slice(0, 2)
    .join('')

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
        delay: 0.3 + index * 0.04,
        type: 'spring',
        stiffness: 280,
        damping: 18,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Event indicators above player */}
      <div className="absolute -top-2.5 flex gap-0.5 z-20">
        {hasGoal &&
          goalEvents.map((e, i) => (
            <motion.span
              key={i}
              className="text-[10px] leading-none drop-shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 + index * 0.04 }}
            >
              ⚽
            </motion.span>
          ))}
        {hasYellow && (
          <motion.span
            className="block w-[8px] h-[10px] rounded-[1px] bg-yellow-400 border border-yellow-600 shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7 + index * 0.04 }}
          />
        )}
        {hasRed && (
          <motion.span
            className="block w-[8px] h-[10px] rounded-[1px] bg-red-500 border border-red-700 shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7 + index * 0.04 }}
          />
        )}
      </div>

      {/* Player Avatar */}
      <motion.div
        className="relative group cursor-pointer"
        animate={{
          scale: isHovered ? 1.18 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Glow ring */}
        <motion.div
          className="absolute inset-[-4px] rounded-full"
          animate={{
            boxShadow: isHovered
              ? `0 0 20px ${teamColor}60, 0 0 40px ${teamColor}30`
              : `0 0 8px ${teamColor}40`,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Photo circle */}
        <div
          className="relative w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-full overflow-hidden"
          style={{
            border: `3px solid ${teamColor}`,
            boxShadow: `0 0 12px ${teamColor}30, 0 2px 8px rgba(0,0,0,0.3)`,
          }}
        >
          {/* Layer 1: Player photo */}
          {hasPhoto && (
            <img
<<<<<<< HEAD
              src={safeSrc(player.photo)}
=======
              src={player.photo}
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
              alt={player.name}
              className="absolute inset-0 w-full h-full object-cover bg-gray-800"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          )}

          {/* Layer 2: Team logo fallback (shown when no player photo) */}
<<<<<<< HEAD
          {!hasPhoto && safeSrc(teamLogo) && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm">
              <img
                src={safeSrc(teamLogo)}
=======
          {!hasPhoto && hasTeamLogo && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm">
              <img
                src={teamLogo}
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
                alt={isHome ? 'Home' : 'Away'}
                className="w-[70%] h-[70%] object-contain"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}

          {/* Layer 3: Initials fallback (shown when neither photo nor logo) */}
<<<<<<< HEAD
          {!hasPhoto && !safeSrc(teamLogo) && (
=======
          {!hasPhoto && !hasTeamLogo && (
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                backgroundColor: `${teamColor}25`,
              }}
            >
              <span
                className="text-xs sm:text-sm font-bold drop-shadow-lg"
                style={{ color: teamColor }}
              >
                {initials || '?'}
              </span>
            </div>
          )}
        </div>

        {/* Number badge */}
        <div
          className="absolute -bottom-1 -right-1 w-[22px] h-[22px] sm:w-6 sm:h-6 rounded-full flex items-center justify-center z-20 border-2 border-white dark:border-gray-900 shadow-lg"
          style={{ backgroundColor: teamColor }}
        >
          <span className="text-[9px] sm:text-[10px] font-black text-white leading-none">
            {player.number}
          </span>
        </div>
      </motion.div>

      {/* Player name */}
      <div className="mt-1 text-center">
        <span
          className="text-[9px] sm:text-[10px] font-bold leading-tight block truncate max-w-[60px] sm:max-w-[72px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
          style={{ color: '#ffffff' }}
        >
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
            className={`absolute z-30 w-52 rounded-xl p-3 shadow-2xl border pointer-events-none ${
              isHome
                ? 'top-full mt-2 left-1/2 -translate-x-1/2'
                : 'bottom-full mb-2 left-1/2 -translate-x-1/2'
            }`}
            style={{
              background: 'linear-gradient(135deg, rgba(15, 15, 26, 0.97), rgba(22, 22, 37, 0.97))',
              borderColor: `${teamColor}50`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${teamColor}30`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="relative w-10 h-10 rounded-full overflow-hidden shrink-0"
                style={{ border: `2px solid ${teamColor}` }}
              >
<<<<<<< HEAD
                {safeSrc(player.photo) ? (
                  <img src={safeSrc(player.photo)} alt={player.name} className="w-full h-full object-cover bg-gray-800" />
                ) : safeSrc(teamLogo) ? (
                  <div className="w-full h-full flex items-center justify-center bg-white/10">
                    <img src={safeSrc(teamLogo)} alt="" className="w-[70%] h-[70%] object-contain" />
=======
                {hasPhoto ? (
                  <img src={player.photo} alt={player.name} className="w-full h-full object-cover bg-gray-800" />
                ) : hasTeamLogo ? (
                  <div className="w-full h-full flex items-center justify-center bg-white/10">
                    <img src={teamLogo} alt="" className="w-[70%] h-[70%] object-contain" />
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
                  </div>
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: `${teamColor}25` }}
                  >
                    <span className="text-xs font-bold" style={{ color: teamColor }}>{initials || '?'}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-white truncate">{player.name}</p>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${teamColor}25`, color: teamColor }}
                  >
                    {POSITION_LABELS[cat]}
                  </span>
                  <span className="text-[10px] text-gray-400">#{player.number}</span>
                </div>
              </div>
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
                    🟨 Yellow Card
                  </span>
                )}
                {hasRed && (
                  <span className="flex items-center gap-1 text-[9px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-md font-medium">
                    🟥 Red Card
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
// SVG Pitch Lines
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
      {/* Pitch outline */}
      <rect x="2" y="2" width="96" height="62.67" fill="none" stroke={lineColor} strokeWidth="0.3" />
      {/* Halfway line */}
      <line x1="50" y1="2" x2="50" y2="64.67" stroke={accentColor} strokeWidth="0.35" />
      {/* Center circle */}
      <circle cx="50" cy="33.33" r="9" fill="none" stroke={lineColor} strokeWidth="0.3" />
      <circle cx="50" cy="33.33" r="0.6" fill={accentColor} />

      {/* Top penalty area (away GK) */}
      <rect x="18" y="2" width="64" height="13" fill="none" stroke={lineColor} strokeWidth="0.3" />
      <rect x="32" y="2" width="36" height="5" fill="none" stroke={lineColor} strokeWidth="0.3" />
      <circle cx="50" cy="10.5" r="0.4" fill={accentColor} />
      <path d="M 43 15 A 9 9 0 0 0 57 15" fill="none" stroke={lineColor} strokeWidth="0.3" />
      <rect x="40" y="0" width="20" height="2" fill="none" stroke={accentColor} strokeWidth="0.25" rx="0.5" />

      {/* Bottom penalty area (home GK) */}
      <rect x="18" y="51.67" width="64" height="13" fill="none" stroke={lineColor} strokeWidth="0.3" />
      <rect x="32" y="59.67" width="36" height="5" fill="none" stroke={lineColor} strokeWidth="0.3" />
      <circle cx="50" cy="56.17" r="0.4" fill={accentColor} />
      <path d="M 43 51.67 A 9 9 0 0 1 57 51.67" fill="none" stroke={lineColor} strokeWidth="0.3" />
      <rect x="40" y="64.67" width="20" height="2" fill="none" stroke={accentColor} strokeWidth="0.25" rx="0.5" />

      {/* Corner arcs */}
      <path d="M 2 4.5 A 2.5 2.5 0 0 0 4.5 2" fill="none" stroke={lineColor} strokeWidth="0.25" />
      <path d="M 95.5 2 A 2.5 2.5 0 0 0 98 4.5" fill="none" stroke={lineColor} strokeWidth="0.25" />
      <path d="M 2 62.17 A 2.5 2.5 0 0 1 4.5 64.67" fill="none" stroke={lineColor} strokeWidth="0.25" />
      <path d="M 95.5 64.67 A 2.5 2.5 0 0 1 98 62.17" fill="none" stroke={lineColor} strokeWidth="0.25" />
    </svg>
  )
}

// ──────────────────────────────────────────────
// Team Logo Watermark
// ──────────────────────────────────────────────

function TeamWatermark({ logo, side }: { logo: string; side: 'home' | 'away' }) {
<<<<<<< HEAD
  if (!safeSrc(logo)) return null
=======
  if (!logo) return null
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: '50%',
        top: side === 'away' ? '25%' : '75%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.08,
      }}
    >
      <img
<<<<<<< HEAD
        src={safeSrc(logo)!}
=======
        src={logo}
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
        alt=""
        className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 object-contain"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none'
        }}
      />
    </div>
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

  // Use team logos from lineup data (more reliable) or fall back to props
  const effectiveHomeLogo = homeLineup?.team?.logo || homeLogo || ''
  const effectiveAwayLogo = awayLineup?.team?.logo || awayLogo || ''

  return (
    <AnimatePresence>
      <motion.div
        className="w-full max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-1 sm:px-4 mb-3">
          {/* Away team (top) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <div className="w-7 h-7 sm:w-9 sm:h-9 flex-shrink-0 rounded-full overflow-hidden bg-white/10">
<<<<<<< HEAD
              {safeSrc(effectiveAwayLogo) && (
                <img
                  src={safeSrc(effectiveAwayLogo)}
=======
              {effectiveAwayLogo && (
                <img
                  src={effectiveAwayLogo}
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
                  alt={awayTeam}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
            </div>
            <div>
              <p className="text-white text-xs sm:text-sm font-bold leading-tight truncate max-w-[90px] sm:max-w-[160px]">
                {awayTeam}
              </p>
              <span className="text-blue-400 text-xs sm:text-sm font-mono font-semibold">{awayLineup.formation}</span>
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2 sm:gap-3 mx-2 sm:mx-4 flex-shrink-0">
            <span className="text-white text-xl sm:text-2xl lg:text-3xl font-black tabular-nums">{awayScore}</span>
            <span className="text-gray-400 text-sm sm:text-lg font-light">–</span>
            <span className="text-white text-xl sm:text-2xl lg:text-3xl font-black tabular-nums">{homeScore}</span>
          </div>

          {/* Home team (bottom) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
            <div className="text-right">
              <p className="text-white text-xs sm:text-sm font-bold leading-tight truncate max-w-[90px] sm:max-w-[160px]">
                {homeTeam}
              </p>
              <span className="text-red-400 text-xs sm:text-sm font-mono font-semibold">{homeLineup.formation}</span>
            </div>
            <div className="w-7 h-7 sm:w-9 sm:h-9 flex-shrink-0 rounded-full overflow-hidden bg-white/10">
<<<<<<< HEAD
              {safeSrc(effectiveHomeLogo) && (
                <img
                  src={safeSrc(effectiveHomeLogo)}
=======
              {effectiveHomeLogo && (
                <img
                  src={effectiveHomeLogo}
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
                  alt={homeTeam}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Pitch ── */}
        <div
          className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl"
          style={{
            boxShadow: '0 0 40px rgba(0, 0, 0, 0.5), 0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Aspect ratio wrapper - establishes the pitch dimensions */}
          <div className="relative w-full" style={{ paddingBottom: '66.67%' }} />

          {/* All content absolutely positioned within the pitch container */}
          <div className="absolute inset-0">
            {/* Away team half (top) - slightly darker */}
            <div className="absolute top-0 left-0 right-0 h-[50%]" style={{ background: 'linear-gradient(180deg, #14532d 0%, #166534 100%)' }} />
            {/* Home team half (bottom) - slightly lighter */}
            <div className="absolute bottom-0 left-0 right-0 h-[50%]" style={{ background: 'linear-gradient(180deg, #166534 0%, #14532d 100%)' }} />

            {/* Subtle team tint overlays */}
            <div className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none" style={{ backgroundColor: 'rgba(59, 130, 246, 0.04)' }} />
            <div className="absolute bottom-0 left-0 right-0 h-[50%] pointer-events-none" style={{ backgroundColor: 'rgba(239, 68, 68, 0.04)' }} />

            {/* Grass stripes */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(180deg, transparent, transparent 8.33%, rgba(255,255,255,0.03) 8.33%, rgba(255,255,255,0.03) 16.66%)`,
              }}
            />

            {/* Center divider accent */}
            <div className="absolute top-1/2 left-0 right-0 h-px pointer-events-none" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />

            {/* Team logo watermarks */}
            <TeamWatermark logo={effectiveAwayLogo} side="away" />
            <TeamWatermark logo={effectiveHomeLogo} side="home" />

            {/* Pitch lines */}
            <PitchLines />

            {/* Player overlay */}
            {/* Away players (top half) */}
            {awayPlayers.map(({ player, pos }, idx) => (
              <PlayerNode
                key={`away-${player.id}`}
                player={player}
                pos={pos}
                index={idx}
                isHome={false}
                teamLogo={effectiveAwayLogo}
              />
            ))}

            {/* Home players (bottom half) */}
            {homePlayers.map(({ player, pos }, idx) => (
              <PlayerNode
                key={`home-${player.id}`}
                player={player}
                pos={pos}
                index={awayPlayers.length + idx}
                isHome={true}
                teamLogo={effectiveHomeLogo}
              />
            ))}

            {/* Vignette */}
            <div
              className="absolute inset-0 pointer-events-none rounded-xl sm:rounded-2xl"
              style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.35)' }}
            />
          </div>
        </div>

        {/* ── Footer: Coaches ── */}
        <div className="flex items-center justify-between px-2 sm:px-4 mt-3">
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span className="text-gray-400 text-[10px] sm:text-xs font-medium">{awayLineup.coach.name}</span>
          </div>
          <span className="text-gray-500 text-[9px] sm:text-[10px] uppercase tracking-widest font-mono">Manager</span>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 text-[10px] sm:text-xs font-medium">{homeLineup.coach.name}</span>
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
