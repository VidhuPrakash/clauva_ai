'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/shared/Logo'
import { ClauvaInput } from '@/components/shared/ClauvaInput'
import { ClauvaButton } from '@/components/shared/ClauvaButton'
import { ClauvaCard } from '@/components/shared/ClauvaCard'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const passwordReset = searchParams.get('reset') === 'success'
  const setSession = useAuthStore((s) => s.setSession)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut()
      setError(
        'Please verify your email before signing in. Check your inbox for the confirmation link.'
      )
      setLoading(false)
      return
    }

    setSession(data.session)

    const role: string =
      data.session?.user?.app_metadata?.role ??
      data.session?.user?.user_metadata?.role ??
      'user'

    router.push(role === 'admin' ? '/admin' : '/home')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="lg:hidden mb-8 flex justify-center">
        <Logo size="lg" />
      </div>

      <ClauvaCard padding="lg">
        <h2 className="text-2xl font-display font-bold text-text-primary">
          Welcome back
        </h2>
        <p className="mt-1 text-sm font-body text-text-secondary">
          Sign in to your Clauva AI account
        </p>

        {passwordReset && (
          <div className="mt-4 p-3 rounded-md bg-risk-low text-risk-low text-sm font-body border border-risk-low">
            Password updated successfully. Sign in with your new password.
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <ClauvaInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <ClauvaInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8.5 text-text-muted hover:text-text-secondary"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-risk-high text-risk-high text-sm font-body border border-risk-high">
              {error}
            </div>
          )}

          <ClauvaButton type="submit" loading={loading} className="w-full">
            Sign In
          </ClauvaButton>
        </form>

        <div className="mt-4 space-y-2 text-center">
          <Link
            href="/forgot-password"
            className="text-sm font-body text-accent hover:underline"
          >
            Forgot password?
          </Link>
          <p className="text-sm font-body text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-accent hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </ClauvaCard>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
