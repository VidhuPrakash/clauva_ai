'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  MessageSquare,
  Shield,
  Send,
  AlertCircle,
} from 'lucide-react'
import { ClauvaCard } from '@/components/shared/ClauvaCard'
import { ClauvaButton } from '@/components/shared/ClauvaButton'
import { RiskBadge } from '@/components/shared/RiskBadge'
import { useContractStore } from '@/store/contractStore'
import { getQAHistory, askQuestion, runRiskScan } from '@/lib/api'

import type { RiskScanResponse, RiskFlag, Severity } from '@/types/api'
import { cn } from '@/lib/utils'

const QUICK_QUESTIONS = [
  'What are the main risks?',
  'Explain the termination clause',
  'What are my payment obligations?',
  'Is there a non-compete?',
]

const tabs = [
  { id: 'qa' as const, label: 'Q&A', icon: MessageSquare },
  { id: 'risk' as const, label: 'Risk Scan', icon: Shield },
]

export default function ContractWorkspacePage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()
  const {
    activeContract,
    qaHistory,
    riskScan,
    activeTab,
    setActiveTab,
    setQAHistory,
    addQAEntry,
    setRiskScan,
  } = useContractStore()

  const [question, setQuestion] = useState('')
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const qaBottomRef = useRef<HTMLDivElement>(null)

  // Load Q&A history and existing risk flags on mount
  useEffect(() => {
    if (!id) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      // Clear stale data from the previous contract immediately
      setQAHistory([])
      setRiskScan(null)
      try {
        const [historyRes, scanRes] = await Promise.all([
          getQAHistory(id),
          runRiskScan(id),
        ])
        if (cancelled) return
        // backend returns desc order; reverse for chronological chat display
        setQAHistory([...historyRes.data].reverse())
        if (scanRes.data.summary.total_flags > 0) {
          setRiskScan(scanRes.data)
        }
      } catch {
        if (!cancelled) setError('Failed to load contract. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, setQAHistory, setRiskScan])

  // Auto-scroll Q&A to the latest message
  useEffect(() => {
    qaBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [qaHistory, pendingQuestion])

  const handleAsk = async (q?: string) => {
    const text = (q || question).trim()
    if (!text || !id || pendingQuestion !== null) return
    setQuestion('')
    setPendingQuestion(text)
    try {
      const res = await askQuestion(id, text)
      addQAEntry({
        id: Date.now().toString(),
        user_id: '',
        contract_id: id,
        question: text,
        answer: res.data.answer,
        sources: res.data.sources,
        created_at: new Date().toISOString(),
      })
    } catch {
      addQAEntry({
        id: Date.now().toString(),
        user_id: '',
        contract_id: id,
        question: text,
        answer:
          'Sorry, there was an error processing your question. Please try again.',
        sources: [],
        created_at: new Date().toISOString(),
      })
    } finally {
      setPendingQuestion(null)
    }
  }

  const handleScan = async () => {
    if (!id) return
    setScanning(true)
    setRiskScan(null)
    try {
      const res = await runRiskScan(id)
      setRiskScan(res.data)
    } catch {
      // restore empty state so user can retry
      setRiskScan(null)
    } finally {
      setScanning(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="h-8 w-48 rounded-md bg-bg-elevated animate-pulse" />
        <div className="h-10 rounded-lg bg-bg-elevated animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-bg-elevated animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <ClauvaCard className="text-center py-12">
          <AlertCircle className="w-10 h-10 mx-auto text-risk-high-solid mb-3" />
          <p className="font-body font-medium text-text-primary">{error}</p>
          <ClauvaButton className="mt-4" onClick={() => router.push('/home')}>
            Back to Home
          </ClauvaButton>
        </ClauvaCard>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/home')}
          className="p-2 rounded-md hover:bg-bg-hover transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <h1 className="text-lg font-display font-semibold text-text-primary truncate">
          {activeContract?.name ?? `Contract ${id?.slice(0, 8)}…`}
        </h1>
      </div>

      <div className="flex gap-1 bg-bg-elevated rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-body font-medium transition-all',
              activeTab === tab.id
                ? 'bg-bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'qa' && (
          <motion.div
            key="qa"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {qaHistory.length === 0 && pendingQuestion === null ? (
              <ClauvaCard className="text-center py-12">
                <MessageSquare className="w-10 h-10 mx-auto text-text-muted mb-3" />
                <p className="font-body font-medium text-text-primary">
                  Ask anything about this contract
                </p>
                <p className="text-xs font-body text-text-muted mt-1">
                  Please ask clause-related questions
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleAsk(q)}
                      className="px-3 py-1.5 rounded-full border border-border-clauva text-xs font-body text-text-secondary hover:bg-bg-hover transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </ClauvaCard>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {qaHistory.map((entry, i) => (
                  <div key={entry.id || i} className="space-y-2">
                    <div className="flex justify-end">
                      <div className="max-w-[80%] px-4 py-3 rounded-tl-lg rounded-bl-lg rounded-br-lg bg-accent-muted border border-accent/30 text-sm font-body text-text-primary">
                        {entry.question}
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-[85%] space-y-2">
                        <div className="px-4 py-3 rounded-tr-lg rounded-bl-lg rounded-br-lg bg-bg-surface border border-border-clauva text-sm font-body text-text-primary">
                          <p>{entry.answer}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingQuestion !== null && (
                  <div className="space-y-2">
                    <div className="flex justify-end">
                      <div className="max-w-[80%] px-4 py-3 rounded-tl-lg rounded-bl-lg rounded-br-lg bg-accent-muted border border-accent/30 text-sm font-body text-text-primary">
                        {pendingQuestion}
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="px-4 py-3 rounded-tr-lg rounded-bl-lg rounded-br-lg bg-bg-surface border border-border-clauva">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-2 h-2 rounded-full bg-accent animate-pulse-dot"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={qaBottomRef} />
              </div>
            )}

            <p className="text-xs font-body text-text-muted text-center -mt-1">
              Please ask clause-related questions
            </p>
            <div className="flex gap-2 items-end">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && !e.shiftKey && handleAsk()
                }
                placeholder="Ask a question about this contract..."
                className="flex-1 px-4 py-3 rounded-lg bg-bg-elevated border border-border-clauva text-text-primary font-body text-sm placeholder:text-text-muted focus:outline-none focus:border-border-focus"
                disabled={pendingQuestion !== null}
              />
              <ClauvaButton
                onClick={() => handleAsk()}
                disabled={!question.trim() || pendingQuestion !== null}
                size="md"
              >
                <Send className="w-4 h-4" />
              </ClauvaButton>
            </div>
          </motion.div>
        )}

        {activeTab === 'risk' && (
          <motion.div
            key="risk"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {scanning ? (
              <ClauvaCard className="py-16">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <Shield className="w-12 h-12 text-accent" />
                    <span className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-30" />
                  </div>
                  <div className="text-center">
                    <p className="font-display font-semibold text-text-primary text-lg">
                      Analysing contract…
                    </p>
                    <p className="text-sm font-body text-text-muted mt-1">
                      AI is scanning every clause for risk patterns
                    </p>
                  </div>
                  <div className="w-full max-w-xs space-y-2">
                    {[
                      'Extracting clauses',
                      'Matching risk patterns',
                      'Running AI verification',
                      'Generating report',
                    ].map((step, i) => (
                      <div
                        key={step}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg bg-bg-elevated border border-border-clauva"
                        style={{ animationDelay: `${i * 0.4}s` }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
                          style={{ animationDelay: `${i * 0.4}s` }}
                        />
                        <span className="text-sm font-body text-text-secondary">
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-body text-text-muted">
                    This usually takes 30–60 seconds
                  </p>
                </div>
              </ClauvaCard>
            ) : !riskScan ? (
              <ClauvaCard className="text-center py-12">
                <Shield className="w-10 h-10 mx-auto text-text-muted mb-3" />
                <p className="font-body font-medium text-text-primary">
                  No risk scan yet
                </p>
                <p className="text-sm font-body text-text-muted mt-1 max-w-sm mx-auto">
                  Run a full AI risk scan to detect potentially risky clauses in
                  this contract.
                </p>
                <div className="mt-4">
                  <ClauvaButton onClick={handleScan}>
                    Run Risk Scan
                  </ClauvaButton>
                </div>
              </ClauvaCard>
            ) : (
              <RiskReportView scan={riskScan} onRescan={handleScan} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RiskReportView({
  scan,
  onRescan,
}: {
  scan: RiskScanResponse
  onRescan: () => void
}) {
  const grouped: Record<Severity, RiskFlag[]> = {
    HIGH: [],
    MEDIUM: [],
    LOW: [],
  }
  scan.flags.forEach((f) => grouped[f.severity].push(f))
  const total = scan.summary.total_flags || 1

  return (
    <motion.div
      className="space-y-4"
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-semibold text-text-primary">
            Risk Analysis Report
          </h2>
          <p className="text-sm font-body text-text-muted">
            {scan.lang?.toUpperCase() || 'EN'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ClauvaButton variant="ghost" size="sm" onClick={onRescan}>
            Re-scan
          </ClauvaButton>
        </div>
      </div>

      {scan.overall_review && (
        <motion.div
          variants={{
            initial: { opacity: 0, y: 16 },
            animate: { opacity: 1, y: 0 },
          }}
        >
          <ClauvaCard>
            <h3 className="font-body font-medium text-text-secondary mb-2">
              Overall Assessment
            </h3>
            <p className="text-sm font-body text-text-primary leading-relaxed">
              {scan.overall_review}
            </p>
          </ClauvaCard>
        </motion.div>
      )}

      <motion.div
        variants={{
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
        }}
      >
        <ClauvaCard>
          <h3 className="font-body font-medium text-text-secondary mb-4">
            Overall Risk Summary
          </h3>
          <p className="text-3xl font-display font-bold text-text-primary mb-4">
            {scan.summary.total_flags}{' '}
            <span className="text-lg font-normal text-text-muted">
              flags found
            </span>
          </p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-risk-high border border-risk-high">
              <p className="text-2xl font-display font-bold text-risk-high">
                {scan.summary.high}
              </p>
              <p className="text-xs font-body text-risk-high uppercase tracking-wider">
                High
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-risk-medium border border-risk-medium">
              <p className="text-2xl font-display font-bold text-risk-medium">
                {scan.summary.medium}
              </p>
              <p className="text-xs font-body text-risk-medium uppercase tracking-wider">
                Medium
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-risk-low border border-risk-low">
              <p className="text-2xl font-display font-bold text-risk-low">
                {scan.summary.low}
              </p>
              <p className="text-xs font-body text-risk-low uppercase tracking-wider">
                Low
              </p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-bg-elevated overflow-hidden flex">
            <div
              className="bg-risk-high-solid animate-bar-fill"
              style={
                {
                  '--fill-width': `${(scan.summary.high / total) * 100}%`,
                } as React.CSSProperties
              }
            />
            <div
              className="bg-risk-medium-solid animate-bar-fill"
              style={
                {
                  '--fill-width': `${(scan.summary.medium / total) * 100}%`,
                  animationDelay: '0.2s',
                } as React.CSSProperties
              }
            />
            <div
              className="bg-risk-low-solid animate-bar-fill"
              style={
                {
                  '--fill-width': `${(scan.summary.low / total) * 100}%`,
                  animationDelay: '0.4s',
                } as React.CSSProperties
              }
            />
          </div>
        </ClauvaCard>
      </motion.div>

      {(['HIGH', 'MEDIUM', 'LOW'] as Severity[]).map((severity) => {
        const severityFlags = grouped[severity]
        if (severityFlags.length === 0) return null
        return (
          <div key={severity} className="space-y-2">
            <h3 className="text-sm font-display font-semibold text-text-muted uppercase tracking-wider">
              {severity} RISK ({severityFlags.length}{' '}
              {severityFlags.length === 1 ? 'flag' : 'flags'})
            </h3>
            {severityFlags.map((flag, i) => (
              <motion.div
                key={i}
                variants={{
                  initial: { opacity: 0, y: 16 },
                  animate: {
                    opacity: 1,
                    y: 0,
                    transition: { ease: [0.16, 1, 0.3, 1], duration: 0.35 },
                  },
                }}
              >
                <ClauvaCard
                  className={cn(
                    'border-l-[3px]',
                    severity === 'HIGH' &&
                      'border-l-risk-high bg-risk-high border-risk-high',
                    severity === 'MEDIUM' &&
                      'border-l-risk-medium bg-risk-medium border-risk-medium',
                    severity === 'LOW' &&
                      'border-l-risk-low bg-risk-low border-risk-low'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <RiskBadge severity={severity} />
                    <span className="text-sm font-body font-medium text-text-primary">
                      {flag.risk_type}
                    </span>
                  </div>
                  <div className="p-3 rounded-md bg-bg-elevated border-l-2 border-border-clauva mb-3">
                    <p className="text-xs font-mono text-text-secondary leading-relaxed">
                      &quot;{flag.clause_text}&quot;
                    </p>
                  </div>
                  <p className="text-sm font-body text-text-secondary mb-3">
                    {flag.explanation}
                  </p>
                </ClauvaCard>
              </motion.div>
            ))}
          </div>
        )
      })}
    </motion.div>
  )
}
