// ============================================================
// GOALZONE - Auth Context Provider (Example)
// ============================================================
// Copy file ini ke: src/lib/auth-context.tsx
// Kemudian wrap AppLayout dengan <AuthProvider>
//
// Dependencies: @supabase/supabase-js
// ============================================================

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

type AuthContext = {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthCtx = createContext<AuthContext>({} as AuthContext)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  const signOut = async () => await supabase.auth.signOut()

  return (
    <AuthCtx.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}
