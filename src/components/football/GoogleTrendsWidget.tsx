'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  ExternalLink,
  Newspaper,
  BarChart3,
  Flame,
  ChevronRight,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   GoogleTrendsWidget
   ─────────────────────────────────────────────────────────────
   Fetches Google Trends Daily Search Trends via our own API
   (which reads the public RSS feed) and renders them as a
   beautiful Glassmorphism card — no external scripts needed.
   ───────────────────────────────────────────────────────────── */

interface NewsItem {
  title: string;
  url: string;
  picture: string;
  source: string;
}

interface TrendingItem {
  title: string;
  traffic: string;
  picture: string;
  pictureSource: string;
  newsItems: NewsItem[];
}

interface GoogleTrendsWidgetProps {
  /** Geo restrict  e.g. "US" "ID" "" (worldwide) — defaults to "ID" */
  geo?: string;
  /** Number of trending topics to show (max 10) */
  limit?: number;
  /** Optional extra class names on the outer wrapper */
  className?: string;
}

export default function GoogleTrendsWidget({
  geo = 'ID',
  limit = 8,
  className = '',
}: GoogleTrendsWidgetProps) {
  const [trends, setTrends] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/google-trends?geo=${geo}`);
      if (res.ok) {
        const json = await res.json();
        const list: TrendingItem[] = json.data || [];
        setTrends(list.slice(0, limit));
      }
    } catch {
      // silently fail — keep previous data
    } finally {
      setLoading(false);
    }
  }, [geo, limit]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const toggleExpand = (idx: number) => {
    setExpandedIdx((prev) => (prev === idx ? null : idx));
  };

  const getRankBadge = (idx: number) => {
    if (idx === 0)
      return (
        <div className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <Flame className="w-3 h-3 text-amber-400" />
        </div>
      );
    if (idx === 1)
      return (
        <div className="w-6 h-6 rounded-md bg-gray-400/20 border border-gray-400/30 flex items-center justify-center">
          <span className="text-[10px] font-bold text-gray-300">2</span>
        </div>
      );
    if (idx === 2)
      return (
        <div className="w-6 h-6 rounded-md bg-orange-700/20 border border-orange-700/30 flex items-center justify-center">
          <span className="text-[10px] font-bold text-orange-400">3</span>
        </div>
      );
    return (
      <div className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
        <span className="text-[10px] font-bold text-muted-foreground/50">{idx + 1}</span>
      </div>
    );
  };

  const getTrafficBar = (traffic: string) => {
    const num = parseInt(traffic.replace(/[^0-9]/g, ''), 10) || 0;
    const width = Math.min(100, Math.max(8, (num / 5000) * 100));
    return (
      <div className="w-12 h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="h-full rounded-full bg-gradient-to-r from-cyan-500/60 to-neon/40"
        />
      </div>
    );
  };

  const geoLabel: Record<string, string> = {
    ID: 'Indonesia',
    US: 'United States',
    GB: 'United Kingdom',
    BR: 'Brasil',
    '': 'Worldwide',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`glass-card overflow-hidden ${className}`}
    >
      {/* ─── Header ────────────────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Trending Now
            </h3>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5">
              Google Trends &middot; {geoLabel[geo] || geo}
            </p>
          </div>
        </div>

        <a
          href={`https://trends.google.com/trends/trending?geo=${geo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-cyan-400 transition-colors duration-200"
          aria-label="Open Google Trends"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* ─── Accent divider ────────────────── */}
      <div className="mx-4 sm:mx-5 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      {/* ─── Loading State ─────────────────── */}
      {loading && (
        <div className="p-4 sm:p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-6 h-6 rounded-md bg-white/5" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
                <div className="h-1.5 w-1/4 rounded bg-white/[0.03]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Empty State ───────────────────── */}
      {!loading && trends.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
          <TrendingUp className="w-8 h-8 text-muted-foreground/15 mb-3" />
          <p className="text-sm text-muted-foreground/40">
            Belum ada data trending
          </p>
        </div>
      )}

      {/* ─── Trending List ─────────────────── */}
      {!loading && trends.length > 0 && (
        <div className="p-3 sm:p-4">
          <AnimatePresence>
            {trends.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
              >
                {/* Trend Row */}
                <button
                  onClick={() =>
                    item.newsItems.length > 0
                      ? toggleExpand(idx)
                      : window.open(
                          `https://www.google.com/search?q=${encodeURIComponent(item.title)}`,
                          '_blank'
                        )
                  }
                  className="w-full flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-white/[0.03] transition-colors duration-150 group text-left"
                >
                  {/* Rank Badge */}
                  {getRankBadge(idx)}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {item.picture && (
                        <img
                          src={item.picture}
                          alt=""
                          className="w-5 h-5 rounded-sm object-cover shrink-0 opacity-80"
                          loading="lazy"
                        />
                      )}
                      <span className="text-[13px] text-gray-200 truncate group-hover:text-neon transition-colors duration-150">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {getTrafficBar(item.traffic)}
                      <span className="text-[9px] text-muted-foreground/30 tabular-nums">
                        {item.traffic}
                      </span>
                    </div>
                  </div>

                  {/* Expand indicator */}
                  {item.newsItems.length > 0 && (
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-muted-foreground/20 shrink-0 transition-transform duration-200 ${
                        expandedIdx === idx ? 'rotate-90' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Expanded News Items */}
                <AnimatePresence>
                  {expandedIdx === idx && item.newsItems.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden ml-8 mr-1"
                    >
                      <div className="pl-3 border-l border-cyan-500/15 py-1.5 space-y-1.5">
                        {item.newsItems.slice(0, 3).map((news, ni) => (
                          <a
                            key={ni}
                            href={news.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 py-1 px-1.5 rounded hover:bg-white/[0.03] transition-colors group/news"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Newspaper className="w-3 h-3 text-muted-foreground/25 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[11px] text-muted-foreground/60 leading-snug line-clamp-2 group-hover/news:text-gray-300 transition-colors">
                                {news.title}
                              </p>
                              <span className="text-[9px] text-muted-foreground/30">{news.source}</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Footer ────────────────────────── */}
      {!loading && trends.length > 0 && (
        <div className="px-4 sm:px-5 pb-3 sm:pb-4 pt-1">
          <div className="h-[1px] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent mb-3" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground/25">
              Data from Google Trends RSS
            </span>
            <a
              href={`https://trends.google.com/trending/rss?geo=${geo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-muted-foreground/25 hover:text-cyan-400/60 transition-colors flex items-center gap-1"
            >
              <TrendingUp className="w-2.5 h-2.5" />
              RSS
            </a>
          </div>
        </div>
      )}
    </motion.div>
  );
}
