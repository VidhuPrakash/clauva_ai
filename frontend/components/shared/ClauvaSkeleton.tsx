import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function ClauvaSkeletonBlock({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-md bg-bg-elevated', className)} />
  )
}

export const ClauvaSkeleton = ClauvaSkeletonBlock
