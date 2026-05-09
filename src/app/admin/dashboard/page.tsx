'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search,
  Sparkles,
  Plus,
  CheckCircle2,
  XCircle,
  Flame,
  Zap,
  ArrowRight,
  Copy,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

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
  categories: { id: string; name: string; slug: string; color: string; articleCount: number }[];
  recentComments: any[];
}

interface GeneratedArticle {
  id: string;
  title: string;
  slug: string;
  status: string;
  isTrending: boolean;
  category: string;
  readTime: number;
  seoKeywords: string[];
  createdAt: string;
}

// ─── Trending Topic Suggestions ─────────────────────────────
const TRENDING_SUGGESTIONS = [
  'Mbappé performa di Real Madrid',
  'Transfer striker besar musim ini',
  'Liga Champions hasil terbaru',
  'Timnas Indonesia persiapan ajang',
  'Premier League kompetisi ketat',
  'La Liga El Clasico terbaru',
  'Serie A Napoli juara bertahan',
  'Bundesliga Bayern dominasi',
  'Piala Dunia kualifikasi terbaru',
  'Erik ten Hag keputusan strategis',
];

// ─── Valid Categories for Trending ──────────────────────────
const CATEGORY_OPTIONS = [
  'Premier League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'Champions League',
  'Europa League',
  'Transfer',
  'Timnas',
  'Analisis',
];

// ============================================================
// Login Form — Clean Solid Light Mode
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Shield className="w-8 h-8 text-sky-600" />
            <span className="text-2xl font-bold text-slate-900 tracking-wider">GOALZONE</span>
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-sky-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Admin Login</h2>
          <p className="text-xs text-slate-500">Masuk untuk mengakses dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-sm border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Username</label>
              <Input
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="Masukkan username..."
                autoFocus
                className="bg-slate-50 border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Masukkan password..."
                  className="bg-slate-50 border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-500/20 pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-sky-600 px-2 py-1 rounded transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={!username.trim() || !password.trim() || loading}
              className="w-full bg-sky-600 text-white hover:bg-sky-700 gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-[10px] text-slate-400 text-center">
              Demo: <code className="text-sky-600 font-mono bg-sky-50 px-1 py-0.5 rounded">admin</code> / <code className="text-sky-600 font-mono bg-sky-50 px-1 py-0.5 rounded">admin123</code>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Overview Tab — Clean Solid Light Mode
