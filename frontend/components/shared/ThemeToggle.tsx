'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-md bg-bg-elevated border border-border-clauva hover:bg-bg-hover transition-colors"
      aria-label="Toggle theme"
    >
      {/* Render nothing until client-side theme is known to avoid hydration mismatch */}
      {mounted &&
        (theme === 'dark' ? (
          <Sun className="w-4 h-4 text-text-secondary" />
        ) : (
          <Moon className="w-4 h-4 text-text-secondary" />
        ))}
      {!mounted && <Moon className="w-4 h-4 text-text-secondary invisible" />}
    </button>
  )
}
