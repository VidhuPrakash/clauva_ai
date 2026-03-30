import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type UserRole = 'user' | 'admin'
export type Language = 'en' | 'ml' | 'ta' | 'ar' | 'hi' | 'kn' | 'te'

interface AuthState {
  session: Session | null
  user: User | null
  role: UserRole | null
  fullName: string
  timezone: string
  country: string
  language: Language
  setSession: (session: Session | null) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      role: null,
      fullName: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      country: '',
      language: 'en',
      setSession: (session) =>
        set({
          session,
          user: session?.user ?? null,
          role:
            ((session?.user?.app_metadata?.role ??
              session?.user?.user_metadata?.role) as UserRole) ?? 'user',
          fullName: session?.user?.user_metadata?.full_name ?? '',
          timezone:
            session?.user?.user_metadata?.timezone ??
            Intl.DateTimeFormat().resolvedOptions().timeZone,
          country: session?.user?.user_metadata?.country ?? '',
          language:
            (session?.user?.user_metadata?.language as Language) ?? 'en',
        }),
      logout: async () => {
        await supabase.auth.signOut()
        set({
          session: null,
          user: null,
          role: null,
          fullName: '',
          timezone: '',
          country: '',
          language: 'en',
        })
        window.location.href = '/login'
      },
    }),
    {
      name: 'clauva-auth',
      partialize: (state) => ({
        role: state.role,
        fullName: state.fullName,
        timezone: state.timezone,
        country: state.country,
        language: state.language,
      }),
    }
  )
)
