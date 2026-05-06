'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface LiveMatch {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  minute: number | null;
}

function StatusBadge({ status, minute }: { status: string; minute: number | null }) {
  switch (status) {
    case 'LIVE':
      return (
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
          {minute ? `${minute}'` : 'LIVE'}
        </span>
      );
    case 'HT':
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
          HT
        </span>
      );
    case 'FT':
      return (
        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
          FT
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 text-xs font-bold">
          NS
        </span>
      );
  }
}

export default function LiveScoreTicker() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/live-scores');
        if (res.ok && !cancelled) {
          const data = await res.json();
          const list = data.matches || [];
          if (Array.isArray(list)) {
            setMatches(list);
          }
        }
      } catch {
        // silently fail, keep previous data
      }
    };

    load();
    const interval = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (matches.length === 0) return null;

  const tickerContent = (
    <div className="flex">
      {[...matches, ...matches].map((match, index) => (
        <div
          key={`${match.id}-${index}`}
          className="flex items-center gap-3 px-4 py-2 whitespace-nowrap shrink-0 border-r border-white/5"
        >
          <span className="text-xs text-muted-foreground font-medium">
            {match.league}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {match.homeTeam}
            </span>
            <span className="text-sm font-bold neon-text">
              {match.homeScore} - {match.awayScore}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {match.awayTeam}
            </span>
          </div>
          <StatusBadge status={match.status} minute={match.minute} />
        </div>
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed top-16 left-0 right-0 z-40 glass overflow-hidden"
    >
      <div className="ticker-scroll">{tickerContent}</div>
    </motion.div>
  );
}
