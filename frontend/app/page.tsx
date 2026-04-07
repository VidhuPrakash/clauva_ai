'use client'

import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'
import { ClauvaButton } from '@/components/shared/ClauvaButton'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { motion } from 'framer-motion'
import { Shield, MessageSquare, FileText, ArrowRight, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Nav */}
      <nav className="border-b border-border-clauva bg-bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <ClauvaButton variant="ghost" size="sm">
                Sign In
              </ClauvaButton>
            </Link>
            <Link href="/signup">
              <ClauvaButton size="sm">Get Started</ClauvaButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-clauva bg-bg-surface text-xs font-body text-text-secondary mb-6">
            <Zap className="w-3 h-3 text-accent" />
            AI-Powered Contract Intelligence
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-extrabold text-text-primary leading-tight tracking-tight">
            Small clauses,
            <br />
            <span className="text-accent">big consequences.</span>
          </h1>
          <p className="mt-4 text-lg font-body text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Upload any contract. Ask questions in plain language. Get instant
            AI-powered risk analysis with clause-level precision.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <ClauvaButton size="lg">
                Start Analyzing <ArrowRight className="w-4 h-4 ml-1" />
              </ClauvaButton>
            </Link>
            <Link href="/login">
              <ClauvaButton variant="ghost" size="lg">
                Sign In
              </ClauvaButton>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: FileText,
              title: 'Smart Upload',
              desc: 'Upload PDF contracts and extract clauses automatically with AI-powered document parsing.',
            },
            {
              icon: MessageSquare,
              title: 'Ask Anything',
              desc: 'Chat with your contract. Get precise answers backed by specific clause references and confidence scores.',
            },
            {
              icon: Shield,
              title: 'Risk Scan',
              desc: 'Detect risky clauses across CUAD categories. Severity-ranked flags with AI explanations.',
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <div className="p-6 rounded-lg bg-bg-surface border border-border-clauva hover:border-text-muted transition-colors">
                <feature.icon className="w-8 h-8 text-accent mb-3" />
                <h3 className="text-lg font-display font-semibold text-text-primary">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm font-body text-text-secondary leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-clauva py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <Logo size="sm" />
          <p className="text-xs font-body text-text-muted">
            © {new Date().getFullYear()} Clauva AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
