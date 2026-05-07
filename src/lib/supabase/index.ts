// ============================================================
// GOALZONE - Supabase Package
// ============================================================
// Central export for all Supabase-related utilities
// ============================================================
//
// Usage:
//   import { supabase } from '@/lib/supabase'
//   import { createServerSupabaseClient } from '@/lib/supabase'
//   import { uploadNewsImage } from '@/lib/supabase/upload'
// ============================================================

export { supabase, createServerSupabaseClient, type Tables } from './client'

// Stats helpers
export { getDashboardStats, type DashboardStats } from './stats'

// Upload helpers (re-exported for convenience)
export {
  uploadNewsImage,
  uploadNewsImageFromUrl,
  deleteNewsImage,
  uploadAvatar,
  optimizeImage,
} from './upload'
