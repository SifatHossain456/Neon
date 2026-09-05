'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Blocks,
  Check,
  ExternalLink,
  Fuel,
  Gauge,
  Radio,
  RefreshCw,
  Timer,
  Users,
  Wallet,
} from 'lucide-react'
import type { ChainConfig } from '@/lib/chainConfigs'
import { fetchArcBlock } from '@/lib/fetchChainData'
import {
  addArcToWallet,
  ARC_CHAIN_ID,
  ARC_FAUCET,
  ARC_RPC,
  ARC_STATUS_PAGE,
  ARC_TRANSFER_GAS,
  fetchArcLatestBlocks,
  fetchArcStats,
  type AddWalletResult,
  type ArcBlockFeedItem,
  type ArcBlocksResult,
  type ArcStats,
} from '@/lib/fetchArcData'
import {
  fmtAge,
  fmtAvgBlockTimeMs,
  fmtBlock,
  fmtCompact,
  fmtGasUsd,
  fmtGwei,
  fmtInt,
  fmtLatency,
} from '@/lib/format'
import { StatusBadge } from '@/components/StatusBadge'

// ---------------------------------------------------------------------------
// Shared atoms
// ---------------------------------------------------------------------------

const POLL_MS = 10_000

function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

function Panel({
  title,
  icon,
  tag,
  children,
  className = '',
}: {
  title: string
  icon: React.ReactNode
  tag?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-[0_2px_24px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl ${className}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.05] px-4 py-3 sm:px-5">
        <h2 className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
          <span className="text-white/35">{icon}</span>
          {title}
        </h2>
        {tag}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

function Tile({
  label,
  value,
  caption,
  dot,
  icon,
}: {
  label: string
  value: React.ReactNode
  caption?: React.ReactNode
  dot?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-colors duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
        {icon ? (
          <span className="text-white/30">{icon}</span>
        ) : dot ? (
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot }} />
        ) : null}
        <span>{label}</span>
      </div>
      <div className="font-mono text-[17px] font-semibold leading-none tracking-tight text-white/95 tabular-nums">
        {value}
      </div>
      {caption && <div className="text-[10px] leading-tight text-white/30">{caption}</div>}
    </div>
  )
}

function OfflineNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-red-400/15 bg-red-400/[0.05] px-3.5 py-3 text-[12.5px] leading-relaxed text-white/50">
      <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400/80" />
      <div>{children}</div>
    </div>
  )
}

function ConnectingNote() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-[12.5px] text-white/40">
      <RefreshCw size={13} className="animate-spin text-white/30" />
      Connecting&hellip;
    </div>
  )
}

function PanelStateTag({
  state,
  text,
}: {
  state: 'loading' | 'online' | 'offline'
  text?: string
}) {
  if (state === 'loading') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[9.5px] font-mono uppercase tracking-[0.12em] text-amber-300/80">
        <RefreshCw size={9} className="animate-spin" /> syncing
      </span>
    )
  }
  if (state === 'online') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-2 py-0.5 text-[9.5px] font-mono uppercase tracking-[0.12em] text-emerald-300/70">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {text}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-400/[0.06] px-2 py-0.5 text-[9.5px] font-mono uppercase tracking-[0.12em] text-red-300/70">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      offline
    </span>
  )
}

/** $ cost of one 21000-gas transfer at a given gas price in gwei. */
function transferUsd(gwei: number | null): number | null {
  if (gwei === null || !isFinite(gwei)) return null
  // gwei → wei, × gas, ÷ 1e18 → native units; native USDC is pegged to $1.
  return (gwei * 1e9 * ARC_TRANSFER_GAS) / 1e18
}

function gasTileLabel(gwei: number | null): string {
  return gwei !== null ? fmtGwei(gwei) : '—'
}

function fmtTransfer(gwei: number | null): string {
  const usd = transferUsd(gwei)
  return usd !== null ? `≈ ${fmtGasUsd(usd)} / transfer` : '—'
}

