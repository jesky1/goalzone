'use client';

import { useState, useEffect, Component, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/football/Navbar';
import LiveScoreTicker from '@/components/football/LiveScoreTicker';
import StandingsWidget from '@/components/football/StandingsWidget';
import TopScorersWidget from '@/components/football/TopScorersWidget';
import FanTokenWidget from '@/components/football/FanTokenWidget';
import Footer from '@/components/football/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye, Calendar, ChevronRight, ChevronDown, ChevronUp, MapPin, User, X, Loader2, Sparkles, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';


// --- Error Boundary ---
class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback || null;
    return this.props.children;
  }
}

// --- Types ---
interface Article {
  id: string; title: string; slug: string; content?: string; summary: string | null;
  imageUrl: string | null; category: { name: string; slug: string };
  author: { username: string }; viewCount: number; readTime: number; createdAt: string; isFeatured?: boolean;
}

interface MatchEvent { type: string; minute: number; player: string; detail?: string; card?: string | null; }

interface Match {
  id: string; league: string; leagueLogo?: string;
  homeTeam: string; awayTeam: string; homeLogo?: string; awayLogo?: string;
  homeScore: number; awayScore: number; status: string; minute: number | null;
  homeEvents: MatchEvent[]; awayEvents: MatchEvent[];
}

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
    referee: string | null; venue: string | null;
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

interface Comment { id: string; text: string; user: { username: string }; createdAt: string; }

// --- Hero Section ---
function HeroSection({ articles, onArticleClick }: { articles: Article[]; onArticleClick?: (a: Article) => void }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (articles.length <= 1) return;
    const timer = setInterval(() => setCurrent((p) => (p + 1) % articles.length), 5000);
    return () => clearInterval(timer);
  }, [articles.length]);

  if (articles.length === 0) return null;
  const article = articles[current];

  return (
    <section id="home" className="relative w-full h-[400px] sm:h-[480px] md:h-[540px] overflow-hidden">
      <motion.div key={article.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} className="absolute inset-0">
        {article.imageUrl && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${article.imageUrl})` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-deep-900 via-deep-900/60 to-deep-900/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-deep-900/80 to-transparent" />
        <div className="relative h-full flex flex-col justify-end p-6 sm:p-8 md:p-12 max-w-7xl mx-auto">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <Badge className="bg-neon/10 text-neon border border-neon/20 text-xs font-bold mb-4">{article.category.name}</Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 max-w-3xl cursor-pointer hover:text-neon transition-colors" onClick={() => onArticleClick?.(article)}>
              {article.title}
            </h1>
            {article.summary && <p className="text-sm sm:text-base text-gray-300 max-w-2xl mb-4 line-clamp-2">{article.summary}</p>}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" /><span>{article.readTime} menit baca</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
      {articles.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {articles.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-neon w-8' : 'bg-white/20 w-2.5 hover:bg-white/40'}`}
              aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      )}
    </section>
  );
}

// --- News Card ---
function SimpleNewsCard({ article, onClick }: { article: Article; onClick?: (a: Article) => void }) {
  const timeAgo = formatDistanceToNow(new Date(article.createdAt), { addSuffix: true, locale: localeId });
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      whileHover={{ scale: 1.02 }} onClick={() => onClick?.(article)}
      className="glass-card glass-hover cursor-pointer overflow-hidden flex flex-col">
      <div className="relative w-full h-48 shrink-0 overflow-hidden">
        {article.imageUrl ? (
          <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-deep-700 to-deep-900 flex items-center justify-center">
            <span className="text-4xl text-white/10">⚽</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge className="bg-deep-900/80 backdrop-blur-sm border border-neon/20 text-neon text-xs font-bold">{article.category.name}</Badge>
        </div>
      </div>
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-base font-bold text-white mb-2 line-clamp-2 leading-snug">{article.title}</h3>
        {article.summary && <p className="text-sm text-gray-400 mb-3 line-clamp-2 flex-1">{article.summary}</p>}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-3 border-t border-white/5">
          <span className="font-medium text-gray-300">{article.author.username}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{timeAgo}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.viewCount}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime}m</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- News Section ---
function NewsSection({ onArticleClick }: { onArticleClick?: (a: Article) => void }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/articles?limit=12');
        if (res.ok && !cancelled) {
          const data = await res.json();
          const list = data.articles || [];
          if (Array.isArray(list)) setArticles(list);
        }
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="glass-card overflow-hidden flex flex-col">
          <Skeleton className="w-full h-48" />
          <div className="p-4 space-y-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-full" /><Skeleton className="h-4 w-3/4" /></div>
        </div>
      ))}
    </div>
  );
  if (articles.length === 0) return <div className="text-center py-16"><div className="text-4xl mb-4 opacity-20">⚽</div><p className="text-muted-foreground text-sm">Belum ada berita tersedia</p></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {articles.map((article) => <SimpleNewsCard key={article.id} article={article} onClick={onArticleClick} />)}
    </div>
  );
}

