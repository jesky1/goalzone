cat > src / app / admin / page.tsx << 'ENDOFFILE'
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  ChevronRight,
  Zap,
  Search,
  Newspaper,
  Activity,
  Trophy,
  Clock,
  Globe,
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

interface LiveMatch {
  id: string;
  league: string;
  leagueLogo: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number;
  awayScore: number;
  status: string;
  minute: number | null;
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
    <div className="min-h-screen flex items-center justify-center p-4">
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

        <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8">
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
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Overview Tab (Full Online - Real Data)
// ============================================================
function OverviewTab({ data }: { data: DashboardData }) {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [matchCount, setMatchCount] = useState<number>(0);

  // Fetch live data from real API
  const fetchLiveData = useCallback(async () => {
    try {
      const res = await fetch('/api/live-scores');
      const json = await res.json();
      if (json.matches) {
        setLiveMatches(json.matches.slice(0, 6));
      }
    } catch { /* silent */ }
  }, []);

  // Fetch today match count
  const fetchMatchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/matches');
      const json = await res.json();
      if (json.matches) {
        setMatchCount(json.matches.length);
      }
    } catch { /* silent */ }
  }, []);

  // Sync matches from Football API
  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncStatus('');
    try {
      const res = await fetch('/api/sync-matches');
      const json = await res.json();
      if (json.success) {
        setSyncStatus(`✅ Sync berhasil: ${json.totalFetched || json.upserted || 0} fixtures`);
        fetchMatchCount();
      } else {
        setSyncStatus(`⚠️ ${json.message || 'Sync gagal'}`);
      }
    } catch {
      setSyncStatus('❌ Tidak dapat terhubung ke server');
    } finally {
      setSyncing(false);
    }
  }, [fetchMatchCount]);

  useEffect(() => {
    fetchLiveData();
    fetchMatchCount();
  }, [fetchLiveData, fetchMatchCount]);

  const topArticles = [...(data.articles || [])]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  const liveCount = liveMatches.filter(m => m.status === 'LIVE' || m.status === 'HT').length;

  const statCards = [
    { label: 'Total Artikel', value: data.stats.totalArticles, icon: FileText, color: 'text-neon' },
    { label: 'Match Hari Ini', value: matchCount, icon: Activity, color: 'text-cyan-400' },
    { label: 'Live Sekarang', value: liveCount, icon: Trophy, color: 'text-green-400' },
    { label: 'Total Views', value: data.stats.totalViews.toLocaleString(), icon: Eye, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sync Button */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sync dari Football API</h3>
              <p className="text-[10px] text-muted-foreground">Ambil data pertandingan terbaru dari api-sports.io</p>
            </div>
          </div>
          <Button
            onClick={handleSync}
            disabled={syncing}
            size="sm"
            className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 gap-1.5"
          >
            {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
        {syncStatus && (
          <div className="mt-3 p-2.5 rounded-lg bg-white/3 border border-white/5">
            <p className="text-xs text-muted-foreground">{syncStatus}</p>
          </div>
        )}
      </div>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            Pertandingan Hari Ini
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[9px] px-1.5">
              {liveMatches.length}
            </Badge>
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {liveMatches.map((match) => (
              <div key={match.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/3 border border-white/5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <img src={match.homeLogo || '/placeholder-team.png'} alt="" className="w-5 h-5 rounded-full" />
                  <span className="text-xs text-white truncate">{match.homeTeam}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-sm font-bold text-white">{match.homeScore}</span>
                  <span className="text-xs text-muted-foreground">-</span>
                  <span className="text-sm font-bold text-white">{match.awayScore}</span>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="text-xs text-white truncate">{match.awayTeam}</span>
                  <img src={match.awayLogo || '/placeholder-team.png'} alt="" className="w-5 h-5 rounded-full" />
                </div>
                <div className="shrink-0 w-14 text-right">
                  {(match.status === 'LIVE' || match.status === 'HT') ? (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[9px] px-1.5">
                      {match.status === 'HT' ? 'HT' : `${match.minute}'`}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[9px] px-1.5">
                      {match.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Articles */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          Artikel Paling Populer
        </h3>
        <div className="space-y-2">
          {topArticles.map((article, i) => (
            <div key={article.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/3 transition-colors">
              <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-muted-foreground'}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{article.title}</p>
                <p className="text-[10px] text-muted-foreground">{article.categoryName}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Eye className="w-3 h-3" />
                {article.viewCount}
              </div>
            </div>
          ))}
          {topArticles.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Belum ada artikel</p>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-neon" />
          Kategori
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(data.categories || []).map((cat: any) => (
            <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/3 border border-white/5">
              <span className="text-xs text-white">{cat.name}</span>
              <Badge variant="secondary" className="text-[10px] bg-white/5 text-muted-foreground">
                {cat.articleCount || 0}
              </Badge>
            </div>
          ))}
        </div>
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
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5">
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
        <div className="flex gap-1 bg-white/5 p-1 w-fit rounded-lg overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'news-engine', label: 'News Engine', icon: Newspaper },
            { key: 'articles', label: 'Articles', icon: FileText },
            { key: 'comments', label: 'Comments', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-xs gap-1.5 px-4 py-2 rounded-md flex items-center transition-colors whitespace-nowrap ${activeTab === tab.key
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
        <DialogContent className="max-w-md bg-[#0a0a0a] border-white/10">
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