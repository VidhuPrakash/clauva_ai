'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/shared/Logo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { useAuthStore } from '@/store/authStore'
import { BarChart3, Users, FileText, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const sidebarLinks = [
  { to: '/admin', icon: BarChart3, label: 'Overview', exact: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/contracts', icon: FileText, label: 'Contracts' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { logout } = useAuthStore()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (path: string, exact?: boolean) =>
    exact ? pathname === path : pathname.startsWith(path)

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 bg-bg-surface border-r border-border-clauva flex flex-col transition-transform md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-border-clauva">
          <Logo size="sm" />
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.to}
              href={link.to}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-body transition-colors',
                isActive(link.to, link.exact)
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              )}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border-clauva">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-body text-text-secondary hover:bg-bg-hover w-full"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 md:ml-60">
        <header className="h-14 border-b border-border-clauva bg-bg-surface/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-30">
          <button
            className="md:hidden p-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-text-primary" />
          </button>
          <span className="text-sm font-body text-text-muted hidden md:block">
            Admin Dashboard
          </span>
          <ThemeToggle />
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
