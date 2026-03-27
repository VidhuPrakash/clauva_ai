'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'
import { ClauvaInput } from '@/components/shared/ClauvaInput'
import { ClauvaButton } from '@/components/shared/ClauvaButton'
import { ClauvaCard } from '@/components/shared/ClauvaCard'
import { Eye, EyeOff, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    language: 'en',
    agreedToTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const passwordStrength = (() => {
    const p = form.password
    let s = 0
    if (p.length >= 6) s++
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
    if (/[0-9!@#$%^&*]/.test(p)) s++
    return s
  })()

  const strengthColors = [
    'bg-risk-high-solid',
    'bg-risk-medium-solid',
    'bg-risk-medium-solid',
    'bg-risk-low-solid',
  ]
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']

  const update = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!form.agreedToTerms) {
      setError('You must agree to the Terms of Service')
      return
    }

    setLoading(true)

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          timezone,
          country: form.country,
          language: form.language,
        },
      },
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    // Sign out immediately — user must verify email before accessing the app
    await supabase.auth.signOut()
    setSuccess(true)
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <ClauvaCard padding="lg">
          <div className="text-center space-y-3 py-4">
            <div className="w-12 h-12 rounded-full bg-risk-low flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-risk-low" />
            </div>
            <h2 className="text-xl font-display font-bold text-text-primary">
              Check your email
            </h2>
            <p className="text-sm font-body text-text-secondary">
              We sent a confirmation link to{' '}
              <span className="text-text-primary font-medium">
                {form.email}
              </span>
              . Click it to activate your account.
            </p>
            <Link
              href="/login"
              className="block mt-4 text-sm font-body text-accent hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </ClauvaCard>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="lg:hidden mb-6 flex justify-center">
        <Logo size="lg" />
      </div>

      <ClauvaCard padding="lg">
        <h2 className="text-2xl font-display font-bold text-text-primary">
          Create your account
        </h2>

        <form onSubmit={handleSignup} className="mt-5 space-y-3.5">
          <ClauvaInput
            label="Full Name"
            value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            required
            placeholder="John Doe"
          />
          <ClauvaInput
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
            placeholder="you@example.com"
          />

          <div className="relative">
            <ClauvaInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8.5 text-text-muted"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {form.password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-bg-elevated'}`}
                  />
                ))}
              </div>
              <p className="text-[11px] font-body text-text-muted">
                {passwordStrength > 0
                  ? strengthLabels[passwordStrength - 1]
                  : 'Too short'}
              </p>
            </div>
          )}

          <ClauvaInput
            label="Confirm Password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
            required
            placeholder="••••••••"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-body font-medium text-text-primary">
                Country
              </label>
              <select
                value={form.country}
                onChange={(e) => update('country', e.target.value)}
                required
                className="w-full rounded-md border border-border bg-bg-surface text-text-primary text-sm font-body px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="" disabled>
                  Select country
                </option>
                {[
                  'Australia',
                  'Bangladesh',
                  'Brazil',
                  'Canada',
                  'France',
                  'Germany',
                  'India',
                  'Japan',
                  'Kenya',
                  'Malaysia',
                  'Nepal',
                  'Nigeria',
                  'Pakistan',
                  'Saudi Arabia',
                  'Singapore',
                  'South Africa',
                  'Sri Lanka',
                  'United Kingdom',
                  'United States',
                  'United Arab Emirates',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-body font-medium text-text-primary">
                Language
              </label>
              <select
                value={form.language}
                onChange={(e) => update('language', e.target.value)}
                className="w-full rounded-md border border-border bg-bg-surface text-text-primary text-sm font-body px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="en">English</option>
                <option value="ar">Arabic</option>
                <option value="hi">Hindi</option>
                <option value="kn">Kannada</option>
                <option value="ml">Malayalam</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
              </select>
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <div
              className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${form.agreedToTerms ? 'bg-accent border-accent' : 'border-border'}`}
              onClick={() => update('agreedToTerms', !form.agreedToTerms)}
            >
              {form.agreedToTerms && (
                <Check className="w-3 h-3 text-primary-foreground" />
              )}
            </div>
            <span className="text-xs font-body text-text-secondary">
              I agree to the Terms of Service and Privacy Policy
            </span>
          </label>

          {error && (
            <div className="p-3 rounded-md bg-risk-high text-risk-high text-sm font-body border border-risk-high">
              {error}
            </div>
          )}

          <ClauvaButton type="submit" loading={loading} className="w-full">
            Create Account
          </ClauvaButton>
        </form>

        <p className="mt-4 text-center text-sm font-body text-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </ClauvaCard>
    </motion.div>
  )
}
