'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  LogOut,
  FileText,
  MessageSquare,
  Eye,
  Trophy,
  RefreshCw,
  Search,
  Trash2,
  Loader2,
  Zap,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth-context';
import { getSupabaseClient } from '@/lib/supabase/client';
import NewsEnginePanel from '@/components/admin/NewsEnginePanel';

// ─── Types ──────────────────────────────────────────────────

interface DashboardStats {
  totalArticles: number;
  totalComments: number;
  commentsToday: number;
  totalViews: number;
  totalCategories: number;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  viewCount: number;
  categoryName: string | null;
  authorName: string | null;
  isFeatured: boolean;
  createdAt: string;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  authorName: string;
  articleTitle: string | null;
}

type TabId = 'overview' | 'news-engine' | 'articles' | 'comments';

// ─── Tab Config ─────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'news-engine', label: 'News Engine' },
  { id: 'articles', label: 'Articles' },
  { id: 'comments', label: 'Comments' },
];

// ─── Helpers ────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  try {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin}m lalu`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}j lalu`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay}h lalu`;
    return `${Math.floor(diffDay / 30)}bl lalu`;
  } catch {
    return '';
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ─── Stat Card ──────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  sublabel,
  live,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  sublabel?: string;
  live?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {label}
                </span>
                {live && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 live-pulse" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">
                      Live
                    </span>
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(value)}
              </p>
              {sublabel && (
                <p className="text-xs text-muted-foreground">{sublabel}</p>
              )}
            </div>
            <div
              className={`p-3 rounded-xl ${color}`}
            >
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const { user, token, isAuthenticated, signOut, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [recentComments, setRecentComments] = useState<Comment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // ─── Fetch dashboard data ────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    setDataLoading(true);
    setDataError(null);

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, dataRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/data', { headers }),
      ]);

      // Process stats
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        if (statsJson.success && statsJson.data) {
          const d = statsJson.data;
          setStats({
            totalArticles: d.counts?.totalArticles ?? 0,
            totalComments: d.counts?.totalComments ?? 0,
            commentsToday: d.counts?.commentsToday ?? 0,
            totalViews: d.counts?.totalViews ?? 0,
            totalCategories: d.counts?.totalCategories ?? 0,
          });
        }
      }

      // Process data
      if (dataRes.ok) {
        const dataJson = await dataRes.json();
        if (dataJson.success && dataJson.data) {
          setArticles(dataJson.data.articles || []);
          setRecentComments(dataJson.data.recentComments || []);
        }
      }
    } catch {
      setDataError('Gagal memuat data dashboard');
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDashboardData();
    }
  }, [isAuthenticated, token, fetchDashboardData]);

  // ─── Supabase Realtime for Comments ──────────────────────
  useEffect(() => {
    if (!token) return;

    const supabase = getSupabaseClient();

    const channel = supabase
      .channel('admin-comments-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          const newComment = payload.new as Record<string, unknown>;
          setStats((prev) =>
            prev
              ? {
                  ...prev,
                  totalComments: prev.totalComments + 1,
                  commentsToday: prev.commentsToday + 1,
                }
              : prev,
          );
          setRecentComments((prev) =>
            [
              {
                id: String(newComment.id || ''),
                text: String(newComment.content || newComment.text || ''),
                createdAt: String(newComment.created_at || new Date().toISOString()),
                authorName:
                  String(
                    (newComment.profiles as Record<string, unknown>)?.username || 'New User',
                  ),
                articleTitle: null,
              },
              ...prev,
            ].slice(0, 10),
          );
          setNotification('Komentar baru masuk!');
          setTimeout(() => setNotification(null), 3000);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token]);

  // ─── Delete article ──────────────────────────────────────
  const handleDeleteArticle = async (id: string) => {
    if (!token) return;
    setDeletingArticle(id);
    try {
      const res = await fetch(`/api/admin/data/articles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
        setStats((prev) =>
          prev ? { ...prev, totalArticles: prev.totalArticles - 1 } : prev,
        );
      }
    } catch {
      // silent
    } finally {
      setDeletingArticle(null);
    }
  };

  // ─── Auth states ─────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-deep-900 cyber-grid flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-neon animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // ─── Filter articles ─────────────────────────────────────
  const filteredArticles = searchQuery
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : articles;

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-deep-900 cyber-grid">
      {/* Realtime Notification Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-0 left-0 right-0 z-50 p-3"
          >
            <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-lg">
              <span className="text-lg">💬</span>
              <p className="text-sm font-medium text-emerald-300">
                {notification}
              </p>
              <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 live-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-40 glass-strong border-b border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-neon/10 border border-neon/20">
                <Shield className="w-5 h-5 text-neon" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Admin Dashboard
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-neon/5 text-neon border-neon/20"
                  >
                    <Zap className="w-2.5 h-2.5 mr-1" />
                    GOALZONE
                  </Badge>
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  Welcome, {user.fullName}
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs text-muted-foreground">
                {user.username}
              </span>
              <Separator
                orientation="vertical"
                className="h-6 bg-gray-200 dark:bg-white/10"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-muted-foreground hover:text-red-400"
              >
                <LogOut className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Tabs ────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 glass border-b border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto py-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'text-neon bg-neon/10'
                    : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="admin-tab-indicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-neon rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {/* ─── Overview Tab ─────────────────────────────── */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Stat Cards */}
              {dataLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="glass-card">
                      <CardContent className="p-5 space-y-3">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard
                    icon={FileText}
                    label="Total Artikel"
                    value={stats?.totalArticles ?? 0}
                    color="bg-neon/10 text-neon"
                    sublabel={`${stats?.totalCategories ?? 0} kategori`}
                  />
                  <StatCard
                    icon={MessageSquare}
                    label="Komentar"
                    value={stats?.totalComments ?? 0}
                    color="bg-blue-500/10 text-blue-400"
                    sublabel={`${stats?.commentsToday ?? 0} hari ini`}
                    live
                  />
                  <StatCard
                    icon={Eye}
                    label="Total Views"
                    value={stats?.totalViews ?? 0}
                    color="bg-emerald-500/10 text-emerald-400"
                  />
                </div>
              )}

              {/* Recent Comments with LIVE indicator */}
              <Card className="glass-card overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Komentar Terbaru
                    </h3>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-pulse" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">
                        Realtime
                      </span>
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('comments')}
                    className="text-muted-foreground hover:text-neon text-xs"
                  >
                    Lihat semua
                  </Button>
                </div>

                <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-white/5">
                  {dataLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      ))}
                    </div>
                  ) : recentComments.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Belum ada komentar
                      </p>
                    </div>
                  ) : (
                    recentComments.map((comment, idx) => (
                      <motion.div
                        key={comment.id}
                        initial={idx === 0 ? { opacity: 0, x: -10 } : false}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-neon/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold text-neon">
                              {(comment.authorName || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                {comment.authorName}
                              </span>
                              {comment.articleTitle && (
                                <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                  pada &ldquo;{comment.articleTitle}&rdquo;
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                              {comment.text}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                {timeAgo(comment.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </Card>

              {/* Error */}
              {dataError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                  <p className="text-sm text-red-400">{dataError}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchDashboardData}
                    className="mt-2 text-red-400 hover:text-red-300"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Coba Lagi
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── News Engine Tab ─────────────────────────── */}
          {activeTab === 'news-engine' && (
            <motion.div
              key="news-engine"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <NewsEnginePanel />
            </motion.div>
          )}

          {/* ─── Articles Tab ────────────────────────────── */}
          {activeTab === 'articles' && (
            <motion.div
              key="articles"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Toolbar */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari artikel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchDashboardData}
                  disabled={dataLoading}
                  className="text-muted-foreground hover:text-neon"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`}
                  />
                </Button>
              </div>

              {/* Articles List */}
              <Card className="glass-card overflow-hidden">
                {dataLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-3 rounded-lg"
                      >
                        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    ))}
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery
                        ? 'Tidak ada artikel yang cocok'
                        : 'Belum ada artikel'}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-white/5">
                    {filteredArticles.map((article, idx) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Index */}
                        <div className="w-8 h-8 rounded-lg bg-neon/5 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-neon/60">
                            {idx + 1}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {article.title}
                            </h4>
                            {article.isFeatured && (
                              <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {article.categoryName && (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 px-1.5"
                              >
                                {article.categoryName}
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {article.authorName}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                              {timeAgo(article.createdAt)}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {formatNumber(article.viewCount)}
                            </span>
                          </div>
                        </div>

                        {/* Status */}
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ${
                            article.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {article.status}
                        </Badge>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteArticle(article.id)}
                          disabled={deletingArticle === article.id}
                          className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          {deletingArticle === article.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Count */}
              {!dataLoading && articles.length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  {filteredArticles.length} dari {articles.length} artikel
                  {searchQuery && ` cocok dengan "${searchQuery}"`}
                </p>
              )}
            </motion.div>
          )}

          {/* ─── Comments Tab ────────────────────────────── */}
          {activeTab === 'comments' && (
            <motion.div
              key="comments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      Comments
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-pulse" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">
                          Live
                        </span>
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {stats?.totalComments ?? 0} total · {stats?.commentsToday ?? 0}{' '}
                      hari ini
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchDashboardData}
                  disabled={dataLoading}
                  className="text-muted-foreground hover:text-neon"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`}
                  />
                </Button>
              </div>

              {/* Comments Feed */}
              <Card className="glass-card overflow-hidden">
                {dataLoading ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg"
                      >
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentComments.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Belum ada komentar
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-white/5">
                    {recentComments.map((comment, idx) => (
                      <motion.div
                        key={comment.id}
                        initial={idx === 0 ? { opacity: 0, x: -10 } : false}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full bg-neon/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-neon">
                              {(comment.authorName || '?')[0].toUpperCase()}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {comment.authorName}
                              </span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeAgo(comment.createdAt)}
                              </span>
                            </div>

                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                              {comment.text}
                            </p>

                            {comment.articleTitle && (
                              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <FileText className="w-3 h-3" />
                                <span className="truncate max-w-[300px]">
                                  {comment.articleTitle}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
