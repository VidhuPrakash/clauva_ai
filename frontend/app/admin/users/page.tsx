'use client'

import { useEffect, useState } from 'react'
import { ClauvaCard } from '@/components/shared/ClauvaCard'

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

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
]

import { ClauvaButton } from '@/components/shared/ClauvaButton'
import { ClauvaSkeleton } from '@/components/shared/ClauvaSkeleton'
import type { AdminUser, Pagination } from '@/types/api'
import { X, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAdminUsers, updateAdminUser, deleteAdminUser } from '@/lib/api'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editFullName, setEditFullName] = useState('')
  const [editCountry, setEditCountry] = useState('')
  const [editLanguage, setEditLanguage] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchUsers = (p: number) => {
    setLoading(true)
    getAdminUsers(p)
      .then((res) => {
        setUsers(res.data.users)
        setPagination(res.data.pagination)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers(page)
  }, [page])

  const handleEdit = async () => {
    if (!editUser) return
    setEditLoading(true)
    try {
      const updated = await updateAdminUser(editUser.id, {
        role: editRole,
        full_name: editFullName || undefined,
        country: editCountry || undefined,
        language: editLanguage || undefined,
      })
      setUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? { ...u, ...updated.data } : u))
      )
      setEditUser(null)
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    setDeleteLoading(true)
    try {
      await deleteAdminUser(deleteUser.id)
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id))
      setDeleteUser(null)
      if (users.length === 1 && page > 1) setPage((p) => p - 1)
    } finally {
      setDeleteLoading(false)
    }
  }

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
                  Name
                </th>
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
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border-subtle">
                      <td className="py-3 px-4" colSpan={6}>
                        <ClauvaSkeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                : users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border-subtle hover:bg-bg-hover transition-colors"
                    >
                      <td className="py-3 px-4 text-text-primary">
                        {user.full_name || (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-primary">
                        {user.email}
                      </td>
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
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <ClauvaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            View
                          </ClauvaButton>
                          <ClauvaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditUser(user)
                              setEditRole(user.role)
                              setEditFullName(user.full_name ?? '')
                              setEditCountry(user.country ?? '')
                              setEditLanguage(user.language ?? '')
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </ClauvaButton>
                          <ClauvaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteUser(user)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-risk-high" />
                          </ClauvaButton>
                        </div>
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
            {pagination.total} users
          </span>
          <div className="flex gap-2">
            <ClauvaButton
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={!pagination.has_prev}
            >
              <ChevronLeft className="w-4 h-4" />
            </ClauvaButton>
            <ClauvaButton
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.has_next}
            >
              <ChevronRight className="w-4 h-4" />
            </ClauvaButton>
          </div>
        </div>
      )}

      <AnimatePresence>
        {/* View modal */}
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
                  {selectedUser.full_name && (
                    <div>
                      <dt className="text-text-muted">Name</dt>
                      <dd className="text-text-primary">
                        {selectedUser.full_name}
                      </dd>
                    </div>
                  )}
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
                  {selectedUser.country && (
                    <div>
                      <dt className="text-text-muted">Country</dt>
                      <dd className="text-text-primary">
                        {selectedUser.country}
                      </dd>
                    </div>
                  )}
                  {selectedUser.language && (
                    <div>
                      <dt className="text-text-muted">Language</dt>
                      <dd className="text-text-primary">
                        {LANGUAGES.find((l) => l.code === selectedUser.language)
                          ?.label ?? selectedUser.language}
                      </dd>
                    </div>
                  )}
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
                </dl>
              </ClauvaCard>
            </motion.div>
          </div>
        )}

        {/* Edit modal */}
        {editUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setEditUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-sm"
            >
              <ClauvaCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-text-primary">
                    Edit User
                  </h3>
                  <button onClick={() => setEditUser(null)}>
                    <X className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
                <p className="text-sm font-body text-text-secondary mb-4">
                  {editUser.email}
                </p>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-body text-text-muted mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      placeholder="Full name"
                      className="w-full rounded-md border border-border-clauva bg-bg-surface text-text-primary text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-body text-text-muted mb-1">
                      Country
                    </label>
                    <select
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      className="w-full rounded-md border border-border-clauva bg-bg-surface text-text-primary text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      <option value="">— Select country —</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-body text-text-muted mb-1">
                      Language
                    </label>
                    <select
                      value={editLanguage}
                      onChange={(e) => setEditLanguage(e.target.value)}
                      className="w-full rounded-md border border-border-clauva bg-bg-surface text-text-primary text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      <option value="">— Select language —</option>
                      {LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-body text-text-muted mb-1">
                      Role
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full rounded-md border border-border-clauva bg-bg-surface text-text-primary text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <ClauvaButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditUser(null)}
                  >
                    Cancel
                  </ClauvaButton>
                  <ClauvaButton
                    size="sm"
                    onClick={handleEdit}
                    disabled={editLoading}
                  >
                    {editLoading ? 'Saving…' : 'Save'}
                  </ClauvaButton>
                </div>
              </ClauvaCard>
            </motion.div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setDeleteUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-sm"
            >
              <ClauvaCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-text-primary">
                    Delete User
                  </h3>
                  <button onClick={() => setDeleteUser(null)}>
                    <X className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
                <p className="text-sm font-body text-text-secondary mb-6">
                  Are you sure you want to delete{' '}
                  <span className="text-text-primary font-medium">
                    {deleteUser.email}
                  </span>
                  ? This action cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <ClauvaButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteUser(null)}
                  >
                    Cancel
                  </ClauvaButton>
                  <ClauvaButton
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="bg-risk-high text-white hover:opacity-90"
                  >
                    {deleteLoading ? 'Deleting…' : 'Delete'}
                  </ClauvaButton>
                </div>
              </ClauvaCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
