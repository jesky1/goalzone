import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/supabase/stats';

// ============================================================
// GET /api/admin/stats — Platform Statistics
// ============================================================
// Menggunakan fungsi getDashboardStats() yang memanggil Supabase
// client secara langsung untuk query data riil:
//
//   - totalArticles  → COUNT(*) dari tabel articles
//   - totalComments → COUNT(*) dari tabel comments
//   - totalViews    → SUM(view_count) dari tabel articles
//   - + enriched stats (featured, categories, averages, highlights)
//
// Requires Authorization: Bearer <token> header.
// ============================================================

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await getDashboardStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('[Admin Stats Error]', error.message);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil statistik' },
      { status: 500 }
    );
  }
}
