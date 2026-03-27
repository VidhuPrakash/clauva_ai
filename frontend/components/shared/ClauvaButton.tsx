import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ClauvaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function ClauvaButton({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className,
  disabled,
  ...props
}: ClauvaButtonProps) {
  const variants = {
    primary:
      'bg-accent text-primary-foreground hover:bg-accent-hover active:scale-[0.98] hover:-translate-y-[1px]',
    ghost:
      'bg-transparent border border-border-clauva text-text-primary hover:bg-bg-hover',
    destructive:
      'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded',
    md: 'px-5 py-2.5 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-md',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
