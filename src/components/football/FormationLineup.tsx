'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { safeSrc } from '@/lib/safe-src'
import { Trophy, MapPin, User } from 'lucide-react'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface Player {
  id: number
  name: string
  number: number
  position: string
  grid: string | null
  rating: number | null
  photo: string
  events: { type: string; detail: string; time: number }[]
}

interface TeamLineup {
  team: { id: number; name: string; logo: string }
  coach: { id: number; name: string; photo: string }
  formation: string
  startXI: Player[]
  substitutes: Player[]
}

interface LastLineupData {
  fixture: {
    id: number
    date: string
    status: string
    referee: string | null
    venue: string | null
    venueCity: string | null
    homeTeam: string
    awayTeam: string
    homeLogo: string
    awayLogo: string
    homeScore: number | null
    awayScore: number | null
    league: { name: string; country: string; logo: string; round: string }
  }
  homeLineup: TeamLineup
  awayLineup: TeamLineup
  source: string
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const HOME_COLOR = '#ef4444'
const AWAY_COLOR = '#3b82f6'

/** Parse "4-3-3" → [4, 3, 3] */
function parseFormation(formation: string): number[] {
  return formation
    .split('-')
    .map(Number)
    .filter((n) => !isNaN(n))
}

/**
 * Group players by formation line.
 * Returns [[GK], [DEF...], [MID...], [FWD...]]
 */
function groupByFormationLine(
  startXI: Player[],
  formation: string
): Player[][] {
  const lines = parseFormation(formation)
  const gk = startXI.filter(
    (p) => p.position.toUpperCase().startsWith('G')
  )
  const outfield = startXI.filter(
    (p) => !p.position.toUpperCase().startsWith('G')
  )

  const groups: Player[][] = [gk]

  let idx = 0
  for (const count of lines) {
    groups.push(outfield.slice(idx, idx + count))
    idx += count
  }

  return groups // [GK, DEF, MID, FWD]
}

// ──────────────────────────────────────────────
// PlayerNode
// ──────────────────────────────────────────────

function PlayerNode({
  player,
  teamColor,
  teamLogo,
  index,
}: {
  player: Player
  teamColor: string
  teamLogo: string
  index: number
}) {
  const [imgError, setImgError] = useState(false)
  const lastName = player.name.split(' ').pop() || player.name
  const hasPhoto = player.photo && player.photo.length > 10 && !imgError
  const hasGoal = player.events.some(
    (e) =>
      e.type.toLowerCase() === 'goal' ||
      e.detail.toLowerCase() === 'goal' ||
      e.detail.toLowerCase() === 'penalty'
  )
  const hasYellow = player.events.some((e) =>
    e.detail.toLowerCase().includes('yellow')
  )
  const hasRed = player.events.some((e) =>
    e.detail.toLowerCase().includes('red')
  )

  const initials = player.name
    .split(' ')
    .filter((n) => n.length > 0 && n[0] === n[0].toUpperCase())
    .map((n) => n[0])
    .slice(0, 2)
    .join('')

  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={{ opacity: 0, scale: 0.5, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: 0.1 + index * 0.04,
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      {/* Event badges */}
      <div className="flex gap-0.5 h-3 items-center">
        {hasGoal && <span className="text-[9px] leading-none">⚽</span>}
        {hasYellow && (
          <span className="w-1.5 h-2 rounded-sm bg-yellow-400 border border-yellow-600" />
        )}
        {hasRed && (
          <span className="w-1.5 h-2 rounded-sm bg-red-500 border border-red-700" />
        )}
      </div>

      {/* Player avatar */}
      <div
        className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden"
        style={{
          border: `2.5px solid ${teamColor}`,
          boxShadow: `0 0 8px ${teamColor}25, 0 2px 4px rgba(0,0,0,0.3)`,
        }}
      >
        {hasPhoto ? (
          <img
            src={safeSrc(player.photo)}
            alt={player.name}
            className="w-full h-full object-cover bg-gray-800"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : safeSrc(teamLogo) ? (
          <div className="w-full h-full flex items-center justify-center bg-white/10 backdrop-blur-sm">
            <img
              src={safeSrc(teamLogo)!}
              alt=""
              className="w-[65%] h-[65%] object-contain"
              loading="lazy"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${teamColor}20` }}
          >
            <span
              className="text-[10px] sm:text-xs font-bold"
              style={{ color: teamColor }}
            >
              {initials || '?'}
            </span>
          </div>
        )}

        {/* Number badge */}
        <div
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 z-10"
          style={{ backgroundColor: teamColor }}
        >
          <span className="text-[7px] sm:text-[8px] font-black text-white leading-none">
            {player.number}
          </span>
        </div>
      </div>

      {/* Player name */}
      <span
        className="text-[8px] sm:text-[10px] font-bold leading-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] max-w-[48px] sm:max-w-[64px] truncate text-center"
        title={player.name}
      >
        {lastName}
      </span>

      {/* Rating */}
      {player.rating && (
        <span
          className={`text-[7px] sm:text-[8px] font-bold tabular-nums ${
            player.rating >= 7
              ? 'text-green-400'
              : player.rating >= 6
              ? 'text-yellow-400'
              : 'text-red-400'
          }`}
        >
          {player.rating.toFixed(1)}
        </span>
      )}
    </motion.div>
  )
}

// ──────────────────────────────────────────────
// FormationRow (CSS Grid row)
// ──────────────────────────────────────────────

function FormationRow({
  players,
  teamColor,
  teamLogo,
  startIndex,
}: {
  players: Player[]
  teamColor: string
  teamLogo: string
  startIndex: number
}) {
  if (players.length === 0) return null

  return (
    <div
      className="grid items-center justify-items-center px-2"
      style={{
        gridTemplateColumns: `repeat(${players.length}, 1fr)`,
      }}
    >
      {players.map((player, i) => (
        <PlayerNode
          key={player.id}
          player={player}
          teamColor={teamColor}
          teamLogo={teamLogo}
          index={startIndex + i}
        />
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────
// TeamFormationGrid
// ──────────────────────────────────────────────

function TeamFormationGrid({
  lineup,
  side,
  teamColor,
}: {
  lineup: TeamLineup
  side: 'home' | 'away'
  teamColor: string
}) {
  const groups = groupByFormationLine(lineup.startXI, lineup.formation)
  // groups: [GK, DEF, MID, FWD]

  const teamLogo = lineup.team?.logo || ''
  const formationRows = parseFormation(lineup.formation)
  const totalFormationLines = formationRows.length + 1 // +1 for GK

  // For away team: display FWD first (top), then MID, DEF, GK (bottom)
  // For home team: display GK first (top), then DEF, MID, FWD (bottom)
  const displayGroups =
    side === 'away' ? [...groups].reverse() : groups

  // Pre-compute start indices for animation staggering
  const rowStartIndices = displayGroups.reduce<number[]>(
    (acc, linePlayers, idx) => {
      const prevTotal = idx === 0 ? 0 : acc[idx - 1] + displayGroups[idx - 1].length
      return [...acc, prevTotal]
    },
    []
  )

  return (
    <div
      className="grid gap-y-3 sm:gap-y-4 py-3"
      style={{
        gridTemplateRows: `repeat(${totalFormationLines}, 1fr)`,
      }}
    >
      {displayGroups.map((linePlayers, rowIdx) => (
        <FormationRow
          key={`row-${rowIdx}`}
          players={linePlayers}
          teamColor={teamColor}
          teamLogo={teamLogo}
          startIndex={rowStartIndices[rowIdx]}
        />
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────
// SVG Pitch Lines (minimalist, single-pitch)
// ──────────────────────────────────────────────

function PitchLines() {
  const lineColor = 'rgba(255,255,255,0.2)'
  const accentColor = 'rgba(255,255,255,0.35)'

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outline */}
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.3"
      />
      {/* Halfway line */}
      <line
        x1="2"
        y1="50"
        x2="98"
        y2="50"
        stroke={accentColor}
        strokeWidth="0.35"
      />
      {/* Center circle */}
      <circle
        cx="50"
        cy="50"
        r="10"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.3"
      />
      <circle cx="50" cy="50" r="0.6" fill={accentColor} />

      {/* Top penalty area (away) */}
      <rect
        x="20"
        y="2"
        width="60"
        height="14"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.3"
      />
      <rect
        x="34"
        y="2"
        width="32"
        height="5.5"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.3"
      />
      <circle cx="50" cy="11" r="0.4" fill={accentColor} />
      <path
        d="M 42 16 A 8 8 0 0 0 58 16"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.3"
      />

      {/* Bottom penalty area (home) */}
      <rect
        x="20"
        y="84"
        width="60"
        height="14"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.3"
      />
      <rect
        x="34"
        y="92.5"
        width="32"
        height="5.5"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.3"
      />
      <circle cx="50" cy="89" r="0.4" fill={accentColor} />
      <path
        d="M 42 84 A 8 8 0 0 1 58 84"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.3"
      />

      {/* Corner arcs */}
      <path
        d="M 2 4.5 A 2.5 2.5 0 0 0 4.5 2"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.2"
      />
      <path
        d="M 95.5 2 A 2.5 2.5 0 0 0 98 4.5"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.2"
      />
      <path
        d="M 2 95.5 A 2.5 2.5 0 0 1 4.5 98"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.2"
      />
      <path
        d="M 95.5 98 A 2.5 2.5 0 0 1 98 95.5"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.2"
      />
    </svg>
  )
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

export default function FormationLineup() {
  const [data, setData] = useState<LastLineupData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const loadData = async () => {
      try {
        const res = await fetch('/api/last-lineup')
        if (res.ok && !cancelled) {
          const json = await res.json()
          setData(json)
        }
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 rounded-full bg-neon" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Formasi <span className="neon-text">Terakhir</span>
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Memuat data formasi pertandingan terakhir...
          </p>
        </motion.div>
        <div className="h-[400px] rounded-2xl bg-slate-100 dark:bg-white/[0.03] animate-pulse border border-slate-200 dark:border-white/[0.06]" />
      </section>
    )
  }

  if (!data) return null

  const { fixture, homeLineup, awayLineup } = data

  if (!homeLineup?.startXI?.length || !awayLineup?.startXI?.length)
    return null

  const effectiveHomeLogo =
    homeLineup?.team?.logo || fixture.homeLogo || ''
  const effectiveAwayLogo =
    awayLineup?.team?.logo || fixture.awayLogo || ''

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-2 rounded-full bg-neon" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Formasi <span className="neon-text">Terakhir</span>
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Susunan pemain dari pertandingan terakhir yang selesai
        </p>
      </motion.div>

      {/* Main Card: Stadium Background + Glassmorphism Pitch */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-cyan-500/20 shadow-lg dark:shadow-[0_0_30px_rgba(0,240,255,0.08)]"
      >
        {/* ── Stadium Background Image ── */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(/stadium-bg.png)` }}
        />
        {/* Dark overlay to ensure readability */}
        <div className="absolute inset-0 bg-black/50 dark:bg-black/60" />

        {/* ── Content Layer ── */}
        <div className="relative z-10">
          {/* Match Info Header */}
          <div className="px-4 sm:px-6 pt-5 pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* League */}
              <div className="flex items-center gap-2">
                {safeSrc(fixture.league.logo) && (
                  <img
                    src={safeSrc(fixture.league.logo)}
                    alt=""
                    className="w-5 h-5 rounded-sm"
                    loading="lazy"
                  />
                )}
                <div>
                  <span className="text-xs font-semibold text-white/90">
                    {fixture.league.name}
                  </span>
                  {fixture.league.round && (
                    <span className="text-[10px] text-white/50 ml-1.5">
                      · {fixture.league.round}
                    </span>
                  )}
                </div>
              </div>

              {/* Venue */}
              {fixture.venue && (
                <div className="flex items-center gap-1 text-white/40">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[10px] truncate max-w-[140px]">
                    {fixture.venue}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Teams + Score Bar */}
          <div className="px-4 sm:px-6 pb-4">
            <div className="flex items-center justify-center gap-3 sm:gap-6">
              {/* Away Team */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
                <div className="text-right">
                  <p className="text-sm sm:text-base font-bold text-white truncate max-w-[100px] sm:max-w-[160px]">
                    {fixture.awayTeam}
                  </p>
                  <span
                    className="text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${AWAY_COLOR}20`,
                      color: AWAY_COLOR,
                      border: `1px solid ${AWAY_COLOR}30`,
                    }}
                  >
                    {awayLineup.formation}
                  </span>
                </div>
                {safeSrc(effectiveAwayLogo) ? (
                  <img
                    src={safeSrc(effectiveAwayLogo)}
                    alt={fixture.awayTeam}
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-lg">⚽</span>
                  </div>
                )}
              </div>

              {/* Score */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                  {fixture.awayScore ?? 0}
                </span>
                <span className="text-white/30 text-sm font-light">–</span>
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                  {fixture.homeScore ?? 0}
                </span>
              </div>

              {/* Home Team */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1">
                {safeSrc(effectiveHomeLogo) ? (
                  <img
                    src={safeSrc(effectiveHomeLogo)}
                    alt={fixture.homeTeam}
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-lg">⚽</span>
                  </div>
                )}
                <div>
                  <p className="text-sm sm:text-base font-bold text-white truncate max-w-[100px] sm:max-w-[160px]">
                    {fixture.homeTeam}
                  </p>
                  <span
                    className="text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${HOME_COLOR}20`,
                      color: HOME_COLOR,
                      border: `1px solid ${HOME_COLOR}30`,
                    }}
                  >
                    {homeLineup.formation}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Glassmorphism Pitch ── */}
          <div className="mx-3 sm:mx-5 mb-4">
            <div
              className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/10"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,83,45,0.7) 0%, rgba(22,101,52,0.6) 50%, rgba(20,83,45,0.7) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow:
                  '0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              {/* Green pitch gradient */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, #14532d 0%, #166534 40%, #15803d 50%, #166534 60%, #14532d 100%)',
                  opacity: 0.7,
                }}
              />

              {/* Grass stripes */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(180deg, transparent, transparent 5.55%, rgba(255,255,255,0.03) 5.55%, rgba(255,255,255,0.03) 11.1%)`,
                }}
              />

              {/* Subtle team tint */}
              <div
                className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.03)' }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.03)' }}
              />

              {/* Team watermarks */}
              {safeSrc(effectiveAwayLogo) && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: '50%',
                    top: '25%',
                    transform: 'translate(-50%, -50%)',
                    opacity: 0.05,
                  }}
                >
                  <img
                    src={safeSrc(effectiveAwayLogo)!}
                    alt=""
                    className="w-20 h-20 sm:w-28 sm:h-28 object-contain"
                    loading="lazy"
                  />
                </div>
              )}
              {safeSrc(effectiveHomeLogo) && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: '50%',
                    top: '75%',
                    transform: 'translate(-50%, -50%)',
                    opacity: 0.05,
                  }}
                >
                  <img
                    src={safeSrc(effectiveHomeLogo)!}
                    alt=""
                    className="w-20 h-20 sm:w-28 sm:h-28 object-contain"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Pitch lines */}
              <PitchLines />

              {/* Main pitch content - CSS Grid */}
              <div className="relative z-10 py-3 sm:py-4">
                {/* Away Team Formation (top half) */}
                <TeamFormationGrid
                  lineup={awayLineup}
                  side="away"
                  teamColor={AWAY_COLOR}
                />

                {/* Center divider */}
                <div className="relative my-2 sm:my-3">
                  <div className="absolute inset-x-4 h-px bg-white/15" />
                  <div className="flex justify-center">
                    <div className="bg-white/10 backdrop-blur-sm px-3 py-0.5 rounded-full border border-white/10">
                      <Trophy className="w-3 h-3 text-white/40" />
                    </div>
                  </div>
                </div>

                {/* Home Team Formation (bottom half) */}
                <TeamFormationGrid
                  lineup={homeLineup}
                  side="home"
                  teamColor={HOME_COLOR}
                />
              </div>

              {/* Vignette */}
              <div
                className="absolute inset-0 pointer-events-none rounded-xl sm:rounded-2xl"
                style={{
                  boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3)',
                }}
              />
            </div>
          </div>

          {/* Coach Footer */}
          <div className="px-4 sm:px-6 pb-5">
            <div className="flex items-center justify-between text-white/40 text-[10px] sm:text-xs">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3" />
                <span>{awayLineup.coach?.name || '—'}</span>
              </div>
              <span className="uppercase tracking-widest font-mono text-[8px] sm:text-[9px] text-white/25">
                Manager
              </span>
              <div className="flex items-center gap-1.5">
                <span>{homeLineup.coach?.name || '—'}</span>
                <User className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
