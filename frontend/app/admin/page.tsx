'use client'

import { ClauvaCard } from '@/components/shared/ClauvaCard'
import { Users, FileText, MessageSquare, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

const MOCK_STATS = {
  total_users: 120,
  total_contracts: 450,
  total_queries: 3200,
  total_risk_flags: 890,
}

export default function AdminOverviewPage() {
  const cards = [
    { label: 'Users', value: MOCK_STATS.total_users, icon: Users },
    { label: 'Contracts', value: MOCK_STATS.total_contracts, icon: FileText },
    { label: 'Queries', value: MOCK_STATS.total_queries, icon: MessageSquare },
    {
      label: 'Risk Flags',
      value: MOCK_STATS.total_risk_flags,
      icon: AlertTriangle,
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-text-primary">
        Platform Overview
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <ClauvaCard>
              <card.icon className="w-5 h-5 text-text-muted mb-2" />
              <p className="text-3xl font-display font-bold text-text-primary">
                {card.value.toLocaleString()}
              </p>
              <p className="text-sm font-body text-text-muted mt-0.5">
                {card.label}
              </p>
            </ClauvaCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
