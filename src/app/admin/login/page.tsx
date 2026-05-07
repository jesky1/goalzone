'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
import { AuthProvider, useAuth } from '@/lib/auth-context';

// ─── Login Form (must be inside AuthProvider) ───────────────

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

  // If already authenticated, redirect via useEffect (not during render)
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectPath);
    }
  }, [isAuthenticated, router, redirectPath]);

  if (isAuthenticated) {
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
    <div className="min-h-screen bg-deep-900 cyber-grid flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neon/10 border border-neon/20 neon-glow mb-4"
          >
            <Shield className="w-8 h-8 text-neon" />
          </motion.div>
          <h1 className="text-2xl font-bold neon-text tracking-wider">
            GOALZONE
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Admin Dashboard
          </p>
        </div>

        {/* Login Card */}
        <Card className="glass-card p-0 overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <LogIn className="w-5 h-5 text-neon" />
                Sign In
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Masuk untuk mengakses panel admin
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label
                  htmlFor="username"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
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
                  className="bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 focus:border-neon/50 focus:ring-neon/20"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
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
                    className="bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 focus:border-neon/50 focus:ring-neon/20 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-neon transition-colors"
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
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-bold transition-all"
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
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-neon transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Kembali ke Beranda
          </Link>

          {/* Security notice */}
          <div className="mx-auto max-w-xs p-3 rounded-lg bg-white/[0.03] border border-white/5">
            <p className="text-[11px] text-muted-foreground text-center">
              <span className="font-semibold text-neon/70">🔒</span>{' '}
              Akses terbatas hanya untuk admin yang terotorisasi
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page (wraps with AuthProvider) ─────────────────────────

export default function AdminLoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
