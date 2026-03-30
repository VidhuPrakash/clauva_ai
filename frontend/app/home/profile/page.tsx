'use client'

import { useState, useEffect } from 'react'
import { ClauvaCard } from '@/components/shared/ClauvaCard'
import { ClauvaInput } from '@/components/shared/ClauvaInput'
import { ClauvaButton } from '@/components/shared/ClauvaButton'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { User, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Language } from '@/store/authStore'

const COUNTRIES = [
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
]

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
]

const TIMEZONES = [
  'Africa/Nairobi',
  'America/Chicago',
  'America/Los_Angeles',
  'America/New_York',
  'America/Sao_Paulo',
  'Asia/Calcutta',
  'Asia/Dubai',
  'Asia/Jakarta',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Riyadh',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/Berlin',
  'Europe/London',
  'Europe/Moscow',
  'Europe/Paris',
  'Pacific/Auckland',
  'UTC',
]

export default function ProfilePage() {
  const { logout, setSession } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  const [localName, setLocalName] = useState('')
  const [localCountry, setLocalCountry] = useState('')
  const [localLanguage, setLocalLanguage] = useState<Language>('en')
  const [email, setEmail] = useState('')
  const [timezone, setTimezone] = useState('')

  // Fetch fresh profile data on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      if (!u) return
      const m = u.user_metadata
      setEmail(u.email ?? '')
      setLocalName(m?.full_name ?? '')
      setLocalCountry(m?.country ?? '')
      setLocalLanguage((m?.language as Language) ?? 'en')
      setTimezone(
        m?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
      )
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setError('')
    setSaving(true)

    // 1. Update Supabase Auth user_metadata
    const { error: authErr } = await supabase.auth.updateUser({
      data: {
        full_name: localName,
        country: localCountry,
        language: localLanguage,
        timezone,
      },
    })

    if (authErr) {
      setError(authErr.message)
      setSaving(false)
      return
    }

    // 2. Sync profiles table via backend (bypasses RLS)
    try {
      await api.patch('/me/profile', {
        country: localCountry,
        timezone,
        language: localLanguage,
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save profile'
      setError(msg)
      setSaving(false)
      return
    }

    // 3. Refresh session in store so TopNav/greeting updates
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session) setSession(sessionData.session)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Profile
        </h1>
      </motion.div>

      <ClauvaCard>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-bg-elevated border border-border flex items-center justify-center">
            <User className="w-8 h-8 text-text-muted" />
          </div>
          <div>
            <p className="font-body font-medium text-text-primary">
              {localName || 'User'}
            </p>
            <p className="text-sm font-body text-text-muted">{email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <ClauvaInput
            label="Full Name"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="Your name"
          />
          <ClauvaInput label="Email" value={email} disabled />

          <div className="space-y-1">
            <label className="text-sm font-body font-medium text-text-primary">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-surface text-text-primary text-sm font-body px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {!TIMEZONES.includes(timezone) && (
                <option value={timezone}>{timezone}</option>
              )}
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-body font-medium text-text-primary">
                Country
              </label>
              <select
                value={localCountry}
                onChange={(e) => setLocalCountry(e.target.value)}
                className="w-full rounded-md border border-border bg-bg-surface text-text-primary text-sm font-body px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Not set</option>
                {COUNTRIES.map((c) => (
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
                value={localLanguage}
                onChange={(e) => setLocalLanguage(e.target.value as Language)}
                className="w-full rounded-md border border-border bg-bg-surface text-text-primary text-sm font-body px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {LANGUAGES.map(({ code, label }) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-risk-high text-risk-high text-sm font-body border border-risk-high">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <ClauvaButton onClick={handleSave} loading={saving}>
              Save Changes
            </ClauvaButton>
            {saved && (
              <span className="text-sm text-risk-low font-body">✓ Saved</span>
            )}
          </div>
        </div>
      </ClauvaCard>

      <ClauvaCard>
        {!showDelete ? (
          <ClauvaButton
            variant="destructive"
            size="sm"
            onClick={() => setShowDelete(true)}
          >
            Delete Account
          </ClauvaButton>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-body text-text-secondary">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <ClauvaButton variant="destructive" size="sm" onClick={logout}>
                Confirm Delete
              </ClauvaButton>
              <ClauvaButton
                variant="ghost"
                size="sm"
                onClick={() => setShowDelete(false)}
              >
                Cancel
              </ClauvaButton>
            </div>
          </div>
        )}
      </ClauvaCard>
    </div>
  )
}
