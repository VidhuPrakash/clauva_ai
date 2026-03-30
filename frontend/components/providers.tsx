'use client'

import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import NextTopLoader from 'nextjs-toploader'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const setSession = useAuthStore((s) => s.setSession)

  useEffect(() => {
    // Sync Supabase auth state with Zustand store on every auth event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [setSession])

  return (
    <QueryClientProvider client={queryClient}>
      <NextTopLoader showSpinner={false} />
      <TooltipProvider>
        <Toaster />
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  )
}
