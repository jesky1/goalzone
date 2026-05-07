'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, TrendingUp, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface PopularArticle {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  category?: { name: string; slug: string; color?: string } | null;
  summary?: string | null;
  imageUrl?: string | null;
}

interface PopularArticlesProps {
  onArticleClick?: (article: PopularArticle) => void;
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function getRankStyle(rank: number): string {
  switch (rank) {
    case 1:
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30 ring-1 ring-amber-500/20';
    case 2:
      return 'bg-gray-400/15 text-gray-300 border-gray-400/30';
    case 3:
      return 'bg-orange-700/15 text-orange-400 border-orange-700/30';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

export default function PopularArticles({ onArticleClick }: PopularArticlesProps) {
  const [articles, setArticles] = useState<PopularArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/articles/popular');
        if (res.ok && !cancelled) {
          const data = await res.json();
          const list = data.articles || [];
          if (Array.isArray(list)) setArticles(list);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="glass-card p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-1.5 rounded-lg bg-neon/10">
          <TrendingUp className="w-4 h-4 text-neon" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
            Artikel Paling Populer
          </h3>
          <p className="text-[10px] text-muted-foreground">
            5 artikel terpopuler berdasarkan jumlah views
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-7 h-7 rounded-lg shrink-0 bg-gray-200 dark:bg-white/5" />
              <div className="flex-1 space-y-1.5 pt-0.5">
                <Skeleton className="h-3.5 w-full bg-gray-200 dark:bg-white/5" />
                <Skeleton className="h-3 w-24 bg-gray-200 dark:bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="text-center py-6">
          <p className="text-xs text-muted-foreground">Gagal memuat data populer</p>
        </div>
      )}

      {/* Article List */}
      {!loading && !error && (
        <div className="space-y-1">
          {articles.map((article, index) => {
            const rank = index + 1;
            return (
              <motion.button
                key={article.id}
                type="button"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                onClick={() => onArticleClick?.(article)}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all group hover:bg-gray-100 dark:hover:bg-white/[0.04] ${
                  rank === 1 ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.03]' : ''
                }`}
              >
                {/* Rank Number */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 border ${getRankStyle(rank)}`}
                >
                  {rank}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-[13px] leading-snug line-clamp-2 transition-colors group-hover:text-neon ${
                      rank === 1
                        ? 'font-bold text-gray-900 dark:text-white'
                        : 'font-medium text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    {/* Category Badge */}
                    {article.category && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border"
                        style={{
                          color: article.category.color || 'var(--c-neon)',
                          backgroundColor: `${article.category.color || 'var(--c-neon)'}15`,
                          borderColor: `${article.category.color || 'var(--c-neon)'}25`,
                        }}
                      >
                        {article.category.name}
                      </span>
                    )}
                    {/* View Count */}
                    <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                      <Eye className="w-3 h-3" />
                      <span className="font-medium tabular-nums">
                        {formatViews(article.viewCount)}
                      </span>
                    </span>
                  </div>
                </div>

                {/* View Bar (visual indicator) */}
                <div className="hidden sm:flex flex-col items-end justify-center gap-1 shrink-0 w-12 pt-0.5">
                  <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-neon/60 to-neon"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          100,
                          ((article.viewCount || 0) / (articles[0]?.viewCount || 1)) * 100
                        )}%`,
                      }}
                      transition={{ duration: 0.6, delay: index * 0.08 + 0.2 }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 tabular-nums">
                    {article.viewCount?.toLocaleString('id-ID')}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Footer Stats */}
      {!loading && !error && articles.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Total {articles.length} artikel terpopuler</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {articles.reduce((sum, a) => sum + (a.viewCount || 0), 0).toLocaleString('id-ID')} views total
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
