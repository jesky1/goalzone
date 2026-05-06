'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/football/Navbar';
import LiveScoreTicker from '@/components/football/LiveScoreTicker';
import HeroSlider from '@/components/football/HeroSlider';
import NewsGrid from '@/components/football/NewsGrid';
import StandingsWidget from '@/components/football/StandingsWidget';
import TopScorersWidget from '@/components/football/TopScorersWidget';
import Footer from '@/components/football/Footer';
import ArticleModal from '@/components/football/ArticleModal';
import AdminDashboard from '@/components/football/AdminDashboard';
import { Skeleton } from '@/components/ui/skeleton';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  imageUrl: string | null;
  category: { name: string; slug: string };
  author: { username: string };
  viewCount: number;
  readTime: number;
  createdAt: string;
}

interface MatchEvent {
  type: string;
  minute: number;
  player: string;
}

interface Match {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  minute: number | null;
  homeEvents: MatchEvent[];
  awayEvents: MatchEvent[];
}

export default function Home() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadMatches = async () => {
      try {
        const res = await fetch('/api/live-scores');
        if (res.ok && !cancelled) {
          const data = await res.json();
          const all = data.matches || [];
          const live = all.filter((m: Match) => m.status === 'LIVE');
          const other = all.filter((m: Match) => m.status !== 'LIVE').slice(0, 3);
          setLiveMatches([...live, ...other]);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setMatchesLoading(false);
      }
    };
    loadMatches();
    const interval = setInterval(loadMatches, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedArticle(null), 300);
  };

  return (
    <div className="min-h-screen flex flex-col bg-deep-900 cyber-grid">
      <Navbar onAdminClick={() => setAdminOpen(true)} />
      <LiveScoreTicker />

      {/* Main content offset for fixed navbar + ticker */}
      <main className="flex-1 pt-[104px]">
        {/* Hero Section */}
        <HeroSlider />

        {/* Live Scores Section */}
        <section id="live" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500 live-pulse" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Live <span className="neon-text">Score</span>
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Pertandingan yang sedang berlangsung dari berbagai liga
            </p>
          </motion.div>

          {matchesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-4">
                  <Skeleton className="h-4 w-24 mb-3 bg-white/5" />
                  <Skeleton className="h-6 w-16 mx-auto mb-2 bg-white/5" />
                  <div className="flex justify-center gap-2">
                    <Skeleton className="h-8 w-20 bg-white/5" />
                    <Skeleton className="h-8 w-6 bg-white/5" />
                    <Skeleton className="h-8 w-20 bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.map((match, index) => (
                <LiveMatchCard key={match.id} match={match} index={index} />
              ))}
            </div>
          )}
        </section>

        {/* Main Content: News Grid + Sidebar */}
        <section id="standings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* News Grid */}
            <div className="lg:col-span-2">
              <NewsGrid onArticleClick={handleArticleClick} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <StandingsWidget />
              <TopScorersWidget />
            </div>
          </div>
        </section>

        {/* Transfer Section */}
        <section id="transfer" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-6 sm:p-8 text-center"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Berita <span className="neon-text">Transfer</span>
            </h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Dapatkan update terbaru seputar transfer pemain dari seluruh liga top Eropa
            </p>
            <button
              onClick={() => {
                const grid = document.querySelector('[data-tab="transfer"]');
                if (grid) (grid as HTMLElement).click();
                else {
                  const tabTriggers = document.querySelectorAll('[role="tab"]');
                  tabTriggers.forEach((tab) => {
                    if (tab.getAttribute('data-state') === 'active') {
                      const transferTab = document.querySelector('[value="transfer"]');
                      if (transferTab) (transferTab as HTMLElement).click();
                    }
                  });
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-neon bg-neon/10 border border-neon/20 hover:bg-neon/20 hover:neon-glow transition-all duration-300"
            >
              Lihat Semua Transfer
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>
        </section>
      </main>

      <Footer />

      {/* Article Modal */}
      <ArticleModal
        article={selectedArticle}
        open={modalOpen}
        onClose={handleCloseModal}
      />

      {/* Admin Dashboard */}
      <AdminDashboard
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
      />
    </div>
  );
}

function LiveMatchCard({ match, index }: { match: Match; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ scale: 1.01 }}
      className="glass-card glass-hover p-4"
    >
      {/* League */}
      <div className="text-xs text-muted-foreground font-medium mb-3">
        {match.league}
      </div>

      {/* Status */}
      <div className="flex justify-center mb-3">
        {match.status === 'LIVE' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-500 live-pulse" />
            <span className="text-xs font-bold text-red-400">
              {match.minute ? `${match.minute}'` : 'LIVE'}
            </span>
          </div>
        )}
        {match.status === 'HT' && (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/20 text-xs font-bold text-amber-400">
            HT
          </span>
        )}
        {match.status === 'FT' && (
          <span className="px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/20 text-xs font-bold text-green-400">
            FT
          </span>
        )}
        {match.status === 'NS' && (
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-400">
            NS
          </span>
        )}
      </div>

      {/* Score */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 text-right">
          <div className="font-bold text-sm sm:text-base text-white">
            {match.homeTeam}
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5 justify-end">
            {match.homeEvents?.filter((e) => e.type === 'goal').map((e, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neon/10 text-xs text-neon"
              >
                ⚽ {e.minute}&apos; <span className="text-gray-300">{e.player}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-2xl sm:text-3xl font-bold neon-text tabular-nums">
            {match.homeScore}
          </span>
          <span className="text-lg text-gray-500">-</span>
          <span className="text-2xl sm:text-3xl font-bold neon-text tabular-nums">
            {match.awayScore}
          </span>
        </div>

        <div className="flex-1 text-left">
          <div className="font-bold text-sm sm:text-base text-white">
            {match.awayTeam}
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {match.awayEvents?.filter((e) => e.type === 'goal').map((e, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neon/10 text-xs text-neon"
              >
                ⚽ {e.minute}&apos; <span className="text-gray-300">{e.player}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
