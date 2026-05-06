'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Database,
  Shield,
  Clock,
  ImageIcon,
  Rocket,
  Server,
  Key,
  Globe,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  FileCode,
  Terminal,
  Settings,
  RefreshCw,
  Eye,
} from 'lucide-react';

// --- Code Block Component ---
function CodeBlock({ code, language = 'sql', label }: { code: string; language?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      {label && (
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs bg-white/5 text-muted-foreground">{language}</Badge>
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
        </div>
      )}
      <div className="relative">
        <pre className="bg-black/40 border border-white/10 rounded-lg p-4 overflow-x-auto text-xs sm:text-sm text-gray-300 font-mono leading-relaxed custom-scrollbar">
          <code>{code}</code>
        </pre>
        <button onClick={copy} className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}

// --- Step Component ---
function Step({ number, title, children, icon }: { number: number; title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center shrink-0">
          {icon || <span className="text-sm font-bold neon-text">{number}</span>}
        </div>
        {number < 8 && <div className="w-px flex-1 bg-gradient-to-b from-neon/20 to-transparent mt-2" />}
      </div>
      <div className="flex-1 pb-8">
        <h3 className="text-base font-bold text-white mb-3">{title}</h3>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}

// --- Section Card ---
function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// --- Env Variable Item ---
function EnvVar({ name, description, example, required = true }: { name: string; description: string; example: string; required?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 p-3 rounded-lg bg-white/3 border border-white/5">
      <div className="flex items-center gap-2 shrink-0">
        <code className="text-xs font-mono font-bold neon-text">{name}</code>
        {required && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-500/30 text-red-400">Required</Badge>}
      </div>
      <p className="text-xs text-muted-foreground flex-1">{description}</p>
      <code className="text-[10px] font-mono text-gray-400 bg-black/30 px-2 py-1 rounded shrink-0">{example}</code>
    </div>
  );
}

// ============================================================
// MAIN DEPLOYMENT GUIDE PAGE
// ============================================================
export default function DeploymentGuidePage() {
  const [activeTab, setActiveTab] = useState('database');
  const [isAdminGuideOpen, setIsAdminGuideOpen] = useState(false);

  return (
    <Dialog open={isAdminGuideOpen} onOpenChange={setIsAdminGuideOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-neon gap-1.5">
          <Rocket className="w-4 h-4" />
          <span className="hidden sm:inline">Deployment Guide</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden bg-deep-800 border-white/10 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="shrink-0 p-5 pb-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Rocket className="w-5 h-5 text-neon" />
                GOALZONE - Production Deployment Guide
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-2">Panduan lengkap untuk menyiapkan backend production dan deployment ke Vercel</p>
          </div>

          {/* Tabs */}
          <div className="shrink-0 px-5 pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start bg-white/5 h-auto p-1 gap-1 flex-wrap">
                <TabsTrigger value="database" className="text-xs gap-1.5 data-[state=active]:bg-neon/10 data-[state=active]:text-neon">
                  <Database className="w-3.5 h-3.5" /> Database
                </TabsTrigger>
                <TabsTrigger value="edge-functions" className="text-xs gap-1.5 data-[state=active]:bg-neon/10 data-[state=active]:text-neon">
                  <Clock className="w-3.5 h-3.5" /> Edge Functions
                </TabsTrigger>
                <TabsTrigger value="auth" className="text-xs gap-1.5 data-[state=active]:bg-neon/10 data-[state=active]:text-neon">
                  <Shield className="w-3.5 h-3.5" /> Auth & OAuth
                </TabsTrigger>
                <TabsTrigger value="storage" className="text-xs gap-1.5 data-[state=active]:bg-neon/10 data-[state=active]:text-neon">
                  <ImageIcon className="w-3.5 h-3.5" /> Storage
                </TabsTrigger>
                <TabsTrigger value="deployment" className="text-xs gap-1.5 data-[state=active]:bg-neon/10 data-[state=active]:text-neon">
                  <Globe className="w-3.5 h-3.5" /> Vercel Deploy
                </TabsTrigger>
                <TabsTrigger value="env" className="text-xs gap-1.5 data-[state=active]:bg-neon/10 data-[state=active]:text-neon">
                  <Key className="w-3.5 h-3.5" /> Env Variables
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-5">
            <div className="pb-6">
              {activeTab === 'database' && <DatabaseTab />}
              {activeTab === 'edge-functions' && <EdgeFunctionsTab />}
              {activeTab === 'auth' && <AuthTab />}
              {activeTab === 'storage' && <StorageTab />}
              {activeTab === 'deployment' && <DeploymentTab />}
              {activeTab === 'env' && <EnvVarsTab />}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// TAB 1: DATABASE
// ============================================================
function DatabaseTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Database Schema & RLS Policies" description="Tabel, index, trigger, dan kebijakan keamanan untuk Supabase PostgreSQL">
        <Step number={1} title="Buat Project Supabase" icon={<Database className="w-4 h-4 text-neon" />}>
          <p className="text-sm text-muted-foreground">Buka <span className="text-neon">supabase.com/dashboard</span> dan buat project baru. Catat:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-white/3 border border-white/5">
              <div className="text-[10px] text-muted-foreground mb-1">Project URL</div>
              <code className="text-xs font-mono neon-text">https://xxxxx.supabase.co</code>
            </div>
            <div className="p-3 rounded-lg bg-white/3 border border-white/5">
              <div className="text-[10px] text-muted-foreground mb-1">Anon Key</div>
              <code className="text-xs font-mono neon-text">eyJhbGciOiJI...</code>
            </div>
          </div>
        </Step>

        <Step number={2} title="Jalankan Schema SQL" icon={<FileCode className="w-4 h-4 text-neon" />}>
          <p className="text-sm text-muted-foreground">Buka <span className="text-neon">SQL Editor</span> di Supabase Dashboard, lalu paste dan jalankan file berikut:</p>
          <CodeBlock
            label="supabase/schema.sql"
            language="sql"
            code={`-- File: supabase/schema.sql
-- Jalankan seluruh isi file ini di Supabase SQL Editor
-- Mencakup: 9 tabel, 15+ indexes, 25+ RLS policies

-- Tabel yang dibuat:
-- 1. categories      - Kategori berita
-- 2. profiles        - Profil user (terhubung auth.users)
-- 3. articles        - Artikel berita
-- 4. comments        - Komentar user
-- 5. live_scores     - Skor live (dari API-Football)
-- 6. bookmarked_matches - Bookmark pertandingan
-- 7. standings       - Klasemen liga
-- 8. top_scorers     - Top skor liga
-- 9. audit_logs      - Log audit admin

-- RLS Policies:
-- - Publik: SELECT articles (published), SELECT comments
-- - Login: INSERT comments, UPDATE/DELETE own comments
-- - Admin: INSERT/UPDATE/DELETE articles
-- - Service Role: INSERT/UPDATE live_scores, standings, top_scorers

-- Views:
-- - v_articles_published
-- - v_articles_trending

-- Jalankan file: supabase/schema.sql`}
          />
        </Step>

        <Step number={3} title="Jalankan Storage Setup" icon={<ImageIcon className="w-4 h-4 text-neon" />}>
          <CodeBlock label="supabase/storage-setup.sql" language="sql" code={`-- File: supabase/storage-setup.sql
-- Membuat bucket: news-images, avatars
-- Plus storage policies (RLS untuk file)`} />
        </Step>

        <Step number={4} title="Jalankan Auth Trigger" icon={<Shield className="w-4 h-4 text-neon" />}>
          <CodeBlock label="supabase/triggers/handle-new-user.sql" language="sql" code={`-- File: supabase/triggers/handle-new-user.sql
-- Auto-create profile saat user baru signup
-- Auto-update profile saat user update metadata`} />
        </Step>

        <Step number={5} title="Verifikasi Tabel" icon={<Eye className="w-4 h-4 text-neon" />}>
          <CodeBlock language="sql" code={`-- Cek semua tabel sudah terbuat
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Cek RLS policies
SELECT policyname, tablename, cmd
FROM pg_policies WHERE schemaname = 'public';

-- Cek kategori seed data
SELECT name, slug FROM categories ORDER BY sort_order;

-- Cek trigger
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public';`} />
        </Step>
      </SectionCard>

      <SectionCard title="Quick: RLS Policy Summary" description="Ringkasan kebijakan keamanan row-level">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Tabel</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Publik (Anon)</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">User (Login)</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Admin</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-white/5"><td className="py-2 px-3 font-medium">articles</td><td className="py-2 px-3">SELECT (published)</td><td className="py-2 px-3">-</td><td className="py-2 px-3">INSERT, UPDATE, DELETE</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 px-3 font-medium">comments</td><td className="py-2 px-3">SELECT (published)</td><td className="py-2 px-3">INSERT, UPDATE/DELETE own</td><td className="py-2 px-3">DELETE all</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 px-3 font-medium">profiles</td><td className="py-2 px-3">SELECT</td><td className="py-2 px-3">UPDATE own</td><td className="py-2 px-3">UPDATE all</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 px-3 font-medium">live_scores</td><td className="py-2 px-3">SELECT</td><td className="py-2 px-3">-</td><td className="py-2 px-3">-</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 px-3 font-medium">standings</td><td className="py-2 px-3">SELECT</td><td className="py-2 px-3">-</td><td className="py-2 px-3">-</td></tr>
              <tr><td className="py-2 px-3 font-medium">top_scorers</td><td className="py-2 px-3">SELECT</td><td className="py-2 px-3">-</td><td className="py-2 px-3">-</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2"><span className="text-neon">Service Role</span> (Edge Function) bisa INSERT/UPDATE live_scores, standings, top_scorers</p>
      </SectionCard>
    </div>
  );
}

// ============================================================
// TAB 2: EDGE FUNCTIONS
// ============================================================
function EdgeFunctionsTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Cron Job: Fetch Live Scores" description="Edge Function yang berjalan setiap 15 menit untuk mengambil data skor terbaru dari API-Football">
        <Step number={1} title="Daftar API-Football" icon={<Globe className="w-4 h-4 text-neon" />}>
          <p className="text-sm text-muted-foreground">Daftar di <span className="text-neon">api-football.com</span> dan dapatkan API Key (Free tier: 100 request/hari)</p>
        </Step>

        <Step number={2} title="Setup Environment Variables" icon={<Settings className="w-4 h-4 text-neon" />}>
          <p className="text-sm text-muted-foreground mb-2">Di <span className="text-neon">Supabase Dashboard &gt; Edge Functions &gt; Settings</span>, tambahkan:</p>
          <CodeBlock language="bash" code={`FOOTBALL_API_KEY=your_api_football_key_here
FOOTBALL_API_BASE=https://v3.football.api-sports.io
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...`} />
        </Step>

        <Step number={3} title="Deploy Edge Function" icon={<Terminal className="w-4 h-4 text-neon" />}>
          <p className="text-sm text-muted-foreground mb-2">Install Supabase CLI dan deploy:</p>
          <CodeBlock language="bash" code={`# Install Supabase CLI
npm install -g supabase

# Login ke Supabase
supabase login

# Link ke project (gunakan project reference ID)
supabase link --project-ref xxxxx

# Deploy edge function
supabase functions deploy fetch-live-scores`} />
          <p className="text-xs text-muted-foreground mt-1">Atau upload manual via <span className="text-neon">Supabase Dashboard &gt; Edge Functions &gt; New Function</span></p>
        </Step>

        <Step number={4} title="Setup Cron Job (pg_cron)" icon={<RefreshCw className="w-4 h-4 text-neon" />}>
          <p className="text-sm text-muted-foreground mb-2">Buat cron job di Supabase SQL Editor:</p>
          <CodeBlock language="sql" code={`-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule: setiap 15 menit
-- Catatan: gunakan URL Edge Function Anda
SELECT cron.schedule(
  'fetch-live-scores-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xxxxx.supabase.co/functions/v1/fetch-live-scores',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verifikasi cron job
SELECT * FROM cron.job;

-- Untuk menghentikan:
-- SELECT cron.unschedule('fetch-live-scores-15min');`} />
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-400"><span className="font-bold">Catatan:</span> Alternatif jika pg_cron tidak tersedia, gunakan <span className="font-mono">cron-job.org</span> atau Vercel Cron Jobs untuk memanggil Edge Function.</p>
          </div>
        </Step>

        <Step number={5} title="Test Manual" icon={<Terminal className="w-4 h-4 text-neon" />}>
          <CodeBlock language="bash" code={`# Test manual via curl
curl -X POST 'https://xxxxx.supabase.co/functions/v1/fetch-live-scores' \\
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \\
  -H "Content-Type: application/json"

# Response:
# {
#   "success": true,
#   "stats": { "leagues_monitored": 6, "total_updated": 24 },
#   "logs": ["Premier League: 4 pertandingan ditemukan", ...]
# }`} />
        </Step>
      </SectionCard>

      <SectionCard title="Konfigurasi Liga yang Dimonitor" description="Liga yang di-fetch oleh Edge Function">
        <CodeBlock language="typescript" code={`// File: supabase/functions/fetch-live-scores/index.ts
// Konfigurasi liga (line ~80-90):

const leaguesToMonitor = [
  { id: 39,  name: 'Premier League' },    // Inggris
  { id: 140, name: 'La Liga' },            // Spanyol
  { id: 135, name: 'Serie A' },            // Italia
  { id: 78,  name: 'Bundesliga' },         // Jerman
  { id: 61,  name: 'Ligue 1' },            // Prancis
  { id: 2,   name: 'Champions League' },   // UCL
  // Tambahkan liga lain:
  // { id: 94,  name: 'Primeira Liga' },   // Portugal
  // { id: 88,  name: 'Eredivisie' },      // Belanda
  // { id: 203, name: 'Süper Lig' },       // Turki
  // { id: 144, name: 'J-League' },        // Jepang
]`} />
      </SectionCard>
    </div>
  );
}

// ============================================================
// TAB 3: AUTH & OAUTH
// ============================================================
function AuthTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Google OAuth Configuration" description="Setup login dengan akun Google di Supabase Auth">
        <Step number={1} title="Setup Google Cloud Console" icon={<Globe className="w-4 h-4 text-neon" />}>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Buka <span className="text-neon">console.cloud.google.com</span>:</p>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Buat project baru atau pilih existing</li>
              <li>Go to <span className="font-mono">APIs & Services &gt; Credentials</span></li>
              <li>Click <span className="font-mono">+ CREATE CREDENTIALS &gt; OAuth client ID</span></li>
              <li>Application type: <span className="font-mono">Web application</span></li>
              <li>Authorized redirect URI: <span className="font-mono text-neon">https://xxxxx.supabase.co/auth/v1/callback</span></li>
              <li>Copy <span className="font-bold">Client ID</span> dan <span className="font-bold">Client Secret</span></li>
            </ol>
          </div>
        </Step>

        <Step number={2} title="Setup Supabase Auth" icon={<Settings className="w-4 h-4 text-neon" />}>
          <p className="text-sm text-muted-foreground mb-2">Di <span className="text-neon">Supabase Dashboard &gt; Authentication &gt; Providers</span>:</p>
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li>Click <span className="font-mono">Google</span> provider</li>
            <li>Toggle <span className="font-mono">Enable Sign in with Google</span></li>
            <li> paste <span className="font-bold">Client ID</span> dari Google Cloud Console</li>
            <li>Paste <span className="font-bold">Client Secret</span> dari Google Cloud Console</li>
            <li>Scroll down, klik <span className="font-mono">Save</span></li>
          </ol>
        </Step>

        <Step number={3} title="Setup Redirect URL" icon={<Server className="w-4 h-4 text-neon" />}>
          <p className="text-sm text-muted-foreground mb-2">Di <span className="text-neon">Supabase Dashboard &gt; Authentication &gt; URL Configuration</span>:</p>
          <div className="grid grid-cols-1 gap-2">
            <div className="p-3 rounded-lg bg-white/3 border border-white/5">
              <div className="text-[10px] text-muted-foreground mb-1">Site URL (Production)</div>
              <code className="text-xs font-mono neon-text">https://your-domain.com</code>
            </div>
            <div className="p-3 rounded-lg bg-white/3 border border-white/5">
              <div className="text-[10px] text-muted-foreground mb-1">Redirect URLs (tambahkan)</div>
              <code className="text-xs font-mono text-gray-300 block">https://your-domain.com/auth/callback</code>
              <code className="text-xs font-mono text-gray-300 block">http://localhost:3000/auth/callback</code>
            </div>
          </div>
        </Step>

        <Step number={4} title="Implement Auth di Next.js" icon={<FileCode className="w-4 h-4 text-neon" />}>
          <p className="text-sm text-muted-foreground mb-2">Buat halaman auth callback dan auth provider:</p>
          <CodeBlock language="typescript" code={`// src/app/auth/callback/route.ts
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(\`\${origin}/\`)
}`} />
          <CodeBlock language="typescript" code={`// src/lib/auth-context.tsx (Client Component)
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

type AuthContext = {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthCtx = createContext<AuthContext>({} as AuthContext)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: \`\${window.location.origin}/auth/callback\` }
    })
  }

  const signOut = async () => await supabase.auth.signOut()

  return (
    <AuthCtx.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}`} />
        </Step>

        <Step number={5} title="Jalankan Auth Trigger" icon={<Shield className="w-4 h-4 text-neon" />}>
          <p className="text-sm text-muted-foreground mb-2">Sudah dijalankan di Step Database. Trigger ini otomatis:</p>
          <div className="grid grid-cols-1 gap-2">
            <div className="p-3 rounded-lg bg-white/3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-bold text-green-400">on_auth_user_created</span>
              </div>
              <p className="text-xs text-muted-foreground">Membuat profile baru di tabel <span className="font-mono">public.profiles</span> saat user signup</p>
            </div>
            <div className="p-3 rounded-lg bg-white/3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-bold text-green-400">on_auth_user_updated</span>
              </div>
              <p className="text-xs text-muted-foreground">Update profile saat user update metadata (nama, avatar)</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mt-2">
            <p className="text-xs text-amber-400"><span className="font-bold">PROMOTE TO ADMIN:</span> Setelah signup pertama, jalankan:</p>
            <CodeBlock language="sql" code={`UPDATE profiles SET role = 'admin' WHERE id = '<UUID_USER_PERTAMA>';`} />
          </div>
        </Step>
      </SectionCard>
    </div>
  );
}

