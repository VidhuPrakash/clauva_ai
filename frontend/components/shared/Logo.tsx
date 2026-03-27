import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <span className="text-primary-foreground font-display font-bold text-sm">
            C
          </span>
        </div>
      </div>
      <span
        className={cn(
          'font-display font-bold text-text-primary tracking-tight',
          sizes[size]
        )}
      >
        Clauva <span className="text-accent">AI</span>
      </span>
    </div>
  )
}
