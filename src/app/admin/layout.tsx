import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';

// ─── Metadata ───────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

// ─── Layout ─────────────────────────────────────────────────

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-deep-900 cyber-grid">
      <AuthProvider>{children}</AuthProvider>
    </div>
  );
}
