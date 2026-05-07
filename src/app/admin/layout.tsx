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
    <div className="min-h-screen bg-[#0a0a12]">
      <AuthProvider>{children}</AuthProvider>
    </div>
  );
}
