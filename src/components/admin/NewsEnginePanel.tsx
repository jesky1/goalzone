'use client'

import { useState, useCallback, useEffect } from 'react'
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
  Rss,
  ExternalLink,
  Calendar,
  Terminal,
} from 'lucide-react'
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

// Blogger types
interface BloggerPost {
  id: string
  title: string
  published: string
  updated: string
  url: string
  labels?: string[]
  author?: { displayName: string } | null
}

interface BloggerData {
  posts: BloggerPost[]
  total: number
  source: 'blogger-api' | 'mock'
  blogId: string | null
  notice?: string | null
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

// ─── Blogger Feed Section ───────────────────────────────────

function BloggerFeedSection() {
  const [data, setData] = useState<BloggerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBlogger = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/blogger?max=5')
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `HTTP ${res.status}`)
      }
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data Blogger')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBlogger()
  }, [loadBlogger])

  const formatPublishedDate = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      })
    } catch {
      return isoString
    }
  }

  const timeAgo = (isoString: string) => {
    try {
      const now = Date.now()
      const then = new Date(isoString).getTime()
      const diffMs = now - then
      const diffMin = Math.floor(diffMs / 60000)
      if (diffMin < 60) return `${diffMin} menit lalu`
      const diffHr = Math.floor(diffMin / 60)
      if (diffHr < 24) return `${diffHr} jam lalu`
      const diffDay = Math.floor(diffHr / 24)
      if (diffDay < 30) return `${diffDay} hari lalu`
      const diffMonth = Math.floor(diffDay / 30)
      return `${diffMonth} bulan lalu`
    } catch {
      return ''
    }
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Rss className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Blogger Feed
              {data?.source === 'blogger-api' && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1.5 py-0">
                  LIVE
                </Badge>
              )}
    
            </h3>
            <p className="text-[10px] text-muted-foreground">
              5 postingan terbaru dari blog
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadBlogger}
          disabled={loading}
          className="text-muted-foreground hover:text-neon"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Notice Banner */}
      {data?.notice && !loading && (
        <div className="mx-4 mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
          <Info className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-amber-400/80 leading-relaxed">{data.notice}</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mx-4 mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/15">
          <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-red-400/80">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-6 h-6 rounded-md shrink-0 bg-gray-200 dark:bg-white/5" />
              <div className="flex-1 space-y-1.5 pt-0.5">
                <Skeleton className="h-3.5 w-full bg-gray-200 dark:bg-white/5" />
                <Skeleton className="h-3 w-28 bg-gray-200 dark:bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Posts List */}
      {!loading && !error && data && (
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {data.posts.map((post, idx) => (
            <motion.a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
            >
              {/* Rank */}
              <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                idx === 0
                  ? 'bg-orange-500/15 text-orange-400'
                  : idx === 1
                    ? 'bg-gray-400/10 text-gray-400'
                    : idx === 2
                      ? 'bg-amber-600/10 text-amber-500'
                      : 'bg-gray-500/5 text-gray-400 dark:text-gray-500'
              }`}>
                {idx + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-[13px] font-medium text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-neon transition-colors">
                  {post.title}
                </h4>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {/* Published date */}
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <time dateTime={post.published}>{formatPublishedDate(post.published)}</time>
                  </span>
                  {/* Time ago */}
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {timeAgo(post.published)}
                  </span>
                  {/* Author */}
                  {post.author?.displayName && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      oleh {post.author.displayName}
                    </span>
                  )}
                </div>
                {/* Labels */}
                {post.labels && post.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {post.labels.slice(0, 3).map(label => (
                      <span
                        key={label}
                        className="text-[9px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium"
                      >
                        {label}
                      </span>
                    ))}
                    {post.labels.length > 3 && (
                      <span className="text-[9px] px-1.5 py-0.5 text-gray-400 dark:text-gray-500">
                        +{post.labels.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* External Link */}
              <ExternalLink className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-neon transition-colors shrink-0 mt-1" />
            </motion.a>
          ))}
        </div>
      )}

      {/* Footer */}
      {!loading && !error && data && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {data.total} postingan dari Blogger
            {data.source === 'blogger-api' && data.blogId && (
              <span className="text-gray-400 dark:text-gray-500 ml-1">
                (ID: {data.blogId.slice(0, 8)}...)
              </span>
            )}
          </span>
          {data.source === 'blogger-api' && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              Connected
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────

interface NewsEnginePanelProps {
  authToken?: string | null
}

export default function NewsEnginePanel({ authToken }: NewsEnginePanelProps = {}) {
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
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.debug?.message || `Pipeline failed (${res.status})`)
      setResponse(data)
      setShowResult(true)
    } catch (err: any) {
      const errorMsg = err.message || 'Pipeline failed'
      console.error('[NewsEnginePanel] Pipeline error:', errorMsg)
      setError(errorMsg)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
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

      {/* ─── Blogger Feed ─── */}
      <BloggerFeedSection />

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
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-400">Pipeline Error</p>
              <p className="text-xs text-red-400/70 mt-0.5 break-words">{error}</p>
              {error.includes('Unauthorized') && (
                <p className="text-[10px] text-amber-400 mt-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Sesi admin kadaluarsa. Silakan logout lalu login kembali.
                </p>
              )}
              {error.includes('RLS') && (
                <p className="text-[10px] text-amber-400 mt-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Jalankan SQL berikut di Supabase Dashboard: CREATE POLICY &quot;service_role_all&quot; ON articles FOR ALL TO service_role USING (true) WITH CHECK (true);
                </p>
              )}
            </div>
          </div>
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
