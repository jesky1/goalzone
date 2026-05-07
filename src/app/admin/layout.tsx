import type { Metadata } from 'next';

// ─── Admin Layout Metadata (separate from frontend) ──────────
export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'GOALZONE Admin Dashboard — Kelola artikel, komentar, dan statistik.',
  robots: {
    index: false,
    follow: false,
  },
};

// ============================================================
// Admin Layout
// ============================================================
// Layout terpisah dari frontend utama:
//   - TIDAK ada Navbar/Footer dari situs publik
//   - Background gelap dedikasi (deep-900 + cyber-grid)
//   - SEO robots: noindex, nofollow (halaman admin tidak di-index)
// ============================================================

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-deep-900 cyber-grid">
      {children}
    </div>
  );
}
