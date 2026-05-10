// ============================================================
// GOALZONE - Supabase Package
// ============================================================
// Central export for all Supabase-related utilities
// ============================================================
//
// Usage:
//   import { supabase } from '@/lib/supabase'
//   import { createServerSupabaseClient } from '@/lib/supabase'
<<<<<<< HEAD
//   import { createMiddlewareClient } from '@/lib/supabase/middleware'
=======
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
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
<<<<<<< HEAD

// Middleware helpers (for route protection)
export { createMiddlewareClient, getSupabaseSession } from './middleware'
=======
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
