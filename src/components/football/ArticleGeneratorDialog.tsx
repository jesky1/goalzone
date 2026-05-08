'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  ImageIcon,
  FileText,
  TrendingUp,
  Zap,
  ChevronRight,
  Copy,
  Check,
  Eye,
  X,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────

type CategorySlug =
  | 'match-report'
  | 'transfer'
  | 'taktik'
  | 'premier-league'
  | 'la-liga'
  | 'serie-a'
  | 'champions-league'
  | 'bundesliga'
  | 'general';

interface CategoryOption {
  slug: CategorySlug;
  label: string;
  icon: string;
}

interface GeneratedArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  imageUrl: string | null;
  readTime: number;
  category: { name: string; slug: string };
  author: { username: string; role: string };
  createdAt: string;
}

// ─── Categories ──────────────────────────────────────────────

const CATEGORIES: CategoryOption[] = [
  { slug: 'match-report', label: 'Laporan Pertandingan', icon: '⚽' },
  { slug: 'transfer', label: 'Transfer Pemain', icon: '🔄' },
  { slug: 'taktik', label: 'Analisis Taktik', icon: '📋' },
  { slug: 'premier-league', label: 'Premier League', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { slug: 'la-liga', label: 'La Liga', icon: '🇪🇸' },
  { slug: 'serie-a', label: 'Serie A', icon: '🇮🇹' },
  { slug: 'champions-league', label: 'Champions League', icon: '🏆' },
  { slug: 'bundesliga', label: 'Bundesliga', icon: '🇩🇪' },
  { slug: 'general', label: 'Sepak Bola Umum', icon: '📰' },
];

// ─── Quick Topics ────────────────────────────────────────────

const QUICK_TOPICS = [
  { label: 'El Clasico 2025', topic: 'Real Madrid vs Barcelona El Clasico 2025 - Preview dan Prediksi' },
  { label: 'Transfer Haaland', topic: 'Rumor transfer Erling Haaland ke klub baru musim depan' },
  { label: 'Final UCL', topic: 'Preview Final Liga Champions UEFA 2025' },
  { label: 'Premier League', topic: 'Persaingan gelar Premier League musim ini - analisis klasemen' },
  { label: 'Taktik Guardiola', topic: 'Evolusi taktik Pep Guardiola di Manchester City' },
  { label: 'Talenta Muda', topic: '5 pemain muda berbakat yang bakal jadi bintang dunia' },
];

// ─── Component ───────────────────────────────────────────────

interface ArticleGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ArticleGeneratorDialog({
  open,
  onOpenChange,
}: ArticleGeneratorDialogProps) {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState<CategorySlug>('general');
  const [generateImage, setGenerateImage] = useState(false);

  const [step, setStep] = useState<'input' | 'generating' | 'success' | 'error'>('input');
  const [result, setResult] = useState<GeneratedArticle | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);

  // Timer for generation progress
  useEffect(() => {
    if (step !== 'generating') return;
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [step]);

  const resetState = () => {
    setStep('input');
    setResult(null);
    setErrorMsg('');
    setElapsed(0);
    setCopied(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) resetState();
    onOpenChange(val);
  };

  const handleGenerate = async () => {
    if (!topic.trim() || topic.trim().length < 3) return;

    setStep('generating');
    setErrorMsg('');
    setResult(null);

    // Use AbortController with 3-minute timeout for AI generation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180_000); // 3 minutes

    try {
      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          category,
          language: 'id',
          generateImage,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (res.ok && data.success) {
        setResult(data.article);
        setStep('success');
      } else {
        const errMsg = data.error || `Gagal generate artikel (HTTP ${res.status})`;
        setErrorMsg(errMsg);
        setStep('error');
        console.error('[AI Generator] API error:', errMsg, data);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setErrorMsg('Generate artikel timeout. Coba lagi dengan topik yang lebih singkat, atau nonaktifkan "Generate Cover Image".');
      } else {
        setErrorMsg(err.message || 'Terjadi kesalahan koneksi');
        console.error('[AI Generator] Fetch error:', err.message, err.stack);
      }
      setStep('error');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedCat = CATEGORIES.find((c) => c.slug === category);

  // ── Input Step ──
  const renderInput = () => (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center pb-2">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-neon/20 to-emerald-500/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-neon" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          AI Article Generator
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Buat artikel berita sepak bola profesional dengan AI dalam hitungan detik
        </p>
      </div>

      {/* Topic Input */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Topik Artikel
        </label>
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Contoh: Real Madrid vs Barcelona El Clasico 2025 - Preview dan Prediksi"
          className="min-h-[100px] bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-sm placeholder:text-muted-foreground focus:border-neon/40 focus:ring-neon/20 resize-none"
          rows={3}
          maxLength={500}
        />
        <div className="flex justify-between items-center text-[11px] text-muted-foreground">
          <span>Minimal 3 karakter</span>
          <span>{topic.length}/500</span>
        </div>
      </div>

      {/* Quick Topics */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Topik Populer
        </label>
        <div className="flex flex-wrap gap-2">
          {QUICK_TOPICS.map((qt) => (
            <button
              key={qt.label}
              onClick={() => setTopic(qt.topic)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium
                bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300
                hover:bg-neon/10 hover:text-neon hover:border-neon/20
                border border-transparent transition-all duration-200"
            >
              <Zap className="w-3 h-3" />
              {qt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Selection */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Kategori
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                category === cat.slug
                  ? 'bg-neon/10 border-neon/30 text-neon shadow-sm shadow-neon/5'
                  : 'bg-gray-100 dark:bg-white/5 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              <span className="truncate">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Image Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-pink-500/10 flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Generate Cover Image
            </span>
            <p className="text-[11px] text-muted-foreground">
              AI akan buat gambar cover sinematik
            </p>
          </div>
        </div>
        <button
          onClick={() => setGenerateImage(!generateImage)}
          className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
            generateImage ? 'bg-neon' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              generateImage ? 'left-5.5' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={topic.trim().length < 3}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl
          bg-gradient-to-r from-neon to-emerald-500
          text-white font-bold text-sm
          hover:from-neon/90 hover:to-emerald-500/90
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-200 shadow-lg shadow-neon/20
          active:scale-[0.98]"
      >
        <Sparkles className="w-5 h-5" />
        Generate Artikel Sekarang
      </button>
    </div>
  );

  // ── Generating Step ──
  const renderGenerating = () => {
    const tips = [
      'Menganalisis data pertandingan...',
      'Menulis analisis taktis mendalam...',
      'Membuat narasi yang engaging...',
      'Mengoptimasi SEO...',
      'Menyusun heading hierarchy...',
    ];
    const currentTip = tips[Math.min(Math.floor(elapsed / 6), tips.length - 1)];

    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-6">
        {/* Animated Spinner */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-neon/20 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon"
            />
            <Sparkles className="w-8 h-8 text-neon" />
          </div>
        </div>

        {/* Status */}
        <div className="text-center space-y-2">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Sedang Generate Artikel...
          </h3>
          <p className="text-xs text-muted-foreground animate-pulse">
            {currentTip}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {elapsed}s elapsed
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-neon to-emerald-500 rounded-full"
            animate={{ width: `${Math.min((elapsed / 60) * 100, 95)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>

        {/* Topic Display */}
        <div className="glass p-3 rounded-xl w-full max-w-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{selectedCat?.icon}</span>
            <span className="text-[11px] font-medium text-muted-foreground">{selectedCat?.label}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
            {topic}
          </p>
        </div>
      </div>
    );
  };

  // ── Success Step ──
  const renderSuccess = () => {
    if (!result) return null;
    return (
      <div className="space-y-5">
        {/* Success Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
          </motion.div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Artikel Berhasil Dibuat!
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Artikel sudah dipublikasikan ke database
          </p>
        </div>

        {/* Article Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card overflow-hidden"
        >
          {/* Cover Image */}
          {result.imageUrl && (
            <div className="w-full h-40 overflow-hidden">
              <img
                src={result.imageUrl}
                alt={result.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {!result.imageUrl && (
            <div className="w-full h-24 bg-gradient-to-br from-neon/20 to-emerald-500/10 flex items-center justify-center">
              <FileText className="w-8 h-8 text-neon/40" />
            </div>
          )}

          {/* Article Info */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-neon/10 text-neon border border-neon/20 text-[10px] font-bold">
                {result.category.name}
              </Badge>
              <Badge variant="secondary" className="bg-gray-100 dark:bg-white/5 text-[10px]">
                {result.readTime} menit baca
              </Badge>
            </div>

            <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
              {result.title}
            </h4>

            {result.summary && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {result.summary}
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-gray-200 dark:border-white/5">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {result.author.username}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                0 views
              </span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {/* Copy Title */}
          <button
            onClick={() => handleCopy(result.title)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium
              bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300
              hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Judul Disalin!' : 'Copy Judul'}
          </button>

          {/* Generate Another */}
          <button
            onClick={resetState}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium
              bg-gradient-to-r from-neon to-emerald-500 text-white
              hover:from-neon/90 hover:to-emerald-500/90 transition-all shadow-lg shadow-neon/20"
          >
            <Sparkles className="w-4 h-4" />
            Generate Artikel Lagi
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: FileText, label: 'Artikel', value: 'AI' },
            { icon: TrendingUp, label: 'SEO', value: 'Optimized' },
            { icon: Zap, label: 'Tipe', value: result.category.name },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center py-2.5 rounded-xl bg-gray-100 dark:bg-white/5"
            >
              <stat.icon className="w-4 h-4 text-neon mb-1" />
              <span className="text-[10px] font-bold text-gray-900 dark:text-white">
                {stat.value}
              </span>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Error Step ──
  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-10 space-y-5">
      <XCircle className="w-14 h-14 text-red-400" />
      <div className="text-center">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Gagal Generate Artikel
        </h3>
        <p className="text-xs text-muted-foreground mt-2 max-w-xs">
          {errorMsg}
        </p>
      </div>
      <button
        onClick={resetState}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
          bg-gradient-to-r from-neon to-emerald-500 text-white
          hover:from-neon/90 hover:to-emerald-500/90 transition-all"
      >
        Coba Lagi
      </button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto custom-scrollbar bg-deep-800 border-gray-200 dark:border-white/10 p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>AI Article Generator - GOALZONE</DialogTitle>
        </DialogHeader>

        {/* Close Button */}
        <div className="flex justify-end p-3 pb-0">
          <button
            onClick={() => handleClose(false)}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="px-5 pb-6">
          <AnimatePresence mode="wait">
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {renderInput()}
              </motion.div>
            )}
            {step === 'generating' && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {renderGenerating()}
              </motion.div>
            )}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {renderSuccess()}
              </motion.div>
            )}
            {step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {renderError()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
