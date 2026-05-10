import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'goalzone-admin-secret-2025';
const JWT_EXPIRES_IN = '24h';

// ============================================================
// POST /api/admin/login — Authenticate admin
<<<<<<< HEAD
// Sets HttpOnly cookie for middleware-based route protection
=======
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    // Check credentials against env vars with fallbacks
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json({ success: false, error: 'Username atau password salah' }, { status: 401 });
    }

    // Optionally verify user exists in Supabase profiles with admin role
    let userId = username;
    let fullName = username;
    let role = 'admin';

    try {
      const supabase = createServerSupabaseClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, full_name, role')
        .eq('username', username)
        .eq('role', 'admin')
        .single();

      if (profile) {
        userId = profile.id;
        fullName = profile.full_name || profile.username;
        role = profile.role || 'admin';
      }
    } catch {
      // Supabase not available, use fallback values
    }

    const token = jwt.sign(
      { id: userId, username, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

<<<<<<< HEAD
    // Build response with HttpOnly cookie for middleware auth guard
    const response = NextResponse.json({
=======
    return NextResponse.json({
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        expiresIn: JWT_EXPIRES_IN,
        user: {
          id: userId,
          username,
          fullName,
          role,
        },
      },
    });
<<<<<<< HEAD

    // Set HttpOnly cookie — readable by middleware, not by JS
    response.cookies.set('goalzone_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours (matches JWT_EXPIRES_IN)
    });

    return response;
=======
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
  } catch (error: any) {
    console.error('[Admin Login Error]', error.message);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
