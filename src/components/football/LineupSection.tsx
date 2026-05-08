'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, User } from 'lucide-react'

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

export interface LineupSectionProps {
  homeLineup: TeamLineup
  awayLineup: TeamLineup
  homeScore: number
  awayScore: number
  homeTeam: string
  awayTeam: string
  homeLogo?: string
  awayLogo?: string
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

const POSITION_COLORS: Record<PositionCategory, { bg: string; text: string; border: string }> = {
  G: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  D: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
  M: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
  F: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
}

interface ComputedPosition {
  x: number
  y: number
}

/**
 * Compute player positions for a SINGLE team pitch.
 * GK at the bottom, FWD near the top.
 */
function computePlayerPosition(
  player: PitchPlayer,
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

    // Single team pitch: GK at bottom, forwards at top
    const yMap: Record<number, number> = {
      1: 88,  // GK
      2: 70,  // DEF
      3: 50,  // MID
      4: 30,  // FWD
      5: 30,
    }
    const y = yMap[line] ?? 50

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

  const yMap: Record<number, number> = { 1: 88, 2: 70, 3: 50, 4: 30 }
  const y = yMap[line] ?? 50

  return { x, y }
}

// ──────────────────────────────────────────────
// PlayerNode Component (simpler for dual-column)
// ──────────────────────────────────────────────

interface PlayerNodeProps {
  player: PitchPlayer
  pos: ComputedPosition
  index: number
  teamColor: string
  teamLogo?: string
}

function PlayerNode({ player, pos, index, teamColor, teamLogo }: PlayerNodeProps) {
  const [imgError, setImgError] = useState(false)
  const cat = categorizePosition(player.position)
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
        delay: 0.2 + index * 0.05,
        type: 'spring',
        stiffness: 280,
        damping: 18,
      }}
    >
      {/* Event indicators */}
      <div className="absolute -top-2.5 flex gap-0.5 z-20">
        {hasGoal &&
          goalEvents.map((e, i) => (
            <motion.span
              key={i}
              className="text-[9px] leading-none drop-shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 + index * 0.05 }}
            >
              ⚽
            </motion.span>
          ))}
        {hasYellow && (
          <motion.span
            className="block w-[7px] h-[9px] rounded-[1px] bg-yellow-400 border border-yellow-600 shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 + index * 0.05 }}
          />
        )}
        {hasRed && (
          <motion.span
            className="block w-[7px] h-[9px] rounded-[1px] bg-red-500 border border-red-700 shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 + index * 0.05 }}
          />
        )}
      </div>

      {/* Player Avatar */}
      <div
        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden"
        style={{
          border: `2.5px solid ${teamColor}`,
          boxShadow: `0 0 10px ${teamColor}30, 0 2px 6px rgba(0,0,0,0.3)`,
        }}
      >
        {hasPhoto && (
          <img
            src={player.photo}
            alt={player.name}
            className="absolute inset-0 w-full h-full object-cover bg-gray-800"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
        {!hasPhoto && hasTeamLogo && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm">
            <img
              src={teamLogo}
              alt=""
              className="w-[70%] h-[70%] object-contain"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}
        {!hasPhoto && !hasTeamLogo && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: `${teamColor}25` }}
          >
            <span className="text-[10px] sm:text-xs font-bold drop-shadow-lg" style={{ color: teamColor }}>
              {initials || '?'}
            </span>
          </div>
        )}
      </div>

      {/* Number badge */}
      <div
        className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] sm:w-5 sm:h-5 rounded-full flex items-center justify-center z-20 border-2 border-white dark:border-gray-900 shadow-lg"
        style={{ backgroundColor: teamColor }}
      >
        <span className="text-[8px] sm:text-[9px] font-black text-white leading-none">
          {player.number}
        </span>
      </div>

      {/* Player name */}
      <span
        className="mt-0.5 text-[8px] sm:text-[9px] font-bold leading-tight block truncate max-w-[52px] sm:max-w-[64px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
        style={{ color: '#ffffff' }}
      >
        {lastName}
      </span>
    </motion.div>
  )
}

// ──────────────────────────────────────────────
// SVG Pitch Lines (single team half)
// ──────────────────────────────────────────────

