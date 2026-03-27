'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, FileText, MessageSquare, Shield, Send } from 'lucide-react'
import { ClauvaCard } from '@/components/shared/ClauvaCard'
import { ClauvaButton } from '@/components/shared/ClauvaButton'
import { RiskBadge } from '@/components/shared/RiskBadge'
import { useContractStore } from '@/store/contractStore'

type Language = 'en' | 'ml' | 'ta' | 'ar' | 'hi' | 'kn' | 'te'
import type {
  QueryHistoryEntry,
  RiskScanResponse,
  RiskFlag,
  Severity,
} from '@/types/api'
import { cn } from '@/lib/utils'

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'ta', label: 'Tamil' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'kn', label: 'Kannada' },
  { value: 'te', label: 'Telugu' },
]

const QUICK_QUESTIONS = [
  'What are the main risks?',
  'Explain the termination clause',
  'What are my payment obligations?',
  'Is there a non-compete?',
]

const MOCK_QA: QueryHistoryEntry[] = [
  {
    id: '1',
    user_id: '',
    contract_id: '1',
    question: 'What is the notice period?',
    answer:
      'According to Clause 7, the termination notice period is 30 days written notice by either party.',
    sources: [
      {
        clause_index: 7,
        text: 'Either party may terminate this Agreement upon 30 days written notice to the other party...',
        score: 0.92,
      },
    ],
    created_at: new Date().toISOString(),
  },
]

const MOCK_RISK: RiskScanResponse = {
  contract_id: '1',
  cached: false,
  lang: 'en',
  summary: { total_flags: 5, high: 2, medium: 2, low: 1 },
  flags: [
    {
      clause_text:
        'The Licensor shall retain all intellectual property rights including inventions, patents, trademarks...',
      risk_type: 'IP Ownership Assignment',
      severity: 'HIGH',
      explanation:
        'Clauses that assign IP ownership to one party can be highly restrictive.',
      detection_method: 'cuad_semantic',
      matched_clause: 'Licensor retains all IP rights',
      similarity_score: 0.93,
    },
    {
      clause_text:
        'The Company may terminate this agreement at any time without cause or prior notice...',
      risk_type: 'Termination For Convenience',
      severity: 'HIGH',
      explanation:
        'One-sided termination without cause creates significant risk.',
      detection_method: 'cuad_semantic',
      matched_clause: 'terminate without cause',
      similarity_score: 0.89,
    },
    {
      clause_text:
        'The Employee shall not engage in any competing business for a period of 24 months...',
      risk_type: 'Non-Compete',
      severity: 'MEDIUM',
      explanation:
        '24-month non-compete is considered lengthy and may be unenforceable.',
      detection_method: 'cuad_semantic',
      matched_clause: 'non-compete 24 months',
      similarity_score: 0.85,
    },
    {
      clause_text:
        'All disputes shall be resolved through arbitration in a jurisdiction chosen by the Company...',
      risk_type: 'Arbitration',
      severity: 'MEDIUM',
      explanation:
        'One-sided jurisdiction selection in arbitration may disadvantage the other party.',
      detection_method: 'cuad_semantic',
      matched_clause: 'arbitration jurisdiction',
      similarity_score: 0.82,
    },
    {
      clause_text:
        'The agreement shall automatically renew for successive one-year terms unless terminated...',
      risk_type: 'Auto-Renewal',
      severity: 'LOW',
      explanation: 'Auto-renewal is common but should be noted for awareness.',
      detection_method: 'cuad_semantic',
      matched_clause: 'auto renew',
      similarity_score: 0.78,
    },
  ],
}

const tabs = [
  { id: 'clauses' as const, label: 'Clauses', icon: FileText },
  { id: 'qa' as const, label: 'Q&A', icon: MessageSquare },
  { id: 'risk' as const, label: 'Risk Scan', icon: Shield },
]