// ============================================================
// TAB 4: STORAGE
// ============================================================
function StorageTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Supabase Storage Setup" description="Konfigurasi bucket untuk menyimpan gambar berita dan avatar">
        <Step number={1} title="Jalankan Storage SQL" icon={<Database className="w-4 h-4 text-neon" />}>
          <p className="text-sm text-muted-foreground mb-2">File <span className="font-mono text-neon">supabase/storage-setup.sql</span> membuat:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-white/3 border border-white/5">
              <div className="flex items-center gap-2 mb-1"><ImageIcon className="w-3.5 h-3.5 text-neon" /><span className="text-xs font-bold">news-images</span></div>
              <p className="text-[10px] text-muted-foreground">Public bucket, 5MB max, JPG/PNG/WebP/GIF/SVG</p>
            </div>
            <div className="p-3 rounded-lg bg-white/3 border border-white/5">
              <div className="flex items-center gap-2 mb-1"><ImageIcon className="w-3.5 h-3.5 text-neon" /><span className="text-xs font-bold">avatars</span></div>
              <p className="text-[10px] text-muted-foreground">Public bucket, 2MB max, scoped per-user</p>
            </div>
          </div>
        </Step>

        <Step number={2} title="Upload Helper API Route" icon={<Server className="w-4 h-4 text-neon" />}>
          <p className="text-sm text-muted-foreground mb-2">API route untuk upload gambar dari admin dashboard:</p>
          <CodeBlock label="src/app/api/upload/route.ts" language="typescript" code={`import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get user session from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin/editor
    const supabase = createServerSupabaseClient()
    // ... validation logic ...

    const formData = await request.formData()
    const file = formData.get('file') as File
    const slug = formData.get('slug') as string
    const folder = formData.get('folder') as string || 'articles'

    if (!file || !slug) {
      return NextResponse.json({ error: 'File dan slug wajib diisi' }, { status: 400 })
    }

    // Generate path
    const timestamp = Date.now()
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const ext = file.name.split('.').pop() || 'jpg'
    const filePath = \`\${folder}/\${year}/\${month}/\${timestamp}-\${slug}.\${ext}\`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const { data, error } = await supabase.storage
      .from('news-images')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('news-images')
      .getPublicUrl(filePath)

    return NextResponse.json({ url: urlData.publicUrl, path: filePath })
  } catch (error) {
    return NextResponse.json({ error: 'Upload gagal' }, { status: 500 })
  }
}`} />
        </Step>

        <Step number={3} title="Client-Side Upload Helper" icon={<FileCode className="w-4 h-4 text-neon" />}>
          <p className="text-sm text-muted-foreground mb-2">File <span className="font-mono text-neon">src/lib/supabase-upload.ts</span> menyediakan:</p>
          <div className="grid grid-cols-1 gap-2">
            {[
              { fn: 'uploadNewsImage(file, slug, folder)', desc: 'Upload gambar berita' },
              { fn: 'uploadNewsImageFromUrl(url, slug, folder)', desc: 'Import gambar dari URL' },
              { fn: 'deleteNewsImage(path)', desc: 'Hapus gambar' },
              { fn: 'uploadAvatar(file, userId)', desc: 'Upload avatar user' },
              { fn: 'optimizeImage(file, maxWidth, quality)', desc: 'Optimasi gambar (resize + compress)' },
            ].map(item => (
              <div key={item.fn} className="p-3 rounded-lg bg-white/3 border border-white/5">
                <code className="text-xs font-mono neon-text">{item.fn}</code>
                <p className="text-[10px] text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </Step>
      </SectionCard>

      <SectionCard title="Contoh Penggunaan di Admin Dashboard" description="Upload gambar saat membuat/mengedit artikel">
        <CodeBlock language="typescript" code={`'use client'
import { uploadNewsImage, optimizeImage } from '@/lib/supabase-upload'
import { useState } from 'react'

function ImageUploader({ onUpload }: { onUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)

      // Optimasi gambar dulu
      const optimized = await optimizeImage(file, 1200, 0.85)

      // Preview
      setPreview(URL.createObjectURL(optimized))

      // Upload ke Supabase
      const { url } = await uploadNewsImage(
        optimized,
        'judul-artikel-slug',
        'articles'
      )

      onUpload(url)
    } catch (error) {
      console.error('Upload gagal:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="block w-full text-sm text-muted-foreground
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-neon/10 file:text-neon
          hover:file:bg-neon/20"
      />
      {uploading && <p className="text-xs text-muted-foreground mt-2">Mengupload...</p>}
      {preview && (
        <img src={preview} alt="Preview" className="mt-2 rounded-lg max-h-48 object-cover" />
      )}
    </div>
  )
}`} />
      </SectionCard>
    </div>
  );
}

// ============================================================
// TAB 5: DEPLOYMENT
// ============================================================
function DeploymentTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Vercel Deployment" description="Deploy GOALZONE ke Vercel untuk production">
        <Step number={1} title="Prepare Repository" icon={<Server className="w-4 h-4 text-neon" />}>
          <p className="text-sm text-muted-foreground mb-2">Pastikan repository sudah push ke GitHub:</p>
          <CodeBlock language="bash" code={`# Inisialisasi git (jika belum)
git init
git add .
git commit -m "feat: GOALZONE football news website"

# Push ke GitHub
git remote add origin https://github.com/username/goalzone.git
git branch -M main
git push -u origin main`} />
        </Step>

        <Step number={2} title="Connect to Vercel" icon={<Globe className="w-4 h-4 text-neon" />}>
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li>Buka <span className="text-neon">vercel.com</span> dan login dengan GitHub</li>
            <li>Click <span className="font-mono">Add New &gt; Project</span></li>
            <li>Import repository <span className="font-mono">goalzone</span></li>
            <li>Framework Preset: <span className="font-mono">Next.js</span> (auto-detect)</li>
            <li>Build Command: <span className="font-mono">next build</span></li>
            <li>Output Directory: <span className="font-mono">.next</span></li>
            <li>Install Command: <span className="font-mono">bun install</span> (atau npm install)</li>
          </ol>
        </Step>

        <Step number={3} title="Add Environment Variables" icon={<Key className="w-4 h-4 text-neon" />}>
          <p className="text-sm text-muted-foreground">Lihat tab <span className="neon-text font-bold">Env Variables</span> untuk daftar lengkap</p>
        </Step>

        <Step number={4} title="Deploy!" icon={<Rocket className="w-4 h-4 text-neon" />}>
          <p className="text-sm text-muted-foreground mb-2">Click <span className="font-mono">Deploy</span> dan tunggu build selesai. Vercel akan memberikan URL:</p>
          <div className="p-3 rounded-lg bg-white/3 border border-white/5">
            <code className="text-xs font-mono neon-text">https://goalzone-xxxx.vercel.app</code>
          </div>
        </Step>
      </SectionCard>

      <SectionCard title="ISR (Incremental Static Regeneration)" description="Halaman statis yang auto-update tanpa rebuild">
        <p className="text-sm text-muted-foreground mb-3">ISR memungkinkan halaman serve sebagai static (cepat) tapi otomatis diregenerate saat ada konten baru.</p>

        <CodeBlock label="next.config.ts - tambahkan revalidate" language="typescript" code={`// next.config.ts
const nextConfig = {
  // Revalidate semua halaman setiap 60 detik
  // (atau gunakan per-route revalidate)
  experimental: {
    staleTimes: {
      dynamic: 60,     // Halaman dinamis: 60 detik
      static: 300,     // Halaman statis: 5 menit
    },
  },
}

export default nextConfig`} />

        <CodeBlock label="Contoh: Halaman artikel dengan ISR" language="typescript" code={`// src/app/articles/[slug]/page.tsx
import { supabase } from '@/lib/supabase'

// ISR: Regenerate setiap 60 detik
export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params

  const { data: article } = await supabase
    .from('articles')
    .select(\`
      *,
      category:categories(name, slug),
      author:profiles(username, avatar_url)
    \`)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article) return notFound()

  // Increment view count (non-blocking)
  supabase.rpc('increment_view_count', { article_slug: slug })

  return <ArticleView article={article} />
}`} />

        <CodeBlock label="Contoh: Halaman homepage dengan ISR" language="typescript" code={`// src/app/page.tsx (Server Component version)
export const revalidate = 60 // Regenerate setiap 60 detik

export default async function Home() {
  const { data: articles } = await supabase
    .from('articles')
    .select(\`*, category:categories(name), author:profiles(username)\`)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12)

  return <HomePage articles={articles || []} />
}`} />

        <CodeBlock label="On-Demand Revalidation (API Route)" language="typescript" code={`// src/app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { secret, path, tag } = await request.json()

  // Validasi secret (gunakan env variable)
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  // Revalidate by path
  if (path) {
    revalidatePath(path)
    return NextResponse.json({ revalidated: true, path })
  }

  // Revalidate by tag
  if (tag) {
    revalidateTag(tag)
    return NextResponse.json({ revalidated: true, tag })
  }

  return NextResponse.json({ error: 'Missing path or tag' }, { status: 400 })
}

// Gunakan tag di fetch:
// fetch(url, { next: { tags: ['articles'] } })
// Kemudian revalidate: revalidateTag('articles')`} />

        <div className="p-3 rounded-lg bg-neon/5 border border-neon/20">
          <p className="text-xs text-neon"><span className="font-bold">ISR Strategy:</span></p>
          <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
            <li>- Homepage: <span className="font-mono">revalidate = 60</span> (1 menit)</li>
            <li>- Halaman artikel: <span className="font-mono">revalidate = 60</span></li>
            <li>- Klasemen: <span className="font-mono">revalidate = 300</span> (5 menit)</li>
            <li>- Top Scorers: <span className="font-mono">revalidate = 300</span></li>
            <li>- Live Scores: <span className="font-mono">no-store</span> (selalu fresh via client-side fetch)</li>
            <li>- On-demand: <span className="font-mono">revalidateTag('articles')</span> saat ada artikel baru</li>
          </ul>
        </div>
      </SectionCard>

      <SectionCard title="Custom Domain (Opsional)" description="Hubungkan domain kustom ke Vercel">
        <CodeBlock language="bash" code={`# Di Vercel Dashboard > Project > Settings > Domains:
1. Tambahkan domain: goalzone.com
2. Update DNS records di domain registrar:

   # Type: CNAME
   # Name: @
   # Value: cname.vercel-dns.com

   # Type: CNAME
   # Name: www
   # Value: cname.vercel-dns.com

3. Vercel akan otomatis mengissue SSL certificate (Let's Encrypt)

# Update Supabase redirect URLs:
# Site URL: https://goalzone.com
# Redirect: https://goalzone.com/auth/callback`} />
      </SectionCard>
    </div>
  );
}

