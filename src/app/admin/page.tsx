'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  LogIn,
  LogOut,
  Loader2,
  Eye,
  EyeOff,
  FileText,
  BarChart3,
  MessageSquare,
  TrendingUp,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Zap,
  Search,
  Newspaper,
  Users,
  Clock,
  Layers,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import NewsEnginePanel from '@/components/admin/NewsEnginePanel';

// ============================================================
// Types
// ============================================================
interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  imageUrl: string | null;
  isFeatured: number;
  viewCount: number;
  readTime: number;
  createdAt: string;
  categoryName: string | null;
  authorName: string | null;
}

interface DashboardData {
  stats: {
    totalArticles: number;
    totalComments: number;
    totalViews: number;
    featuredArticles: number;
    totalCategories: number;
  };
  articles: ArticleRow[];
  categories: any[];
  recentComments: any[];
}

// Extended stats from /api/admin/stats
interface PlatformStats {
  counts: {
    totalArticles: number;
    totalComments: number;
    totalViews: number;
    totalFeatured: number;
    totalCategories: number;
    commentsToday: number;
  };
  averages: {
    avgReadTime: number;
    viewsPerArticle: number;
    commentsPerArticle: number;
  };
  highlights: {
    topViewedArticle: {
      id: string;
      title: string;
      slug: string;
      viewCount: number;
      imageUrl: string | null;
      createdAt: string;
    } | null;
    latestArticle: {
      id: string;
      title: string;
      slug: string;
      viewCount: number;
      imageUrl: string | null;
      createdAt: string;
    } | null;
    weeklyNewViews: number;
  };
  charts: {
    monthlyArticles: { month: string; articles: number }[];
  };
}

// ============================================================
// Login Form
// ============================================================
function LoginForm({ onLogin }: { onLogin: (token: string, user: AdminUser) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success && data.data.token) {
        onLogin(data.data.token, data.data.user);
      } else {
        setError(data.error || 'Login gagal');
      }
    } catch {
      setError('Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-deep-900 cyber-grid">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Zap className="w-8 h-8 text-neon" />
            <span className="text-2xl font-bold neon-text tracking-wider">GOALZONE</span>
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-neon/10 border border-neon/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-neon" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Admin Login</h2>
          <p className="text-xs text-muted-foreground">Masuk untuk mengakses dashboard</p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="glass-card p-6 sm:p-8">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Username</label>
              <Input
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="Masukkan username..."
                autoFocus
                className="bg-white/5 border-white/10 text-sm text-white placeholder:text-muted-foreground focus:border-neon/30 focus:ring-neon/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Masukkan password..."
                  className="bg-white/5 border-white/10 text-sm text-white placeholder:text-muted-foreground focus:border-neon/30 focus:ring-neon/20 pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-neon px-2 py-1 rounded transition-colors"
                >
                  {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={!username.trim() || !password.trim() || loading}
              className="w-full bg-neon/10 text-neon hover:bg-neon/20 border border-neon/20 gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-[10px] text-muted-foreground text-center">
              Demo: <code className="text-neon/70 font-mono">admin</code> / <code className="text-neon/70 font-mono">admin123</code>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Animated Number Counter
// ============================================================
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    prevValue.current = display;
    const start = display;
    const end = value;
    if (start === end) return;

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

// ============================================================
// Stats Card Component
// ============================================================
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  subtitle,
  trend,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const isNumeric = typeof value === 'number';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="group relative overflow-hidden"
    >
      <Card className="bg-white dark:bg-deep-800 border border-gray-200 dark:border-white/10 hover:border-neon/30 transition-all duration-300 hover:shadow-lg hover:shadow-neon/5">
        <CardContent className="p-4 sm:p-5">
          {/* Icon + Trend */}
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            {trend && trend !== 'neutral' && (
              <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                trend === 'up'
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}>
                {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3 rotate-180" />}
              </div>
            )}
          </div>

          {/* Value */}
          <div className={`text-2xl sm:text-3xl font-bold ${color} tabular-nums tracking-tight`}>
            {isNumeric ? <AnimatedNumber value={value as number} /> : value}
          </div>

          {/* Label + Subtitle */}
          <div className="mt-1">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            {subtitle && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{subtitle}</p>
            )}
          </div>
        </CardContent>

        {/* Decorative gradient line at bottom */}
        <div className={`h-0.5 w-full ${bgColor} opacity-50 group-hover:opacity-100 transition-opacity`} />
      </Card>
    </motion.div>
  );
}

