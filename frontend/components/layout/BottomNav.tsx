'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()
  const tabs = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/home/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border-clauva bg-bg-surface/95 backdrop-blur-md">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const active = pathname === tab.to
          return (
            <Link
              key={tab.to}
              href={tab.to}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1 px-4 transition-colors',
                active ? 'text-accent' : 'text-text-muted'
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-body font-medium">
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
