-- ============================================================
-- GOALZONE - Supabase Production Database Schema
-- Portal Berita Sepak Bola Terkini
-- ============================================================
-- Jalankan SQL ini di Supabase SQL Editor (https://supabase.com/dashboard)
-- Pastikan tidak ada error sebelum melanjutkan ke step selanjutnya
-- ============================================================

-- ============================================
-- 1. ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- 2a. Kategori berita
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#00f0ff',
  icon VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2b. Profil user (terhubung ke auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'editor', 'admin')),
  is_verified BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{"email_notifications": true, "dark_mode": true}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2c. Artikel berita
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  summary TEXT,
  excerpt TEXT,
  cover_image TEXT,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  read_time INT DEFAULT 5,
  seo_title VARCHAR(500),
  seo_description TEXT,
  seo_keywords TEXT[],
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2d. Komentar
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  likes INT DEFAULT 0,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2e. Live scores (data dari API-Football)
CREATE TABLE IF NOT EXISTS public.live_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id INT NOT NULL UNIQUE, -- ID dari API-Football
  league_name VARCHAR(200),
  league_logo TEXT,
  league_country VARCHAR(100),
  season INT,
  home_team VARCHAR(200) NOT NULL,
  home_team_logo TEXT,
  away_team VARCHAR(200) NOT NULL,
  away_team_logo TEXT,
  home_score INT DEFAULT 0,
  away_score INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'NS', -- NS, 1H, HT, 2H, ET, BT, P, FT, AWD, WO, LIVE
  minute INT,
  elapsed INT,
  match_date TIMESTAMPTZ,
  venue VARCHAR(200),
  home_events JSONB DEFAULT '[]', -- [{type: "goal", minute: 5, player: "Ronaldo"}]
  away_events JSONB DEFAULT '[]',
  statistics JSONB DEFAULT '{}',
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2f. Bookmarks pertandingan
CREATE TABLE IF NOT EXISTS public.bookmarked_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id INT NOT NULL, -- external match ID
  home_team VARCHAR(200),
  away_team VARCHAR(200),
  match_date TIMESTAMPTZ,
  league_name VARCHAR(200),
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, match_id)
);

-- 2g. Klasemen liga
CREATE TABLE IF NOT EXISTS public.standings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_name VARCHAR(200) NOT NULL,
  season INT NOT NULL,
  team_name VARCHAR(200) NOT NULL,
  team_logo TEXT,
  position INT NOT NULL,
  played INT DEFAULT 0,
  won INT DEFAULT 0,
  draw INT DEFAULT 0,
  lost INT DEFAULT 0,
  goals_for INT DEFAULT 0,
  goals_against INT DEFAULT 0,
  goal_difference INT DEFAULT 0,
  points INT DEFAULT 0,
  form VARCHAR(10) DEFAULT '',
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(league_name, season, team_name)
);

-- 2h. Top scorers
CREATE TABLE IF NOT EXISTS public.top_scorers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_name VARCHAR(200) NOT NULL,
  season INT NOT NULL,
  player_name VARCHAR(200) NOT NULL,
  player_photo TEXT,
  team_name VARCHAR(200),
  team_logo TEXT,
  goals INT DEFAULT 0,
  assists INT DEFAULT 0,
  appearances INT DEFAULT 0,
  minutes_played INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(league_name, season, player_name)
);

