'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  FileText,
  Users,
  Trophy,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// --- Types ---
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

interface Match {
  id: string;
  league: string;
  leagueLogo?: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore: number;
  awayScore: number;
  status: string;
  minute: number | null;
}

// --- Constants ---
const RECENT_SEARCHES_KEY = 'goalzone-recent-searches';
const MAX_RECENT_SEARCHES = 8;
const DEBOUNCE_MS = 300;

const TRENDING_SEARCHES = [
  'Premier League',
  'Champions League',
  'Mbappe',
  'Haaland',
  'Real Madrid',
  'Transfer',
  'La Liga',
  'Arsenal',
  'Vinicius Jr',
  'Barcelona',
];

// --- Hooks ---
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecent((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { recent, addSearch, clearAll };
}

// --- Animation Variants ---
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const dialogVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.2 },
  }),
  exit: { opacity: 0, y: -4, transition: { duration: 0.1 } },
};

// --- Sub-components ---
function SearchSkeleton() {
  return (
    <div className="space-y-3 p-1">
      <Skeleton className="h-5 w-28 bg-white/5" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
          <Skeleton className="w-9 h-9 rounded-lg bg-white/5 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full bg-white/5" />
            <Skeleton className="h-3 w-2/3 bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentSearchItem({
  query,
  onSelect,
  onRemove,
  index,
}: {
  query: string;
  onSelect: (q: string) => void;
  onRemove: (q: string) => void;
  index: number;
}) {
  return (
    <motion.button
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={() => onSelect(query)}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group text-left"
    >
      <Clock className="w-4 h-4 text-gray-500 dark:text-gray-500 shrink-0" />
      <span className="text-sm text-gray-300 dark:text-gray-300 flex-1 truncate">
        {query}
      </span>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(query);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
        aria-label={`Remove ${query}`}
      >
        <X className="w-3 h-3 text-gray-500 dark:text-gray-500" />
      </span>
    </motion.button>
  );
}

