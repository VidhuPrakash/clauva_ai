import { create } from 'zustand'
import type { Contract, QueryHistoryEntry, RiskScanResponse } from '@/types/api'

interface ContractState {
  activeContract: Contract | null
  qaHistory: QueryHistoryEntry[]
  riskScan: RiskScanResponse | null
  activeTab: 'clauses' | 'qa' | 'risk'
  setActiveContract: (contract: Contract | null) => void
  setQAHistory: (history: QueryHistoryEntry[]) => void
  addQAEntry: (entry: QueryHistoryEntry) => void
  setRiskScan: (scan: RiskScanResponse | null) => void
  setActiveTab: (tab: 'clauses' | 'qa' | 'risk') => void
}

export const useContractStore = create<ContractState>((set) => ({
  activeContract: null,
  qaHistory: [],
  riskScan: null,
  activeTab: 'clauses',
  setActiveContract: (activeContract) => set({ activeContract }),
  setQAHistory: (qaHistory) => set({ qaHistory }),
  addQAEntry: (entry) =>
    set((state) => ({ qaHistory: [...state.qaHistory, entry] })),
  setRiskScan: (riskScan) => set({ riskScan }),
  setActiveTab: (activeTab) => set({ activeTab }),
}))
