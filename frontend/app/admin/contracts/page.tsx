import { ClauvaCard } from '@/components/shared/ClauvaCard'
import { FileText } from 'lucide-react'

export default function AdminContractsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-text-primary">
        Contracts
      </h1>
      <ClauvaCard className="text-center py-12">
        <FileText className="w-10 h-10 mx-auto text-text-muted mb-3" />
        <p className="font-body text-text-secondary">Contract management</p>
        <p className="text-sm font-body text-text-muted mt-1">
          View all contracts across users from this admin panel.
        </p>
      </ClauvaCard>
    </div>
  )
}
