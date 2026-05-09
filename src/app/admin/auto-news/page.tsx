'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Newspaper, Loader2 } from 'lucide-react';
import NewsEnginePanel from '@/components/admin/NewsEnginePanel';

export default function AutoNewsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('goalzone_admin_token');
    if (token) {
      fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) {
            if (data.success) {
              setAuthenticated(true);
            } else {
              localStorage.removeItem('goalzone_admin_token');
              localStorage.removeItem('goalzone_admin_user');
              // Redirect to homepage — middleware will handle /admin access
              router.push('/');
            }
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            localStorage.removeItem('goalzone_admin_token');
            localStorage.removeItem('goalzone_admin_user');
            router.push('/');
            setLoading(false);
          }
        });
    } else {
      // No token — middleware already protects /admin routes,
      // but as a fallback redirect to homepage
      router.push('/');
      queueMicrotask(() => { if (!cancelled) setLoading(false); });
    }
    return () => { cancelled = true; };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
          <Newspaper className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Auto News Engine</h1>
          <p className="text-sm text-slate-500">AI-powered match report generation pipeline</p>
        </div>
      </div>

      <NewsEnginePanel />
    </div>
  );
}