function HalfPitchLines() {
  const lineColor = 'var(--pitch-line-color, rgba(255,255,255,0.35))'
  const accentColor = 'var(--pitch-line-accent, rgba(255,255,255,0.5))'

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pitch outline */}
      <rect x="2" y="2" width="96" height="96" fill="none" stroke={lineColor} strokeWidth="0.4" />
      {/* Halfway line (top) */}
      <line x1="2" y1="8" x2="98" y2="8" stroke={accentColor} strokeWidth="0.3" />
      {/* Center circle (partial, at top) */}
      <path d="M 35 8 A 15 15 0 0 0 65 8" fill="none" stroke={lineColor} strokeWidth="0.3" />
      <circle cx="50" cy="8" r="0.5" fill={accentColor} />
      {/* Penalty area (bottom) */}
      <rect x="18" y="74" width="64" height="24" fill="none" stroke={lineColor} strokeWidth="0.3" />
      {/* 6-yard box */}
      <rect x="32" y="88" width="36" height="10" fill="none" stroke={lineColor} strokeWidth="0.3" />
      {/* Penalty spot */}
      <circle cx="50" cy="82" r="0.4" fill={accentColor} />
      {/* Penalty arc */}
      <path d="M 40 74 A 12 12 0 0 0 60 74" fill="none" stroke={lineColor} strokeWidth="0.3" />
      {/* Goal area */}
      <rect x="40" y="98" width="20" height="2" fill="none" stroke={accentColor} strokeWidth="0.25" rx="0.5" />
      {/* Corner arcs */}
      <path d="M 2 5 A 3 3 0 0 1 5 2" fill="none" stroke={lineColor} strokeWidth="0.25" />
      <path d="M 95 2 A 3 3 0 0 1 98 5" fill="none" stroke={lineColor} strokeWidth="0.25" />
    </svg>
  )
}

// ──────────────────────────────────────────────
// Substitutes List
// ──────────────────────────────────────────────

