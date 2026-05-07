-- ============================================================
-- GOALZONE - Supabase Storage Setup
-- ============================================================
-- Konfigurasi bucket untuk menyimpan gambar berita
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Buat Storage Bucket untuk gambar berita
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'news-images',
  'news-images',
  true, -- public bucket (gambar bisa diakses tanpa auth)
  5242880, -- 5MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Buat Storage Bucket untuk avatar user (opsional)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES (RLS untuk file storage)
-- ============================================

-- ------ NEWS-IMAGES BUCKET ------

-- Semua orang bisa lihat gambar berita (public read)
CREATE POLICY "news_images_select_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'news-images');

-- Hanya admin/editor yang bisa upload gambar berita
CREATE POLICY "news_images_insert_admin_editor" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'news-images'
    AND (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
      OR auth.role() = 'service_role'
    )
  );

-- Hanya admin/editor yang bisa update gambar berita
CREATE POLICY "news_images_update_admin_editor" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'news-images'
    AND (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
      OR auth.role() = 'service_role'
    )
  );

-- Hanya admin yang bisa hapus gambar berita
CREATE POLICY "news_images_delete_admin" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'news-images'
    AND (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      OR auth.role() = 'service_role'
    )
  );

-- ------ AVATARS BUCKET ------

-- Semua orang bisa lihat avatar
CREATE POLICY "avatars_select_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- User bisa upload avatar sendiri
CREATE POLICY "avatars_insert_self" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- User bisa update avatar sendiri
CREATE POLICY "avatars_update_self" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- User bisa hapus avatar sendiri
CREATE POLICY "avatars_delete_self" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- CATATAN FORMAT PENAMAAN FILE:
--
-- news-images/
--   articles/
--     <year>/<month>/<timestamp>-<slug>.webp
--     contoh: 2025/01/1706200000-ronaldo-resmi-ke-al-nassr.webp
--   heroes/
--     <year>/<month>/<timestamp>-hero-<slug>.webp
--   logos/
--     team-logos/<team-name>.png
--     league-logos/<league-name>.png
--
-- avatars/
--   <user-uuid>/avatar.webp
-- ============================================================
