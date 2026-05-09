'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Newspaper,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Settings2,
  Info,
  ChevronDown,
  ChevronUp,
  BarChart3,
  RefreshCw,
  Eye,
  AlertTriangle,
  Database,
  Image as ImageIcon,
  FileText,
  Search,
  Shield,
  Sparkles,
  BookOpen,
  Tag,
  Copy,
  Check,
  Save,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Types ──────────────────────────────────────────────────

interface GeneratedArticle {
  title: string
  slug: string
  content: string
  summary: string
  metaDescription: string
  category: string
  readTime: number
  imageUrl: string | null
  imagePrompt?: string
}

interface PipelineResult {
  success: boolean
  match: string
  fixtureId: number
  article?: { id: string; slug: string; title: string; imageUrl: string }
  error?: string
  stage?: string
  duration: number
}

interface PipelineResponse {
  success: boolean
  message: string
  pipeline_duration_ms: number
  mode: string
  dry_run: boolean
  matches_found: number
  articles_generated: number
  results: PipelineResult[]
}

interface ServiceStatus {
  status: string
  service: string
  version: string
  leagues_monitored: number
  features: string[]
  config: {
    footballApi: boolean
    supabase: boolean
    revalidation: boolean
    defaultAuthor: string
    defaultCategory: string
  }
}

// ─── Pipeline Stage Icons ───────────────────────────────────

function StageIcon({ stage, success }: { stage?: string; success: boolean }) {
  if (success) return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
  if (stage === 'dedup') return <AlertTriangle className="w-4 h-4 text-amber-400" />
  return <XCircle className="w-4 h-4 text-red-400" />
}

// ─── Stats Card ─────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color?: string }) {
  return (
    <div className="glass-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${color || 'bg-neon/10'}`}>
          <Icon className={`w-4 h-4 ${color ? color.replace('bg-', 'text-') : 'text-neon'}`} />
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  )
}

// ─── Config Panel ───────────────────────────────────────────