function SubstitutesList({ players, teamColor, side }: { players: PitchPlayer[]; teamColor: string; side: 'home' | 'away' }) {
  const [expanded, setExpanded] = useState(false)

  if (players.length === 0) return null

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 hover:text-white transition-colors py-1.5 px-1 w-full"
      >
        <span className="font-semibold">Pemain Pengganti ({players.length})</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pb-1">
              {players.map((p) => {
                const cat = categorizePosition(p.position)
                const posColors = POSITION_COLORS[cat]
                const hasGoal = p.events.some(e => e.type.toLowerCase() === 'goal' || e.detail.toLowerCase() === 'goal' || e.detail.toLowerCase() === 'penalty')
                const hasYellow = p.events.some(e => e.detail.toLowerCase() === 'yellow card')
                const hasRed = p.events.some(e => e.detail.toLowerCase() === 'red card')

                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-white/5 transition-colors ${side === 'away' ? 'flex-row-reverse text-right' : ''}`}
                  >
                    <div className="w-7 shrink-0 text-center">
                      {p.rating ? (
                        <span className={`text-[10px] font-bold tabular-nums ${p.rating >= 7 ? 'text-green-400' : p.rating >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {p.rating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-600">-</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`flex items-center gap-1.5 ${side === 'away' ? 'justify-end' : ''}`}>
                        <span className="text-[10px] text-gray-500 w-4 shrink-0 tabular-nums">{p.number}</span>
                        <span className="text-[12px] text-white truncate">{p.name}</span>
                        <span
                          className="text-[8px] px-1 py-0.5 rounded border font-bold shrink-0"
                          style={{
                            backgroundColor: posColors.bg,
                            color: posColors.text,
                            borderColor: posColors.border,
                          }}
                        >
                          {POSITION_LABELS[cat]}
                        </span>
                        {hasGoal && <span className="text-[9px]">⚽</span>}
                        {hasYellow && <span className="w-1.5 h-2 rounded-sm bg-yellow-500 shrink-0" />}
                        {hasRed && <span className="w-1.5 h-2 rounded-sm bg-red-500 shrink-0" />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ──────────────────────────────────────────────
// Single Team Column Component
// ──────────────────────────────────────────────

interface TeamColumnProps {
  lineup: TeamLineup
  side: 'home' | 'away'
  teamName: string
  teamLogo?: string
  teamColor: string
  score: number
}

function TeamColumn({ lineup, side, teamName, teamLogo, teamColor, score }: TeamColumnProps) {
  const players = useMemo(
    () =>
      lineup.startXI.map((p) => ({
        player: p,
        pos: computePlayerPosition(p, lineup.startXI),
      })),
    [lineup.startXI],
  )

  const effectiveLogo = lineup?.team?.logo || teamLogo || ''

  if (lineup.startXI.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-3xl mb-3 opacity-20">⚽</div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Lineup belum tersedia</p>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col"
      initial={{ opacity: 0, x: side === 'home' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: side === 'home' ? 0 : 0.15 }}
    >
      {/* ── Team Header ── */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0"
          style={{
            border: `2px solid ${teamColor}`,
            boxShadow: `0 0 12px ${teamColor}30`,
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
        >
          {effectiveLogo ? (
            <img src={effectiveLogo} alt={teamName} className="w-full h-full object-contain" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <span className="text-sm">⚽</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-white truncate">{teamName}</h3>
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0"
              style={{
                backgroundColor: `${teamColor}20`,
                color: teamColor,
                border: `1px solid ${teamColor}30`,
              }}
            >
              {lineup.formation}
            </span>
          </div>
          {lineup.coach?.name && (
            <div className="flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 text-gray-500" />
              <span className="text-[11px] text-gray-500">{lineup.coach.name}</span>
            </div>
          )}
        </div>
        {/* Score badge */}
        <div
          className="text-xl sm:text-2xl font-black tabular-nums shrink-0"
          style={{ color: teamColor }}
        >
          {score}
        </div>
      </div>

      {/* ── Pitch Visual with Glassmorphism ── */}
      <div
        className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl"
        style={{
          boxShadow: `0 0 30px ${teamColor}15, 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}
      >
        {/* Aspect ratio wrapper */}
        <div className="relative w-full" style={{ paddingBottom: '100%' }} />

        {/* Pitch content */}
        <div className="absolute inset-0">
          {/* Green pitch background */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, #166534 0%, #14532d 60%, #15803d 100%)`,
            }}
          />

          {/* Subtle team tint */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: `${teamColor}06` }}
          />

          {/* Grass stripes */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(180deg, transparent, transparent 10%, rgba(255,255,255,0.025) 10%, rgba(255,255,255,0.025) 20%)`,
            }}
          />

          {/* Team logo watermark */}
          {effectiveLogo && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.06,
              }}
            >
              <img src={effectiveLogo} alt="" className="w-24 h-24 sm:w-32 sm:h-32 object-contain" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
          )}

          {/* Pitch lines */}
          <HalfPitchLines />

          {/* Players */}
          {players.map(({ player, pos }, idx) => (
            <PlayerNode
              key={`${side}-${player.id}`}
              player={player}
              pos={pos}
              index={idx}
              teamColor={teamColor}
              teamLogo={effectiveLogo}
            />
          ))}

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none rounded-xl sm:rounded-2xl"
            style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3)' }}
          />
        </div>
      </div>

      {/* ── Substitutes ── */}
      <SubstitutesList players={lineup.substitutes} teamColor={teamColor} side={side} />
    </motion.div>
  )
}

// ──────────────────────────────────────────────
// Main Component: Dual-Column Lineup Section
// ──────────────────────────────────────────────

export default function LineupSection({
  homeLineup,
  awayLineup,
  homeScore,
  awayScore,
  homeTeam,
  awayTeam,
  homeLogo,
  awayLogo,
}: LineupSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Kolom Kiri: Home Team */}
      <TeamColumn
        lineup={homeLineup}
        side="home"
        teamName={homeTeam}
        teamLogo={homeLogo}
        teamColor={HOME_COLOR}
        score={homeScore}
      />

      {/* Kolom Kanan: Away Team */}
      <TeamColumn
        lineup={awayLineup}
        side="away"
        teamName={awayTeam}
        teamLogo={awayLogo}
        teamColor={AWAY_COLOR}
        score={awayScore}
      />
    </div>
  )
}
