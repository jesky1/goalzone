import { NextRequest, NextResponse } from 'next/server';

const ADMIN_API = `http://localhost:3001`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${ADMIN_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[Proxy /admin/login Error]', error.message);
    return NextResponse.json(
      { success: false, error: 'Admin API tidak tersedia' },
      { status: 503 }
    );
  }
}
