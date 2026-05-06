'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface Scorer {
  rank: number;
  player: string;
  team: string;
  goals: number;
  assists: number;
}

export default function TopScorersWidget() {
  const [scorers, setScorers] = useState<Scorer[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/top-scorers');
        if (res.ok && !cancelled) {
          const data = await res.json();
          setScorers(data.scorers || data || []);
        }
      } catch {
        // silently fail
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxGoals = scorers.length > 0 ? scorers[0].goals : 1;

  function getRankStyle(rank: number) {
    switch (rank) {
      case 1:
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 2:
        return 'text-gray-300 bg-gray-300/10 border-gray-300/20';
      case 3:
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default:
        return 'text-muted-foreground bg-white/5 border-white/10';
    }
  }

  function getRankIcon(rank: number) {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass-card p-4 sm:p-5"
    >
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-5 h-5 text-neon" />
        <h3 className="text-lg font-bold text-white">
          Top <span className="neon-text">Skor</span>
        </h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Premier League 2024/2025</p>

      <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-1.5">
        {scorers.map((scorer, index) => {
          const progressWidth =
            maxGoals > 0 ? (scorer.goals / maxGoals) * 100 : 0;

          return (
            <motion.div
              key={scorer.rank}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors group"
            >
              {/* Rank */}
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold border shrink-0 ${getRankStyle(scorer.rank)}`}
              >
                {getRankIcon(scorer.rank) || scorer.rank}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate group-hover:text-neon transition-colors">
                  {scorer.player}
                </div>
                <div className="text-xs text-muted-foreground">
                  {scorer.team}
                </div>
                {/* Progress Bar */}
                <div className="mt-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${progressWidth}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-neon/60 to-neon"
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-lg font-bold neon-text tabular-nums">
                    {scorer.goals}
                  </div>
                  <div className="text-[10px] text-muted-foreground">GOL</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-300 tabular-nums">
                    {scorer.assists}
                  </div>
                  <div className="text-[10px] text-muted-foreground">ASS</div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {scorers.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Memuat data...
          </div>
        )}
      </div>
    </motion.div>
  );
}