// ============================================================
function OverviewTab({ data }: { data: DashboardData }) {
  const topArticles = [...(data.articles || [])]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  const statCards = [
    { label: 'Total Artikel', value: data.stats.totalArticles, icon: FileText, color: 'bg-sky-50 text-sky-600' },
    { label: 'Komentar', value: data.stats.totalComments, icon: MessageSquare, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Views', value: data.stats.totalViews.toLocaleString(), icon: Eye, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Featured', value: data.stats.featuredArticles, icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow-sm border border-slate-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 rounded-lg ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <ChevronRight className="w-3 h-3 text-slate-300" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-500" />
          Artikel Paling Populer
        </h3>
        <div className="space-y-2">
          {topArticles.map((article, i) => (
            <div key={article.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                i === 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
              }`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">{article.title}</p>
                <p className="text-[10px] text-slate-400">{article.categoryName}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                <Eye className="w-3 h-3" />
                {article.viewCount}
              </div>
            </div>
          ))}
          {topArticles.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">Belum ada artikel</p>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-sky-600" />
          Kategori
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(data.categories || []).map((cat: any) => (
            <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-700 font-medium">{cat.name}</span>
              <Badge variant="secondary" className="text-[10px] bg-white text-slate-500 border border-slate-200">
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
// Articles Tab — Clean Solid Light Mode
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari artikel..."
            className="bg-white border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 pl-9"
          />
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm" className="text-sky-600 border-sky-200 hover:bg-sky-50 gap-1.5 shrink-0">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-4 text-slate-500 font-medium">#</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Judul</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium hidden sm:table-cell">Kategori</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium hidden md:table-cell">Views</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium hidden lg:table-cell">Tanggal</th>
                <th className="text-right py-3 px-4 text-slate-500 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {filtered.map((article, i) => (
                <tr key={article.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-slate-400">{i + 1}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {article.isFeatured ? (
                        <Badge className="bg-sky-50 text-sky-600 border-sky-200 text-[9px] px-1 py-0 shrink-0">
                          Featured
                        </Badge>
                      ) : null}
                      <span className="text-xs font-medium text-slate-900 truncate max-w-[200px] sm:max-w-[300px]">
                        {article.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <Badge variant="secondary" className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200">
                      {article.categoryName || '-'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-slate-400" />{article.viewCount}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 hidden lg:table-cell">
                    {new Date(article.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onDelete(article.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
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
              <p className="text-xs text-slate-400">Tidak ada artikel ditemukan</p>
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-slate-200 text-[10px] text-slate-400">
          Menampilkan {filtered.length} dari {data.articles?.length || 0} artikel
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Comments Tab — Clean Solid Light Mode
// ============================================================
function CommentsTab({ data }: { data: DashboardData }) {
  return (
    <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-blue-500" />
        Komentar Terbaru
      </h3>
      <div className="space-y-3">
        {(data.recentComments || []).map((comment: any) => (
          <div key={comment.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-900">{comment.authorName || 'Anonymous'}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(comment.createdAt).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-1.5">{comment.text}</p>
            {comment.articleTitle && (
              <p className="text-[10px] text-slate-400">
                pada: <span className="text-sky-600">{comment.articleTitle}</span>
              </p>
            )}
          </div>
        ))}
        {(data.recentComments || []).length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6">Belum ada komentar</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Trending AI Tab — Auto-Generate Trending Article
// ============================================================
function TrendingAITab({ token, onArticleCreated }: { token: string; onArticleCreated: () => void }) {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedArticle | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<GeneratedArticle[]>([]);

  // ─── Generate Handler ───────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/admin/generate-trending-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: topic.trim(),
          category: category || undefined,
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setResult(data.data);
        setHistory((prev) => [data.data, ...prev].slice(0, 10));
        setTopic('');
        onArticleCreated();
      } else {
        setError(data.error || 'Gagal membuat artikel');
      }
    } catch {
      setError('Tidak dapat terhubung ke server AI');
    } finally {
      setGenerating(false);
    }
  };

  // ─── Quick-pick suggestion ──────────────────────────────────
  const handleSuggestion = (suggestion: string) => {
    setTopic(suggestion);
    setError('');
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* ─── Input Card ──────────────────────────────────── */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Auto-Generate Artikel Trending</h3>
            <p className="text-[10px] text-slate-400">Masukkan topik dari Google Trends, AI akan membuat artikel draft otomatis</p>
          </div>
        </div>

        {/* Topic Input */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Topik Trending <span className="text-red-400">*</span>
            </label>
            <Textarea
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setError(''); }}
              placeholder="Contoh: Mbappé performa luar biasa di Real Madrid musim ini..."
              className="bg-slate-50 border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 min-h-[80px] resize-none"
              disabled={generating}
            />
            <p className="text-[10px] text-slate-400">{topic.length}/500 karakter</p>
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Kategori (opsional)</label>
            <Select value={category} onValueChange={setCategory} disabled={generating}>
              <SelectTrigger className="bg-slate-50 border-slate-200 text-sm text-slate-900 focus:ring-amber-500/20">
                <SelectValue placeholder="Pilih kategori..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-sm">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trending Suggestions */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Saran Topik Populer</label>
            <div className="flex flex-wrap gap-1.5">
              {TRENDING_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestion(suggestion)}
                  disabled={generating}
                  className="text-[10px] px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-colors disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!topic.trim() || generating}
            className="w-full bg-amber-500 text-white hover:bg-amber-600 gap-2 h-10"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI sedang menulis artikel...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Artikel Trending</span>
              </>
            )}
          </Button>

          {/* Generating Progress */}
          {generating && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200"
            >
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-700">AI sedang bekerja...</p>
                <p className="text-[10px] text-amber-600">Menganalisis topik, menulis konten, dan menyimpan sebagai draft</p>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200"
            >
              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* ─── Success Result ──────────────────────────────── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-emerald-800">Artikel Berhasil Dibuat!</h3>
            </div>

            <div className="bg-white rounded-lg border border-emerald-200 p-4 space-y-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Judul</p>
                <p className="text-sm font-semibold text-slate-900">{result.title}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] gap-1">
                  <Flame className="w-3 h-3" /> Trending
                </Badge>
                <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] gap-1">
                  <FileText className="w-3 h-3" /> Draft
                </Badge>
                <Badge className="bg-sky-50 text-sky-600 border-sky-200 text-[10px]">
                  {result.category}
                </Badge>
                <Badge variant="outline" className="text-[10px] text-slate-400">
                  {result.readTime} min read
                </Badge>
              </div>

              {result.seoKeywords && result.seoKeywords.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">SEO Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {result.seoKeywords.map((kw, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-emerald-200">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1"
                  onClick={() => {
                    navigator.clipboard.writeText(result.slug);
                  }}
                >
                  <Copy className="w-3 h-3" /> Copy Slug
                </Button>
                <p className="text-[10px] text-slate-400 ml-auto">
                  {new Date(result.createdAt).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <p className="text-[10px] text-emerald-600 mt-2">
              ✅ Artikel telah disimpan ke Supabase dengan status <strong>draft</strong> dan ditandai sebagai <strong>trending</strong>.
              Anda bisa mengedit dan mempublikasikannya dari tab Articles.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── History ─────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Riwayat Generate ({history.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {history.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <div className="p-1 rounded bg-amber-50 border border-amber-200 shrink-0">
                  <Flame className="w-3 h-3 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">{article.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-[8px] px-1 py-0">
                      {article.category}
                    </Badge>
                    <span className="text-[9px] text-slate-400">
                      {new Date(article.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[8px] px-1 py-0 shrink-0">
                  Draft
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}
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
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="text-center py-16 px-6">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-sm text-red-500 mb-2">{error}</p>
          <Button onClick={loadData} variant="outline" size="sm" className="text-sky-600 border-sky-200 hover:bg-sky-50 gap-2">
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center">
            <Shield className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Dashboard</h1>
            <p className="text-[10px] text-slate-400">Welcome, {user.fullName || user.username}</p>
          </div>
        </div>
        <Button
          onClick={onLogout}
          variant="outline"
          size="sm"
          className="text-xs text-slate-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </Button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 w-fit rounded-lg mb-6 overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'articles', label: 'Articles', icon: FileText },
          { key: 'trending-ai', label: 'Trending AI', icon: Flame },
          { key: 'comments', label: 'Comments', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-xs gap-1.5 px-4 py-2 rounded-md flex items-center transition-colors font-medium whitespace-nowrap ${
              activeTab === tab.key
                ? tab.key === 'trending-ai'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white shadow-sm border border-slate-200 rounded-xl p-4">
                  <Skeleton className="h-10 w-20 bg-slate-100" />
                  <Skeleton className="h-4 w-16 bg-slate-100 mt-2" />
                </div>
              ))}
            </div>
            <Skeleton className="h-[300px] w-full bg-slate-100 rounded-xl" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && data && <OverviewTab data={data} />}
            {activeTab === 'articles' && data && (
              <ArticlesTab data={data} token={token} onRefresh={loadData} onDelete={(id) => setDeleteId(id)} />
            )}
            {activeTab === 'trending-ai' && (
              <TrendingAITab token={token} onArticleCreated={loadData} />
            )}
            {activeTab === 'comments' && data && <CommentsTab data={data} />}
          </>
        )}
      </div>

      {/* Delete Modal */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Hapus Artikel?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Artikel akan dihapus secara permanen beserta komentar-komentarnya.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="text-slate-600">
              Batal
            </Button>
            <Button
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 gap-2"
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
// Main: Admin Dashboard Page
// ============================================================
export default function AdminDashboardPage() {
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

  const handleLogout = async () => {
    // Clear HttpOnly cookie via API
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch { /* silent */ }
    // Clear client-side state
    setToken(null);
    setUser(null);
    localStorage.removeItem('goalzone_admin_token');
    localStorage.removeItem('goalzone_admin_user');
  };

  return (
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
  );
}
