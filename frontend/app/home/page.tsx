'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { ClauvaCard } from '@/components/shared/ClauvaCard'
import { ClauvaButton } from '@/components/shared/ClauvaButton'
import { useAuthStore } from '@/store/authStore'
import { uploadContract, getContracts } from '@/lib/api'
import type { Contract, Pagination } from '@/types/api'
import { cn } from '@/lib/utils'

type UploadState = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

export default function HomePage() {
  const { fullName } = useAuthStore()
  const router = useRouter()

  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadResult, setUploadResult] = useState<{
    contractId: string
    filename: string
    chunks: number
  } | null>(null)
  const [uploadError, setUploadError] = useState('')

  // Contracts list state
  const [contracts, setContracts] = useState<Contract[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loadingContracts, setLoadingContracts] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [listError, setListError] = useState('')

  const fetchContracts = useCallback(async (page: number) => {
    setLoadingContracts(true)
    setListError('')
    try {
      const { data } = await getContracts(page, 10)
      setContracts(data.contracts)
      setPagination(data.pagination)
      setCurrentPage(page)
    } catch {
      setListError('Failed to load contracts.')
    } finally {
      setLoadingContracts(false)
    }
  }, [])

  useEffect(() => {
    fetchContracts(1)
  }, [fetchContracts])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return
      if (file.type !== 'application/pdf') {
        setUploadError('Only PDF files are accepted')
        setUploadState('error')
        return
      }
      setUploadState('uploading')
      setUploadError('')
      try {
        const { data } = await uploadContract(file)
        setUploadState('processing')
        await new Promise((r) => setTimeout(r, 500))
        setUploadResult({
          contractId: data.contract_id,
          filename: data.filename,
          chunks: data.chunks_count,
        })
        setUploadState('success')
        fetchContracts(1)
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail ?? 'Upload failed. Please try again.'
        setUploadError(message)
        setUploadState('error')
      }
    },
    [fetchContracts]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  })

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const statusDot = (status: string) => {
    if (status === 'ready') return 'bg-risk-low-solid'
    if (status === 'processing') return 'bg-risk-medium-solid animate-pulse-dot'
    return 'bg-risk-high-solid'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary">
          {greeting}, {fullName?.split(' ')[0] || 'there'}.
        </h1>
        <p className="mt-1 text-text-secondary font-body">
          Upload a contract to get started.
        </p>
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div
          {...getRootProps()}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-12 md:p-16 text-center transition-all duration-200 cursor-pointer',
            isDragActive
              ? 'border-accent bg-accent-muted scale-[1.005]'
              : 'border-border-clauva bg-bg-surface hover:border-text-muted',
            (uploadState === 'uploading' || uploadState === 'processing') &&
              'pointer-events-none'
          )}
        >
          <input {...getInputProps()} />

          <AnimatePresence mode="wait">
            {uploadState === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Upload className="w-10 h-10 mx-auto text-text-muted mb-3" />
                <p className="text-text-primary font-body font-medium">
                  Drop your PDF contract here
                </p>
                <p className="text-sm text-text-muted font-body mt-1">
                  Supports PDF · Max 20MB
                </p>
                <div className="flex items-center gap-3 justify-center my-4">
                  <div className="h-px flex-1 max-w-20 bg-border-clauva" />
                  <span className="text-xs text-text-muted font-body">or</span>
                  <div className="h-px flex-1 max-w-20 bg-border-clauva" />
                </div>
                <ClauvaButton variant="ghost" size="sm">
                  Browse Files
                </ClauvaButton>
              </motion.div>
            )}

            {(uploadState === 'uploading' || uploadState === 'processing') && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <p className="text-sm font-body text-text-secondary">
                  {uploadState === 'uploading'
                    ? 'Uploading...'
                    : 'Extracting clauses from your contract...'}
                </p>
              </motion.div>
            )}

            {uploadState === 'success' && uploadResult && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <CheckCircle className="w-10 h-10 mx-auto text-risk-low mb-2" />
                <p className="font-body font-medium text-text-primary">
                  {uploadResult.filename}
                </p>
                <p className="text-sm text-text-secondary font-body">
                  {uploadResult.chunks} clauses extracted
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <ClauvaButton
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/home/contracts/${uploadResult.contractId}`)
                    }}
                  >
                    Open Contract →
                  </ClauvaButton>
                  <ClauvaButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setUploadState('idle')
                    }}
                  >
                    Upload Another
                  </ClauvaButton>
                </div>
              </motion.div>
            )}

            {uploadState === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AlertCircle className="w-10 h-10 mx-auto text-risk-high mb-2" />
                <p className="text-sm text-risk-high font-body">
                  {uploadError}
                </p>
                <ClauvaButton
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => setUploadState('idle')}
                >
                  Try Again
                </ClauvaButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Contract List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-text-primary">
            Your Contracts
          </h2>
          {pagination && (
            <span className="text-sm font-body text-text-muted">
              {pagination.total} contract{pagination.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loadingContracts ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
          </div>
        ) : listError ? (
          <ClauvaCard className="text-center py-8">
            <AlertCircle className="w-8 h-8 mx-auto text-risk-high mb-2" />
            <p className="text-sm font-body text-text-secondary">{listError}</p>
            <ClauvaButton
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => fetchContracts(currentPage)}
            >
              Retry
            </ClauvaButton>
          </ClauvaCard>
        ) : contracts.length === 0 ? (
          <ClauvaCard className="text-center py-12">
            <FileText className="w-10 h-10 mx-auto text-text-muted mb-3" />
            <p className="font-body font-medium text-text-primary">
              No contracts yet
            </p>
            <p className="text-sm font-body text-text-muted mt-1">
              Upload your first contract above.
            </p>
          </ClauvaCard>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              {contracts.map((contract, i) => (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ClauvaCard
                    className="hover:border-text-muted transition-colors cursor-pointer group"
                    onClick={() =>
                      router.push(`/home/contracts/${contract.id}`)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-text-muted mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-body font-medium text-text-primary truncate">
                            {contract.name}
                          </p>
                          <p className="text-xs font-body text-text-muted mt-0.5">
                            Uploaded{' '}
                            {new Date(contract.created_at).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            statusDot(contract.status)
                          )}
                        />
                        <span className="text-xs font-body text-text-muted capitalize">
                          {contract.status}
                        </span>
                      </div>
                    </div>
                  </ClauvaCard>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <ClauvaButton
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchContracts(currentPage - 1)}
                  disabled={!pagination.has_prev}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </ClauvaButton>
                <span className="text-sm font-body text-text-muted">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <ClauvaButton
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchContracts(currentPage + 1)}
                  disabled={!pagination.has_next}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </ClauvaButton>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
