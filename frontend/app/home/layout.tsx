import { TopNav } from '@/components/layout/TopNav'
import { BottomNav } from '@/components/layout/BottomNav'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-base">
      <TopNav />
      <main className="pb-20 md:pb-8">{children}</main>
      <BottomNav />
    </div>
  )
}
