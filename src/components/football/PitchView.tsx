'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import Image from 'next/image'

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

interface PitchViewProps {
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

const POSITION_COLORS: Record<PositionCategory, string> = {
  G: '#eab308', // amber-500
  D: '#3b82f6', // blue-500
  M: '#22c55e', // green-500
  F: '#ef4444', // red-500
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
  // If the player has a valid grid, use it
  if (player.grid) {
    const parts = player.grid.split(':')
    const line = parseInt(parts[0], 10) // 1=GK, 2=DEF, 3=MID, 4=FWD
    const posInLine = parseInt(parts[1], 10) - 1 // 0-indexed

    // Count how many players share this line
    const sameLine = allPlayers.filter((p) => {
      if (!p.grid) return false
      return parseInt(p.grid.split(':')[0], 10) === line
    })
    const countInLine = sameLine.length

    // Sort them by position within line to get the correct index
    const sorted = [...sameLine].sort(
      (a, b) => parseInt(a.grid!.split(':')[1], 10) - parseInt(b.grid!.split(':')[1], 10),
    )
    const indexInLine = sorted.findIndex((p) => p.id === player.id)

    const x = ((indexInLine + 1) / (countInLine + 1)) * 100

    // Y positions by line
    const yMapHome: Record<number, number> = {
      1: 88, // GK
      2: 72, // DEF
      3: 52, // MID
      4: 30, // FWD
      5: 15, // Extra attacker (rare)
    }
    const yMapAway: Record<number, number> = {
      1: 12, // GK
      2: 28, // DEF
      3: 48, // MID
      4: 70, // FWD
      5: 85, // Extra attacker (rare)
    }

    const yMap = side === 'home' ? yMapHome : yMapAway
    const y = yMap[line] ?? (side === 'home' ? 52 : 48)

    return { x, y }
  }

  // Fallback: position by category
  const cat = categorizePosition(player.position)
  const lineMap: Record<PositionCategory, number> = { G: 1, D: 2, M: 3, F: 4 }
  const line = lineMap[cat] ?? 3

  // Count same-category players for x-spacing
  const sameCat = allPlayers.filter((p) => categorizePosition(p.position) === cat)
  const countInLine = sameCat.length
  const indexInLine = sameCat.findIndex((p) => p.id === player.id)

  const x = countInLine > 0
    ? ((indexInLine + 1) / (countInLine + 1)) * 100
    : 50

  const yMapHome: Record<number, number> = { 1: 88, 2: 72, 3: 52, 4: 30 }
  const yMapAway: Record<number, number> = { 1: 12, 2: 28, 3: 48, 4: 70 }
  const yMap = side === 'home' ? yMapHome : yMapAway
  const y = yMap[line] ?? (side === 'home' ? 52 : 48)

  return { x, y }
}

// ──────────────────────────────────────────────
// Player Dot
// ──────────────────────────────────────────────

interface PlayerDotProps {
  player: PitchPlayer
  pos: ComputedPosition
  index: number
}

function PlayerDot({ player, pos, index }: PlayerDotProps) {
  const cat = categorizePosition(player.position)
  const color = POSITION_COLORS[cat]
  const hasGoal = player.events.some(
    (e) =>
      e.type.toLowerCase() === 'goal' ||
      e.detail.toLowerCase() === 'goal' ||
      e.detail.toLowerCase() === 'penalty' ||
      e.detail.toLowerCase() === 'own goal',
  )
  const hasYellow = player.events.some(
    (e) => e.detail.toLowerCase() === 'yellow card',
  )
  const hasRed = player.events.some(
    (e) => e.detail.toLowerCase() === 'red card',
  )

  const ratingText = player.rating ? player.rating.toFixed(1) : 'N/A'

  return (
    <motion.div
      className="absolute flex flex-col items-center"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: 0.4 + index * 0.04,
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="group relative flex flex-col items-center outline-none cursor-default"
            aria-label={`${player.name} #${player.number}`}
          >
            {/* Event indicators */}
            <div className="absolute -top-2 flex gap-0.5 z-20">
              {hasGoal && (
                <motion.span
                  className="text-[10px] leading-none"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.04 }}
                >
                  ⚽
                </motion.span>
              )}
              {hasYellow && (
                <motion.span
                  className="block w-[8px] h-[10px] rounded-[1px] bg-yellow-400 border border-yellow-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.04 }}
                />
              )}
              {hasRed && (
                <motion.span
                  className="block w-[8px] h-[10px] rounded-[1px] bg-red-500 border border-red-700"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.04 }}
                />
              )}
            </div>

            {/* Player circle */}
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-125 group-hover:shadow-lg"
              style={{
                backgroundColor: `${color}55`,
                border: `2px solid ${color}`,
                boxShadow: `0 0 8px ${color}40`,
              }}
            >
              <span className="text-[11px] sm:text-xs font-bold text-white select-none">
                {player.number}
              </span>
            </div>

            {/* Player name */}
            <span className="mt-0.5 text-[9px] sm:text-[10px] text-gray-300 font-medium leading-tight text-center max-w-[56px] sm:max-w-[72px] truncate whitespace-nowrap">
              {player.name.split(' ').pop()}
            </span>
          </button>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          className="bg-deep-800/95 border border-white/10 backdrop-blur-md px-3 py-2 pointer-events-none"
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-white text-xs font-semibold">
              {player.name}
            </span>
            <span className="text-gray-400 text-[10px]">
              #{player.number}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px]">
            <span className="text-gray-400">
              {POSITION_LABELS[cat]} ·{' '}
              <span className="text-neon">{ratingText}</span>
            </span>
            {player.events.length > 0 && (
              <span className="text-gray-500">
                {player.events.map((e) => {
                  if (e.detail.toLowerCase() === 'yellow card') return '🟨'
                  if (e.detail.toLowerCase() === 'red card') return '🟥'
                  if (
                    e.type.toLowerCase() === 'goal' ||
                    e.detail.toLowerCase() === 'goal'
                  )
                    return `⚽ ${e.time}'`
                  return ''
                })}
              </span>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </motion.div>
  )
}

