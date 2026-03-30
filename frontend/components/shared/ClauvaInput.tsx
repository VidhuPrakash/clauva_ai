import { cn } from '@/lib/utils'

interface ClauvaInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function ClauvaInput({
  label,
  error,
  className,
  ...props
}: ClauvaInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-body font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-4 py-3 rounded-lg bg-bg-elevated border border-border-clauva text-text-primary font-body text-sm',
          'placeholder:text-text-muted',
          'focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30',
          'transition-colors duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-destructive focus:border-destructive',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive font-body">{error}</p>}
    </div>
  )
}
