-- ============================================================
-- GOALZONE - PostgreSQL Trigger untuk Auto-Create Profile
-- ============================================================
-- Trigger ini otomatis membuat entry di tabel public.profiles
-- setiap kali ada user baru mendaftar melalui Supabase Auth
-- ============================================================

-- 1. Buat fungsi trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Buat profil baru berdasarkan data dari auth.users
  INSERT INTO public.profiles (id, username, full_name, avatar_url, role, is_verified)
  VALUES (
    NEW.id,
    -- Generate username dari email (bagian sebelum @)
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    -- Full name dari metadata OAuth atau email
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    -- Avatar URL dari OAuth provider (Google, dll)
    NEW.raw_user_meta_data->>'avatar_url',
    -- Role default: user
    'user',
    -- Mark verified jika email sudah dikonfirmasi
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Buat trigger setelah user baru dibuat
-- Hapus trigger lama jika sudah ada (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. (Opsional) Trigger untuk update profil saat user update metadata
CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profil jika ada perubahan nama atau avatar
  UPDATE public.profiles
  SET
    full_name = COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    avatar_url = COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      public.profiles.avatar_url
    ),
    is_verified = NEW.email_confirmed_at IS NOT NULL,
    updated_at = now()
  WHERE id = NEW.id;

  -- Update username jika belum diubah (masih default dari email)
  UPDATE public.profiles
  SET username = NEW.raw_user_meta_data->>'username'
  WHERE id = NEW.id
    AND NEW.raw_user_meta_data->>'username' IS NOT NULL
    AND public.profiles.username = split_part(OLD.email, '@', 1);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_updated();

-- ============================================================
-- CATATAN PENTING:
-- - Trigger ini BERJALAN OTOMATIS setelah user signup
-- - Jika kamu ingin user pertama langsung jadi admin,
--   jalankan SQL berikut SETELAH signup pertama:
--
--   UPDATE public.profiles SET role = 'admin' WHERE id = '<UUID_USER_PERTAMA>';
--
-- - Untuk cek apakah trigger berhasil, buat test user di
--   Supabase Dashboard > Authentication > Users > Add User
--   lalu cek tabel profiles
-- ============================================================
