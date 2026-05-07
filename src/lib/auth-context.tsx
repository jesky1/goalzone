'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

// ─── Types ──────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

interface AuthContextValue {
  user: AdminUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const COOKIE_NAME = 'goalzone_admin_token';
const COOKIE_MAX_AGE = 86400;

// ─── Cookie Helpers ─────────────────────────────────────────

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;path=/;max-age=0`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ─── Provider ───────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from cookie on mount
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const savedToken = getCookie(COOKIE_NAME);
      if (!savedToken) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/admin/verify', {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        const json = await res.json();

        if (cancelled) return;

        if (json.success && json.data) {
          setToken(savedToken);
          setUser({
            id: json.data.id,
            username: json.data.username,
            fullName: json.data.username,
            role: json.data.role || 'admin',
          });
        } else {
          deleteCookie(COOKIE_NAME);
        }
      } catch {
        if (!cancelled) deleteCookie(COOKIE_NAME);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();

      if (!json.success) {
        return { success: false, error: json.error || 'Login gagal' };
      }

      const newToken = json.data.token;
      const userData = json.data.user;

      setToken(newToken);
      setUser({
        id: userData.id,
        username: userData.username,
        fullName: userData.fullName,
        role: userData.role,
      });
      setCookie(COOKIE_NAME, newToken, COOKIE_MAX_AGE);

      return { success: true };
    } catch {
      return { success: false, error: 'Terjadi kesalahan jaringan' };
    }
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    deleteCookie(COOKIE_NAME);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
