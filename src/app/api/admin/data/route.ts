import { NextRequest, NextResponse } from 'next/server';

const ADMIN_API = `http://localhost:3001`;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${ADMIN_API}/data`, {
      headers: { Authorization: authHeader },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[Proxy /admin/data Error]', error.message);
    return NextResponse.json(
      { success: false, error: 'Admin API tidak tersedia' },
      { status: 503 }
    );
  }
}
