'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw } from 'lucide-react';

interface Standing {
  position: number;
  team: string;
  teamLogo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

interface LeagueOption {
  slug: string;
  name: string;
  logo: string;
}

export default function StandingsWidget() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [leagues, setLeagues] = useState<LeagueOption[]>([]);
  const [activeLeague, setActiveLeague] = useState('premier-league');
  const [seasonLabel, setSeasonLabel] = useState('2025/26');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStandings = async (league: string) => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/standings?league=${league}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.standings || [];
        if (Array.isArray(list)) setStandings(list);
        if (data.league) {
          // update active league name from API response
          setLeagues(prev => {
            if (prev.length > 0) return prev;
            return data.availableLeagues || prev;
          });
        }
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
    loadStandings(activeLeague);
  }, [activeLeague]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass-card p-4 sm:p-5"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-bold text-white">
          Klasemen <span className="neon-text">2025/26</span>
        </h3>
        <button
          onClick={() => loadStandings(activeLeague)}
          disabled={refreshing}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-40"
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
              onClick={() => { setActiveLeague(league.slug); setStandings([]); setLoading(true); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0 ${
                activeLeague === league.slug
                  ? 'bg-neon/10 text-neon border border-neon/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300 border border-transparent'
              }`}
            >
              {league.logo && <img src={league.logo} alt="" className="w-3.5 h-3.5 rounded-sm object-contain" />}
              <span className="hidden sm:inline">{league.name}</span>
              <span className="sm:hidden">{league.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mb-3">Musim {seasonLabel}</p>

      <div className="max-h-80 overflow-y-auto custom-scrollbar rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="w-8 text-center text-xs">#</TableHead>
              <TableHead className="text-xs">Tim</TableHead>
              <TableHead className="w-7 text-center text-xs hidden sm:table-cell">P</TableHead>
              <TableHead className="w-7 text-center text-xs hidden sm:table-cell">M</TableHead>
              <TableHead className="w-7 text-center text-xs hidden sm:table-cell">S</TableHead>
              <TableHead className="w-7 text-center text-xs hidden sm:table-cell">K</TableHead>
              <TableHead className="w-9 text-center text-xs">SG</TableHead>
              <TableHead className="w-10 text-center text-xs font-bold">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((row) => {
              const isChampionsLeague = row.position <= 4;
              const isEuropaLeague = row.position === 5 || row.position === 6;
              const isRelegation = row.position > standings.length - 3;
              const zoneClass = isChampionsLeague
                ? 'bg-green-500/5'
                : isEuropaLeague
                  ? 'bg-blue-500/5'
                  : isRelegation
                    ? 'bg-red-500/5'
                    : '';

              return (
                <TableRow
                  key={row.position}
                  className={`border-white/5 hover:bg-white/5 transition-colors ${zoneClass}`}
                >
                  <TableCell className="text-center text-xs font-bold text-muted-foreground">
                    <span
                      className={
                        isChampionsLeague
                          ? 'text-green-400'
                          : isEuropaLeague
                            ? 'text-blue-400'
                            : isRelegation
                              ? 'text-red-400'
                              : ''
                      }
                    >
                      {row.position}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-white">
                    <div className="flex items-center gap-1.5">
                      {row.teamLogo && (
                        <img src={row.teamLogo} alt={row.team} className="w-4 h-4 rounded-full object-contain shrink-0" />
                      )}
                      <span className="truncate">{row.team}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground hidden sm:table-cell">
                    {row.played}
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground hidden sm:table-cell">
                    {row.won}
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground hidden sm:table-cell">
                    {row.drawn}
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground hidden sm:table-cell">
                    {row.lost}
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {row.goalDiff > 0 ? '+' : ''}
                    {row.goalDiff}
                  </TableCell>
                  <TableCell className="text-center text-xs font-bold neon-text">
                    {row.points}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {loading && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Memuat klasemen...
          </div>
        )}
        {!loading && standings.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Tidak ada data tersedia
          </div>
        )}
      </div>

      {/* Zone Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5 text-[10px] text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-green-500/30 border border-green-500/30" />
          Champions League
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-blue-500/30 border border-blue-500/30" />
          Europa League
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-red-500/30 border border-red-500/30" />
          Degradasi
        </div>
      </div>
    </motion.div>
  );
}
