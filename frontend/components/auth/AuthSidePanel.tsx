'use client'

import { Logo } from '@/components/shared/Logo'
import { motion } from 'framer-motion'

const clauseSnippets = [
  '"The Licensor retains all intellectual property rights..."',
  '"Either party may terminate this Agreement upon 30 days..."',
  '"Confidential Information shall mean any data or information..."',
  '"The Licensee shall not directly or indirectly compete..."',
  '"All disputes shall be resolved through binding arbitration..."',
  '"Force majeure events include but are not limited to..."',
  '"The indemnifying party shall hold harmless and defend..."',
  '"Governing law shall be the laws of the State of..."',
  '"Representations and warranties made herein shall survive..."',
  '"Limitation of liability shall not exceed the total fees paid..."',
]

export function AuthSidePanel() {
  const doubled = [...clauseSnippets, ...clauseSnippets]

  return (
    <div className="hidden lg:flex w-[40%] bg-bg-surface border-r border-border-clauva flex-col items-center justify-center relative overflow-hidden">
      <div className="relative z-10 text-center px-8">
        <Logo size="lg" />
        <p className="mt-3 text-sm font-body text-text-secondary max-w-xs">
          Small clauses, big consequences.
          <br />
          Examining what contracts carry.
        </p>
      </div>

      {/* Scrolling clause text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="flex flex-col gap-6 opacity-[0.06]"
          animate={{ y: [0, -400] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
          {doubled.map((snippet, i) => (
            <p
              key={i}
              className="font-mono text-xs text-text-primary whitespace-nowrap px-8"
            >
              {snippet}
            </p>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