function ConfigPanel({ config, onFixtureIdsChange }: { config: ServiceStatus | null; onFixtureIdsChange: (ids: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Configuration & Status</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {config ? (
                <>
                  {/* Service Status */}
                  <div className="flex items-center gap-2">
                    <Badge variant={config.status === 'active' ? 'default' : 'secondary'} className={config.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}>
                      {config.status === 'active' ? '● Active' : '● Inactive'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">v{config.version}</span>
                    <span className="text-xs text-muted-foreground">{config.leagues_monitored} leagues monitored</span>
                  </div>

                  {/* Integration Status */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'API-Football', ok: config.config.footballApi, icon: Search },
                      { label: 'Supabase', ok: config.config.supabase, icon: Database },
                      { label: 'Revalidation', ok: config.config.revalidation, icon: RefreshCw },
                      { label: 'Auth', ok: config.config.defaultAuthor !== 'auto-create' || config.config.defaultCategory !== 'auto-resolve', icon: Shield },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-white/[0.03]">
                        <item.icon className={`w-3.5 h-3.5 ${item.ok ? 'text-emerald-400' : 'text-red-400'}`} />
                        <span className="text-[11px] text-muted-foreground">{item.label}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ml-auto ${item.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pipeline Features</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {config.features.map(f => (
                        <Badge key={f} variant="outline" className="text-[10px] font-normal py-0 px-2">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Manual Fixture IDs */}
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Manual Mode — Fixture IDs</span>
                    <Textarea
                      placeholder="Enter fixture IDs, comma-separated (e.g., 1234567, 1234568)"
                      className="mt-2 text-sm bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 resize-none"
                      rows={2}
                      onChange={(e) => onFixtureIdsChange(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────

export default function NewsEnginePanel() {
  const [status, setStatus] = useState<ServiceStatus | null>(null)
  const [running, setRunning] = useState(false)
  const [response, setResponse] = useState<PipelineResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showPreview, setShowPreview] = useState<{ title: string; slug: string } | null>(null)

  // Config state
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const [fixtureIds, setFixtureIds] = useState('')
  const [lookbackHours, setLookbackHours] = useState('24')
  const [maxArticles, setMaxArticles] = useState('5')
  const [dryRun, setDryRun] = useState(false)

  // AI Article Generator state
  const [aiTopic, setAiTopic] = useState('')
  const [aiCategory, setAiCategory] = useState<string>('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiArticle, setAiArticle] = useState<GeneratedArticle | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedArticleId, setSavedArticleId] = useState<string | null>(null)
  const { toast } = useToast()

  // Load service status
  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/cron/generate-news')
      if (res.ok) setStatus(await res.json())
    } catch { /* silent */ }
  }, [])

  useState(() => { loadStatus() })

  // Run pipeline
  const runPipeline = async () => {
    setRunning(true)
    setError(null)
    setResponse(null)

    try {
      const body: any = { mode, lookbackHours: parseInt(lookbackHours), maxArticles: parseInt(maxArticles), dryRun }
      if (mode === 'manual' && fixtureIds.trim()) {
        body.fixtureIds = fixtureIds.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
      }

      const res = await fetch('/api/cron/generate-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Pipeline failed')
      setResponse(data)
      setShowResult(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRunning(false)
    }
  }

  // Generate AI article
  const generateAiArticle = async () => {
    if (!aiTopic.trim()) return
    setAiGenerating(true)
    setAiError(null)
    setAiArticle(null)
    setSavedArticleId(null)

    try {
      const adminKey = localStorage.getItem('goalzone_admin_token') || localStorage.getItem('admin_api_key') || ''
      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminKey ? { Authorization: `Bearer ${adminKey}` } : {}),
        },
        body: JSON.stringify({ topic: aiTopic.trim(), category: aiCategory || undefined }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'AI generation failed')
      setAiArticle(data.article)
    } catch (err: any) {
      setAiError(err.message)
    } finally {
      setAiGenerating(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch { /* silent */ }
  }

  // ─── Save AI Article to Database ──────────────────────────
  const handleSaveToDatabase = async () => {
    if (!aiArticle) return
    setSaving(true)

    try {
      const adminKey = localStorage.getItem('goalzone_admin_token') || ''

      const res = await fetch('/api/admin/save-article?XTransformPort=3000', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminKey ? { Authorization: `Bearer ${adminKey}` } : {}),
        },
        body: JSON.stringify({
          title: aiArticle.title,
          slug: aiArticle.slug,
          content: aiArticle.content,
          summary: aiArticle.summary,
          metaDescription: aiArticle.metaDescription,
          category: aiArticle.category,
          readTime: aiArticle.readTime,
          imageUrl: aiArticle.imageUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan artikel')
      }

      setSavedArticleId(data.data.id)

      toast({
        title: 'Berita berhasil disimpan sebagai Draft!',
        description: `"${aiArticle.title}" telah disimpan ke database.`,
        variant: 'default',
      })
    } catch (err: any) {
      toast({
        title: 'Gagal menyimpan berita',
        description: err.message || 'Terjadi kesalahan saat menyimpan artikel.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── AI Article Generator Section ── */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-white/5 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/20">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Article Generator</h3>
            <p className="text-[11px] text-muted-foreground">Generate football news articles with AI</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Input row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter article topic, e.g. Manchester City kejar striker baru di bursa transfer"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !aiGenerating && generateAiArticle()}
                className="text-sm bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10"
                disabled={aiGenerating}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={aiCategory} onValueChange={setAiCategory}>
                <SelectTrigger className="text-sm bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Premier League">Premier League</SelectItem>
                  <SelectItem value="La Liga">La Liga</SelectItem>
                  <SelectItem value="Serie A">Serie A</SelectItem>
                  <SelectItem value="Bundesliga">Bundesliga</SelectItem>
                  <SelectItem value="Ligue 1">Ligue 1</SelectItem>
                  <SelectItem value="Champions League">Champions League</SelectItem>
                  <SelectItem value="Europa League">Europa League</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="Timnas">Timnas</SelectItem>
                  <SelectItem value="Analisis">Analisis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={generateAiArticle}
              disabled={aiGenerating || !aiTopic.trim()}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/20 shrink-0"
              size="default"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>

          {/* AI Error */}
          {aiError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">Generation Error</p>
                <p className="text-xs text-red-400/70 mt-0.5">{aiError}</p>
              </div>
            </motion.div>
          )}

          {/* AI Generated Article Preview */}
          <AnimatePresence>
            {aiArticle && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 overflow-hidden"
              >
                {/* Preview header */}
                <div className="p-4 border-b border-violet-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Generated Article Preview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20">AI Generated</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-red-400 h-7 px-2"
                      onClick={() => setAiArticle(null)}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Preview content */}
                <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Title</span>
                      <button
                        onClick={() => copyToClipboard(aiArticle.title, 'title')}
                        className="text-[10px] text-muted-foreground hover:text-neon flex items-center gap-1 transition-colors"
                      >
                        {copiedField === 'title' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedField === 'title' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{aiArticle.title}</h4>
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {aiArticle.category}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {aiArticle.readTime} min read
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] flex items-center gap-1 ${aiArticle.imageUrl ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'}`}
                    >
                      <ImageIcon className="w-3 h-3" />
                      {aiArticle.imageUrl ? 'Cover Image ✓' : 'No Image'}
                    </Badge>
                  </div>

                  {/* Slug (Auto-Generated) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Auto-Slug
                      </span>
                      <button
                        onClick={() => copyToClipboard(aiArticle.slug, 'slug')}
                        className="text-[10px] text-muted-foreground hover:text-neon flex items-center gap-1 transition-colors"
                      >
                        {copiedField === 'slug' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedField === 'slug' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <code className="text-xs text-sky-600 dark:text-cyan-400 bg-gray-100 dark:bg-white/[0.05] px-2 py-1.5 rounded-md block font-mono break-all">
                      /{aiArticle.slug}
                    </code>
                  </div>

                  {/* Meta Description (SEO) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Search className="w-3 h-3" />
                        Meta Description
                        <span className="text-[9px] font-normal text-muted-foreground/60">({aiArticle.metaDescription.length}/150)</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(aiArticle.metaDescription, 'metaDesc')}
                        className="text-[10px] text-muted-foreground hover:text-neon flex items-center gap-1 transition-colors"
                      >
                        {copiedField === 'metaDesc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedField === 'metaDesc' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/30 dark:border-amber-500/10 px-3 py-2 rounded-lg">
                      {aiArticle.metaDescription}
                    </p>
                  </div>

                  {/* Cover Image Preview */}
                  {aiArticle.imageUrl && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cover Image</span>
                      <div className="relative rounded-lg overflow-hidden border border-violet-500/10 aspect-video">
                        <img
                          src={aiArticle.imageUrl}
                          alt="Article cover"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Summary</span>
                      <button
                        onClick={() => copyToClipboard(aiArticle.summary, 'summary')}
                        className="text-[10px] text-muted-foreground hover:text-neon flex items-center gap-1 transition-colors"
                      >
                        {copiedField === 'summary' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedField === 'summary' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed">{aiArticle.summary}</p>
                  </div>

                  <Separator className="bg-violet-500/10" />

                  {/* Content */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Content</span>
                      <button
                        onClick={() => copyToClipboard(aiArticle.content, 'content')}
                        className="text-[10px] text-muted-foreground hover:text-neon flex items-center gap-1 transition-colors"
                      >
                        {copiedField === 'content' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedField === 'content' ? 'Copied!' : 'Copy HTML'}
                      </button>
                    </div>
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: aiArticle.content }}
                    />
                  </div>
                </div>

                {/* Save to Database Action Bar */}
                <div className="p-4 border-t border-violet-500/10 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {savedArticleId ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-400">Tersimpan sebagai Draft</span>
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">{savedArticleId.slice(0, 8)}...</Badge>
                        </>
                      ) : (
                        <>
                          <Database className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Simpan ke database</span>
                        </>
                      )}
                    </div>
                    <Button
                      onClick={handleSaveToDatabase}
                      disabled={saving || !!savedArticleId}
                      className={`${
                        savedArticleId
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/20'
                          : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/20'
                      }`}
                      size="sm"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Menyimpan...
                        </>
                      ) : savedArticleId ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Saved as Draft
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save as Draft
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-neon/20 to-emerald-500/10 border border-neon/20">
            <Newspaper className="w-5 h-5 text-neon" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Automated News Engine</h2>
            <p className="text-xs text-muted-foreground">AI-powered match report generation pipeline</p>
          </div>
        </div>
        <Button
          onClick={loadStatus}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-neon"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Status
        </Button>
      </div>

      {/* Stats Row */}
      {response && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Search} label="Matches Found" value={response.matches_found} />
          <StatCard icon={Zap} label="Articles Generated" value={response.articles_generated} />
          <StatCard icon={Clock} label="Pipeline Duration" value={`${(response.pipeline_duration_ms / 1000).toFixed(1)}s`} />
          <StatCard icon={BarChart3} label="Success Rate" value={response.results.length > 0 ? `${Math.round((response.results.filter(r => r.success).length / response.results.length) * 100)}%` : '—'} />
        </div>
      )}

      {/* Config Panel */}
      <ConfigPanel config={status} onFixtureIdsChange={setFixtureIds} />

      {/* Controls */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-neon" />
          Pipeline Controls
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Mode */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Mode</label>
            <Select value={mode} onValueChange={(v) => setMode(v as 'auto' | 'manual')}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (API-Football)</SelectItem>
                <SelectItem value="manual">Manual (Fixture IDs)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lookback Hours */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Lookback (hours)</label>
            <Select value={lookbackHours} onValueChange={setLookbackHours}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="48">48 hours</SelectItem>
                <SelectItem value="72">72 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Articles */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Max Articles</label>
            <Select value={maxArticles} onValueChange={setMaxArticles}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dry Run Toggle */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Dry Run</label>
            <div className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
              <button
                onClick={() => setDryRun(!dryRun)}
                className={`relative w-10 h-5 rounded-full transition-colors ${dryRun ? 'bg-neon' : 'bg-gray-300 dark:bg-white/20'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${dryRun ? 'left-5' : 'left-0.5'}`} />
              </button>
              <span className="text-xs text-muted-foreground">{dryRun ? 'Preview only' : 'Publish'}</span>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">Pipeline Error</p>
              <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Run Button */}
        <Button
          onClick={runPipeline}
          disabled={running}
          className={`w-full py-3 text-sm font-bold transition-all ${running ? 'opacity-70' : ''}`}
          size="lg"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Articles...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              {dryRun ? 'Run Dry Run (Preview Only)' : 'Generate & Publish Articles'}
            </>
          )}
        </Button>

        {/* Info Banner */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            <strong>Auto mode:</strong> Fetches finished matches from API-Football in the last N hours and generates articles for each.
            <br />
            <strong>Manual mode:</strong> Enter specific fixture IDs (comma-separated) to generate articles for specific matches.
            <br />
            <strong>Dry run:</strong> Generates content without publishing to Supabase.
          </div>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {showResult && response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-neon" />
                Pipeline Results
              </h3>
              <Badge variant={response.success ? 'default' : 'secondary'} className={response.success ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}>
                {response.success ? `${response.articles_generated} Published` : 'Failed'}
              </Badge>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-96 overflow-y-auto custom-scrollbar">
              {response.results.map((result, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Status */}
                  <div className="mt-0.5">
                    <StageIcon stage={result.stage} success={result.success} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{result.match}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">ID: {result.fixtureId}</Badge>
                    </div>

                    {result.success && result.article ? (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.article.title}</p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{result.article.slug}</span>
                          <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" />{result.article.imageUrl ? 'Image ✓' : 'No image'}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{(result.duration / 1000).toFixed(1)}s</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs text-red-400">{result.error || 'Unknown error'}</p>
                        {result.stage && (
                          <p className="text-[10px] text-muted-foreground">Failed at stage: {result.stage}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {result.success && result.article && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-neon shrink-0"
                      onClick={() => setShowPreview({ title: result.article!.title, slug: result.article!.slug })}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Article Preview Modal */}
      <Dialog open={!!showPreview} onOpenChange={(v) => !v && setShowPreview(null)}>
        <DialogContent className="max-w-lg bg-gray-50 dark:bg-deep-800 border-gray-200 dark:border-white/10 p-0">
          {showPreview && (
            <>
              <DialogHeader className="p-5 pb-0">
                <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">{showPreview.title}</DialogTitle>
              </DialogHeader>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">{showPreview.slug}</Badge>
                </div>
                <Separator className="bg-gray-200 dark:bg-white/5" />
                <p className="text-xs text-muted-foreground">Article has been published to Supabase. It will appear in the News Grid and Hero Slider.</p>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => window.open(`/api/articles/${showPreview.slug}`, '_blank')}>
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    View API Response
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowPreview(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
