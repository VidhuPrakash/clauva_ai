import { cn } from '@/lib/utils'

interface ClauvaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export function ClauvaCard({
  children,
  className,
  padding = 'md',
  ...props
}: ClauvaCardProps) {
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      {...props}
      className={cn(
        'bg-bg-surface border border-border-clauva rounded-lg',
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  )
}
