'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/shared/Logo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { useAuthStore } from '@/store/authStore'
import { LogOut, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function TopNav() {
  const { fullName, logout } = useAuthStore()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = [
    { to: '/home', label: 'Home' },
    { to: '/home/profile', label: 'Profile' },
  ]

  const isActive = (path: string) => pathname === path

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border-clauva bg-bg-surface/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/home">
            <Logo size="sm" />
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                href={link.to}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-body transition-colors',
                  isActive(link.to)
                    ? 'text-text-primary bg-bg-elevated'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <User className="w-4 h-4 text-accent" />
            </div>
            <span className="text-sm font-body text-text-secondary">
              {fullName || 'User'}
            </span>
          </div>
          <button
            onClick={logout}
            className="hidden md:block p-2 rounded-md hover:bg-bg-hover transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-text-muted" />
          </button>
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5 text-text-primary" />
            ) : (
              <Menu className="w-5 h-5 text-text-primary" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border-clauva bg-bg-surface px-4 py-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.to}
              href={link.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'block px-3 py-2 rounded-md text-sm font-body',
                isActive(link.to)
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-secondary'
              )}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-body text-destructive"
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  )
}