// ============================================================
// TAB 6: ENV VARIABLES
// ============================================================
function EnvVarsTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Environment Variables" description="Daftar semua environment variable yang diperlukan untuk production">

        <div className="mb-4">
          <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-neon" /> Supabase
          </h4>
          <div className="space-y-2">
            <EnvVar name="NEXT_PUBLIC_SUPABASE_URL" description="URL project Supabase Anda" example="https://xxxxx.supabase.co" />
            <EnvVar name="NEXT_PUBLIC_SUPABASE_ANON_KEY" description="Public anon key untuk client-side" example="eyJhbGciOiJI..." />
            <EnvVar name="SUPABASE_SERVICE_ROLE_KEY" description="Secret service role key (bypasses RLS) - JANGAN EXPOSE!" example="eyJhbGciOiJI..." />
          </div>
        </div>

        <Separator className="bg-white/5" />

        <div className="mb-4">
          <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-neon" /> API-Football
          </h4>
          <div className="space-y-2">
            <EnvVar name="NEXT_PUBLIC_FOOTBALL_API_KEY" description="API key dari api-football.com" example="a1b2c3d4e5f6..." required={false} />
            <EnvVar name="FOOTBALL_API_KEY" description="API key (server-side only)" example="a1b2c3d4e5f6..." required={true} />
          </div>
        </div>

        <Separator className="bg-white/5" />

        <div className="mb-4">
          <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <Key className="w-4 h-4 text-neon" /> Security
          </h4>
          <div className="space-y-2">
            <EnvVar name="REVALIDATION_SECRET" description="Secret untuk on-demand ISR revalidation" example="random-long-string-here" />
            <EnvVar name="NEXTAUTH_SECRET" description="Secret untuk NextAuth.js sessions" example="generate-with-openssl" required={false} />
          </div>
        </div>

        <Separator className="bg-white/5" />

        <div className="mb-4">
          <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <Server className="w-4 h-4 text-neon" /> Application
          </h4>
          <div className="space-y-2">
            <EnvVar name="NEXT_PUBLIC_APP_URL" description="URL aplikasi (untuk OAuth redirect)" example="https://goalzone.com" required={false} />
            <EnvVar name="NEXT_PUBLIC_GA_ID" description="Google Analytics Measurement ID" example="G-XXXXXXXXXX" required={false} />
          </div>
        </div>

        <Separator className="bg-white/5" />

        <div>
          <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-neon" /> Edge Functions (Supabase)
          </h4>
          <div className="space-y-2">
            <EnvVar name="FOOTBALL_API_KEY" description="API key untuk Edge Function" example="a1b2c3d4e5f6..." />
            <EnvVar name="FOOTBALL_API_BASE" description="Base URL API-Football" example="https://v3.football.api-sports.io" required={false} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Environment variables untuk Edge Functions di-set terpisah di <span className="text-neon">Supabase Dashboard &gt; Edge Functions &gt; Settings</span></p>
        </div>
      </SectionCard>

      <SectionCard title="Generate Secrets" description="Cara generate secret yang aman">
        <CodeBlock language="bash" code={`# Generate REVALIDATION_SECRET
openssl rand -base64 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Contoh output:
# k7xP2mQ9vR4wL8jN5fH3dY6tA1bC0eG+iO8uS2zX4=`} />
      </SectionCard>

      <SectionCard title=".env.example" description="Template file .env untuk development">
        <CodeBlock language="bash" code={`# .env.example - Copy ke .env.local untuk development

# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...

# --- API-Football ---
FOOTBALL_API_KEY=a1b2c3d4e5f6...

# --- Security ---
REVALIDATION_SECRET=random-long-string-here

# --- Optional ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`} />
      </SectionCard>
    </div>
  );
}