// ---------------------------------------------------------------------------
// Stats grid (Blockscout /api/v2/stats)
// ---------------------------------------------------------------------------

function StatsGrid({ stats }: { stats: ArcStats }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Tile
        label="Gas · slow"
        dot="#63e2ff"
        value={gasTileLabel(stats.gasSlowGwei)}
        caption={fmtTransfer(stats.gasSlowGwei)}
      />
      <Tile
        label="Gas · average"
        dot="#b9a8ff"
        value={gasTileLabel(stats.gasAverageGwei)}
        caption={fmtTransfer(stats.gasAverageGwei)}
      />
      <Tile
        label="Gas · fast"
        dot="#ff6b6b"
        value={gasTileLabel(stats.gasFastGwei)}
        caption={fmtTransfer(stats.gasFastGwei)}
      />
      <Tile
        label="Tx today"
        icon={<Activity size={11} />}
        value={stats.transactionsToday !== null ? fmtInt(stats.transactionsToday) : '—'}
        caption={
          stats.gasAverageGwei !== null
            ? `21k-gas transfer ≈ ${fmtGasUsd(transferUsd(stats.gasAverageGwei) ?? 0)}`
            : '21,000-gas transfer'
        }
      />
      <Tile
        label="Total tx"
        value={stats.totalTransactions !== null ? fmtInt(stats.totalTransactions) : '—'}
      />
      <Tile
        label="Addresses"
        icon={<Users size={11} />}
        value={stats.totalAddresses !== null ? fmtInt(stats.totalAddresses) : '—'}
      />
      <Tile
        label="Utilization"
        value={stats.utilizationPct !== null ? `${stats.utilizationPct.toFixed(1)}%` : '—'}
        caption="network utilization"
      />
      <Tile
        label="Avg block time"
        icon={<Timer size={11} />}
        value={fmtAvgBlockTimeMs(stats.avgBlockTimeMs)}
        caption="instant finality"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Block feed rows
// ---------------------------------------------------------------------------

function BlockRow({
  block,
  now,
  explorerUrl,
  isLatest,
}: {
  block: ArcBlockFeedItem
  now: number
  explorerUrl: string
  isLatest: boolean
}) {
  const gasPct =
    block.gasLimit && block.gasLimit > 0 && block.gasUsed > 0
      ? Math.round((block.gasUsed / block.gasLimit) * 100)
      : null
  return (
    <li className="px-1 py-2.5 transition-colors hover:bg-white/[0.02]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isLatest && (
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-400" />
          )}
          <a
            href={`${explorerUrl}/block/${block.height}`}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate font-mono text-[13px] font-medium text-white/85 tabular-nums transition-colors hover:text-white"
          >
            {fmtBlock(block.height)}
          </a>
          {block.hash && (
            <span className="hidden font-mono text-[10px] text-white/25 md:inline">
              {block.hash.slice(0, 8)}&hellip;{block.hash.slice(-6)}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="font-mono text-[11px] text-white/60 tabular-nums">
            {fmtInt(block.txCount)} tx
          </span>
          {block.baseFeeGwei !== null && (
            <span className="hidden font-mono text-[10.5px] text-white/30 tabular-nums sm:inline">
              base {fmtGwei(block.baseFeeGwei)}
            </span>
          )}
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 pl-3.5">
        <span className="font-mono text-[10px] text-white/30 tabular-nums">
          {isFinite(block.timestamp) ? fmtAge(block.timestamp, now) : '—'}
          {block.source === 'rpc' ? ' · via RPC' : ''}
        </span>
        <span className="font-mono text-[10px] text-white/25 tabular-nums">
          {fmtCompact(block.gasUsed)} gas{gasPct !== null ? ` · ${gasPct}%` : ''}
        </span>
      </div>
    </li>
  )
}

// ---------------------------------------------------------------------------
// RPC status state
// ---------------------------------------------------------------------------

interface RpcLive {
  loading: boolean
  online: boolean
  blockNumber: number | null
  gasPriceGwei: number | null
  latency: number | null
}

const initialRpc: RpcLive = {
  loading: true,
  online: false,
  blockNumber: null,
  gasPriceGwei: null,
  latency: null,
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function ArcDetail({ config }: { config: ChainConfig }) {
  const now = useNow(1000)

  // Public Arc RPC (eth_blockNumber + eth_gasPrice).
  const [rpc, setRpc] = useState<RpcLive>(initialRpc)
  const [rpcUpdatedAt, setRpcUpdatedAt] = useState<number | null>(null)

  // Blockscout ArcScan free API.
  const [stats, setStats] = useState<ArcStats | null>(null)
  const [statsState, setStatsState] = useState<'loading' | 'online' | 'offline'>('loading')
  const [statsUpdatedAt, setStatsUpdatedAt] = useState<number | null>(null)

  const [blocks, setBlocks] = useState<ArcBlocksResult | null>(null)
  const [blocksState, setBlocksState] = useState<'loading' | 'online' | 'offline'>('loading')
  const [blocksUpdatedAt, setBlocksUpdatedAt] = useState<number | null>(null)

  const [walletMsg, setWalletMsg] = useState<string | null>(null)
  const [walletBusy, setWalletBusy] = useState(false)
  const inFlight = useRef(false)

  const poll = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      const [rpcRes, statsRes, blocksRes] = await Promise.all([
        fetchArcBlock(),
        fetchArcStats(),
        fetchArcLatestBlocks(12),
      ])
      setRpc({
        loading: false,
        online: rpcRes !== null,
        blockNumber: rpcRes?.blockNumber ?? null,
        gasPriceGwei: rpcRes?.gasPriceGwei ?? null,
        latency: rpcRes?.latency ?? null,
      })
      setRpcUpdatedAt(Date.now())
      setStats(statsRes)
      setStatsState(statsRes === null ? 'offline' : 'online')
      setStatsUpdatedAt(Date.now())
      setBlocks(blocksRes)
      setBlocksState(blocksRes === null ? 'offline' : 'online')
      setBlocksUpdatedAt(Date.now())
    } finally {
      inFlight.current = false
    }
  }, [])

  useEffect(() => {
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [poll])

  const handleAddWallet = async () => {
    if (walletBusy) return
    setWalletBusy(true)
    setWalletMsg(null)
    const result: AddWalletResult = await addArcToWallet()
    const text: Record<AddWalletResult, string> = {
      added: 'Arc testnet was added to your wallet.',
      rejected: 'The wallet request was rejected.',
      unsupported: 'No browser wallet detected (e.g. MetaMask).',
      error: 'Could not add the chain — check the wallet for details.',
    }
    setWalletMsg(text[result])
    setWalletBusy(false)
  }

  const badge: 'online' | 'offline' | 'connecting' = rpc.loading
    ? 'connecting'
    : rpc.online
      ? 'online'
      : 'offline'

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(1100px 700px at 12% -10%, rgba(255,107,107,0.10), transparent 60%), radial-gradient(900px 600px at 88% -5%, rgba(255,162,107,0.08), transparent 55%), radial-gradient(800px 600px at 50% 115%, rgba(139,124,248,0.08), transparent 60%)',
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
            <span className="hidden text-[11px] text-white/30 md:inline">
              Live data from public endpoints &mdash; no keys
            </span>
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
          className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
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
                <StatusBadge state={badge} />
                <span className="rounded-full border border-amber-400/25 bg-amber-400/[0.07] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300/80">
                  Testnet
                </span>
              </div>
              <p className="mt-1 text-sm text-white/40">{config.tagline}</p>
              <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/30">
                Gas is paid in native <span className="text-white/55">USDC</span> — Neon converts
                gas prices into the dollar cost of a plain 21,000-gas transfer.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={ARC_FAUCET}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white/75 transition-colors hover:border-white/25 hover:text-white"
            >
              Faucet
              <ArrowUpRight size={13} className="text-white/35" />
            </a>
            <a
              href={config.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white/75 transition-colors hover:border-white/25 hover:text-white"
            >
              {config.explorerLabel}
              <ExternalLink size={13} className="text-white/35" />
            </a>
            <button
              type="button"
              onClick={handleAddWallet}
              disabled={walletBusy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/85 transition-all hover:border-white/25 hover:bg-white/[0.07] hover:text-white active:scale-[0.98] disabled:opacity-60"
            >
              <Wallet size={13} className="text-white/45" />
              {walletBusy ? 'Adding&hellip;' : 'Add to wallet'}
            </button>
          </div>
        </motion.div>

        {walletMsg && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-xs text-white/45"
          >
            {walletMsg}
          </motion.p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left: explorer-backed data */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            {/* Network stats (Blockscout) */}
            <Panel
              title="Network stats"
              icon={<Gauge size={13} />}
              tag={
                <PanelStateTag
                  state={statsState}
                  text={
                    statsState === 'online'
                      ? `ArcScan API · ${fmtAge(statsUpdatedAt, now)}`
                      : undefined
                  }
                />
              }
            >
              {statsState === 'loading' ? (
                <ConnectingNote />
              ) : statsState === 'offline' || stats === null ? (
                <OfflineNote>
                  Blockscout ArcScan did not answer. Network stats are paused — the block feed
                  below falls back to the public RPC. Nothing is estimated.
                </OfflineNote>
              ) : (
                <StatsGrid stats={stats} />
              )}
              <p className="mt-3 text-[10px] leading-relaxed text-white/25">
                Gas tiers are quoted by Blockscout in gwei; the ≈$ figure converts a 21,000-gas
                transfer from native 18-decimal USDC at $1/USDC. Stats refresh every 10 seconds.
              </p>
            </Panel>

            {/* Live blocks feed */}
            <Panel
              title="Live blocks"
              icon={<Blocks size={13} />}
              tag={
                <PanelStateTag
                  state={blocksState}
                  text={
                    blocksState === 'online'
                      ? `${blocks?.source === 'rpc' ? 'RPC fallback' : 'ArcScan API'} · ${fmtAge(blocksUpdatedAt, now)}`
                      : undefined
                  }
                />
              }
            >
              {blocksState === 'loading' ? (
                <ConnectingNote />
              ) : blocksState === 'offline' || blocks === null ? (
                <OfflineNote>
                  Both ArcScan and the Arc RPC are unreachable right now. The feed resumes
                  automatically once an endpoint answers.
                </OfflineNote>
              ) : (
                <>
                  {blocks.source === 'rpc' && (
                    <div className="mb-2 flex items-start gap-2.5 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] px-3.5 py-2.5 text-[12px] leading-relaxed text-white/50">
                      <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-300/80" />
                      Blockscout list unreachable — showing the latest block from the public RPC
                      (eth_getBlockByNumber) instead.
                    </div>
                  )}
                  <ul className="flex flex-col divide-y divide-white/[0.04]">
                    {blocks.items.map((b, i) => (
                      <BlockRow
                        key={b.hash || `${b.height}-${i}`}
                        block={b}
                        now={now}
                        explorerUrl={config.explorerUrl}
                        isLatest={i === 0}
                      />
                    ))}
                  </ul>
                </>
              )}
            </Panel>
          </div>

          {/* Right rail */}
          <div className="flex flex-col gap-4">
            {/* RPC live */}
            <Panel
              title="RPC status"
              icon={<Radio size={13} />}
              tag={
                <span className="inline-flex items-center rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-white/35">
                  eth_blockNumber
                </span>
              }
            >
              {rpc.loading ? (
                <ConnectingNote />
              ) : !rpc.online ? (
                <div className="flex flex-col gap-2">
                  <OfflineNote>
                    The public Arc RPC did not answer the last poll. Latest block and gas values
                    stay cleared until it recovers.
                  </OfflineNote>
                  <p className="text-[10.5px] text-white/25">
                    Last successful poll: {rpcUpdatedAt ? fmtAge(rpcUpdatedAt, now) : 'never'}.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                    <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
                      <span>Latest block</span>
                      <span className="font-mono normal-case tracking-normal text-white/25">
                        chain {ARC_CHAIN_ID}
                      </span>
                    </div>
                    <div className="mt-1 truncate font-mono text-[26px] font-semibold leading-none tracking-tight text-white">
                      {rpc.blockNumber !== null ? fmtBlock(rpc.blockNumber) : '—'}
                    </div>
                  </div>
                  <Tile
                    label="Gas · USDC"
                    icon={<Fuel size={11} />}
                    value={gasTileLabel(rpc.gasPriceGwei)}
                    caption={fmtTransfer(rpc.gasPriceGwei)}
                  />
                  <Tile
                    label="Latency"
                    icon={<Timer size={11} />}
                    value={rpc.latency !== null ? fmtLatency(rpc.latency) : '—'}
                    caption={`last poll ${rpcUpdatedAt ? fmtAge(rpcUpdatedAt, now) : '—'}`}
                  />
                </div>
              )}
              <p className="mt-3 text-[10px] leading-relaxed text-white/25">
                Polled straight from {ARC_RPC} every 10 seconds. No API key, no middleman.
              </p>
            </Panel>

            {/* Chain params */}
            <Panel title="Chain" icon={<Activity size={13} />}>
              <dl className="flex flex-col gap-2.5 text-[12.5px]">
                <ParamRow label="Chain ID" value={fmtInt(ARC_CHAIN_ID)} mono />
                <ParamRow label="Network" value="Testnet · instant finality" />
                <ParamRow label="Gas token" value="USDC (native · 18 dec)" />
                <ParamRow label="RPC" value={ARC_RPC} mono truncate />
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-white/[0.05] pt-2.5">
                  <ExternalLinkMini href={config.explorerUrl} label={config.explorerLabel} />
                  <ExternalLinkMini href={ARC_FAUCET} label="Faucet (Circle)" />
                  <ExternalLinkMini href={ARC_STATUS_PAGE} label="Status · arc.io" />
                </div>
              </dl>
              <button
                type="button"
                onClick={handleAddWallet}
                disabled={walletBusy}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs font-semibold text-white/85 transition-all hover:border-white/25 hover:bg-white/[0.07] hover:text-white active:scale-[0.99] disabled:opacity-60"
              >
                {walletMsg?.startsWith('Arc testnet was added') ? (
                  <Check size={13} className="text-emerald-400" />
                ) : (
                  <Wallet size={13} className="text-white/45" />
                )}
                {walletBusy ? 'Adding chain&hellip;' : 'Add Arc testnet to wallet'}
              </button>
              <p className="mt-2 text-[10px] leading-relaxed text-white/25">
                Uses EIP-3085 (wallet_addEthereumChain). Requires a browser wallet like MetaMask.
              </p>
            </Panel>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center text-[11px] leading-relaxed text-white/25"
        >
          Every number here is a live HTTP response from ArcScan&apos;s free Blockscout API or the
          public Arc RPC — when a source is down, Neon says so. Data refreshes every 10 seconds.
        </motion.p>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] bg-white/[0.015]">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-3 px-5 py-5 text-[11px] text-white/25 sm:flex-row sm:items-center sm:px-6">
          <p>
            Neon &middot; chain detail &mdash; Arc testnet (chain {ARC_CHAIN_ID})
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

// ---------------------------------------------------------------------------
// Small rows
// ---------------------------------------------------------------------------

function ParamRow({
  label,
  value,
  mono,
  truncate,
}: {
  label: string
  value: string
  mono?: boolean
  truncate?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-white/30">{label}</dt>
      <dd
        className={`text-right text-white/70 ${mono ? 'font-mono text-[11.5px]' : ''} ${
          truncate ? 'max-w-[230px] truncate' : ''
        }`}
        title={truncate ? value : undefined}
      >
        {value}
      </dd>
    </div>
  )
}

function ExternalLinkMini({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] text-white/55 transition-colors hover:text-white"
    >
      {label}
      <ArrowUpRight size={10} className="text-white/30" />
    </a>
  )
}
