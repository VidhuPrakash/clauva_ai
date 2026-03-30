import { Loader2 } from 'lucide-react'

export function ReadinessBar() {
  return (
    <div className="w-full px-4 py-2.5 bg-bg-elevated border-b border-border-clauva flex items-center justify-center gap-2">
      <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
      <span className="text-xs font-body text-text-secondary">
        Clauva AI is warming up — uploads will be available shortly
      </span>
    </div>
  )
}
