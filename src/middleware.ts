// ============================================================
// GOALZONE - Middleware
// ============================================================
// Protects /admin routes with Supabase Auth + JWT cookie guard.
// Unauthenticated or non-admin users are redirected to /.
// Uses `jose` instead of `jsonwebtoken` for Edge Runtime compat.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createMiddlewareClient, getSupabaseSession } from '@/lib/supabase/middleware';

// Convert JWT_SECRET string to Uint8Array for jose
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'goalzone-admin-secret-2025',
);

const ADMIN_ROLES = ['admin', 'editor'];

// Routes that should NOT be protected (public admin API endpoints)
const ALLOWED_ADMIN_API_ROUTES = [
  '/api/admin/login',
  '/api/admin/verify',
  '/api/admin/logout',
];

// ============================================================
// JWT Cookie Verification (Edge Runtime compatible via jose)
// ============================================================
async function verifyJwtCookie(
  request: NextRequest,
): Promise<{ valid: boolean; role?: string }> {
  const tokenCookie = request.cookies.get('goalzone_admin_token');
  if (!tokenCookie?.value) return { valid: false };

  try {
    const { payload } = await jwtVerify(tokenCookie.value, JWT_SECRET);
    const role = (payload as any).role as string | undefined;

    if (role && ADMIN_ROLES.includes(role)) {
      return { valid: true, role };
    }
    return { valid: false };
  } catch {
    // Token invalid or expired
    return { valid: false };
  }
}

// ============================================================
// Supabase Auth Session Verification
// ============================================================
async function verifySupabaseAuth(
  request: NextRequest,
): Promise<{ valid: boolean; role?: string }> {
  const session = await getSupabaseSession(request);
  if (!session?.user) return { valid: false };

  // Check role from user metadata (set during sign-up or profile)
  const role =
    session.user.app_metadata?.role ||
    session.user.user_metadata?.role;

  if (role && ADMIN_ROLES.includes(role)) {
    return { valid: true, role };
  }

  // If no role in metadata, try fetching from profiles table
  // using service role (middleware has access to env vars)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile && ADMIN_ROLES.includes(profile.role)) {
        return { valid: true, role: profile.role };
      }
    } catch {
      // Supabase query failed
    }
  }

  return { valid: false };
}

// ============================================================
// Main Middleware
// ============================================================
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Skip non-admin routes ────────────────────────────────
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  // ─── Allow whitelisted admin API routes (login, verify, logout) ──
  if (ALLOWED_ADMIN_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // ─── Strategy 1: Supabase Auth Session ────────────────────
  const supabaseResult = await verifySupabaseAuth(request);
  if (supabaseResult.valid) {
    // Create response and refresh Supabase cookies if needed
    const response = NextResponse.next();
    const supabase = createMiddlewareClient(request, response);
    if (supabase) {
      try {
        await supabase.auth.getSession();
      } catch {
        // Cookie refresh failed silently
      }
    }
    return response;
  }

  // ─── Strategy 2: JWT Cookie (HttpOnly) ────────────────────
  const jwtResult = await verifyJwtCookie(request);
  if (jwtResult.valid) {
    return NextResponse.next();
  }

  // ─── Not Authenticated — Redirect / Block ─────────────────

  // For API routes, return 401 JSON
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — Silakan login terlebih dahulu' },
      { status: 401 },
    );
  }

  // For page routes, redirect to public homepage
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/';
  redirectUrl.searchParams.set('auth_redirect', 'admin');
  return NextResponse.redirect(redirectUrl);
}

// ============================================================
// Matcher — which routes the middleware runs on
// ============================================================
export const config = {
  matcher: [
    /*
     * Match all /admin routes (pages + API)
     * Exclude _next/static, _next/image, favicon, etc.
     */
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
