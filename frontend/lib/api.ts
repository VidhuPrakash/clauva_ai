import axios from 'axios'
import { supabase } from './supabase'
import type {
  UploadResponse,
  ContractListResponse,
  QueryResponse,
  QueryHistoryEntry,
  RiskScanResponse,
  RiskFlag,
  AdminStats,
  AdminUser,
  Pagination,
} from '@/types/api'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
})

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Readiness
export const checkReady = () => api.get<{ ready: boolean }>('/ready')

// Contracts
export const uploadContract = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post<UploadResponse>('/upload', form)
}
export const getContracts = (page = 1, limit = 10) =>
  api.get<ContractListResponse>(`/upload?page=${page}&limit=${limit}`)

// QA
export const askQuestion = (contract_id: string, question: string) =>
  api.post<QueryResponse>('/query', { contract_id, question })
export const getQAHistory = (contract_id: string) =>
  api.get<QueryHistoryEntry[]>(`/query/history/${contract_id}`)

// Risk Scan
export const runRiskScan = (contract_id: string, lang = 'en') =>
  api.get<RiskScanResponse>(`/risk-scan/${contract_id}?lang=${lang}`)
export const getRiskFlags = (contract_id: string) =>
  api.get<RiskFlag[]>(`/risk-scan/flags/${contract_id}`)

// Admin
export const getAdminStats = () => api.get<AdminStats>('/admin/stats')
export const getAdminUsers = (page = 1, limit = 10) =>
  api.get<{ users: AdminUser[]; pagination: Pagination }>(
    `/admin/users?page=${page}&limit=${limit}`
  )
export const getAdminUserDetail = (user_id: string) =>
  api.get<AdminUser>(`/admin/users/${user_id}`)
