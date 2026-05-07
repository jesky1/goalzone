import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';

// ============================================================
// POST /api/admin/login — Authenticate admin
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    // Check credentials from environment variables (NO fallbacks for security)
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword || !JWT_SECRET) {
      console.error('[Admin Auth] ADMIN_USERNAME, ADMIN_PASSWORD, or JWT_SECRET not configured');
      return NextResponse.json({ success: false, error: 'Server auth belum dikonfigurasi' }, { status: 500 });
    }

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
      JWT_SECRET!,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return NextResponse.json({
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
  } catch (error: any) {
    console.error('[Admin Login Error]', error.message);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
