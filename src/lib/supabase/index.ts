// ============================================================
// GOALZONE - Supabase Package
// ============================================================
// Central export for all Supabase-related utilities
// ============================================================
//
// Usage:
//   import { supabase } from '@/lib/supabase'
//   import { createServerSupabaseClient } from '@/lib/supabase'
//   import { createMiddlewareClient } from '@/lib/supabase/middleware'
//   import { uploadNewsImage } from '@/lib/supabase/upload'
// ============================================================

export { supabase, createServerSupabaseClient, type Tables } from './client'

// Upload helpers (re-exported for convenience)
export {
  uploadNewsImage,
  uploadNewsImageFromUrl,
  deleteNewsImage,
  uploadAvatar,
  optimizeImage,
} from './upload'

// Middleware helpers (for route protection)
export { createMiddlewareClient, getSupabaseSession } from './middleware'
