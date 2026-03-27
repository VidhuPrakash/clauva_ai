export type Severity = 'HIGH' | 'MEDIUM' | 'LOW'
export type ContractStatus = 'processing' | 'ready' | 'failed'

export interface Contract {
  id: string
  name: string
  status: ContractStatus
  created_at: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface ContractListResponse {
  contracts: Contract[]
  pagination: Pagination
}

export interface UploadResponse {
  contract_id: string
  filename: string
  chunks_count: number
  status: string
}

export interface QuerySource {
  clause_index: number
  text: string
  score: number
}

export interface QueryResponse {
  answer: string
  sources: QuerySource[]
  contract_id: string
}

export interface QueryHistoryEntry {
  id: string
  user_id: string
  contract_id: string
  question: string
  answer: string
  sources: QuerySource[]
  created_at: string
}

export interface RiskFlag {
  clause_text: string
  risk_type: string
  severity: Severity
  explanation: string
  detection_method: string
  matched_clause: string
  similarity_score: number
}

export interface RiskSummary {
  total_flags: number
  high: number
  medium: number
  low: number
}

export interface RiskScanResponse {
  contract_id: string
  cached: boolean
  lang: string
  summary: RiskSummary
  flags: RiskFlag[]
}

export interface AdminStats {
  total_users: number
  total_contracts: number
  total_queries: number
  total_risk_flags: number
}

export interface AdminUser {
  id: string
  email: string
  role: string
  created_at: string
  contract_count: number
}
