'use client';

import { useState, useEffect, useCallback, Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/football/Navbar';
import LiveScoreTicker from '@/components/football/LiveScoreTicker';
import StandingsWidget from '@/components/football/StandingsWidget';
import TopScorersWidget from '@/components/football/TopScorersWidget';
import FanTokenWidget from '@/components/football/FanTokenWidget';
import Footer from '@/components/football/Footer';
import AdminPanel from '@/components/admin/AdminPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye, Calendar, ChevronRight } from 'lucide-react';
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
import { Send, Loader2, Sparkles, User } from 'lucide-react';

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

interface MatchEvent { type: string; minute: number; player: string; }

interface Match {
  id: string; league: string; homeTeam: string; awayTeam: string;
  homeScore: number; awayScore: number; status: string; minute: number | null;
  homeEvents: MatchEvent[]; awayEvents: MatchEvent[];
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

// --- Live Match Card ---
function LiveMatchCard({ match, index }: { match: Match; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }} whileHover={{ scale: 1.01 }} className="glass-card glass-hover p-4">
      <div className="text-xs text-muted-foreground font-medium mb-3">{match.league}</div>
      <div className="flex justify-center mb-3">
        {match.status === 'LIVE' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-500 live-pulse" />
            <span className="text-xs font-bold text-red-400">{match.minute ? `${match.minute}'` : 'LIVE'}</span>
          </div>
        )}
        {match.status === 'HT' && <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/20 text-xs font-bold text-amber-400">HT</span>}
        {match.status === 'FT' && <span className="px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/20 text-xs font-bold text-green-400">FT</span>}
        {match.status === 'NS' && <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-400">NS</span>}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 text-right">
          <div className="font-bold text-sm sm:text-base text-white">{match.homeTeam}</div>
          <div className="flex flex-wrap gap-1 mt-1.5 justify-end">
            {match.homeEvents?.filter((e) => e.type === 'goal').map((e, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neon/10 text-xs text-neon">{e.minute}&apos; <span className="text-gray-300">{e.player}</span></span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-2xl sm:text-3xl font-bold neon-text tabular-nums">{match.homeScore}</span>
          <span className="text-lg text-gray-500">-</span>
          <span className="text-2xl sm:text-3xl font-bold neon-text tabular-nums">{match.awayScore}</span>
        </div>
        <div className="flex-1 text-left">
          <div className="font-bold text-sm sm:text-base text-white">{match.awayTeam}</div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {match.awayEvents?.filter((e) => e.type === 'goal').map((e, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neon/10 text-xs text-neon">{e.minute}&apos; <span className="text-gray-300">{e.player}</span></span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
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
                <div className="mb-6">
                  {(fullArticle?.content || display.content || '').split('\n\n').map((p, i) => (
                    <p key={i} className="text-sm sm:text-base text-gray-300 leading-relaxed mb-4">{p}</p>
                  ))}
                </div>
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
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

  // Keyboard shortcut: Ctrl+Shift+A to open Admin Panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setAdminPanelOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const handleArticleClick = (article: Article) => { setSelectedArticle(article); setModalOpen(true); };
  const handleCloseModal = () => { setModalOpen(false); setTimeout(() => setSelectedArticle(null), 300); };

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
            <p className="text-xs text-muted-foreground">Pertandingan yang sedang berlangsung dari berbagai liga</p>
          </motion.div>
          {matchesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="glass-card p-4">
                  <Skeleton className="h-4 w-24 mb-3 bg-white/5" />
                  <div className="flex justify-center gap-2"><Skeleton className="h-8 w-20 bg-white/5" /><Skeleton className="h-8 w-6 bg-white/5" /><Skeleton className="h-8 w-20 bg-white/5" /></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.map((match, index) => <LiveMatchCard key={match.id} match={match} index={index} />)}
            </div>
          )}
        </section>

        {/* News + Sidebar */}
        <section id="standings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              <NewsSection onArticleClick={handleArticleClick} />
            </div>
            <div className="lg:col-span-1 space-y-6">
              {/* Fan Token Widget - New Feature */}
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
      <AdminPanel open={adminPanelOpen} onClose={() => setAdminPanelOpen(false)} />
    </div>
  );
}