-- 2i. Audit log (opsional, untuk tracking admin actions)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. INDEXES (untuk performa query)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_author ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON public.articles(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_articles_published ON public.articles(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_articles_trending ON public.articles(is_trending) WHERE is_trending = true;

CREATE INDEX IF NOT EXISTS idx_comments_article ON public.comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_live_scores_status ON public.live_scores(status);
CREATE INDEX IF NOT EXISTS idx_live_scores_date ON public.live_scores(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_live_scores_league ON public.live_scores(league_name);

CREATE INDEX IF NOT EXISTS idx_standings_league_season ON public.standings(league_name, season);
CREATE INDEX IF NOT EXISTS idx_standings_position ON public.standings(league_name, season, position);

CREATE INDEX IF NOT EXISTS idx_top_scorers_league_season ON public.top_scorers(league_name, season);
CREATE INDEX IF NOT EXISTS idx_top_scorers_goals ON public.top_scorers(league_name, season, goals DESC);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarked_matches(user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ============================================
-- 4. UPDATED_AT TRIGGERS (auto-update timestamp)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.standings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.top_scorers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS pada semua tabel
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarked_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.top_scorers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------ CATEGORIES ------
-- Semua orang bisa baca kategori
CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT USING (true);

-- Hanya admin yang bisa CRUD kategori
CREATE POLICY "categories_insert_admin" ON public.categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "categories_update_admin" ON public.categories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "categories_delete_admin" ON public.categories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ------ PROFILES ------
-- Semua orang bisa lihat profil publik
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

-- User hanya bisa edit profil sendiri
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Admin bisa edit semua profil
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ------ ARTICLES ------
-- Semua orang bisa baca artikel yang sudah dipublish
CREATE POLICY "articles_select_published" ON public.articles
  FOR SELECT USING (status = 'published');

-- Penulis bisa baca artikel sendiri (termasuk draft)
CREATE POLICY "articles_select_author" ON public.articles
  FOR SELECT USING (
    author_id = auth.uid()
  );

-- Admin/editor bisa baca semua artikel
CREATE POLICY "articles_select_admin" ON public.articles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Hanya admin/editor yang bisa membuat artikel
CREATE POLICY "articles_insert_admin_editor" ON public.articles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Penulis bisa update artikel sendiri
CREATE POLICY "articles_update_author" ON public.articles
  FOR UPDATE USING (
    author_id = auth.uid()
  );

-- Admin bisa update semua artikel
CREATE POLICY "articles_update_admin" ON public.articles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Hanya admin yang bisa hapus artikel
CREATE POLICY "articles_delete_admin" ON public.articles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ------ COMMENTS ------
-- Semua orang bisa baca komentar
CREATE POLICY "comments_select_all" ON public.comments
  FOR SELECT USING (
    status = 'published'
    AND EXISTS (SELECT 1 FROM public.articles WHERE id = article_id AND status = 'published')
  );

-- User yang login bisa lihat semua komentar pada artikelnya
CREATE POLICY "comments_select_authenticated" ON public.comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- User yang login bisa memberi komentar
CREATE POLICY "comments_insert_authenticated" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.articles WHERE id = article_id AND status = 'published')
  );

-- User bisa edit komentar sendiri
CREATE POLICY "comments_update_self" ON public.comments
  FOR UPDATE USING (user_id = auth.uid());

-- User bisa hapus komentar sendiri
CREATE POLICY "comments_delete_self" ON public.comments
  FOR DELETE USING (user_id = auth.uid());

-- Admin bisa hapus semua komentar
CREATE POLICY "comments_delete_admin" ON public.comments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ------ LIVE SCORES ------
-- Semua orang bisa baca live scores
CREATE POLICY "live_scores_select_all" ON public.live_scores
  FOR SELECT USING (true);

-- Service role saja yang bisa write (dipakai Edge Function dengan service_role key)
CREATE POLICY "live_scores_insert_service" ON public.live_scores
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "live_scores_update_service" ON public.live_scores
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "live_scores_delete_service" ON public.live_scores
  FOR DELETE USING (auth.role() = 'service_role');

-- ------ BOOKMARKED MATCHES ------
-- User hanya bisa lihat bookmark sendiri
CREATE POLICY "bookmarks_select_self" ON public.bookmarked_matches
  FOR SELECT USING (user_id = auth.uid());

-- User hanya bisa buat bookmark untuk diri sendiri
CREATE POLICY "bookmarks_insert_self" ON public.bookmarked_matches
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- User hanya bisa update bookmark sendiri
CREATE POLICY "bookmarks_update_self" ON public.bookmarked_matches
  FOR UPDATE USING (user_id = auth.uid());

-- User hanya bisa hapus bookmark sendiri
CREATE POLICY "bookmarks_delete_self" ON public.bookmarked_matches
  FOR DELETE USING (user_id = auth.uid());

-- ------ STANDINGS ------
-- Semua orang bisa baca klasemen
CREATE POLICY "standings_select_all" ON public.standings
  FOR SELECT USING (true);

-- Service role saja yang bisa write
CREATE POLICY "standings_insert_service" ON public.standings
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "standings_update_service" ON public.standings
  FOR UPDATE USING (auth.role() = 'service_role');

-- ------ TOP SCORERS ------
CREATE POLICY "top_scorers_select_all" ON public.top_scorers
  FOR SELECT USING (true);

CREATE POLICY "top_scorers_insert_service" ON public.top_scorers
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "top_scorers_update_service" ON public.top_scorers
  FOR UPDATE USING (auth.role() = 'service_role');

-- ------ AUDIT LOGS ------
-- Admin saja yang bisa baca audit log
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role dan admin bisa insert audit log
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 6. SEED DATA (Kategori default)
-- ============================================

INSERT INTO public.categories (name, slug, description, color, sort_order) VALUES
  ('Transfer', 'transfer', 'Berita transfer pemain terbaru', '#f59e0b', 1),
  ('Premier League', 'premier-league', 'Liga Inggris - kompetisi paling populer di dunia', '#3b0764', 2),
  ('La Liga', 'la-liga', 'Liga Spanyol - rumah Barcelona dan Real Madrid', '#ea580c', 3),
  ('Serie A', 'serie-a', 'Liga Italia - liga tertua di dunia', '#0f766e', 4),
  ('Bundesliga', 'bundesliga', 'Liga Jerman - liga dengan kehadiran tertinggi', '#dc2626', 5),
  ('Ligue 1', 'ligue-1', 'Liga Prancis - rumah PSG', '#1d4ed8', 6),
  ('Champions League', 'champions-league', 'Liga Champions UEFA - kompetisi klub paling bergengsi', '#1e40af', 7),
  ('Timnas Indonesia', 'timnas-indonesia', 'Berita seputar Tim Nasional Indonesia', '#dc2626', 8),
  ('Analisis Taktis', 'analisis-taktis', 'Analisis taktik dan strategi permainan', '#00f0ff', 9),
  ('Opini', 'opini', 'Kolom opini dan editorial', '#a855f7', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 7. VIEWS (untuk query yang sering dipakai)
-- ============================================

-- View: artikel published dengan info lengkap
CREATE OR REPLACE VIEW public.v_articles_published AS
SELECT
  a.id, a.title, a.slug, a.excerpt, a.summary, a.cover_image,
  a.is_featured, a.is_trending, a.view_count, a.like_count, a.comment_count,
  a.read_time, a.published_at, a.created_at,
  c.name AS category_name, c.slug AS category_slug, c.color AS category_color,
  p.username AS author_name, p.avatar_url AS author_avatar
FROM public.articles a
JOIN public.categories c ON a.category_id = c.id
JOIN public.profiles p ON a.author_id = p.id
WHERE a.status = 'published'
ORDER BY a.published_at DESC;

-- View: trending articles (view_count > 100 dalam 7 hari terakhir)
CREATE OR REPLACE VIEW public.v_articles_trending AS
SELECT
  a.id, a.title, a.slug, a.excerpt, a.summary, a.cover_image,
  a.view_count, a.read_time, a.published_at,
  c.name AS category_name, c.slug AS category_slug,
  p.username AS author_name
FROM public.articles a
JOIN public.categories c ON a.category_id = c.id
JOIN public.profiles p ON a.author_id = p.id
WHERE a.status = 'published' AND a.is_trending = true
ORDER BY a.view_count DESC;

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function: auto-increment view_count
CREATE OR REPLACE FUNCTION public.increment_view_count(article_slug VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE public.articles
  SET view_count = view_count + 1
  WHERE slug = article_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: update comment count on article
CREATE OR REPLACE FUNCTION public.update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.articles SET comment_count = comment_count + 1 WHERE id = NEW.article_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.articles SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.article_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_count();

-- Function: generate unique slug from title
CREATE OR REPLACE FUNCTION public.generate_slug(input_title VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  base_slug VARCHAR;
  final_slug VARCHAR;
  counter INT := 0;
BEGIN
  base_slug := lower(regexp_replace(input_title, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.articles WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;
