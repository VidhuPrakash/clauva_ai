'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-md bg-bg-elevated border border-border-clauva hover:bg-bg-hover transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-text-secondary" />
      ) : (
        <Moon className="w-4 h-4 text-text-secondary" />
      )}
    </button>
  )
}
