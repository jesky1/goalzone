import { NextResponse } from 'next/server';

// ============================================================
// POST /api/admin/logout — Clear admin auth cookie
// ============================================================
export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logout berhasil',
  });

  // Clear the HttpOnly cookie set during login
  response.cookies.set('goalzone_admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Immediately expire
  });

  return response;
}
