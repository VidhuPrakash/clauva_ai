'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClauvaInput } from '@/components/shared/ClauvaInput'
import { ClauvaButton } from '@/components/shared/ClauvaButton'
import { ClauvaCard } from '@/components/shared/ClauvaCard'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const router = useRouter()

  // Supabase sends the recovery token as a URL fragment (#access_token=...&type=recovery)
  // The browser client picks it up automatically via onAuthStateChange
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setError('')
    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await supabase.auth.signOut()
    router.push('/login?reset=success')
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <ClauvaCard padding="lg">
          <h2 className="text-2xl font-display font-bold text-text-primary">
            Set new password
          </h2>

          {!ready ? (
            <p className="mt-4 text-sm font-body text-text-secondary">
              Verifying reset link…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <ClauvaInput
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <ClauvaInput
                label="Confirm Password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
              />
              {error && (
                <div className="p-3 rounded-md bg-risk-high text-risk-high text-sm border border-risk-high">
                  {error}
                </div>
              )}
              <ClauvaButton type="submit" loading={loading} className="w-full">
                Update Password
              </ClauvaButton>
            </form>
          )}
        </ClauvaCard>
      </motion.div>
    </div>
  )
}
