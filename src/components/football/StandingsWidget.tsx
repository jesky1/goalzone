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

interface Standing {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export default function StandingsWidget() {
  const [standings, setStandings] = useState<Standing[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/standings');
        if (res.ok && !cancelled) {
          const data = await res.json();
          setStandings(data.standings || data || []);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass-card p-4 sm:p-5"
    >
      <h3 className="text-lg font-bold text-white mb-1">
        Klasemen <span className="neon-text">Premier League</span>
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Musim 2024/2025</p>

      <div className="max-h-80 overflow-y-auto custom-scrollbar rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="w-8 text-center text-xs">#</TableHead>
              <TableHead className="text-xs">Tim</TableHead>
              <TableHead className="w-8 text-center text-xs">P</TableHead>
              <TableHead className="w-8 text-center text-xs">M</TableHead>
              <TableHead className="w-8 text-center text-xs">S</TableHead>
              <TableHead className="w-8 text-center text-xs">K</TableHead>
              <TableHead className="w-10 text-center text-xs">SG</TableHead>
              <TableHead className="w-10 text-center text-xs font-bold">
                Pts
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((row) => {
              const isChampionsLeague = row.position <= 4;
              const isRelegation = row.position > standings.length - 3;
              const zoneClass = isChampionsLeague
                ? 'bg-green-500/5'
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
                          : isRelegation
                            ? 'text-red-400'
                            : ''
                      }
                    >
                      {row.position}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-white">
                    {row.team}
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {row.played}
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {row.won}
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {row.drawn}
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">
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

        {standings.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Memuat klasemen...
          </div>
        )}
      </div>

      {/* Zone Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-green-500/30 border border-green-500/30" />
          Champions League
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-red-500/30 border border-red-500/30" />
          Degradasi
        </div>
      </div>
    </motion.div>
  );
}