function TrendingSearchItem({
  query,
  onSelect,
  index,
}: {
  query: string;
  onSelect: (q: string) => void;
  index: number;
}) {
  return (
    <motion.button
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={() => onSelect(query)}
      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left"
    >
      <TrendingUp className="w-4 h-4 text-neon shrink-0" />
      <span className="text-sm text-gray-300 dark:text-gray-300 truncate">{query}</span>
      <ArrowRight className="w-3 h-3 text-gray-600 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}

function ArticleResultItem({
  article,
  onClick,
  index,
}: {
  article: Article;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClick}
      className="flex items-start gap-3 w-full px-3 py-3 rounded-xl hover:bg-white/[0.06] transition-colors group text-left"
    >
      <div className="w-9 h-9 rounded-lg bg-neon/10 flex items-center justify-center shrink-0 mt-0.5">
        <FileText className="w-4 h-4 text-neon" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-100 dark:text-white line-clamp-1 group-hover:text-neon transition-colors">
          {article.title}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge className="bg-white/5 text-gray-400 dark:text-gray-400 border-white/10 text-[10px] px-1.5 py-0 font-medium">
            {article.category.name}
          </Badge>
          {article.summary && (
            <span className="text-[11px] text-gray-500 dark:text-gray-500 line-clamp-1 hidden sm:inline">
              {article.summary}
            </span>
          )}
        </div>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}

function MatchResultItem({
  match,
  onClick,
  index,
}: {
  match: Match;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-white/[0.06] transition-colors group text-left"
    >
      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
        <Users className="w-4 h-4 text-gray-400 dark:text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-100 dark:text-white group-hover:text-neon transition-colors">
          {match.homeTeam} <span className="text-gray-500 dark:text-gray-500 mx-1">vs</span> {match.awayTeam}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {match.status === 'LIVE' && (
            <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
              {match.minute}&apos;
            </span>
          )}
          <Badge className="bg-white/5 text-gray-500 dark:text-gray-500 border-white/10 text-[10px] px-1.5 py-0 font-medium">
            <Trophy className="w-2.5 h-2.5 mr-1" />
            {match.league}
          </Badge>
          {match.status !== 'NS' && (
            <span className="text-[10px] text-gray-500 tabular-nums">
              {match.homeScore} - {match.awayScore}
            </span>
          )}
        </div>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-gray-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
        <Search className="w-6 h-6 text-gray-600" />
      </div>
      <p className="text-sm text-gray-400 dark:text-gray-400 font-medium mb-1">
        No results for &ldquo;{query}&rdquo;
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-600">
        Try different keywords or check the spelling
      </p>
    </motion.div>
  );
}

// --- Main Component ---
export default function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { recent, addSearch, clearAll } = useRecentSearches();
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);
  const abortRef = useRef<AbortController | null>(null);

  // Open/close
  const handleOpen = useCallback(() => {
    setOpen(true);
    setQuery('');
    setArticles([]);
    setMatches([]);
    setLoading(false);
    setHasSearched(false);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    if (inputRef.current) inputRef.current.blur();
  }, []);

  // Keyboard shortcuts + custom event from Navbar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) {
          handleClose();
        } else {
          handleOpen();
        }
      }
      // Esc to close
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        handleClose();
      }
    };
    const handleOpenFromNav = () => handleOpen();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('goalzone:open-search', handleOpenFromNav);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('goalzone:open-search', handleOpenFromNav);
    };
  }, [open, handleOpen, handleClose]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      // Small delay to let animation start
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Search effect
  useEffect(() => {
    if (!open || !debouncedQuery.trim()) {
      return;
    }

    // Abort previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchResults = async () => {
      setLoading(true);
      setHasSearched(true);

      try {
        // Fetch articles
        const articlesPromise = fetch(
          `/api/articles?search=${encodeURIComponent(debouncedQuery.trim())}&limit=10`,
          { signal: controller.signal }
        )
          .then((r) => (r.ok ? r.json() : { articles: [] }))
          .catch(() => ({ articles: [] }));

        // Fetch matches and filter client-side
        const matchesPromise = fetch('/api/live-scores', {
          signal: controller.signal,
        })
          .then((r) => (r.ok ? r.json() : { matches: [] }))
          .then((data) => {
            const all: Match[] = data.matches || [];
            const q = debouncedQuery.trim().toLowerCase();
            return all.filter(
              (m) =>
                m.homeTeam.toLowerCase().includes(q) ||
                m.awayTeam.toLowerCase().includes(q) ||
                m.league.toLowerCase().includes(q)
            );
          })
          .catch(() => []);

        const [articlesResult, matchesResult] = await Promise.all([
          articlesPromise,
          matchesPromise,
        ]);

        if (!controller.signal.aborted) {
          setArticles(articlesResult.articles || []);
          setMatches(matchesResult);
          setLoading(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      controller.abort();
    };
  }, [open, debouncedQuery]);

  // Handlers
  const handleSelectRecent = useCallback(
    (q: string) => {
      setQuery(q);
      addSearch(q);
    },
    [addSearch]
  );

  const handleSelectTrending = useCallback(
    (q: string) => {
      setQuery(q);
      addSearch(q);
    },
    [addSearch]
  );

  const handleRemoveRecent = useCallback((q: string) => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.filter((s: string) => s !== q);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
    setRecent((prev) => prev.filter((s) => s !== q));
  }, []);

  const handleArticleClick = useCallback(
    (article: Article) => {
      addSearch(query);
      handleClose();
      // Dispatch custom event so page.tsx can open the article modal
      window.dispatchEvent(
        new CustomEvent('goalzone:open-article', {
          detail: article,
        })
      );
    },
    [query, addSearch, handleClose]
  );

  const handleMatchClick = useCallback(
    (match: Match) => {
      addSearch(query);
      handleClose();
      // Dispatch custom event so page.tsx can open the match modal
      window.dispatchEvent(
        new CustomEvent('goalzone:open-match', {
          detail: match,
        })
      );
    },
    [query, addSearch, handleClose]
  );

  const totalResults = articles.length + matches.length;
  const showEmpty = hasSearched && !loading && query.trim().length > 0 && totalResults === 0;
  const showResults = hasSearched && !loading && totalResults > 0;

  return (
    <>
      {/* Search Overlay */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={handleClose}
            />

            {/* Dialog */}
            <motion.div
              className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] sm:pt-[12vh] px-4"
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-xl bg-deep-900 dark:bg-deep-900 border border-white/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                  <Search className="w-5 h-5 text-neon shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search articles, matches, teams..."
                    className="flex-1 bg-transparent text-base text-gray-100 dark:text-white placeholder:text-gray-500 outline-none"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {query && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setQuery('')}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </motion.button>
                  )}
                  {/* Modern close button */}
                  <button
                    onClick={handleClose}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-gray-500 hover:text-gray-300 transition-all text-[11px]"
                    aria-label="Close search"
                  >
                    <X className="w-3 h-3" />
                    <span className="hidden sm:inline">Close</span>
                  </button>
                </div>

                {/* Results Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                  <AnimatePresence mode="wait">
                    {/* Loading State */}
                    {loading && <SearchSkeleton />}

                    {/* Empty State */}
                    {showEmpty && <EmptyState query={query} />}

                    {/* Initial State: Recent + Trending */}
                    {!loading && !hasSearched && (
                      <motion.div
                        key="initial"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-5"
                      >
                        {/* Recent Searches */}
                        {recent.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between px-3 mb-2">
                              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                Recent
                              </h3>
                              <button
                                onClick={clearAll}
                                className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
                              >
                                Clear all
                              </button>
                            </div>
                            <div className="space-y-0.5">
                              {recent.map((q, i) => (
                                <RecentSearchItem
                                  key={q}
                                  query={q}
                                  onSelect={handleSelectRecent}
                                  onRemove={handleRemoveRecent}
                                  index={i}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Trending Searches */}
                        <div>
                          <div className="flex items-center justify-between px-3 mb-2">
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                              <TrendingUp className="w-3 h-3" />
                              Trending
                            </h3>
                          </div>
                          <div className="space-y-0.5">
                            {TRENDING_SEARCHES.slice(0, 7).map((q, i) => (
                              <TrendingSearchItem
                                key={q}
                                query={q}
                                onSelect={handleSelectTrending}
                                index={i}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Search Results */}
                    {showResults && (
                      <motion.div
                        key="results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        {/* Articles */}
                        {articles.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between px-3 mb-1.5">
                              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-3 h-3" />
                                Articles
                              </h3>
                              <span className="text-[10px] text-gray-600 tabular-nums">
                                {articles.length} result{articles.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              {articles.slice(0, 6).map((article, i) => (
                                <ArticleResultItem
                                  key={article.id}
                                  article={article}
                                  onClick={() => handleArticleClick(article)}
                                  index={i}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Matches */}
                        {matches.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between px-3 mb-1.5">
                              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Users className="w-3 h-3" />
                                Matches
                              </h3>
                              <span className="text-[10px] text-gray-600 tabular-nums">
                                {matches.length} result{matches.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              {matches.slice(0, 5).map((match, i) => (
                                <MatchResultItem
                                  key={match.id}
                                  match={match}
                                  onClick={() => handleMatchClick(match)}
                                  index={i}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                {showResults && (
                  <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-gray-600">
                      {totalResults} result{totalResults !== 1 ? 's' : ''} found
                    </span>
                    <div className="flex items-center gap-3 text-[10px] text-gray-600">
                      <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px]">
                          &uarr;&darr;
                        </kbd>
                        navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px]">
                          &crarr;
                        </kbd>
                        open
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
