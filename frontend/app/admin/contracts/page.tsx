'use client'

import { useEffect, useState } from 'react'
import { ClauvaCard } from '@/components/shared/ClauvaCard'
import { ClauvaButton } from '@/components/shared/ClauvaButton'
import { ClauvaSkeleton } from '@/components/shared/ClauvaSkeleton'
import type { AdminContract, Pagination } from '@/types/api'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getAdminContracts } from '@/lib/api'

const STATUS_STYLES: Record<string, string> = {
  ready: 'bg-risk-low text-risk-low',
  processing: 'bg-risk-medium text-risk-medium',
  failed: 'bg-risk-high text-risk-high',
}

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<AdminContract[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminContracts(page)
      .then((res) => {
        setContracts(res.data.contracts)
        setPagination(res.data.pagination)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-text-primary">
        Contracts
      </h1>

      <ClauvaCard padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border-clauva">
                <th className="text-left py-3 px-4 text-text-muted font-medium">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-text-muted font-medium">
                  User
                </th>
                <th className="text-left py-3 px-4 text-text-muted font-medium">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-text-muted font-medium">
                  Uploaded
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border-subtle">
                      <td className="py-3 px-4" colSpan={4}>
                        <ClauvaSkeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                : contracts.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border-subtle hover:bg-bg-hover transition-colors"
                    >
                      <td className="py-3 px-4 text-text-primary max-w-xs truncate">
                        {c.name}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {c.user_email}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLES[c.status] ?? 'bg-bg-elevated text-text-secondary'}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-muted">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </ClauvaCard>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm font-body text-text-muted">
          <span>
            Page {pagination.page} of {pagination.total_pages} &middot;{' '}
            {pagination.total} contracts
          </span>
          <div className="flex gap-2">
            <ClauvaButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setLoading(true)
                setPage((p) => p - 1)
              }}
              disabled={!pagination.has_prev}
            >
              <ChevronLeft className="w-4 h-4" />
            </ClauvaButton>
            <ClauvaButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setLoading(true)
                setPage((p) => p + 1)
              }}
              disabled={!pagination.has_next}
            >
              <ChevronRight className="w-4 h-4" />
            </ClauvaButton>
          </div>
        </div>
      )}
    </div>
  )
}
