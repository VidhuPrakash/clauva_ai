'use client'

import { useState } from 'react'
import { ClauvaCard } from '@/components/shared/ClauvaCard'
import { ClauvaButton } from '@/components/shared/ClauvaButton'
import type { AdminUser } from '@/types/api'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const MOCK_USERS: AdminUser[] = [
  {
    id: '1',
    email: 'john@example.com',
    role: 'user',
    created_at: '2025-01-01T00:00:00Z',
    contract_count: 5,
  },
  {
    id: '2',
    email: 'admin@clauva.ai',
    role: 'admin',
    created_at: '2024-12-15T00:00:00Z',
    contract_count: 12,
  },
  {
    id: '3',
    email: 'sarah@company.com',
    role: 'user',
    created_at: '2025-01-10T00:00:00Z',
    contract_count: 3,
  },
  {
    id: '4',
    email: 'mike@startup.io',
    role: 'user',
    created_at: '2025-01-20T00:00:00Z',
    contract_count: 8,
  },
]

export default function AdminUsersPage() {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-text-primary">
        Users
      </h1>

      <ClauvaCard padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border-clauva">
                <th className="text-left py-3 px-4 text-text-muted font-medium">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-text-muted font-medium">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-text-muted font-medium">
                  Contracts
                </th>
                <th className="text-left py-3 px-4 text-text-muted font-medium">
                  Joined
                </th>
                <th className="text-right py-3 px-4 text-text-muted font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border-subtle hover:bg-bg-hover transition-colors"
                >
                  <td className="py-3 px-4 text-text-primary">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-bg-elevated text-text-secondary capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-secondary">
                    {user.contract_count}
                  </td>
                  <td className="py-3 px-4 text-text-muted">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <ClauvaButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                    >
                      View
                    </ClauvaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ClauvaCard>

      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setSelectedUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md"
            >
              <ClauvaCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-text-primary">
                    User Details
                  </h3>
                  <button onClick={() => setSelectedUser(null)}>
                    <X className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
                <dl className="space-y-3 text-sm font-body">
                  <div>
                    <dt className="text-text-muted">Email</dt>
                    <dd className="text-text-primary">{selectedUser.email}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Role</dt>
                    <dd className="text-text-primary capitalize">
                      {selectedUser.role}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Contracts</dt>
                    <dd className="text-text-primary">
                      {selectedUser.contract_count}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Joined</dt>
                    <dd className="text-text-primary">
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">ID</dt>
                    <dd className="text-text-primary font-mono text-xs">
                      {selectedUser.id}
                    </dd>
                  </div>
                </dl>
              </ClauvaCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
