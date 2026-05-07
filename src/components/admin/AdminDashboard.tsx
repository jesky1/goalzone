'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Send,
  Loader2,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  imageUrl: string | null;
  category: { name: string; slug: string };
  author: { username: string };
  viewCount: number;
  isFeatured: boolean;
  readTime: number;
  createdAt: string;
}

interface AdminDashboardProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminDashboard({ open, onClose }: AdminDashboardProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Editor form state
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formReadTime, setFormReadTime] = useState('5');

  // ─── fetchArticles — direct Supabase client query ──────────
  // Fetches all articles from Supabase ordered by created_at DESC
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('articles')
        .select('*, categories(name, slug), profiles(username)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[fetchArticles] Supabase error:', JSON.stringify({
          code: error.code,
          message: error.message,
          hint: error.hint,
          details: error.details,
        }));

        // Provide user-friendly message for common errors
        let msg = 'Gagal memuat artikel dari Supabase';
        if (error.code === '42501' || error.message?.includes('policy')) {
          msg = 'RLS memblokir akses. Tambahkan policy: CREATE POLICY "anon_read" ON articles FOR SELECT TO anon USING (true);';
        } else if (error.code === '42P01') {
          msg = 'Tabel articles belum ada di Supabase. Jalankan migration terlebih dahulu.';
        }
        setFetchError(msg);
        setArticles([]);
        return;
      }

      // Map Supabase rows (snake_case) to Article interface (camelCase)
      const mapped: Article[] = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        content: row.content,
        summary: row.summary,
        imageUrl: row.cover_image,
        category: {
          name: row.categories?.name || 'Tanpa Kategori',
          slug: row.categories?.slug || '',
        },
        author: {
          username: row.profiles?.username || 'Unknown',
        },
        viewCount: row.view_count ?? 0,
        isFeatured: row.is_featured ?? false,
        readTime: row.read_time ?? 5,
        createdAt: row.created_at,
      }));

      setArticles(mapped);
      console.log(`[fetchArticles] Loaded ${mapped.length} articles from Supabase`);
    } catch (err: any) {
      console.error('[fetchArticles] Unexpected error:', err.message);
      // Supabase client might not be configured
      if (err.message?.includes('NEXT_PUBLIC_SUPABASE')) {
        setFetchError('Supabase belum dikonfigurasi. Set NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      } else {
        setFetchError(`Gagal memuat artikel: ${err.message}`);
      }
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── fetchCategories — direct Supabase client query ────────
  const fetchCategories = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[fetchCategories] Supabase error:', error.message);
        return;
      }

      const mapped: Category[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
      }));
      setCategories(mapped);
    } catch (err: any) {
      console.error('[fetchCategories] Error:', err.message);
    }
  }, []);

  // ─── Auto-fetch on mount ──────────────────────────────────
  useEffect(() => {
    if (open) {
      fetchArticles();
      fetchCategories();
    }
  }, [open, fetchArticles, fetchCategories]);

  const resetForm = () => {
    setFormTitle('');
    setFormSlug('');
    setFormContent('');
    setFormSummary('');
    setFormImageUrl('');
    setFormCategoryId('');
    setFormIsFeatured(false);
    setFormReadTime('5');
    setEditingArticle(null);
  };

  const handleNewArticle = () => {
    resetForm();
    setShowEditor(true);
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setFormTitle(article.title);
    setFormSlug(article.slug);
    setFormContent(article.content);
    setFormSummary(article.summary || '');
    setFormImageUrl(article.imageUrl || '');
    setFormCategoryId(article.category.id);
    setFormIsFeatured(article.isFeatured);
    setFormReadTime(String(article.readTime));
    setShowEditor(true);
  };

  const handleDeleteArticle = async (articleId: string) => {
    try {
      const res = await fetch(`/api/articles/${articles.find(a => a.id === articleId)?.slug}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchArticles();
      }
    } catch {
      // silently fail
    }
    setShowDeleteDialog(null);
  };

  const handleSubmit = async () => {
    if (!formTitle || !formSlug || !formContent || !formCategoryId) return;
    setSubmitting(true);

    try {
      const url = editingArticle
        ? `/api/articles/${editingArticle.slug}`
        : '/api/articles';
      const method = editingArticle ? 'PUT' : 'POST';

      const body: Record<string, unknown> = {
        title: formTitle,
        slug: formSlug,
        content: formContent,
        summary: formSummary || null,
        imageUrl: formImageUrl || null,
        categoryId: formCategoryId,
        authorId: 'admin', // default author
        isFeatured: formIsFeatured,
        readTime: parseInt(formReadTime, 10),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowEditor(false);
        resetForm();
        fetchArticles();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-deep-800/98 backdrop-blur-2xl border-white/10 p-0 overflow-y-auto custom-scrollbar">
          <SheetHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neon/10 border border-neon/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-neon" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-bold text-white">
                    Admin Dashboard
                  </SheetTitle>
                  <p className="text-xs text-muted-foreground">
                    Kelola berita dan konten
                  </p>
                </div>
              </div>
              <Button
                onClick={handleNewArticle}
                size="sm"
                className="bg-neon/10 text-neon hover:bg-neon/20 border border-neon/20 gap-2"
              >
                <Plus className="w-4 h-4" />
                Tulis Berita
              </Button>
            </div>
          </SheetHeader>

          <div className="p-6">
            <Separator className="bg-white/5 mb-6" />

            {/* Error Banner */}
            {fetchError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-red-400 break-words">{fetchError}</p>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0 text-red-400 hover:text-red-300" onClick={fetchArticles}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="glass-card p-3 text-center">
                <div className="text-2xl font-bold neon-text">{articles.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Artikel</div>
              </div>
              <div className="glass-card p-3 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {articles.filter((a) => a.isFeatured).length}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Featured</div>
              </div>
              <div className="glass-card p-3 text-center">
                <div className="text-2xl font-bold text-amber-400">
                  {categories.length}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Kategori</div>
              </div>
            </div>

            {/* Articles List */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-neon" />
                Daftar Artikel
                <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0 text-muted-foreground hover:text-neon" onClick={fetchArticles} disabled={loading}>
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </h3>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-card p-3 animate-pulse">
                      <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {articles.map((article) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass-card p-3 flex items-start gap-3 group"
                    >
                      {article.imageUrl && (
                        <div className="w-16 h-12 rounded-md overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={article.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-white truncate">
                            {article.title}
                          </h4>
                          {article.isFeatured && (
                            <Badge className="bg-neon/10 text-neon border-neon/20 text-[10px] px-1.5 py-0 shrink-0">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{article.category.name}</span>
                          <span>{article.author.username}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {article.viewCount}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-neon hover:bg-white/5"
                          onClick={() => handleEditArticle(article)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => setShowDeleteDialog(article.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}

                  {articles.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      Belum ada artikel
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Article Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar bg-deep-800 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {editingArticle ? 'Edit Artikel' : 'Tulis Artikel Baru'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              {editingArticle ? 'Ubah konten artikel yang sudah ada' : 'Isi formulir untuk membuat artikel baru'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Judul Artikel *</label>
              <Input
                value={formTitle}
                onChange={(e) => {
                  setFormTitle(e.target.value);
                  if (!editingArticle) {
                    setFormSlug(generateSlug(e.target.value));
                  }
                }}
                placeholder="Masukkan judul artikel..."
                className="bg-white/5 border-white/10 text-sm text-white placeholder:text-muted-foreground focus:border-neon/30 focus:ring-neon/20"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">URL Slug *</label>
              <Input
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="url-slug-artikel"
                className="bg-white/5 border-white/10 text-sm text-white placeholder:text-muted-foreground focus:border-neon/30 focus:ring-neon/20"
              />
            </div>

            {/* Category & Read Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Kategori *</label>
                <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-sm text-white">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-deep-700 border-white/10">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Waktu Baca (menit)</label>
                <Input
                  type="number"
                  value={formReadTime}
                  onChange={(e) => setFormReadTime(e.target.value)}
                  min="1"
                  max="30"
                  className="bg-white/5 border-white/10 text-sm text-white placeholder:text-muted-foreground focus:border-neon/30 focus:ring-neon/20"
                />
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">URL Gambar</label>
              <Input
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                placeholder="/images/articles/my-article.jpg"
                className="bg-white/5 border-white/10 text-sm text-white placeholder:text-muted-foreground focus:border-neon/30 focus:ring-neon/20"
              />
              {formImageUrl && (
                <div className="mt-2 w-full h-32 rounded-lg overflow-hidden glass-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Ringkasan (AI Summary)</label>
              <Textarea
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                placeholder="Ringkasan singkat artikel..."
                rows={2}
                className="bg-white/5 border-white/10 text-sm text-white placeholder:text-muted-foreground focus:border-neon/30 focus:ring-neon/20 resize-none"
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Konten Artikel *</label>
              <Textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Tulis konten artikel di sini... Pisahkan paragraf dengan baris kosong."
                rows={10}
                className="bg-white/5 border-white/10 text-sm text-white placeholder:text-muted-foreground focus:border-neon/30 focus:ring-neon/20 resize-none min-h-[200px]"
              />
            </div>

            {/* Featured toggle */}
            <div className="flex items-center justify-between glass-card p-3">
              <div>
                <div className="text-sm font-medium text-white">Tampilkan sebagai Featured</div>
                <div className="text-xs text-muted-foreground">Artikel akan tampil di hero slider</div>
              </div>
              <Switch
                checked={formIsFeatured}
                onCheckedChange={setFormIsFeatured}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => { setShowEditor(false); resetForm(); }}
                className="text-muted-foreground hover:text-white"
              >
                Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !formTitle || !formSlug || !formContent || !formCategoryId}
                className="bg-neon/10 text-neon hover:bg-neon/20 border border-neon/20 gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {editingArticle ? 'Simpan Perubahan' : 'Publikasikan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent className="max-w-md bg-deep-800 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              Hapus Artikel?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Tindakan ini tidak dapat dibatalkan. Artikel akan dihapus secara permanen.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(null)}
              className="text-muted-foreground hover:text-white"
            >
              Batal
            </Button>
            <Button
              onClick={() => showDeleteDialog && handleDeleteArticle(showDeleteDialog)}
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