// --- Status Badge ---
function MatchStatusBadge({ status, minute }: { status: string; minute: number | null }) {
  if (status === 'LIVE') return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
      <span className="text-[11px] font-bold text-red-400 tabular-nums">{minute ? `${minute}'` : 'LIVE'}</span>
    </div>
  );
  if (status === 'HT') return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[11px] font-bold text-amber-400">HT</span>;
  if (status === 'FT') return <span className="px-2 py-0.5 rounded bg-white/10 text-[11px] font-bold text-gray-400">FT</span>;
  return <span className="px-2 py-0.5 rounded bg-white/5 text-[11px] font-bold text-gray-500">{minute ? `${minute}'` : 'NS'}</span>;
}

// --- Team Logo ---
function TeamLogo({ src, name, size = 24 }: { src?: string; name: string; size?: number }) {
  if (!src) return <div className="rounded-full bg-white/10 flex items-center justify-center shrink-0" style={{ width: size, height: size }}><span className="text-[10px] text-white/30">⚽</span></div>;
  return <img src={src} alt={name} className="rounded-full shrink-0" style={{ width: size, height: size }} loading="lazy" />;
}

// --- League Group Header ---
function LeagueHeader({ name, logo, matchCount }: { name: string; logo?: string; matchCount: number }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 px-1 border-b border-white/5">
      {logo ? <img src={logo} alt={name} className="w-5 h-5 rounded-sm object-contain" loading="lazy" /> : <div className="w-5 h-5 rounded-sm bg-white/10" />}
      <span className="text-sm font-semibold text-gray-200">{name}</span>
      <span className="text-[11px] text-gray-500 ml-auto">{matchCount} match{matchCount > 1 ? 'es' : ''}</span>
    </div>
  );
}

