import { create } from 'zustand'

interface ReadinessState {
  ready: boolean
  setReady: (ready: boolean) => void
}

export const useReadinessStore = create<ReadinessState>((set) => ({
  ready: false,
  setReady: (ready) => set({ ready }),
}))