// ──────────────────────────────────────────────
// SVG Pitch Lines
// ──────────────────────────────────────────────

function PitchLines() {
  return (
    <svg
      viewBox="0 0 100 66.67"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pitch outline */}
      <rect
        x="1"
        y="1"
        width="98"
        height="64.67"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.25"
        rx="0.3"
      />

      {/* Halfway line */}
      <line
        x1="50"
        y1="1"
        x2="50"
        y2="65.67"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.25"
      />

      {/* Center circle */}
      <circle
        cx="50"
        cy="33.33"
        r="8.5"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.25"
      />
      {/* Center spot */}
      <circle
        cx="50"
        cy="33.33"
        r="0.5"
        fill="rgba(255,255,255,0.5)"
      />

      {/* Top penalty area (away GK) */}
      <rect
        x="18"
        y="1"
        width="64"
        height="13.33"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.25"
      />

      {/* Top goal area (away GK) */}
      <rect
        x="30"
        y="1"
        width="40"
        height="5.33"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.25"
      />

      {/* Top penalty spot */}
      <circle
        cx="50"
        cy="10"
        r="0.4"
        fill="rgba(255,255,255,0.5)"
      />

      {/* Top penalty arc */}
      <path
        d="M 43 14.33 A 8.5 8.5 0 0 0 57 14.33"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.25"
      />

      {/* Top goal */}
      <rect
        x="36"
        y="0"
        width="28"
        height="1"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="0.2"
      />

      {/* Bottom penalty area (home GK) */}
      <rect
        x="18"
        y="52.34"
        width="64"
        height="13.33"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.25"
      />

      {/* Bottom goal area (home GK) */}
      <rect
        x="30"
        y="60.34"
        width="40"
        height="5.33"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.25"
      />

      {/* Bottom penalty spot */}
      <circle
        cx="50"
        cy="56.67"
        r="0.4"
        fill="rgba(255,255,255,0.5)"
      />

      {/* Bottom penalty arc */}
      <path
        d="M 43 52.34 A 8.5 8.5 0 0 1 57 52.34"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.25"
      />

      {/* Bottom goal */}
      <rect
        x="36"
        y="65.67"
        width="28"
        height="1"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="0.2"
      />

      {/* Corner arcs */}
      <path
        d="M 1 3.5 A 2.5 2.5 0 0 0 3.5 1"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.2"
      />
      <path
        d="M 96.5 1 A 2.5 2.5 0 0 0 99 3.5"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.2"
      />
      <path
        d="M 1 63.17 A 2.5 2.5 0 0 1 3.5 65.67"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.2"
      />
      <path
        d="M 96.5 65.67 A 2.5 2.5 0 0 1 99 63.17"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.2"
      />
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
        {/* ── Header: Teams + Score ── */}
        <div className="flex items-center justify-between px-2 sm:px-4 mb-3 sm:mb-4">
          {/* Home team */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
            <div className="text-right">
              <p className="text-gray-900 dark:text-white text-xs sm:text-sm font-bold leading-tight truncate max-w-[100px] sm:max-w-[180px]">
                {homeTeam}
              </p>
              <FormationBadge formation={homeLineup.formation} />
            </div>
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
              <Image
                src={homeLogo}
                alt={homeTeam}
                fill
                className="object-contain"
                sizes="40px"
              />
            </div>
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
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
              <Image
                src={awayLogo}
                alt={awayTeam}
                fill
                className="object-contain"
                sizes="40px"
              />
            </div>
            <div>
              <p className="text-gray-900 dark:text-white text-xs sm:text-sm font-bold leading-tight truncate max-w-[100px] sm:max-w-[180px]">
                {awayTeam}
              </p>
              <FormationBadge formation={awayLineup.formation} />
            </div>
          </div>
        </div>

        {/* ── Pitch ── */}
        <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl"
          style={{
            background: 'linear-gradient(180deg, #0d3320 0%, #0a2818 50%, #0d3320 100%)',
            boxShadow: `
              0 0 30px rgba(0, 240, 255, 0.06),
              0 0 60px rgba(0, 240, 255, 0.03),
              inset 0 0 40px rgba(0, 0, 0, 0.3)
            `,
          }}
        >
          {/* Grass pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 9.09%,
                rgba(255,255,255,1) 9.09%,
                rgba(255,255,255,1) 10%,
                transparent 10%
              )`,
            }}
          />

          {/* Pitch lines */}
          <PitchLines />

          {/* Aspect ratio wrapper */}
          <div className="relative w-full" style={{ paddingBottom: '66.67%' }} />

          {/* Player dots overlay */}
          <div className="absolute inset-0">
            {/* Away players */}
            {awayPlayers.map(({ player, pos }, idx) => (
              <PlayerDot
                key={player.id}
                player={player}
                pos={pos}
                index={idx}
              />
            ))}

            {/* Home players */}
            {homePlayers.map(({ player, pos }, idx) => (
              <PlayerDot
                key={player.id}
                player={player}
                pos={pos}
                index={awayPlayers.length + idx}
              />
            ))}
          </div>

          {/* Subtle vignette */}
          <div
            className="absolute inset-0 pointer-events-none rounded-xl sm:rounded-2xl"
            style={{
              boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)',
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
