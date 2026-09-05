'use client'
// ChainDetailShell — the shared skeleton every per-chain detail page renders.
// Generalized from the Phase-1 ArcDetail page: ambient gradient background,
// sticky top nav, identity row with status badge, then the page's own panels
// as children, and the Neon footer.

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ChainConfig } from '@/lib/chainConfigs'
import { StatusBadge, type HealthState } from '@/components/StatusBadge'

interface ChainDetailShellProps {
  config: ChainConfig
  /** Overall chain health, derived from the page's own live poll. */
  status: HealthState
  /** Short note under the tagline (chain-specific, e.g. gas explanation). */
  description?: ReactNode
  /** Action buttons shown on the right of the identity row. */
  actions?: ReactNode
  /** The panel grid(s) that make up the page body. */
  children: ReactNode
  /** Optional caption above the footer (data-sourcing note). */
  note?: ReactNode
}

export function ChainDetailShell({
  config,
  status,
  description,
  actions,
  children,
  note,
}: ChainDetailShellProps) {
  const networkChip =
    config.network === 'testnet'
      ? 'border-amber-400/25 bg-amber-400/[0.07] text-amber-300/80'
      : 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300/70'

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(1100px 700px at 12% -10%, ${config.color}16, transparent 60%), radial-gradient(900px 600px at 88% -5%, ${config.accent}0f, transparent 55%), radial-gradient(800px 600px at 50% 115%, rgba(139,124,248,0.08), transparent 60%)`,
          }}
        />
        <div className="absolute inset-0 bg-faint-grid" />
      </div>

      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-white/[0.05] bg-[#07070d]/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3 sm:px-6">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Back to dashboard</span>
            <span className="sm:hidden">Neon</span>
          </Link>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/SifatHossain456/Neon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white"
            >
              GitHub
              <ArrowUpRight size={13} className="text-white/30" />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-6 sm:px-6 sm:py-8">
        {/* Identity row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-black shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${config.color}, ${config.accent})`,
                boxShadow: `0 8px 30px -8px ${config.color}99`,
                color: '#fff',
              }}
            >
              {config.initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[30px]">
                  {config.name}
                </h1>
                <StatusBadge state={status} />
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${networkChip}`}
                >
                  {config.network === 'testnet' ? 'Testnet' : 'Mainnet'}
                </span>
              </div>
              <p className="mt-1 text-sm text-white/40">{config.tagline}</p>
              {description && (
                <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/30">
                  {description}
                </p>
              )}
            </div>
          </div>

          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </motion.div>

        {children}

        {note && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center text-[11px] leading-relaxed text-white/25"
          >
            {note}
          </motion.p>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] bg-white/[0.015]">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-3 px-5 py-5 text-[11px] text-white/25 sm:flex-row sm:items-center sm:px-6">
          <p>
            Neon &middot; chain detail &mdash; {config.name}{' '}
            {config.network === 'testnet' ? 'testnet' : 'mainnet'}
            {config.chainId !== null ? ` (chain ${config.chainId})` : ''}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-white/40 transition-colors hover:text-white/80"
          >
            <ArrowLeft size={11} />
            All chains
          </Link>
        </div>
      </footer>
    </div>
  )
}
