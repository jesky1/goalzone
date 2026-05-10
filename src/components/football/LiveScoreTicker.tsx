'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { safeSrc } from '@/lib/safe-src';

interface LiveMatch {
  id: string;
  league: string;
  leagueLogo?: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore: number;
  awayScore: number;
  status: string;
  minute: number | null;
}

function StatusBadge({ status, minute }: { status: string; minute: number | null }) {
  switch (status) {
    case 'LIVE':
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
          <span className="w-1 h-1 rounded-full bg-red-500 live-pulse" />
          {minute ? `${minute}'` : 'LIVE'}
        </span>
      );
    case 'HT':
      return <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">HT</span>;
    case 'FT':
      return <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold">FT</span>;
    default:
      return null;
  }
}

export default function LiveScoreTicker() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const prevSigRef = useRef('');

  const updateIfChanged = useCallback((list: LiveMatch[]) => {
    const sig = list.map(m => `${m.id}:${m.status}:${m.homeScore}:${m.awayScore}:${m.minute}`).join('|');
    if (sig !== prevSigRef.current) {
      prevSigRef.current = sig;
      setMatches(list);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/live-scores');
        if (res.ok && !cancelled) {
          const data = await res.json();
          const list = data.matches || [];
          if (Array.isArray(list)) updateIfChanged(list);
        }
      } catch { /* silent */ }
    };

    load();
    const interval = setInterval(load, 120000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [updateIfChanged]);

  if (matches.length === 0) return null;

  // Only show LIVE and HT matches in ticker
  const activeMatches = matches.filter(m => m.status === 'LIVE' || m.status === 'HT');
  if (activeMatches.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="sticky top-16 z-40 glass overflow-hidden border-b border-slate-200 dark:border-white/5"
    >
      <div className="ticker-scroll">
        <div className="flex">
          {[...activeMatches, ...activeMatches].map((match, index) => (
            <div
              key={`${match.id}-${index}`}
              className="flex items-center gap-2 px-4 py-2 whitespace-nowrap shrink-0 border-r border-gray-200 dark:border-white/5"
            >
              {/* League logo */}
              {safeSrc(match.leagueLogo) && (
                <img src={safeSrc(match.leagueLogo)} alt="" className="w-4 h-4 rounded-sm object-contain shrink-0" />
              )}
              <span className="text-[10px] text-muted-foreground font-medium">{match.league}</span>
              {/* Home team */}
              {safeSrc(match.homeLogo) ? (
                <img src={safeSrc(match.homeLogo)} alt="" className="w-4 h-4 rounded-full shrink-0" />
              ) : null}
              <span className="text-xs font-semibold text-foreground">{match.homeTeam}</span>
              {/* Score */}
              <span className="text-xs font-bold neon-text tabular-nums">{match.homeScore}-{match.awayScore}</span>
              {/* Away team */}
              <span className="text-xs font-semibold text-foreground">{match.awayTeam}</span>
              {safeSrc(match.awayLogo) ? (
                <img src={safeSrc(match.awayLogo)} alt="" className="w-4 h-4 rounded-full shrink-0" />
              ) : null}
              <StatusBadge status={match.status} minute={match.minute} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
