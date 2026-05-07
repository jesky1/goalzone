'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Rocket,
  X,
  Loader2,
  Lock,
  AlertCircle,
  FileText,
  LayoutDashboard,
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';

// Deployment guide content (extracted, no Dialog wrapper)
import { DeploymentGuideInner } from './DeploymentGuide';

// ============================================================
// Admin Panel - Full-screen overlay accessible only by admin
// ============================================================
// Access: Ctrl+Shift+A (keyboard shortcut)
// Auth: Simple admin password gate (for demo/preview)
// Production: Replace with Supabase Auth role check
// ============================================================

// Admin password for demo (in production, use Supabase Auth)
const ADMIN_PASSWORD = 'goalzone2025';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

type AdminTab = 'dashboard' | 'deploy';

export default function AdminPanel({ open, onClose }: AdminPanelProps) {
  // Check session storage for existing auth on mount
  const isAuthenticated = typeof window !== 'undefined' && sessionStorage.getItem('goalzone_admin_auth') === 'true';
  const [authenticated, setAuthenticated] = useState(isAuthenticated);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  const handleLogin = useCallback(() => {
    if (locked) return;
    setAuthLoading(true);
    setAuthError('');

    // Simulate brief delay for UX
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        setAuthenticated(true);
        sessionStorage.setItem('goalzone_admin_auth', 'true');
        setPassword('');
        setAuthError('');
        setLoginAttempts(0);
        setLocked(false);
      } else {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        setAuthError('Password salah. Coba lagi.');
        if (newAttempts >= 5) {
          setLocked(true);
          // Auto-unlock after 60 seconds
          setTimeout(() => {
            setLocked(false);
            setLoginAttempts(0);
          }, 60000);
        }
      }
      setAuthLoading(false);
    }, 600);
  }, [password, locked, loginAttempts]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  }, [handleLogin]);

  const handleLogout = useCallback(() => {
    setAuthenticated(false);
    sessionStorage.removeItem('goalzone_admin_auth');
    setPassword('');
    setActiveTab('dashboard');
    onClose();
  }, [onClose]);

  const handleOpenChange = useCallback((v: boolean) => {
    if (!v && authenticated) {
      // Keep session when closing (don't logout)
      onClose();
    } else if (!v) {
      onClose();
    }
  }, [authenticated, onClose]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="fixed inset-0 max-w-[100vw] max-h-[100vh] w-full h-full m-0 p-0 rounded-none bg-black/80 backdrop-blur-sm flex items-center justify-center border-0 z-[100]">
        <div className="w-full h-full max-w-6xl max-h-[92vh] mx-auto flex flex-col bg-deep-800 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-neon/5">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-deep-800">
            {authenticated ? (
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-neon/10 border border-neon/20 flex items-center justify-center">
                  <Shield className="w-4.5 h-4.5 text-neon" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Admin Panel</h2>
                  <p className="text-[11px] text-muted-foreground">Kelola berita & konfigurasi backend</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Lock className="w-4.5 h-4.5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Admin Access</h2>
                  <p className="text-[11px] text-muted-foreground">Masukkan password untuk melanjutkan</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {authenticated && (
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Logout
                </Button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {!authenticated ? (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex items-center justify-center p-6"
                >
                  <div className="w-full max-w-sm">
                    {/* Lockout warning */}
                    {locked && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                        <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                        <p className="text-xs text-red-400 font-medium">Terlalu banyak percobaan gagal</p>
                        <p className="text-[10px] text-red-400/70 mt-0.5">Coba lagi dalam 60 detik</p>
                      </div>
                    )}

                    <div className="glass-card p-6">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-deep-700 border border-white/10 flex items-center justify-center mx-auto mb-3">
                          <Shield className="w-8 h-8 text-neon" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Admin Login</h3>
                        <p className="text-xs text-muted-foreground">Panel ini hanya untuk administrator</p>
                      </div>

                      <div className="space-y-3">
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
                            onKeyDown={handleKeyDown}
                            placeholder="Masukkan admin password..."
                            disabled={locked || authLoading}
                            autoFocus
                            className="bg-white/5 border-white/10 text-sm text-white placeholder:text-muted-foreground focus:border-neon/30 focus:ring-neon/20 pr-20"
                          />
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-neon px-2 py-1 rounded transition-colors"
                            type="button"
                          >
                            {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                          </button>
                        </div>

                        {authError && (
                          <p className="text-xs text-red-400 flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {authError}
                          </p>
                        )}

                        <Button
                          onClick={handleLogin}
                          disabled={!password.trim() || locked || authLoading}
                          className="w-full bg-neon/10 text-neon hover:bg-neon/20 border border-neon/20 gap-2"
                        >
                          {authLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Shield className="w-4 h-4" />
                          )}
                          {authLoading ? 'Memverifikasi...' : 'Masuk'}
                        </Button>

                        {!locked && loginAttempts > 0 && (
                          <p className="text-center text-[10px] text-muted-foreground">
                            Percobaan tersisa: {5 - loginAttempts}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/5">
                        <p className="text-[10px] text-muted-foreground text-center">
                          Demo password: <code className="text-neon/70 font-mono">goalzone2025</code>
                        </p>
                        <p className="text-[10px] text-muted-foreground text-center mt-1">
                          atau tekan <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px]">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px]">A</kbd>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex flex-col"
                >
                  {/* Tabs */}
                  <div className="shrink-0 px-6 pt-4">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdminTab)}>
                      <TabsList className="w-fit bg-white/5 h-auto p-1 gap-1">
                        <TabsTrigger
                          value="dashboard"
                          className="text-xs gap-1.5 data-[state=active]:bg-neon/10 data-[state=active]:text-neon px-4 py-2"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          Dashboard
                        </TabsTrigger>
                        <TabsTrigger
                          value="deploy"
                          className="text-xs gap-1.5 data-[state=active]:bg-neon/10 data-[state=active]:text-neon px-4 py-2"
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          Deployment Guide
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-hidden mt-3">
                    {activeTab === 'dashboard' ? (
                      <div className="h-full">
                        <AdminDashboardWrapper />
                      </div>
                    ) : (
                      <div className="h-full px-6 pb-6 overflow-y-auto custom-scrollbar">
                        <DeploymentGuideInner />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Dashboard Wrapper — wraps AdminDashboard in a scrollable container
// ============================================================
function AdminDashboardWrapper() {
  const [open, setOpen] = useState(true);

  return (
    <div className="h-full">
      <AdminDashboard
        open={open}
        onClose={() => {}} // prevent closing inside admin panel
      />
    </div>
  );
}
