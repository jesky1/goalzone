'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RefreshCw } from 'lucide-react';
import EmptyState from '@/components/football/EmptyState';

interface Scorer {
  rank: number;
  name: string;
  photo: string;
  team: string;
  teamLogo: string;
  goals: number;
  assists: number;
  minutesPlayed: number;
}

interface LeagueOption {
  slug: string;
  name: string;
  logo: string;
}

export default function TopScorersWidget() {
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [leagues, setLeagues] = useState<LeagueOption[]>([]);
  const [activeLeague, setActiveLeague] = useState('premier-league');
  const [seasonLabel, setSeasonLabel] = useState('2025/26');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadScorers = async (league: string) => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/top-scorers?league=${league}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.topScorers || data.scorers || data || [];
        if (Array.isArray(list)) setScorers(list);
        if (data.availableLeagues && data.availableLeagues.length > 0) {
          setLeagues(data.availableLeagues);
        }
        setSeasonLabel(data.season || '2025/26');
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadScorers(activeLeague);
  }, [activeLeague]);

  const maxGoals = scorers.length > 0 ? scorers[0].goals : 1;

  function getRankStyle(rank: number) {
    switch (rank) {
      case 1: return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 2: return 'text-gray-300 bg-gray-300/10 border-gray-300/20';
      case 3: return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-muted-foreground bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10';
    }
  }

  function getRankIcon(rank: number) {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
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
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-neon" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Top <span className="neon-text">Skor</span>
          </h3>
        </div>
        <button
          onClick={() => loadScorers(activeLeague)}
          disabled={refreshing}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* League Tabs */}
      {leagues.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-2 mb-3 -mx-1 px-1 custom-scrollbar">
          {leagues.map(league => (
            <button
              key={league.slug}
              onClick={() => { setActiveLeague(league.slug); setScorers([]); setLoading(true); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0 ${
                activeLeague === league.slug
                  ? 'bg-neon/10 text-neon border border-neon/20'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-500 dark:hover:text-gray-300 border border-transparent'
              }`}
            >
              {league.logo && <img src={league.logo} alt="" className="w-3.5 h-3.5 rounded-sm object-contain" />}
              <span className="hidden sm:inline">{league.name}</span>
              <span className="sm:hidden">{league.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mb-4">Musim {seasonLabel}</p>

      <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-1.5">
        {scorers.map((scorer, index) => {
          const progressWidth = maxGoals > 0 ? (scorer.goals / maxGoals) * 100 : 0;

          return (
            <motion.div
              key={scorer.rank}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
            >
              {/* Rank */}
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold border shrink-0 ${getRankStyle(scorer.rank)}`}
              >
                {getRankIcon(scorer.rank) || scorer.rank}
              </div>

              {/* Player Photo */}
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                {scorer.photo ? (
                  <img src={scorer.photo} alt={scorer.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 dark:text-gray-600">?</div>
                )}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-neon transition-colors">
                    {scorer.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {scorer.teamLogo && (
                    <img src={scorer.teamLogo} alt="" className="w-3 h-3 rounded-full object-contain" />
                  )}
                  <span className="truncate">{scorer.team}</span>
                </div>
                {/* Progress Bar */}
                <div className="mt-1 h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
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
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-right">
                  <div className="text-lg font-bold neon-text tabular-nums">
                    {scorer.goals}
                  </div>
                  <div className="text-[10px] text-muted-foreground">GOL</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-300 tabular-nums">
                    {scorer.assists}
                  </div>
                  <div className="text-[10px] text-muted-foreground">ASS</div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {loading && (
          <EmptyState icon="loading" />
        )}
        {!loading && scorers.length === 0 && (
          <EmptyState
            icon="empty"
            onRetry={() => loadScorers(activeLeague)}
            retrying={refreshing}
          />
        )}
      </div>
    </motion.div>
  );
}
