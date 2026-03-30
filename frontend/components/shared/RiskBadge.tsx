import { type Severity } from '@/types/api'
import { cn } from '@/lib/utils'

interface RiskBadgeProps {
  severity: Severity
  className?: string
}

export function RiskBadge({ severity, className }: RiskBadgeProps) {
  const styles: Record<Severity, string> = {
    HIGH: 'bg-risk-high text-risk-high border-risk-high',
    MEDIUM: 'bg-risk-medium text-risk-medium border-risk-medium',
    LOW: 'bg-risk-low text-risk-low border-risk-low',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-medium uppercase tracking-wider border',
        styles[severity],
        className
      )}
    >
      {severity}
    </span>
  )
}