// --- Match Row (Clickable) ---
function MatchRow({ match, onClick }: { match: Match; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center gap-2 py-2.5 px-1 hover:bg-white/[0.04] rounded transition-colors cursor-pointer group">
      {/* Status */}
      <div className="w-10 shrink-0 text-center">
        <MatchStatusBadge status={match.status} minute={match.minute} />
      </div>
      {/* Time / Score */}
      <div className="w-12 shrink-0 text-center">
        <span className={`text-sm font-bold tabular-nums ${match.status === 'LIVE' ? 'text-white' : match.status === 'FT' ? 'text-gray-300' : 'text-gray-400'}`}>{match.homeScore} - {match.awayScore}</span>
      </div>
      {/* Home Team */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <TeamLogo src={match.homeLogo} name={match.homeTeam} size={20} />
        <span className={`text-sm truncate ${match.status === 'LIVE' ? 'text-white font-medium' : 'text-gray-300'}`}>{match.homeTeam}</span>
      </div>
      {/* Away Team */}
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className={`text-sm truncate text-right ${match.status === 'LIVE' ? 'text-white font-medium' : 'text-gray-300'}`}>{match.awayTeam}</span>
        <TeamLogo src={match.awayLogo} name={match.awayTeam} size={20} />
      </div>
      {/* Goal Events */}
      {(match.homeEvents?.filter(e => e.type === 'goal').length || match.awayEvents?.filter(e => e.type === 'goal').length) ? (
        <div className="w-6 shrink-0">
          <span className="text-[10px] text-gray-500">⚽</span>
        </div>
      ) : <div className="w-6 shrink-0" />}
      {/* Click indicator */}
      <ChevronRight className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  );
}

// ============================================
// MATCH DETAIL MODAL (Lineups + Stats)
// ============================================
function MatchDetailModal({ match, open, onClose }: { match: Match | null; open: boolean; onClose: () => void }) {
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'lineups' | 'stats' | 'events'>('lineups');
  const [showSubs, setShowSubs] = useState({ home: false, away: false });

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
    setActiveTab('lineups');
    setShowSubs({ home: false, away: false });
  }, [open, match]);

  if (!match) return null;

  const f = detail?.fixture;
  const hl = detail?.homeLineup;
  const al = detail?.awayLineup;

  const getPositionLabel = (pos: string) => {
    const labels: Record<string, string> = { G: 'GK', D: 'DEF', M: 'MID', F: 'FWD', SUB: 'SUB' };
    return labels[pos] || pos || 'N/A';
  };

  const getPositionColor = (pos: string) => {
    const colors: Record<string, string> = {
      G: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      D: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      M: 'bg-green-500/20 text-green-400 border-green-500/30',
      F: 'bg-red-500/20 text-red-400 border-red-500/30',
      SUB: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[pos] || 'bg-white/5 text-gray-400 border-white/10';
  };

  const renderPlayerRow = (player: LineupPlayer, isHome: boolean) => {
    const hasGoal = player.events.some(e => e.type === 'goal');
    const hasYellow = player.events.some(e => e.type === 'card' && e.detail?.includes('Yellow'));
    const hasRed = player.events.some(e => e.type === 'card' && e.detail?.includes('Red'));

    return (
      <div key={player.id} className={`flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/[0.03] transition-colors ${isHome ? '' : 'flex-row-reverse text-right'}`}>
        {/* Rating */}
        <div className="w-8 shrink-0 text-center">
          {player.rating ? (
            <span className={`text-[11px] font-bold tabular-nums ${player.rating >= 7 ? 'text-green-400' : player.rating >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
              {player.rating.toFixed(1)}
            </span>
          ) : (
            <span className="text-[11px] text-gray-600">-</span>
          )}
        </div>
        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 w-4 shrink-0 tabular-nums">{player.number}</span>
            <span className="text-[13px] text-white truncate">{player.name}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${getPositionColor(player.position)}`}>
              {getPositionLabel(player.position)}
            </span>
            {/* Event indicators */}
            {hasGoal && <span className="text-[10px]">⚽</span>}
            {hasYellow && <span className="w-2 h-2.5 rounded-sm bg-yellow-500 shrink-0" />}
            {hasRed && <span className="w-2 h-2.5 rounded-sm bg-red-500 shrink-0" />}
          </div>
        </div>
      </div>
    );
  };

  const renderTeamLineup = (lineup: TeamLineup, side: 'home' | 'away') => {
    const isHome = side === 'home';
    return (
      <div className="flex-1 min-w-0">
        {/* Team Header */}
        <div className={`flex items-center gap-2 mb-3 ${isHome ? '' : 'flex-row-reverse'}`}>
          <img src={lineup.team.logo} alt={lineup.team.name} className="w-6 h-6 rounded-full" />
          <div className={isHome ? '' : 'text-right'}>
            <span className="text-sm font-bold text-white">{lineup.team.name}</span>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <span className="bg-neon/10 text-neon px-2 py-0.5 rounded font-mono text-[10px] font-bold">{lineup.formation}</span>
              {lineup.coach.name && (
                <span className="flex items-center gap-1">
                  <User className="w-2.5 h-2.5" />
                  {lineup.coach.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Starting XI */}
        <div className="space-y-0.5 mb-2">
          {lineup.startXI.length > 0 ? (
            lineup.startXI.map(p => renderPlayerRow(p, isHome))
          ) : (
            <div className="text-[11px] text-gray-600 text-center py-4">Lineup belum tersedia</div>
          )}
        </div>

        {/* Substitutes Toggle */}
        {lineup.substitutes.length > 0 && (
          <>
            <button
              onClick={() => setShowSubs(prev => ({ ...prev, [side]: !prev[side] }))}
              className={`flex items-center gap-1 text-[11px] text-gray-400 hover:text-neon transition-colors py-2 ${isHome ? '' : 'ml-auto w-fit flex-row-reverse'}`}
            >
              <span>Pemain Pengganti ({lineup.substitutes.length})</span>
              {showSubs[side] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <AnimatePresence>
              {showSubs[side] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 pb-2">
                    {lineup.substitutes.map(p => renderPlayerRow(p, isHome))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    );
  };

  const renderStats = () => {
    if (!f) return null;
    const maxStatLen = Math.max(f.homeStatistics.length, f.awayStatistics.length);
    const stats: { type: string; home: string; away: string; homeVal: number; awayVal: number }[] = [];

    for (let i = 0; i < maxStatLen; i++) {
      const hs = f.homeStatistics[i];
      const as = f.awayStatistics[i];
      const type = hs?.type || as?.type || '';
      const homeVal = parseFloat(String(hs?.value || '0'));
      const awayVal = parseFloat(String(as?.value || '0'));
      const max = Math.max(homeVal, awayVal, 1);
      stats.push({
        type,
        home: hs?.value || '0',
        away: as?.value || '0',
        homeVal,
        awayVal,
      });
    }

    return (
      <div className="space-y-3">
        {stats.map((stat) => {
          const max = Math.max(stat.homeVal, stat.awayVal, 1);
          return (
            <div key={stat.type} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white font-medium w-16 text-right">{stat.home}</span>
                <span className="text-gray-500 flex-1 text-center">{stat.type}</span>
                <span className="text-white font-medium w-16">{stat.away}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex justify-end">
                  <div className="h-1.5 bg-neon/40 rounded-full transition-all" style={{ width: `${(stat.homeVal / max) * 100}%` }} />
                </div>
                <div className="w-2 h-2" />
                <div className="flex-1">
                  <div className="h-1.5 bg-white/30 rounded-full transition-all" style={{ width: `${(stat.awayVal / max) * 100}%` }} />
                </div>
              </div>
            </div>
          );
        })}
        {stats.length === 0 && <div className="text-center text-[11px] text-gray-600 py-6">Statistik belum tersedia</div>}
      </div>
    );
  };

  const renderEvents = () => {
    if (!f) return null;
    const allEvents: (MatchEvent & { side: 'home' | 'away' })[] = [
      ...f.homeEvents.map(e => ({ ...e, side: 'home' as const })),
      ...f.awayEvents.map(e => ({ ...e, side: 'away' as const })),
    ].sort((a, b) => a.minute - b.minute);

    return (
      <div className="space-y-1.5">
        {allEvents.map((e, i) => (
          <div key={i} className={`flex items-center gap-2 py-1.5 px-2 rounded text-[12px] ${e.side === 'home' ? '' : 'flex-row-reverse'}`}>
            <span className="text-gray-500 tabular-nums w-8 shrink-0">{e.minute}&apos;</span>
            {e.type === 'goal' ? (
              <span className="text-[11px]">⚽</span>
            ) : e.card === 'red' ? (
              <span className="w-2.5 h-3 rounded-sm bg-red-500 shrink-0" />
            ) : (
              <span className="w-2.5 h-3 rounded-sm bg-yellow-500 shrink-0" />
            )}
            <span className="text-white">{e.player}</span>
            {e.detail && <span className="text-gray-500 text-[10px]">({e.detail})</span>}
          </div>
        ))}
        {allEvents.length === 0 && <div className="text-center text-[11px] text-gray-600 py-6">Belum ada event</div>}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto custom-scrollbar bg-deep-800 border-white/10 p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-neon animate-spin" />
            <span className="text-sm text-gray-400">Memuat detail pertandingan...</span>
          </div>
        ) : (
          <>
            {/* Match Header */}
            <div className="bg-gradient-to-b from-deep-700 to-deep-800 p-5">
              {/* Close Button */}
              <div className="flex justify-end mb-2">
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* League Info */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {f?.league.logo && <img src={f.league.logo} alt="" className="w-4 h-4 rounded-sm" />}
                <span className="text-[11px] text-gray-400 font-medium">{f?.league.name}</span>
                {f?.league.round && <span className="text-[10px] text-gray-600">· {f.league.round}</span>}
              </div>

              {/* Teams + Score */}
              <div className="flex items-center justify-center gap-4 sm:gap-8">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <img src={f?.homeLogo || match.homeLogo} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full" />
                  <span className="text-sm font-bold text-white text-center">{f?.homeTeam || match.homeTeam}</span>
                </div>

                {/* Score */}
                <div className="flex flex-col items-center">
                  <MatchStatusBadge status={f?.status || match.status} minute={f?.elapsed || match.minute} />
                  <div className="text-3xl sm:text-4xl font-black text-white tabular-nums mt-2">
                    {f?.homeScore ?? match.homeScore} - {f?.awayScore ?? match.awayScore}
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <img src={f?.awayLogo || match.awayLogo} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full" />
                  <span className="text-sm font-bold text-white text-center">{f?.awayTeam || match.awayTeam}</span>
                </div>
              </div>

              {/* Match Info */}
              <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-gray-500">
                {f?.venue && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{f.venue}</span>
                )}
                {f?.referee && (
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{f.referee}</span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 px-2">
              {(['lineups', 'stats', 'events'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-xs font-semibold transition-colors relative ${
                    activeTab === tab ? 'text-neon' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab === 'lineups' ? 'Lineup' : tab === 'stats' ? 'Statistik' : 'Events'}
                  {activeTab === tab && (
                    <motion.div layoutId="match-tab" className="absolute bottom-0 left-2 right-2 h-0.5 bg-neon rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-5">
              {activeTab === 'lineups' && hl && al && (
                <div className="flex gap-4 sm:gap-6">
                  {renderTeamLineup(hl, 'home')}
                  <div className="w-px bg-white/5 shrink-0" />
                  {renderTeamLineup(al, 'away')}
                </div>
              )}
              {activeTab === 'stats' && renderStats()}
              {activeTab === 'events' && renderEvents()}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- Article Modal ---
function ArticleModalView({ article, open, onClose }: { article: Article | null; open: boolean; onClose: () => void }) {
  const [fullArticle, setFullArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !article) return;
    const loadArticle = async () => {
      try {
        const res = await fetch(`/api/articles/${article.slug}`);
        if (res.ok) setFullArticle(await res.json());
      } catch { setFullArticle(article); }
    };
    const loadComments = async () => {
      try {
        const res = await fetch(`/api/articles/${article.slug}/comments`);
        if (res.ok) { const d = await res.json(); if (Array.isArray(d.comments || [])) setComments(d.comments); }
      } catch { /* silent */ }
    };
    loadArticle(); loadComments();
  }, [open, article]);

  const handleSubmit = async () => {
    if (!article || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/articles/${article.slug}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo-user', text: commentText.trim() }),
      });
      if (res.ok) {
        setCommentText('');
        const r = await fetch(`/api/articles/${article.slug}/comments`);
        if (r.ok) { const d = await r.json(); if (Array.isArray(d.comments || [])) setComments(d.comments); }
      }
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  const display = fullArticle || article;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-deep-800 border-white/10 p-0">
        {display && (
          <>
            <div className="relative w-full h-64 sm:h-80">
              {display.imageUrl ? (
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${display.imageUrl})` }} />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-deep-700 to-deep-900 flex items-center justify-center"><span className="text-6xl text-white/10">⚽</span></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-deep-800 via-transparent to-transparent" />
            </div>
            <div className="p-5 sm:p-6 -mt-8 relative">
              <DialogHeader className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-neon/10 text-neon border-neon/20 text-xs font-bold">{display.category.name}</Badge>
                  <Badge variant="secondary" className="bg-white/5 text-muted-foreground text-xs"><Eye className="w-3 h-3 mr-1" />{display.viewCount} views</Badge>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-white leading-tight">{display.title}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-5">
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{display.author.username}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDistanceToNow(new Date(display.createdAt), { addSuffix: true, locale: localeId })}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{display.readTime} menit baca</span>
              </div>

              {display.summary && (
                <div className="glass-card p-4 mb-6 border-neon/10">
                  <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-neon" /><span className="text-xs font-bold neon-text">AI Summary</span></div>
                  <p className="text-sm text-gray-300 leading-relaxed">{display.summary}</p>
                </div>
              )}

              {(fullArticle?.content || display.content) && (
                <div
                  className="mb-6 text-sm sm:text-base text-gray-300 leading-relaxed [&_p]:mb-4"
                  dangerouslySetInnerHTML={{ __html: fullArticle?.content || display.content || '' }}
                />
              )}

              <Separator className="bg-white/5 my-6" />
              <div>
                <h4 className="text-base font-bold text-white mb-4">Komentar ({comments.length})</h4>
                <div className="flex gap-3 mb-6">
                  <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Tulis komentar..."
                    className="min-h-[80px] bg-white/5 border-white/10 text-sm placeholder:text-muted-foreground focus:border-neon/30 focus:ring-neon/20 resize-none" rows={3} />
                  <button onClick={handleSubmit} disabled={!commentText.trim() || submitting}
                    className="self-end bg-neon/10 text-neon hover:bg-neon/20 border border-neon/20 p-2.5 rounded-lg shrink-0 disabled:opacity-40">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c.id} className="glass p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-medium text-white">{c.user.username}</span>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: localeId })}</span>
                      </div>
                      <p className="text-sm text-gray-300">{c.text}</p>
                    </div>
                  ))}
                  {comments.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">Belum ada komentar. Jadilah yang pertama berkomentar!</p>}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function Home() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);


  useEffect(() => {
    let cancelled = false;
    const loadMatches = async () => {
      try {
        const res = await fetch('/api/live-scores');
        if (res.ok && !cancelled) {
          const data = await res.json();
          const all = data.matches || [];
          if (Array.isArray(all)) {
            const live = all.filter((m: Match) => m.status === 'LIVE');
            const other = all.filter((m: Match) => m.status !== 'LIVE').slice(0, 3);
            setLiveMatches([...live, ...other]);
          }
        }
      } catch { /* silent */ }
      finally { if (!cancelled) setMatchesLoading(false); }
    };
    const loadFeatured = async () => {
      try {
        const res = await fetch('/api/articles?featured=true&limit=5');
        if (res.ok && !cancelled) {
          const data = await res.json();
          const list = data.articles || [];
          if (Array.isArray(list)) setFeaturedArticles(list);
        }
      } catch { /* silent */ }
    };
    loadMatches(); loadFeatured();
    const interval = setInterval(loadMatches, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleArticleClick = (article: Article) => { setSelectedArticle(article); setModalOpen(true); };
  const handleCloseModal = () => { setModalOpen(false); setTimeout(() => setSelectedArticle(null), 300); };
  const handleMatchClick = (match: Match) => { setSelectedMatch(match); setMatchModalOpen(true); };
  const handleCloseMatchModal = () => { setMatchModalOpen(false); setTimeout(() => setSelectedMatch(null), 300); };

  return (
    <div className="min-h-screen flex flex-col bg-deep-900 cyber-grid">
      <Navbar />
      <LiveScoreTicker />

      <main className="flex-1 pt-[104px]">
        {/* Hero Slider */}
        <ErrorBoundary fallback={<div className="h-[400px] bg-deep-800" />}>
          <HeroSection articles={featuredArticles} onArticleClick={handleArticleClick} />
        </ErrorBoundary>

        {/* Live Scores */}
        <section id="live" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500 live-pulse" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">Live <span className="neon-text">Score</span></h2>
            </div>
            <p className="text-xs text-muted-foreground">Klik pertandingan untuk lihat lineup & statistik</p>
          </motion.div>
          {matchesLoading ? (
            <div className="glass-card p-4 space-y-4">
              {[1,2,3].map(i => <div key={i} className="flex items-center gap-2 py-2"><Skeleton className="h-4 w-10 bg-white/5" /><Skeleton className="h-4 w-12 bg-white/5" /><Skeleton className="h-4 w-32 bg-white/5" /><Skeleton className="h-4 w-32 bg-white/5" /></div>)}
            </div>
          ) : (() => {
            // Group matches by league
            const leagueMap = new Map<string, { league: string; logo?: string; matches: Match[] }>();
            liveMatches.forEach(m => {
              if (!leagueMap.has(m.league)) leagueMap.set(m.league, { league: m.league, logo: m.leagueLogo, matches: [] });
              leagueMap.get(m.league)!.matches.push(m);
            });
            const leagues = [...leagueMap.values()];
            // Sort leagues: ones with LIVE matches first
            leagues.sort((a, b) => {
              const aLive = a.matches.some(m => m.status === 'LIVE');
              const bLive = b.matches.some(m => m.status === 'LIVE');
              if (aLive && !bLive) return -1;
              if (!aLive && bLive) return 1;
              return 0;
            });
            return (
              <div className="space-y-3">
                {leagues.map((league) => (
                  <motion.div key={league.league} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card overflow-hidden">
                    <LeagueHeader name={league.league} logo={league.logo} matchCount={league.matches.length} />
                    <div className="divide-y divide-white/[0.03]">
                      {league.matches.map((match) => (
                        <MatchRow key={match.id} match={match} onClick={() => handleMatchClick(match)} />
                      ))}
                    </div>
                  </motion.div>
                ))}
                {liveMatches.length === 0 && (
                  <div className="glass-card p-8 text-center">
                    <div className="text-3xl mb-3 opacity-20">⚽</div>
                    <p className="text-sm text-muted-foreground">Tidak ada pertandingan hari ini</p>
                    <p className="text-xs text-gray-600 mt-1">Data akan otomatis update ketika ada pertandingan</p>
                  </div>
                )}
              </div>
            );
          })()}
        </section>

        {/* News + Sidebar */}
        <section id="standings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              <NewsSection onArticleClick={handleArticleClick} />
            </div>
            <div className="lg:col-span-1 space-y-6">
              {/* Fan Token Widget - Real-Time from CoinGecko */}
              <ErrorBoundary>
                <FanTokenWidget />
              </ErrorBoundary>
              <ErrorBoundary>
                <StandingsWidget />
              </ErrorBoundary>
              <ErrorBoundary>
                <TopScorersWidget />
              </ErrorBoundary>
            </div>
          </div>
        </section>

        {/* Transfer CTA */}
        <section id="transfer" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Berita <span className="neon-text">Transfer</span></h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">Dapatkan update terbaru seputar transfer pemain dari seluruh liga top Eropa</p>
            <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-neon bg-neon/10 border border-neon/20 hover:bg-neon/20 hover:neon-glow transition-all duration-300">
              Lihat Semua Transfer <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </section>
      </main>

      <Footer />

      <ArticleModalView article={selectedArticle} open={modalOpen} onClose={handleCloseModal} />
      <MatchDetailModal match={selectedMatch} open={matchModalOpen} onClose={handleCloseMatchModal} />

    </div>
  );
}
