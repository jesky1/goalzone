import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'goalzone-admin-secret-2025';
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

    const admin = await db.profile.findUnique({ where: { username } });
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Username atau password salah' }, { status: 401 });
    }

    let isMatch = false;
    if (admin.passwordHash) {
      isMatch = await bcrypt.compare(password, admin.passwordHash);
    } else {
      isMatch = username === 'admin' && password === 'admin123';
    }

    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Username atau password salah' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role || 'admin' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        expiresIn: JWT_EXPIRES_IN,
        user: {
          id: admin.id,
          username: admin.username,
          fullName: admin.fullName || admin.username,
          role: admin.role || 'admin',
        },
      },
    });
  } catch (error: any) {
    console.error('[Admin Login Error]', error.message);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
