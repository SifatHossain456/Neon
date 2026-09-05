'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, ExternalLink, Fuel, Hourglass, Timer, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ChainConfig } from '@/lib/chainConfigs'
import type { ChainLive } from '@/hooks/useChainData'
import type { PriceInfo } from '@/lib/fetchChainData'
import { fmtBlock, fmtBlockTimeSec, fmtChange, fmtGwei, fmtInt, fmtLatency, fmtPrice, uptimePct } from '@/lib/format'
import { StatusBadge } from './StatusBadge'
import { Sparkline } from './Sparkline'

interface ChainCardProps {
  config: ChainConfig
  live: ChainLive
  price: PriceInfo | null
  history: number[]
  index: number
}

function MetricTile({
  icon,
  label,
  children,
  value,
}: {
  icon: ReactNode
  label: string
  children?: ReactNode
  value?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-colors duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1.5 font-mono text-sm font-medium text-white/90 tabular-nums">
        {value ?? children}
      </div>
    </div>
  )
}

function AnimatedValue({ value, className }: { value: string; className?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={className}
    >
      {value}
    </motion.span>
  )
}

export function ChainCard({ config, live, price, history, index }: ChainCardProps) {
  const { color, accent, blockLabel } = config
  const badge = live.loading ? 'connecting' : live.online ? 'online' : 'offline'
  const hasBlock = live.blockNumber !== null
  const networkLabel = config.network === 'testnet' ? 'Testnet' : 'Mainnet'
  const networkChip =
    config.network === 'testnet'
      ? 'border-amber-400/25 bg-amber-400/[0.07] text-amber-300/80'
      : 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300/70'
  const isEvm = config.id === 'arc' || config.id === 'monad'
  const up = uptimePct(live.polls, live.successes)
  const showBlockTime = isEvm && live.blockTimeSec !== null
  // Chains with a shipped detail page get a real "Details" link (Phase 2).
  const hasDetailPage = config.id === 'arc' || config.id === 'monad' || config.id === 'solana'

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-[0_2px_24px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-[border-color,box-shadow] duration-300 hover:shadow-[0_18px_50px_-20px_rgba(0,0,0,0.85)]"
    >
      {/* per-chain corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full opacity-[0.13] blur-3xl transition-opacity duration-500 group-hover:opacity-30"
        style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }}
      />
      {/* top accent hairline */}
      <div
        aria-hidden
        className="h-px w-full opacity-70 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, ${accent}, transparent)` }}
      />

      <div className="relative flex flex-1 flex-col gap-3.5 p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-black shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${color}, ${accent})`,
                boxShadow: `0 4px 18px -6px ${color}99`,
                color: '#fff',
              }}
            >
              {config.initials}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="text-[15px] font-bold tracking-tight text-white">{config.name}</h3>
                <StatusBadge state={badge} />
              </div>
              <p className="mt-0.5 truncate text-[11px] text-white/35">{config.tagline}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <a
              href={config.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open ${config.explorerLabel}`}
              aria-label={`Open ${config.name} in ${config.explorerLabel}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/40 transition-colors hover:border-white/25 hover:text-white"
            >
              <ExternalLink size={12} />
            </a>
            <span
              className={`rounded-full border px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-[0.12em] ${networkChip}`}
            >
              {networkLabel}
            </span>
          </div>
        </div>

        {/* Block hero */}
        <div
          className="relative overflow-hidden rounded-xl border border-white/[0.06] px-4 py-3"
          style={{ background: `linear-gradient(135deg, ${color}14, transparent 65%)` }}
        >
          <div className="flex items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
            <span>Latest {blockLabel.toLowerCase()}</span>
            <span className="font-mono normal-case tracking-normal text-white/30">
              {config.chainId ? `chain ${config.chainId}` : config.network}
            </span>
          </div>
          <div className="mt-1 truncate font-mono text-[22px] font-semibold leading-none tracking-tight">
            {hasBlock ? (
              <AnimatedValue
                value={fmtBlock(live.blockNumber!)}
                className="tabular-nums text-white"
              />
            ) : (
              <span className="text-white/20">——</span>
            )}
          </div>
          {showBlockTime && (
            <div className="mt-1.5 inline-flex items-center gap-1 text-[9.5px] text-white/35">
              <Timer size={9} className="text-white/25" />
              ~{fmtBlockTimeSec(live.blockTimeSec)} / block
              <span
                className="text-white/20"
                title="Measured from consecutive successful RPC polls (Δt ÷ Δblock number)"
              >
                · est. from last {live.blockTimeN} polls
              </span>
            </div>
          )}
        </div>

        {/* Metric tiles */}
        <div className="grid grid-cols-2 gap-2">
          {config.hasPrice &&
            (price ? (
              <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-colors duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <span>Price · 24h</span>
                  <span className="ml-auto font-mono normal-case tracking-normal text-white/25">
                    {config.nativeToken}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-2.5">
                  <AnimatedValue
                    value={fmtPrice(price.usd)}
                    className="font-mono text-xl font-semibold tabular-nums text-white"
                  />
                  <span
                    className={`font-mono text-xs font-medium tabular-nums ${
                      price.usd_24h_change >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                    title="24h change · CoinGecko"
                  >
                    {fmtChange(price.usd_24h_change)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="col-span-2 rounded-xl border border-dashed border-white/[0.07] px-3 py-2.5 text-[11px] text-white/25">
                No market feed — price comes from the public CoinGecko API only.
              </div>
            ))}

          {config.showTps && (
            <MetricTile
              icon={<Zap size={11} />}
              label="TPS"
              value={live.tps !== null ? fmtInt(live.tps) : '—'}
            />
          )}

          {config.showGas && (
            <MetricTile
              icon={<Fuel size={11} />}
              label={`Gas · ${config.nativeToken}`}
              value={live.gasPriceGwei !== null ? fmtGwei(live.gasPriceGwei) : '—'}
            />
          )}

          <MetricTile
            icon={<Timer size={11} />}
            label="Latency"
            value={live.latency !== null ? fmtLatency(live.latency) : '—'}
          />
        </div>

        {/* Latency sparkline + provenance note */}
        <div className="mt-auto border-t border-white/[0.05] pt-3">
          <div className="flex items-center justify-between text-[9.5px] uppercase tracking-[0.12em] text-white/25">
            <span>RPC latency · last {history.length} samples</span>
            <span
              className={`font-mono lowercase tracking-normal ${up === null ? 'text-white/25' : up === 100 ? 'text-emerald-300/70' : up >= 50 ? 'text-amber-300/70' : 'text-red-300/70'}`}
              title={`${live.successes}/${live.polls} polls returned data since page load`}
            >
              {up === null ? (live.loading ? 'connecting…' : 'no signal') : `${up}% up · ${live.polls} polls`}
            </span>
          </div>
          <div className="mt-1.5">
            <Sparkline values={history} color={accent} live={live.online} />
          </div>
          <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-white/25">{config.note}</p>
        </div>

        {/* Details affordance: live chains link to their detail page; others are honest about Phase 2. */}
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          {hasDetailPage ? (
            <Link
              href={`/chain/${config.id}`}
              className="group inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-white/65 transition-colors hover:border-white/25 hover:bg-white/[0.06] hover:text-white"
              aria-label={`Open the ${config.name} detail page`}
            >
              Details
              <ArrowRight
                size={12}
                className="text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:text-white/80"
              />
            </Link>
          ) : (
            <span
              title={`${config.name} detail page lands in Phase 2 — Arc, Monad and Solana ship first`}
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.015] px-2.5 py-1 text-[11px] font-medium text-white/25"
            >
              <Hourglass size={11} className="text-white/20" />
              Details soon
            </span>
          )}
        </div>
      </div>
    </motion.article>
  )
}
