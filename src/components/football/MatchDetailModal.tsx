'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { safeSrc } from '@/lib/safe-src';
import PitchView from '@/components/football/PitchView';
import LineupSection from '@/components/football/LineupSection';
import RefereeModal from '@/components/football/RefereeModal';
import StadiumName from '@/components/football/StadiumName';
import type { RefereeData } from '@/components/football/RefereeModal';
import { MatchStatusBadge } from '@/components/football/MatchSection';
import type { Match, MatchEvent } from '@/components/football/MatchSection';
import { Loader2, ChevronRight, ChevronDown, ChevronUp, User, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────
interface LineupPlayer {
  id: number; name: string; number: number; position: string;
  grid: string | null; rating: number | null; photo: string;
  events: { type: string; detail: string; time: number }[];
}

interface TeamLineup {
  team: { id: number; name: string; logo: string };
  coach: { id: number; name: string; photo: string };
  formation: string;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
}

interface MatchDetail {
  fixture: {
    id: number; date: string; status: string; elapsed: number | null;
    referee: string | null; venue: string | null; venueCity?: string | null; venueCapacity?: number | null;
    homeTeam: string; awayTeam: string; homeLogo: string; awayLogo: string;
    homeScore: number | null; awayScore: number | null;
    homeWinner: boolean | null; awayWinner: boolean | null;
    league: { name: string; country: string; logo: string; round: string };
    homeEvents: MatchEvent[]; awayEvents: MatchEvent[];
    homeStatistics: { type: string; value: any }[];
    awayStatistics: { type: string; value: any }[];
  };
  homeLineup: TeamLineup;
  awayLineup: TeamLineup;
  source: string;
}

// ─── Position Helpers ─────────────────────────────────────
const getPositionLabel = (pos: string) => {
  const labels: Record<string, string> = { G: 'GK', D: 'DEF', M: 'MID', F: 'FWD', SUB: 'SUB' };
  return labels[pos] || pos || 'N/A';
};

const getPositionColor = (pos: string) => {
  const colors: Record<string, string> = {
    G: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
    D: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
    M: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
    F: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
    SUB: 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-400/30 dark:border-gray-500/30',
  };
  return colors[pos] || 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10';
};

// ─── Player Row ───────────────────────────────────────────
function PlayerRow({ player, isHome }: { player: LineupPlayer; isHome: boolean }) {
  const hasGoal = player.events.some(e => e.type === 'goal');
  const hasYellow = player.events.some(e => e.type === 'card' && e.detail?.includes('Yellow'));
  const hasRed = player.events.some(e => e.type === 'card' && e.detail?.includes('Red'));

  return (
    <div className={`flex items-center gap-2 py-1.5 px-2 rounded hover:bg-black/5 dark:hover:bg-white/[0.03] transition-colors ${isHome ? '' : 'flex-row-reverse text-right'}`}>
      <div className="w-8 shrink-0 text-center">
        {player.rating ? (
          <span className={`text-[11px] font-bold tabular-nums ${player.rating >= 7 ? 'text-green-600 dark:text-green-400' : player.rating >= 6 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
            {player.rating.toFixed(1)}
          </span>
        ) : (
          <span className="text-[11px] text-gray-300 dark:text-gray-600">-</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-500 w-4 shrink-0 tabular-nums">{player.number}</span>
          <span className="text-[13px] text-gray-900 dark:text-white truncate">{player.name}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${getPositionColor(player.position)}`}>
            {getPositionLabel(player.position)}
          </span>
          {hasGoal && <span className="text-[10px]">⚽</span>}
          {hasYellow && <span className="w-2 h-2.5 rounded-sm bg-yellow-500 shrink-0" />}
          {hasRed && <span className="w-2 h-2.5 rounded-sm bg-red-500 shrink-0" />}
        </div>
      </div>
    </div>
  );
}

// ─── Team Lineup ──────────────────────────────────────────
function TeamLineupView({ lineup, side, showSubs, onToggleSubs }: {
  lineup: TeamLineup; side: 'home' | 'away';
  showSubs: boolean; onToggleSubs: () => void;
}) {
  const isHome = side === 'home';
  return (
    <div className="flex-1 min-w-0">
      <div className={`flex items-center gap-2 mb-3 ${isHome ? '' : 'flex-row-reverse'}`}>
        {safeSrc(lineup.team.logo) ? (
          <img src={safeSrc(lineup.team.logo)} alt={lineup.team.name} className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0"><span className="text-[8px]">⚽</span></div>
        )}
        <div className={isHome ? '' : 'text-right'}>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{lineup.team.name}</span>
          <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400">
            <span className="bg-cyan-500/10 text-cyan-700 dark:bg-neon/10 dark:text-neon px-2 py-0.5 rounded font-mono text-[10px] font-bold">{lineup.formation}</span>
            {lineup.coach.name && (
              <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{lineup.coach.name}</span>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-0.5 mb-2">
        {lineup.startXI.length > 0 ? (
          lineup.startXI.map(p => <PlayerRow key={p.id} player={p} isHome={isHome} />)
        ) : (
          <div className="text-[11px] text-gray-400 dark:text-gray-600 text-center py-4">Lineup belum tersedia</div>
        )}
      </div>
      {lineup.substitutes.length > 0 && (
        <>
          <button
            onClick={onToggleSubs}
            className={`flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400 hover:text-cyan-700 dark:hover:text-neon transition-colors py-2 ${isHome ? '' : 'ml-auto w-fit flex-row-reverse'}`}
          >
            <span>Pemain Pengganti ({lineup.substitutes.length})</span>
            {showSubs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <AnimatePresence>
            {showSubs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-0.5 pb-2">
                  {lineup.substitutes.map(p => <PlayerRow key={p.id} player={p} isHome={isHome} />)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ─── Stats View ───────────────────────────────────────────
function StatsView({ homeStats, awayStats }: { homeStats: { type: string; value: any }[]; awayStats: { type: string; value: any }[] }) {
  const maxStatLen = Math.max(homeStats.length, awayStats.length);
  const stats: { type: string; home: string; away: string; homeVal: number; awayVal: number }[] = [];

  for (let i = 0; i < maxStatLen; i++) {
    const hs = homeStats[i];
    const as = awayStats[i];
    stats.push({
      type: hs?.type || as?.type || '',
      home: hs?.value || '0',
      away: as?.value || '0',
      homeVal: parseFloat(String(hs?.value || '0')),
      awayVal: parseFloat(String(as?.value || '0')),
    });
  }

  return (
    <div className="space-y-3">
      {stats.map((stat) => {
        const max = Math.max(stat.homeVal, stat.awayVal, 1);
        return (
          <div key={stat.type} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-900 dark:text-white font-medium w-16 text-right">{stat.home}</span>
              <span className="text-gray-500 dark:text-gray-500 flex-1 text-center">{stat.type}</span>
              <span className="text-gray-900 dark:text-white font-medium w-16">{stat.away}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex justify-end">
                <div className="h-1.5 bg-cyan-500/50 dark:bg-neon/40 rounded-full transition-all" style={{ width: `${(stat.homeVal / max) * 100}%` }} />
              </div>
              <div className="w-2 h-2" />
              <div className="flex-1">
                <div className="h-1.5 bg-gray-400/40 dark:bg-white/30 rounded-full transition-all" style={{ width: `${(stat.awayVal / max) * 100}%` }} />
              </div>
            </div>
          </div>
        );
      })}
      {stats.length === 0 && <div className="text-center text-[11px] text-gray-400 dark:text-gray-600 py-6">Statistik belum tersedia</div>}
    </div>
  );
}

// ─── Events View ──────────────────────────────────────────
function EventsView({ homeEvents, awayEvents }: { homeEvents: MatchEvent[]; awayEvents: MatchEvent[] }) {
  const allEvents: (MatchEvent & { side: 'home' | 'away' })[] = [
    ...homeEvents.map(e => ({ ...e, side: 'home' as const })),
    ...awayEvents.map(e => ({ ...e, side: 'away' as const })),
  ].sort((a, b) => a.minute - b.minute);

  return (
    <div className="space-y-1.5">
      {allEvents.map((e, i) => (
        <div key={i} className={`flex items-center gap-2 py-1.5 px-2 rounded text-[12px] ${e.side === 'home' ? '' : 'flex-row-reverse'}`}>
          <span className="text-gray-500 dark:text-gray-500 tabular-nums w-8 shrink-0">{e.minute}&apos;</span>
          {e.type === 'goal' ? (
            <span className="text-[11px]">⚽</span>
          ) : e.card === 'red' ? (
            <span className="w-2.5 h-3 rounded-sm bg-red-500 shrink-0" />
          ) : (
            <span className="w-2.5 h-3 rounded-sm bg-yellow-500 shrink-0" />
          )}
          <span className="text-gray-900 dark:text-white">{e.player}</span>
          {e.detail && <span className="text-gray-500 dark:text-gray-500 text-[10px]">({e.detail})</span>}
        </div>
      ))}
      {allEvents.length === 0 && <div className="text-center text-[11px] text-gray-400 dark:text-gray-600 py-6">Belum ada event</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN: MatchDetailModal (Radix UI Dialog)
// Glassmorphism: bg-black/60 dark | bg-white/30 light
// ═══════════════════════════════════════════════════════════
export default function MatchDetailModal({ match, open, onClose }: {
  match: Match | null;
  open: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pitch' | 'lineups' | 'stats' | 'events'>('pitch');
  const [showSubs, setShowSubs] = useState({ home: false, away: false });
  const [refereeData, setRefereeData] = useState<RefereeData | null>(null);
  const [refereeModalOpen, setRefereeModalOpen] = useState(false);

  // Fetch detail when modal opens
  useEffect(() => {
    if (!open || !match) return;
    const loadDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/fixtures/${match.id}`);
        if (res.ok) {
          const data = await res.json();
          setDetail(data);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    loadDetail();
    setActiveTab('pitch');
    setShowSubs({ home: false, away: false });
    setDetail(null);
  }, [open, match]);

  // Handle referee click
  const handleRefereeClick = async (name: string) => {
    try {
      const res = await fetch(`/api/referees/${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        setRefereeData(data.referee);
        setRefereeModalOpen(true);
      }
    } catch { /* silent */ }
  };

  if (!match) return null;

  const f = detail?.fixture;
  const hl = detail?.homeLineup;
  const al = detail?.awayLineup;

  const tabs = [
    { key: 'pitch' as const, label: 'Taktik' },
    { key: 'lineups' as const, label: 'Susunan Pemain' },
    { key: 'stats' as const, label: 'Statistik' },
    { key: 'events' as const, label: 'Events' },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className={`
            max-w-4xl max-h-[92vh] overflow-y-auto custom-scrollbar p-0
            bg-white dark:bg-black/60
            border-slate-200 dark:border-cyan-500/20
            shadow-sm dark:shadow-[0_8px_32px_rgba(0,255,255,0.08),0_0_60px_rgba(0,255,255,0.04)]
          `}
          overlayClassName={`
            bg-black/30 dark:bg-black/60
          `}
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{match.homeTeam} vs {match.awayTeam} - Detail Pertandingan</DialogTitle>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-6 h-6 text-cyan-600 dark:text-neon animate-spin" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Memuat detail pertandingan...</span>
            </div>
          ) : (
            <>
              {/* ── Match Header ── */}
              <div className="bg-slate-50 dark:bg-black/40 border-b border-slate-200 dark:border-cyan-500/10 p-5">
                {/* Close Button */}
                <div className="flex justify-end mb-2">
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* League Info */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  {safeSrc(f?.league.logo) && <img src={safeSrc(f.league.logo)} alt="" className="w-4 h-4 rounded-sm" />}
                  <span className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">{f?.league.name || match.league}</span>
                  {f?.league.round && <span className="text-[10px] text-gray-400 dark:text-gray-600">· {f.league.round}</span>}
                </div>

                {/* Teams + Score */}
                <div className="flex items-center justify-center gap-4 sm:gap-8">
                  {/* Home */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    {safeSrc(f?.homeLogo || match.homeLogo) ? (
                      <img src={safeSrc(f?.homeLogo || match.homeLogo)} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full" />
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center"><span className="text-2xl">⚽</span></div>
                    )}
                    <span className="text-sm font-bold text-gray-900 dark:text-white text-center">{f?.homeTeam || match.homeTeam}</span>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-center">
                    <MatchStatusBadge status={f?.status || match.status} minute={f?.elapsed || match.minute} />
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums mt-2 dark:drop-shadow-[0_0_10px_rgba(0,255,255,0.15)]">
                      {f?.homeScore ?? match.homeScore} - {f?.awayScore ?? match.awayScore}
                    </div>
                  </div>

                  {/* Away */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    {safeSrc(f?.awayLogo || match.awayLogo) ? (
                      <img src={safeSrc(f?.awayLogo || match.awayLogo)} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full" />
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center"><span className="text-2xl">⚽</span></div>
                    )}
                    <span className="text-sm font-bold text-gray-900 dark:text-white text-center">{f?.awayTeam || match.awayTeam}</span>
                  </div>
                </div>

                {/* Match Info */}
                <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-gray-500 dark:text-gray-500 flex-wrap">
                  {f?.venue && <StadiumName name={f.venue} city={f.venueCity || undefined} />}
                  {f?.referee && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRefereeClick(f.referee!); }}
                      className="flex items-center gap-1 hover:text-cyan-700 dark:hover:text-neon transition-colors cursor-pointer group"
                    >
                      <User className="w-3 h-3 group-hover:scale-110 transition-transform" />
                      <span className="underline underline-offset-2 decoration-dotted decoration-gray-400 dark:decoration-gray-500 group-hover:decoration-cyan-600 dark:group-hover:decoration-neon transition-colors">{f.referee}</span>
                      <ChevronRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>
              </div>

              {/* ── Tabs ── */}
              <div className="flex border-b border-slate-200 dark:border-cyan-500/10 px-2">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-3 text-xs font-semibold transition-colors relative ${
                      activeTab === tab.key
                        ? 'text-cyan-700 dark:text-neon'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <motion.div layoutId="match-detail-tab" className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-600 dark:bg-neon rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* ── Tab Content ── */}
              <div className="p-4 sm:p-5">
                {activeTab === 'pitch' && hl && al && hl.startXI.length > 0 && al.startXI.length > 0 && (
                  <PitchView
                    homeLineup={hl}
                    awayLineup={al}
                    homeScore={f?.homeScore ?? match.homeScore}
                    awayScore={f?.awayScore ?? match.awayScore}
                    homeTeam={f?.homeTeam || match.homeTeam}
                    awayTeam={f?.awayTeam || match.awayTeam}
                    homeLogo={f?.homeLogo || match.homeLogo || ''}
                    awayLogo={f?.awayLogo || match.awayLogo || ''}
                  />
                )}
                {activeTab === 'pitch' && (!hl?.startXI?.length || !al?.startXI?.length) && (
                  <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">Data taktik belum tersedia</div>
                )}
                {activeTab === 'lineups' && hl && al && (
                  <LineupSection
                    homeLineup={hl}
                    awayLineup={al}
                    homeScore={f?.homeScore ?? match.homeScore}
                    awayScore={f?.awayScore ?? match.awayScore}
                    homeTeam={f?.homeTeam || match.homeTeam}
                    awayTeam={f?.awayTeam || match.awayTeam}
                    homeLogo={f?.homeLogo || match.homeLogo || ''}
                    awayLogo={f?.awayLogo || match.awayLogo || ''}
                  />
                )}
                {activeTab === 'lineups' && (!hl || !al) && (
                  <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">Data lineup belum tersedia</div>
                )}
                {activeTab === 'stats' && f && (
                  <StatsView homeStats={f.homeStatistics} awayStats={f.awayStatistics} />
                )}
                {activeTab === 'stats' && !f && (
                  <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">Statistik belum tersedia</div>
                )}
                {activeTab === 'events' && f && (
                  <EventsView homeEvents={f.homeEvents} awayEvents={f.awayEvents} />
                )}
                {activeTab === 'events' && !f && (
                  <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">Belum ada event</div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Referee Sub-Modal */}
      <RefereeModal referee={refereeData} open={refereeModalOpen} onClose={() => { setRefereeModalOpen(false); setTimeout(() => setRefereeData(null), 300); }} />
    </>
  );
}
