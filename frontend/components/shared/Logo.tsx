import Image from 'next/image'
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

  const imgSizes = {
    sm: 24,
    md: 32,
    lg: 48,
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src="/clauva.png"
        alt="Clauva AI"
        width={imgSizes[size]}
        height={imgSizes[size]}
        className="object-contain"
        priority
      />
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
