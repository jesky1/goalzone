import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// Upload API Route - Upload gambar ke Supabase Storage
// ============================================================
// POST /api/upload
// Body (FormData): file, slug, folder
// Headers: Authorization: Bearer <token>
// ============================================================
//
// CATATAN: Route ini memerlukan Supabase credentials.
// Untuk production, pastikan SUPABASE_SERVICE_ROLE_KEY
// sudah di-set di environment variables.
//
// Jika Supabase belum di-configure, route ini akan
// mengembalikan error 503 (Service Unavailable).
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase belum di-configure. Set NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di environment variables.' },
        { status: 503 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const slug = formData.get('slug') as string | null;
    const folder = (formData.get('folder') as string) || 'articles';

    if (!file) {
      return NextResponse.json({ error: 'File wajib diisi' }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json({ error: 'Slug wajib diisi' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipe file tidak didukung. Gunakan: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Ukuran file terlalu besar. Maksimal 5MB, file Anda ${(file.size / 1024 / 1024).toFixed(1)}MB` },
        { status: 400 }
      );
    }

    // Generate file path
    const timestamp = Date.now();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${folder}/${year}/${month}/${timestamp}-${slug}.${ext}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const uploadUrl = `${supabaseUrl}/storage/v1/object/news-images/${filePath}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': file.type,
        'x-upsert': 'false',
      },
      body: arrayBuffer,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      return NextResponse.json(
        { error: `Upload gagal: ${errorData.error_message || uploadResponse.statusText}` },
        { status: uploadResponse.status }
      );
    }

    // Return public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/news-images/${filePath}`;

    return NextResponse.json({
      url: publicUrl,
      path: filePath,
      message: 'Upload berhasil',
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat upload' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Supabase belum di-configure' }, { status: 503 });
    }

    const { path } = await request.json();

    if (!path) {
      return NextResponse.json({ error: 'Path wajib diisi' }, { status: 400 });
    }

    // Delete from Supabase Storage
    const deleteUrl = `${supabaseUrl}/storage/v1/object/news-images/${path}`;

    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });

    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      return NextResponse.json(
        { error: `Gagal menghapus: ${deleteResponse.statusText}` },
        { status: deleteResponse.status }
      );
    }

    return NextResponse.json({ message: 'File berhasil dihapus' });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat menghapus' }, { status: 500 });
  }
}
