import { NextRequest, NextResponse } from 'next/server';

const ADMIN_API = `http://localhost:3001`;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const res = await fetch(`${ADMIN_API}/data/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[Proxy /admin/data/articles/[id] PUT Error]', error.message);
    return NextResponse.json(
      { success: false, error: 'Admin API tidak tersedia' },
      { status: 503 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${ADMIN_API}/data/articles/${id}`, {
      method: 'DELETE',
      headers: { Authorization: authHeader },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[Proxy /admin/data/articles/[id] DELETE Error]', error.message);
    return NextResponse.json(
      { success: false, error: 'Admin API tidak tersedia' },
      { status: 503 }
    );
  }
}
