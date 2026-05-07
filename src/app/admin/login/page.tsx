'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  LogIn,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';

// ─── Login Form (must be inside AuthProvider + Suspense) ─────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin';

  const { signIn, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch — only run client-side logic after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // If already authenticated, redirect via useEffect (not during render)
  useEffect(() => {
    if (isAuthenticated && mounted) {
      router.replace(redirectPath);
    }
  }, [isAuthenticated, mounted, router, redirectPath]);

  if (isAuthenticated && mounted) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(username.trim(), password.trim());
      if (result.success) {
        router.replace(redirectPath);
      } else {
        setError(result.error || 'Login gagal');
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-500/3 blur-3xl" />
      </div>

      <div
        className={`relative z-10 w-full max-w-md transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-cyan-400 tracking-wider">
            GOALZONE
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Admin Dashboard
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-gray-900/80 border-gray-800 p-0 overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <LogIn className="w-5 h-5 text-cyan-400" />
                Sign In
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Masuk untuk mengakses panel admin
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label
                  htmlFor="username"
                  className="text-xs font-semibold text-gray-400 uppercase tracking-wider"
                >
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={loading}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-gray-400 uppercase tracking-wider"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Masuk
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back to site */}
        <div className="text-center mt-6 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Kembali ke Beranda
          </Link>

          {/* Security notice */}
          <div className="mx-auto max-w-xs p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <p className="text-[11px] text-gray-500 text-center">
              <span className="font-semibold text-cyan-400/70">🔒</span>{' '}
              Akses terbatas hanya untuk admin yang terotorisasi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Suspense wrapper for useSearchParams ─────────────────────

function LoginContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Memuat...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

// ─── Page (AuthProvider already provided by admin layout) ────

export default function AdminLoginPage() {
  return <LoginContent />;
}
