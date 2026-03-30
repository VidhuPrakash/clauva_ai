'use client'

import { useEffect, useState } from 'react'
import { ClauvaCard } from '@/components/shared/ClauvaCard'
import {
  Users,
  FileText,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { getAdminStats } from '@/lib/api'
import type { AdminStats } from '@/types/api'
import { ClauvaSkeleton } from '@/components/shared/ClauvaSkeleton'

function GrowthBadge({ value, label }: { value?: number; label: string }) {
  if (value === undefined) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs font-body text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
      <TrendingUp className="w-3 h-3" />+{value} {label}
    </span>
  )
}

function StatBar({
  label,
  value,
  total,
  color,
  icon: Icon,
}: {
  label: string
  value: number
  total: number
  color: string
  icon: React.ElementType
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm font-body">
        <span className="flex items-center gap-1.5 text-text-secondary">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </span>
        <span className="text-text-primary font-medium">
          {value}
          <span className="text-text-muted font-normal ml-1">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  )
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats()
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const topCards = [
    {
      label: 'Total Users',
      value: stats?.total_users,
      icon: Users,
      badge: stats?.new_users_week,
      badgeLabel: 'this week',
    },
    {
      label: 'Total Contracts',
      value: stats?.total_contracts,
      icon: FileText,
      badge: stats?.new_contracts_week,
      badgeLabel: 'this week',
    },
    {
      label: 'Total Queries',
      value: stats?.total_queries,
      icon: MessageSquare,
      badge: stats?.queries_week,
      badgeLabel: 'this week',
    },
    {
      label: 'Risk Flags',
      value: stats?.total_risk_flags,
      icon: AlertTriangle,
      badge: undefined,
      badgeLabel: '',
    },
  ]

  const totalContracts =
    (stats?.contracts_ready ?? 0) +
    (stats?.contracts_processing ?? 0) +
    (stats?.contracts_failed ?? 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-text-primary">
        Platform Overview
      </h1>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {topCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <ClauvaCard className="h-full">
              <div className="flex items-start justify-between mb-2">
                <card.icon className="w-5 h-5 text-text-muted" />
                {!loading && card.badge !== undefined && card.badge > 0 && (
                  <GrowthBadge value={card.badge} label={card.badgeLabel} />
                )}
              </div>
              {loading ? (
                <ClauvaSkeleton className="h-9 w-16 mb-1" />
              ) : (
                <p className="text-3xl font-display font-bold text-text-primary">
                  {card.value?.toLocaleString() ?? '—'}
                </p>
              )}
              <p className="text-sm font-body text-text-muted mt-0.5">
                {card.label}
              </p>
            </ClauvaCard>
          </motion.div>
        ))}
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contract health */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="md:col-span-2"
        >
          <ClauvaCard>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-text-muted" />
              <h2 className="font-display font-semibold text-text-primary text-sm">
                Contract Health
              </h2>
              <span className="ml-auto text-xs font-body text-text-muted">
                {totalContracts} total
              </span>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <ClauvaSkeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <StatBar
                  label="Ready"
                  value={stats?.contracts_ready ?? 0}
                  total={totalContracts}
                  color="bg-emerald-500"
                  icon={CheckCircle2}
                />
                <StatBar
                  label="Processing"
                  value={stats?.contracts_processing ?? 0}
                  total={totalContracts}
                  color="bg-amber-400"
                  icon={Clock}
                />
                <StatBar
                  label="Failed"
                  value={stats?.contracts_failed ?? 0}
                  total={totalContracts}
                  color="bg-risk-high"
                  icon={XCircle}
                />
              </div>
            )}
          </ClauvaCard>
        </motion.div>

        {/* Engagement + Growth */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34 }}
          className="flex flex-col gap-4"
        >
          <ClauvaCard>
            <p className="text-xs font-body text-text-muted mb-3">Engagement</p>
            {loading ? (
              <ClauvaSkeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-display font-bold text-text-primary">
                    {stats?.avg_contracts_per_user ?? 0}
                  </p>
                  <p className="text-xs font-body text-text-muted">
                    avg contracts / user
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-text-primary">
                    {stats?.queries_week ?? 0}
                  </p>
                  <p className="text-xs font-body text-text-muted">
                    queries this week
                  </p>
                </div>
              </div>
            )}
          </ClauvaCard>

          <ClauvaCard>
            <p className="text-xs font-body text-text-muted mb-3">
              Growth This Month
            </p>
            {loading ? (
              <ClauvaSkeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body text-text-secondary flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> New users
                  </span>
                  <span className="text-sm font-display font-bold text-emerald-500">
                    +{stats?.new_users_month ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body text-text-secondary flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> New contracts
                  </span>
                  <span className="text-sm font-display font-bold text-emerald-500">
                    +{stats?.new_contracts_month ?? 0}
                  </span>
                </div>
              </div>
            )}
          </ClauvaCard>
        </motion.div>
      </div>
    </div>
  )
}