export default function ContractWorkspacePage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()
  const { activeTab, setActiveTab } = useContractStore()

  const [qaHistory, setQaHistory] = useState<QueryHistoryEntry[]>(MOCK_QA)
  const [question, setQuestion] = useState('')
  const [askingQuestion, setAskingQuestion] = useState(false)
  const [scanLang, setScanLang] = useState<Language>('en')
  const [riskScan, setRiskScan] = useState<RiskScanResponse | null>(null)

  const handleAsk = (q?: string) => {
    const text = q || question
    if (!text.trim() || !id) return
    setAskingQuestion(true)
    setTimeout(() => {
      const entry: QueryHistoryEntry = {
        id: Date.now().toString(),
        user_id: '',
        contract_id: id,
        question: text,
        answer:
          'Based on the contract clauses, the relevant information indicates that this matter is addressed in sections 3-5 of the agreement.',
        sources: [
          {
            clause_index: 3,
            text: 'The parties agree to the terms outlined herein...',
            score: 0.87,
          },
        ],
        created_at: new Date().toISOString(),
      }
      setQaHistory((prev) => [...prev, entry])
      setQuestion('')
      setAskingQuestion(false)
    }, 1500)
  }

  const handleScan = () => {
    setRiskScan(null)
    setTimeout(() => setRiskScan({ ...MOCK_RISK, lang: scanLang }), 2000)
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
          Contract {id?.slice(0, 8)}...
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
        {activeTab === 'clauses' && (
          <motion.div
            key="clauses"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ClausesView flags={riskScan?.flags || []} />
          </motion.div>
        )}

        {activeTab === 'qa' && (
          <motion.div
            key="qa"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {qaHistory.length === 0 ? (
              <ClauvaCard className="text-center py-12">
                <MessageSquare className="w-10 h-10 mx-auto text-text-muted mb-3" />
                <p className="font-body font-medium text-text-primary">
                  Ask anything about this contract
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
                          {entry.sources && entry.sources.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs text-text-muted font-medium">
                                Sources used:
                              </p>
                              {entry.sources.map((src, j) => (
                                <div
                                  key={j}
                                  className="p-2.5 rounded-md bg-bg-elevated border-l-2 border-accent"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-mono text-text-muted">
                                      Clause {src.clause_index}
                                    </span>
                                    <span className="text-xs font-mono text-text-muted">
                                      score {src.score.toFixed(2)}
                                    </span>
                                  </div>
                                  <p className="text-xs font-mono text-text-secondary leading-relaxed">
                                    &quot;{src.text}&quot;
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {askingQuestion && (
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
                )}
              </div>
            )}

            <div className="flex gap-2 items-end">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && !e.shiftKey && handleAsk()
                }
                placeholder="Ask a question about this contract..."
                className="flex-1 px-4 py-3 rounded-lg bg-bg-elevated border border-border-clauva text-text-primary font-body text-sm placeholder:text-text-muted focus:outline-none focus:border-border-focus"
                disabled={askingQuestion}
              />
              <ClauvaButton
                onClick={() => handleAsk()}
                disabled={!question.trim() || askingQuestion}
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
            {!riskScan ? (
              <ClauvaCard className="text-center py-12">
                <Shield className="w-10 h-10 mx-auto text-text-muted mb-3" />
                <p className="font-body font-medium text-text-primary">
                  No risk scan yet
                </p>
                <p className="text-sm font-body text-text-muted mt-1 max-w-sm mx-auto">
                  Run a full AI risk scan to detect potentially risky clauses in
                  this contract.
                </p>
                <div className="mt-4 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-body text-text-secondary">
                      Language:
                    </label>
                    <select
                      value={scanLang}
                      onChange={(e) => setScanLang(e.target.value as Language)}
                      className="px-3 py-1.5 rounded-md bg-bg-elevated border border-border-clauva text-text-primary font-body text-sm"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ClauvaButton onClick={handleScan}>
                    Run Risk Scan
                  </ClauvaButton>
                </div>
              </ClauvaCard>
            ) : (
              <RiskReportView
                scan={riskScan}
                onRescan={handleScan}
                scanLang={scanLang}
                setScanLang={setScanLang}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ClausesView({ flags }: { flags: RiskFlag[] }) {
  const mockClauses = [
    'This Employment Agreement is entered into as of January 1, 2025, between the Company and the Employee.',
    'The Employee shall serve in the capacity of Senior Software Engineer and shall perform duties as assigned.',
    'The Company agrees to pay the Employee an annual salary of $120,000, payable in bi-weekly installments.',
    'The Employee shall be entitled to 20 days of paid vacation per calendar year.',
    'Either party may terminate this Agreement upon 30 days written notice to the other party.',
    'The Employee agrees to maintain confidentiality of all proprietary information during and after employment.',
    'The Licensor shall retain all intellectual property rights including inventions, patents, trademarks created during employment.',
  ]

  const borderColors: Record<Severity, string> = {
    HIGH: 'border-l-[3px] border-l-risk-high bg-risk-high',
    MEDIUM: 'border-l-[3px] border-l-risk-medium bg-risk-medium',
    LOW: 'border-l-[3px] border-l-risk-low bg-risk-low',
  }

  const getFlagForClause = (text: string) =>
    flags.find(
      (f) =>
        text.includes(f.clause_text.slice(0, 40)) ||
        f.clause_text.includes(text.slice(0, 40))
    )

  return (
    <div className="space-y-2">
      {mockClauses.map((text, i) => {
        const flag = getFlagForClause(text)
        return (
          <div
            key={i}
            className={cn(
              'p-4 rounded-lg border border-border-clauva font-mono text-sm text-text-secondary leading-relaxed',
              flag ? borderColors[flag.severity] : 'bg-bg-surface'
            )}
            title={flag ? `⚠ ${flag.severity} · ${flag.risk_type}` : undefined}
          >
            {text}
          </div>
        )
      })}
    </div>
  )
}

function RiskReportView({
  scan,
  onRescan,
  scanLang,
  setScanLang,
}: {
  scan: RiskScanResponse
  onRescan: () => void
  scanLang: Language
  setScanLang: (l: Language) => void
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
          {scan.cached && (
            <span className="px-2 py-0.5 rounded text-xs font-mono text-risk-medium bg-risk-medium border border-risk-medium">
              ⚡ Cached
            </span>
          )}
          <select
            value={scanLang}
            onChange={(e) => setScanLang(e.target.value as Language)}
            className="px-2 py-1 rounded bg-bg-elevated border border-border-clauva text-sm font-body text-text-primary"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <ClauvaButton variant="ghost" size="sm" onClick={onRescan}>
            Re-scan
          </ClauvaButton>
        </div>
      </div>

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
                  <div className="flex items-center justify-between text-xs text-text-muted font-body">
                    <span>Matched: &quot;{flag.matched_clause}&quot;</span>
                    <div className="flex items-center gap-2">
                      <span>Confidence:</span>
                      <div className="w-20 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            severity === 'HIGH' && 'bg-risk-high-solid',
                            severity === 'MEDIUM' && 'bg-risk-medium-solid',
                            severity === 'LOW' && 'bg-risk-low-solid'
                          )}
                          style={{ width: `${flag.similarity_score * 100}%` }}
                        />
                      </div>
                      <span>{flag.similarity_score.toFixed(2)}</span>
                    </div>
                  </div>
                </ClauvaCard>
              </motion.div>
            ))}
          </div>
        )
      })}
    </motion.div>
  )
}
