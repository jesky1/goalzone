'use client';

import { motion } from 'framer-motion';

interface MatchEvent {
  type: string;
  minute: number;
  player: string;
}

interface Match {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  minute: number | null;
  homeEvents: MatchEvent[];
  awayEvents: MatchEvent[];
}

interface MatchCardProps {
  match: Match;
  index?: number;
}

function StatusIndicator({ status, minute }: { status: string; minute: number | null }) {
  switch (status) {
    case 'LIVE':
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/20">
          <span className="w-2 h-2 rounded-full bg-red-500 live-pulse" />
          <span className="text-xs font-bold text-red-400">
            {minute ? `${minute}'` : 'LIVE'}
          </span>
        </div>
      );
    case 'HT':
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/20 text-xs font-bold text-amber-400">
          HT
        </span>
      );
    case 'FT':
      return (
        <span className="px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/20 text-xs font-bold text-green-400">
          FT
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-400">
          NS
        </span>
      );
  }
}

function EventPill({ events }: { events: MatchEvent[] }) {
  const goalEvents = events.filter((e) => e.type === 'goal');
  if (goalEvents.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {goalEvents.map((event, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neon/10 text-xs text-neon"
        >
          ⚽ {event.minute}&apos;
          <span className="text-gray-300">{event.player}</span>
        </span>
      ))}
    </div>
  );
}

export default function MatchCard({ match, index = 0 }: MatchCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ scale: 1.01 }}
      className="glass-card glass-hover p-4"
    >
      {/* League */}
      <div className="text-xs text-muted-foreground font-medium mb-3">
        {match.league}
      </div>

      {/* Status */}
      <div className="flex justify-center mb-3">
        <StatusIndicator status={match.status} minute={match.minute} />
      </div>

      {/* Score */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 text-right">
          <div className="font-bold text-sm sm:text-base text-white">
            {match.homeTeam}
          </div>
          <EventPill events={match.homeEvents} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-2xl sm:text-3xl font-bold neon-text tabular-nums">
            {match.homeScore}
          </span>
          <span className="text-lg text-gray-500">-</span>
          <span className="text-2xl sm:text-3xl font-bold neon-text tabular-nums">
            {match.awayScore}
          </span>
        </div>

        <div className="flex-1 text-left">
          <div className="font-bold text-sm sm:text-base text-white">
            {match.awayTeam}
          </div>
          <EventPill events={match.awayEvents} />
        </div>
      </div>
    </motion.div>
  );
}
