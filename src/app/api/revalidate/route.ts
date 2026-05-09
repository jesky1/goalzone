import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// ISR Revalidation API Route
// ============================================================
// POST /api/revalidate
// Body: { secret, path? , tag? }
//
// Digunakan untuk trigger on-demand ISR revalidation
// saat ada artikel baru, update, atau saat live scores berubah
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, path, tag } = body;

    // Validate secret
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    // Dynamic import revalidate functions
    const { revalidatePath, revalidateTag } = await import('next/cache');

    if (path) {
      revalidatePath(path);
      return NextResponse.json({
        revalidated: true,
        path,
        timestamp: new Date().toISOString(),
      });
    }

    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({
        revalidated: true,
        tag,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Missing path or tag parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 }
    );
  }
}
