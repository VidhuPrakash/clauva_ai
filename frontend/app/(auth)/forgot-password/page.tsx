'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'
import { ClauvaInput } from '@/components/shared/ClauvaInput'
import { ClauvaButton } from '@/components/shared/ClauvaButton'
import { ClauvaCard } from '@/components/shared/ClauvaCard'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    )

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
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
          Reset your password
        </h2>
        <p className="mt-1 text-sm font-body text-text-secondary">
          Enter your email and we&apos;ll send a reset link
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <div className="p-4 rounded-lg bg-risk-low text-risk-low border border-risk-low text-sm font-body">
              Check <span className="font-medium">{email}</span> for a password
              reset link.
            </div>
            <p className="text-center text-sm font-body text-text-secondary">
              <Link href="/login" className="text-accent hover:underline">
                Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <ClauvaInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            {error && (
              <div className="p-3 rounded-md bg-risk-high text-risk-high text-sm font-body border border-risk-high">
                {error}
              </div>
            )}
            <ClauvaButton type="submit" loading={loading} className="w-full">
              Send Reset Link
            </ClauvaButton>
          </form>
        )}

        {!sent && (
          <p className="mt-4 text-center text-sm font-body text-text-secondary">
            <Link href="/login" className="text-accent hover:underline">
              Back to sign in
            </Link>
          </p>
        )}
      </ClauvaCard>
    </motion.div>
  )
}
