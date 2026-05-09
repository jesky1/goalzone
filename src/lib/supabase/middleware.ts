// ============================================================
// GOALZONE - Supabase SSR Client for Middleware
// ============================================================
// Cookie-based Supabase Auth client for Next.js middleware.
// Uses @supabase/ssr to read auth sessions from cookies.
// ============================================================

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Create a Supabase client that reads auth cookies from the request
 * and optionally writes updated cookies to the response.
 */
export function createMiddlewareClient(
  request: NextRequest,
  response?: NextResponse,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map((c) => ({
          name: c.name,
          value: c.value,
        }));
      },
      setAll(cookiesToSet) {
        if (!response) return;
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

/**
 * Get the current Supabase Auth session from request cookies.
 * Returns the session if valid, null otherwise.
 */
export async function getSupabaseSession(request: NextRequest) {
  const supabase = createMiddlewareClient(request);
  if (!supabase) return null;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}
