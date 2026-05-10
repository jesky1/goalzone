'use client';

import { useState, useEffect, useCallback, Component, ReactNode, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import StandingsWidget from '@/components/football/StandingsWidget';
import TopScorersWidget from '@/components/football/TopScorersWidget';
import FanTokenWidget from '@/components/football/FanTokenWidget';
import MatchSection from '@/components/football/MatchSection';
import type { Match } from '@/components/football/MatchSection';
import MatchDetailModal from '@/components/football/MatchDetailModal';
import TransferFeed from '@/components/football/TransferFeed';
import FormationLineup from '@/components/football/FormationLineup';
import AdSenseSlot from '@/components/football/AdSenseSlot';
import { WebsiteJsonLd, OrganizationJsonLd } from '@/components/football/JsonLd';
import GoogleNewsSchema from '@/components/football/GoogleNewsSchema';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye, Calendar, ChevronRight, Loader2, Sparkles, Send, User } from 'lucide-react';
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
    <section id="home" className="relative w-full h-[460px] sm:h-[540px] md:h-[600px] overflow-hidden -mt-16 pt-16">
      <AnimatePresence mode="wait">
        <motion.div key={article.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }} className="absolute inset-0">
          {/* Hero Image as <img> element for better accessibility & SEO */}
          <img
            src={article.imageUrl || '/images/articles/default.jpg'}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover object-top"
            loading="eager"
          />
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 dark:from-deep-900/90 via-slate-900/50 dark:via-deep-900/50 to-slate-900/30 dark:to-deep-900/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 dark:from-deep-900/70 to-transparent" />
          {/* Content overlay - padding top to clear navbar */}
          <div className="relative h-full flex flex-col justify-end pt-16 p-6 sm:p-8 md:p-12 max-w-7xl mx-auto">
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <Badge className="bg-cyan-50 dark:bg-neon/10 text-cyan-700 dark:text-neon border border-cyan-200 dark:border-neon/20 text-xs font-bold mb-4">{article.category.name}</Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 max-w-3xl cursor-pointer hover:text-cyan-300 dark:hover:text-neon transition-colors" onClick={() => onArticleClick?.(article)}>
                {article.title}
              </h1>
              {article.summary && <p className="text-sm sm:text-base text-gray-300 max-w-2xl mb-4 line-clamp-2">{article.summary}</p>}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" /><span>{article.readTime} menit baca</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      {/* Slide navigation dots */}
      {articles.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {articles.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-neon w-8' : 'bg-gray-300 dark:bg-white/20 w-2.5 hover:bg-gray-400 dark:hover:bg-white/40'}`}
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
      <div className="relative w-full aspect-video shrink-0 overflow-hidden bg-gray-100 dark:bg-deep-700">
        <img src={article.imageUrl || '/images/articles/default.jpg'} alt={article.title} className="w-full h-full object-contain" loading="lazy" />
        <div className="absolute top-3 left-3">
          <Badge className="bg-deep-900/80 backdrop-blur-sm border border-neon/20 text-neon text-xs font-bold">{article.category.name}</Badge>
        </div>
      </div>
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug">{article.title}</h3>
        {article.summary && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 flex-1">{article.summary}</p>}
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-auto pt-3 border-t border-gray-200 dark:border-white/5">
          <span className="font-medium text-gray-500 dark:text-gray-300">{article.author.username}</span>
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

interface Comment { id: string; text: string; user: { username: string }; createdAt: string; }

// ============================================
// ARTICLE MODAL
// ============================================
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
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar p-0 bg-white dark:bg-black/60 border-slate-200 dark:border-cyan-500/20 shadow-sm dark:shadow-[0_8px_32px_rgba(0,255,255,0.08),0_0_60px_rgba(0,255,255,0.04)]"
        overlayClassName="bg-black/30 dark:bg-black/60"
      >
        {display && (
          <>
            <div className="relative w-full h-64 sm:h-80 overflow-hidden bg-gray-100 dark:bg-deep-700">
              <img
                src={display.imageUrl || '/images/articles/default.jpg'}
                alt={display.title}
                className="absolute inset-0 w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black/80 via-white/50 dark:via-transparent to-white/60 dark:to-transparent" />
            </div>
            <div className="p-5 sm:p-6 -mt-8 relative">
              <DialogHeader className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-neon/10 text-neon border-neon/20 text-xs font-bold">{display.category.name}</Badge>
                  <Badge variant="secondary" className="bg-gray-100 dark:bg-white/5 text-muted-foreground text-xs"><Eye className="w-3 h-3 mr-1" />{display.viewCount} views</Badge>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">{display.title}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-5">
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{display.author.username}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDistanceToNow(new Date(display.createdAt), { addSuffix: true, locale: localeId })}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{display.readTime} menit baca</span>
              </div>

              {display.summary && (
                <div className="p-4 mb-6 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-cyan-500/10">
                  <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-cyan-600 dark:text-neon" /><span className="text-xs font-bold text-cyan-700 dark:text-neon">AI Summary</span></div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{display.summary}</p>
                </div>
              )}

              {(fullArticle?.content || display.content) && (
                <div
                  className="mb-6 text-sm sm:text-base text-gray-500 dark:text-gray-300 leading-relaxed [&_p]:mb-4"
                  dangerouslySetInnerHTML={{ __html: fullArticle?.content || display.content || '' }}
                />
              )}

              <Separator className="bg-slate-200 dark:bg-cyan-500/10 my-6" />
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4">Komentar ({comments.length})</h4>
                <div className="flex gap-3 mb-6">
                  <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Tulis komentar..."
                    className="min-h-[80px] bg-white dark:bg-white/5 border-slate-200 dark:border-cyan-500/10 text-sm placeholder:text-muted-foreground focus:border-cyan-500/30 dark:focus:border-cyan-400/30 focus:ring-cyan-500/20 dark:focus:ring-cyan-400/20 resize-none" rows={3} />
                  <button onClick={handleSubmit} disabled={!commentText.trim() || submitting}
                    className="self-end bg-cyan-500/10 text-cyan-700 dark:bg-neon/10 dark:text-neon hover:bg-cyan-500/20 dark:hover:bg-neon/20 border border-cyan-500/20 dark:border-neon/20 p-2.5 rounded-lg shrink-0 disabled:opacity-40">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-cyan-500/5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{c.user.username}</span>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: localeId })}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{c.text}</p>
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
// MAIN PAGE (inner — uses useSearchParams, must be in Suspense)
// ============================================
function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);

  useEffect(() => {
    let cancelled = false;
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
    loadFeatured();
    return () => { cancelled = true; };
  }, []);

  const handleArticleClick = (article: Article) => { setSelectedArticle(article); setModalOpen(true); };
  const handleCloseModal = () => { setModalOpen(false); setTimeout(() => setSelectedArticle(null), 300); };
  const handleMatchClick = useCallback((match: Match) => {
    setSelectedMatch(match);
    setMatchModalOpen(true);
    router.push(`/?match=${match.id}`, { scroll: false });
  }, [router]);

  const handleCloseMatchModal = useCallback(() => {
    setMatchModalOpen(false);
    setTimeout(() => setSelectedMatch(null), 300);
    router.push('/', { scroll: false });
  }, [router]);

  return (
    <>
      {/* JSON-LD Structured Data for Google */}
      <WebsiteJsonLd />
      <OrganizationJsonLd />

      {/* Hero Slider */}
      <ErrorBoundary fallback={<div className="h-[400px] bg-deep-800" />}>
        <HeroSection articles={featuredArticles} onArticleClick={handleArticleClick} />
      </ErrorBoundary>

      {/* Ad Slot - After Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdSenseSlot slot="hero-bottom" format="horizontal" className="mt-2" />
      </div>

      {/* Live Scores with Tab Filter */}
      <MatchSection onMatchClick={handleMatchClick} autoOpenMatchId={searchParams.get('match') ?? undefined} />

      {/* Last Formation Lineup */}
      <ErrorBoundary>
        <FormationLineup />
      </ErrorBoundary>

      {/* News + Sidebar */}
      <section id="standings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
        {/* Ad Slot - Between Live Scores and News */}
        <AdSenseSlot slot="before-news" format="horizontal" className="mb-6" />
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

      {/* Transfer Feed */}
      <section id="transfer" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Ad Slot - Between News and Transfer */}
        <AdSenseSlot slot="before-transfer" format="horizontal" className="mb-6" />
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 rounded-full bg-neon" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Berita <span className="neon-text">Transfer</span></h2>
          </div>
          <p className="text-xs text-muted-foreground">Update transfer terbaru dari klub-club top Eropa musim 2025/26</p>
        </motion.div>
        <ErrorBoundary>
          <TransferFeed />
        </ErrorBoundary>
      </section>

      {/* Ad Slot - Before Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <AdSenseSlot slot="before-footer" format="horizontal" className="mb-4" />
      </div>

      {/* Article Modal with Google News JSON-LD Schema */}
      {selectedArticle && modalOpen && (
        <GoogleNewsSchema
          headline={selectedArticle.title}
          image={selectedArticle.imageUrl || '/logo.svg'}
          datePublished={selectedArticle.createdAt}
          author={{ name: selectedArticle.author.username }}
          description={selectedArticle.summary || undefined}
          articleSection={selectedArticle.category.name}
          url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://goalzone-seven.vercel.app'}/articles/${selectedArticle.slug}`}
          wordCount={selectedArticle.readTime ? selectedArticle.readTime * 200 : undefined}
        />
      )}
      <ArticleModalView article={selectedArticle} open={modalOpen} onClose={handleCloseModal} />
      <MatchDetailModal match={selectedMatch} open={matchModalOpen} onClose={handleCloseMatchModal} />
    </>
  );
}

// ============================================
// MAIN PAGE (wraps HomeContent in Suspense for useSearchParams)
// ============================================
export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-neon animate-pulse">Memuat...</div></div>}>
      <HomeContent />
    </Suspense>
  );
}
