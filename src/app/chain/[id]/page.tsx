import type { ComponentType } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, Construction } from 'lucide-react'
import { CHAIN_CONFIGS } from '@/lib/chainConfigs'
import { ArcDetail } from '@/components/ArcDetail'
import { MonadDetail } from '@/components/detail/MonadDetail'
import { SolanaDetail } from '@/components/detail/SolanaDetail'
import type { ChainConfig } from '@/lib/chainConfigs'

interface ChainPageProps {
  params: Promise<{ id: string }>
}

const DETAIL_COMPONENTS: Partial<Record<string, ComponentType<{ config: ChainConfig }>>> = {
  arc: ArcDetail,
  monad: MonadDetail,
  solana: SolanaDetail,
}

export async function generateMetadata({ params }: ChainPageProps): Promise<Metadata> {
  const { id } = await params
  const config = CHAIN_CONFIGS.find((c) => c.id === id)
  if (!config) return {}
  return {
    title: config.name,
    description: `Live ${config.name} (${config.tagline}) data — ${config.blockLabel.toLowerCase()} height, latency, network stats and more. Detail page on Neon, the open-source multi-chain dashboard.`,
  }
}

export default async function ChainPage({ params }: ChainPageProps) {
  const { id } = await params
  const config = CHAIN_CONFIGS.find((c) => c.id === id)
  if (!config) notFound()

  const Detail = DETAIL_COMPONENTS[config.id]
  if (Detail) return <Detail config={config} />

  // Phase 2 ships Monad + Solana first; Sui, Aptos and future chains get an
  // honest "coming soon" state until their detail pages land.
  return <ComingSoon config={config} />
}

function ComingSoon({ config }: { config: (typeof CHAIN_CONFIGS)[number] }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(1000px 640px at 15% -10%, ${config.color}14, transparent 60%), radial-gradient(800px 560px at 90% 0%, ${config.accent}10, transparent 55%)`,
          }}
        />
        <div className="absolute inset-0 bg-faint-grid" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/[0.05] bg-[#07070d]/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3 sm:px-6">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
            Back to dashboard
          </Link>
          <span className="text-[11px] text-white/30">Neon</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${config.color}, ${config.accent})`,
            boxShadow: `0 10px 36px -10px ${config.color}aa`,
            color: '#fff',
          }}
        >
          {config.initials}
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {config.name}
        </h1>
        <p className="mt-1 text-sm text-white/40">{config.tagline}</p>

        <div className="mt-8 w-full rounded-2xl border border-white/[0.07] bg-white/[0.025] px-6 py-8 backdrop-blur-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            <Construction size={11} className="text-white/35" />
            Coming soon
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/45">
            The real-time detail page for {config.name} arrives in Phase 2 of the Neon roadmap —
            same treatment Arc, Monad and Solana got: live network stats, a block feed and honest
            health metrics.
          </p>
          <p className="mx-auto mt-2 max-w-md text-[11.5px] leading-relaxed text-white/25">
            In the meantime, {config.name} still streams live on the dashboard: latest{' '}
            {config.blockLabel.toLowerCase()} height
            {config.showGas ? ', gas price' : ''}
            {config.showTps ? ', TPS' : ''} and latency.
          </p>

          <dl className="mx-auto mt-6 grid max-w-md grid-cols-1 gap-2 text-left text-[12px] sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <dt className="text-[10px] uppercase tracking-[0.12em] text-white/30">Chain ID</dt>
              <dd className="mt-0.5 font-mono text-white/70">
                {config.chainId !== null ? config.chainId : 'n/a'}
              </dd>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <dt className="text-[10px] uppercase tracking-[0.12em] text-white/30">Network</dt>
              <dd className="mt-0.5 text-white/70">
                {config.network === 'testnet' ? 'Testnet' : 'Mainnet'}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <a
              href={config.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white/75 transition-colors hover:border-white/25 hover:text-white"
            >
              Open {config.explorerLabel}
              <ArrowUpRight size={13} className="text-white/35" />
            </a>
            <Link
              href="/chain/arc"
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-white/50 transition-colors hover:text-white/90"
            >
              See Arc
              <ArrowUpRight size={13} />
            </Link>
            <Link
              href="/chain/monad"
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-white/50 transition-colors hover:text-white/90"
            >
              See Monad
              <ArrowUpRight size={13} />
            </Link>
            <Link
              href="/chain/solana"
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-white/50 transition-colors hover:text-white/90"
            >
              See Solana
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
