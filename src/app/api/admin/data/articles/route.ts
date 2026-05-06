import { NextRequest, NextResponse } from 'next/server';

const ADMIN_API = `http://localhost:3001`;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    const params = new URLSearchParams({ search, category, limit, offset });
    const res = await fetch(`${ADMIN_API}/data/articles?${params}`, {
      headers: { Authorization: authHeader },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[Proxy /admin/data/articles GET Error]', error.message);
    return NextResponse.json(
      { success: false, error: 'Admin API tidak tersedia' },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const res = await fetch(`${ADMIN_API}/data/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[Proxy /admin/data/articles POST Error]', error.message);
    return NextResponse.json(
      { success: false, error: 'Admin API tidak tersedia' },
      { status: 503 }
    );
  }
}