// ============================================================
// Mini Bar Chart
// ============================================================
function MiniBarChart({ data }: { data: { month: string; articles: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.articles), 1);
  const formatMonth = (m: string) => {
    const [y, mo] = m.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${months[parseInt(mo) - 1]} ${y}`;
  };

  return (
    <div className="space-y-2">
      {data.slice(-8).map((item, i) => (
        <div key={item.month} className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-14 shrink-0 tabular-nums">{formatMonth(item.month)}</span>
          <div className="flex-1 h-5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.articles / max) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.05 }}
              className="h-full rounded-full bg-gradient-to-r from-neon/60 to-neon/30"
            />
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground w-6 text-right tabular-nums">{item.articles}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Overview Tab (Enhanced with platform stats)
// ============================================================
function OverviewTab({ data, token }: { data: DashboardData; token: string }) {
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch extended stats from dedicated endpoint
  useEffect(() => {
    if (!token) return;
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          setPlatformStats(json.data);
        }
      } catch { /* silent */ }
      finally { setStatsLoading(false); }
    };
    loadStats();
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const topArticles = [...(data.articles || [])]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  // Use platform stats if available, fallback to dashboard data stats
  const totalArticles = platformStats?.counts.totalArticles ?? data.stats.totalArticles;
  const totalComments = platformStats?.counts.totalComments ?? data.stats.totalComments;
  const totalViews = platformStats?.counts.totalViews ?? data.stats.totalViews;
  const totalFeatured = platformStats?.counts.totalFeatured ?? data.stats.featuredArticles;
  const totalCategories = platformStats?.counts.totalCategories ?? data.stats.totalCategories;
  const commentsToday = platformStats?.counts.commentsToday ?? 0;

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Total Artikel"
          value={totalArticles}
          icon={FileText}
          color="text-neon"
          bgColor="bg-neon/10"
          subtitle={`${totalCategories} kategori aktif`}
          trend="up"
        />
        <StatCard
          label="Total Komentar"
          value={totalComments}
          icon={MessageSquare}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
          subtitle={commentsToday > 0 ? `${commentsToday} hari ini` : undefined}
          trend={commentsToday > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          label="Total Views"
          value={totalViews}
          icon={Eye}
          color="text-green-500"
          bgColor="bg-green-500/10"
          subtitle={platformStats?.averages.viewsPerArticle ? `avg ${platformStats.averages.viewsPerArticle}/artikel` : undefined}
          trend="up"
        />
        <StatCard
          label="Artikel Featured"
          value={totalFeatured}
          icon={TrendingUp}
          color="text-amber-500"
          bgColor="bg-amber-500/10"
          subtitle={`${totalArticles > 0 ? Math.round((totalFeatured / totalArticles) * 100) : 0}% dari total`}
        />
        <StatCard
          label="Rata-rata Baca"
          value={platformStats?.averages.avgReadTime ? `${platformStats.averages.avgReadTime} mnt` : '-'}
          icon={Clock}
          color="text-purple-500"
          bgColor="bg-purple-500/10"
          subtitle="per artikel"
        />
        <StatCard
          label="Komentar/Artikel"
          value={platformStats?.averages.commentsPerArticle?.toFixed(1) ?? '-'}
          icon={Users}
          color="text-pink-500"
          bgColor="bg-pink-500/10"
          subtitle="engagement rate"
        />
      </div>

      {/* Highlight Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Viewed Article */}
        <Card className="bg-white dark:bg-deep-800 border border-gray-200 dark:border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">Artikel Terpopuler</h3>
                <p className="text-[10px] text-muted-foreground">View tertinggi sepanjang masa</p>
              </div>
            </div>
            {platformStats?.highlights.topViewedArticle ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {platformStats.highlights.topViewedArticle.imageUrl && (
                    <img
                      src={platformStats.highlights.topViewedArticle.imageUrl}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground line-clamp-2">
                      {platformStats.highlights.topViewedArticle.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        {platformStats.highlights.topViewedArticle.viewCount.toLocaleString()} views
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(platformStats.highlights.topViewedArticle.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Sparkles className="w-4 h-4 mr-2 opacity-40" />
                <p className="text-xs">Belum ada data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Article */}
        <Card className="bg-white dark:bg-deep-800 border border-gray-200 dark:border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-neon/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-neon" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">Artikel Terbaru</h3>
                <p className="text-[10px] text-muted-foreground">Baru saja dipublikas</p>
              </div>
            </div>
            {platformStats?.highlights.latestArticle ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {platformStats.highlights.latestArticle.imageUrl && (
                    <img
                      src={platformStats.highlights.latestArticle.imageUrl}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground line-clamp-2">
                      {platformStats.highlights.latestArticle.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        {platformStats.highlights.latestArticle.viewCount.toLocaleString()} views
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(platformStats.highlights.latestArticle.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Sparkles className="w-4 h-4 mr-2 opacity-40" />
                <p className="text-xs">Belum ada data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two-Column Section: Chart + Top 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Articles Chart */}
        <Card className="bg-white dark:bg-deep-800 border border-gray-200 dark:border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">Artikel per Bulan</h3>
                <p className="text-[10px] text-muted-foreground">Tren 12 bulan terakhir</p>
              </div>
            </div>
            {statsLoading ? (
              <div className="space-y-2 py-4">
                {[1,2,3,4,5].map((i) => (
                  <Skeleton key={i} className="h-5 w-full bg-gray-100 dark:bg-white/5 rounded-full" />
                ))}
              </div>
            ) : platformStats?.charts?.monthlyArticles?.length ? (
              <MiniBarChart data={platformStats.charts.monthlyArticles} />
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">Belum ada data</p>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Articles Table */}
        <Card className="bg-white dark:bg-deep-800 border border-gray-200 dark:border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">Top 5 Artikel</h3>
                <p className="text-[10px] text-muted-foreground">Berdasarkan views</p>
              </div>
            </div>
            <div className="space-y-1">
              {topArticles.map((article, i) => (
                <div key={article.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/3 transition-colors">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0
                      ? 'bg-amber-500/20 text-amber-500'
                      : i === 1
                        ? 'bg-gray-300 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                        : 'bg-gray-100 dark:bg-white/5 text-muted-foreground'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{article.title}</p>
                    <p className="text-[10px] text-muted-foreground">{article.categoryName}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 tabular-nums">
                    <Eye className="w-3 h-3" />
                    {article.viewCount.toLocaleString()}
                  </div>
                </div>
              ))}
              {topArticles.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Belum ada artikel</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Section */}
      <Card className="bg-white dark:bg-deep-800 border border-gray-200 dark:border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-neon/10 flex items-center justify-center">
              <Layers className="w-4 h-4 text-neon" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">Kategori</h3>
              <p className="text-[10px] text-muted-foreground">{totalCategories} kategori aktif</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(data.categories || []).map((cat: any) => (
              <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-white/3 border border-gray-200 dark:border-white/5 hover:border-neon/20 transition-colors">
                <span className="text-xs text-foreground truncate">{cat.name}</span>
                <Badge variant="secondary" className="text-[10px] bg-gray-100 dark:bg-white/5 text-muted-foreground">
                  {cat.articleCount || 0}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2 py-2">
        {statsLoading ? (
          <Loader2 className="w-3 h-3 text-neon animate-spin" />
        ) : (
          <CheckCircle2 className="w-3 h-3 text-green-500" />
        )}
        <p className="text-[10px] text-muted-foreground">
          {statsLoading ? 'Memperbarui statistik...' : 'Statistik diperbarui otomatis setiap 30 detik'}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Articles Tab
// ============================================================
function ArticlesTab({
  data,
  token,
  onRefresh,
  onDelete,
}: {
  data: DashboardData;
  token: string;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = (data.articles || []).filter(
    (a) => !search || a.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari artikel..."
            className="bg-white/5 border-white/10 text-sm text-white placeholder:text-muted-foreground pl-9"
          />
        </div>
        <Button onClick={onRefresh} variant="ghost" size="sm" className="text-neon gap-1.5 shrink-0">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/3">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">#</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Judul</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden sm:table-cell">Kategori</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Views</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Tanggal</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {filtered.map((article, i) => (
                <tr key={article.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {article.isFeatured ? (
                        <Badge className="bg-neon/10 text-neon border-neon/20 text-[9px] px-1 py-0 shrink-0">
                          Featured
                        </Badge>
                      ) : null}
                      <span className="text-xs font-medium text-white truncate max-w-[200px] sm:max-w-[300px]">
                        {article.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <Badge variant="secondary" className="text-[10px] bg-white/5">
                      {article.categoryName || '-'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.viewCount}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                    {new Date(article.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onDelete(article.id)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground">Tidak ada artikel ditemukan</p>
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-white/5 text-[10px] text-muted-foreground">
          Menampilkan {filtered.length} dari {data.articles?.length || 0} artikel
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Comments Tab
// ============================================================
function CommentsTab({ data }: { data: DashboardData }) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-blue-400" />
        Komentar Terbaru
      </h3>
      <div className="space-y-3">
        {(data.recentComments || []).map((comment: any) => (
          <div key={comment.id} className="p-3 rounded-lg bg-white/3 border border-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white">{comment.authorName || 'Anonymous'}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-300 mb-1.5">{comment.text}</p>
            {comment.articleTitle && (
              <p className="text-[10px] text-muted-foreground">
                pada: <span className="text-neon/70">{comment.articleTitle}</span>
              </p>
            )}
          </div>
        ))}
        {(data.recentComments || []).length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">Belum ada komentar</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Dashboard (after login)
// ============================================================
function Dashboard({
  token,
  user,
  onLogout,
}: {
  token: string;
  user: AdminUser;
  onLogout: () => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Gagal memuat data');
      }
    } catch {
      setError('Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/data/articles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setDeleteId(null);
        loadData();
      }
    } catch { /* silent */ }
  };

  if (error && !data) {
    return (
      <div className="min-h-screen bg-deep-900 cyber-grid flex items-center justify-center">
        <div className="text-center py-16 px-6">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-sm text-red-400 mb-2">{error}</p>
          <Button onClick={loadData} variant="ghost" size="sm" className="text-neon gap-2">
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-deep-900 cyber-grid">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-deep-800/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neon/10 border border-neon/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-neon" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Admin Dashboard</h1>
              <p className="text-[10px] text-muted-foreground">Welcome, {user.fullName || user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-neon gap-1.5">
                <Zap className="w-3.5 h-3.5" /> GOALZONE
              </Button>
            </Link>
            <Button
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-6">
        <div className="flex gap-1 bg-white/5 p-1 w-fit rounded-lg">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'news-engine', label: 'News Engine', icon: Newspaper },
            { key: 'articles', label: 'Articles', icon: FileText },
            { key: 'comments', label: 'Comments', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-xs gap-1.5 px-4 py-2 rounded-md flex items-center transition-colors ${
                activeTab === tab.key
                  ? 'bg-neon/10 text-neon'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card p-4">
                  <Skeleton className="h-10 w-20 bg-white/5" />
                  <Skeleton className="h-4 w-16 bg-white/5 mt-2" />
                </div>
              ))}
            </div>
            <Skeleton className="h-[300px] w-full bg-white/5 rounded-xl" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && data && <OverviewTab data={data} />}
            {activeTab === 'news-engine' && <NewsEnginePanel />}
            {activeTab === 'articles' && data && (
              <ArticlesTab data={data} token={token} onRefresh={loadData} onDelete={(id) => setDeleteId(id)} />
            )}
            {activeTab === 'comments' && data && <CommentsTab data={data} />}
          </>
        )}
      </div>

      {/* Delete Modal */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-md bg-deep-800 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Hapus Artikel?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Artikel akan dihapus secara permanen beserta komentar-komentarnya.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="text-muted-foreground">
              Batal
            </Button>
            <Button
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 gap-2"
            >
              <Trash2 className="w-4 h-4" /> Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Main: Admin Page
// ============================================================
export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem('goalzone_admin_token');
    const savedUser = localStorage.getItem('goalzone_admin_user');
    if (saved && savedUser) {
      fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${saved}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setToken(saved);
            setUser(JSON.parse(savedUser));
          } else {
            localStorage.removeItem('goalzone_admin_token');
            localStorage.removeItem('goalzone_admin_user');
          }
        })
        .catch(() => {
          localStorage.removeItem('goalzone_admin_token');
          localStorage.removeItem('goalzone_admin_user');
        });
    }
  }, []);

  const handleLogin = (newToken: string, newUser: AdminUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('goalzone_admin_token', newToken);
    localStorage.setItem('goalzone_admin_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('goalzone_admin_token');
    localStorage.removeItem('goalzone_admin_user');
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!token || !user ? (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginForm onLogin={handleLogin} />
          </motion.div>
        ) : (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Dashboard token={token} user={user} onLogout={handleLogout} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
