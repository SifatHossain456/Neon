'use client'
// Solana mainnet detail page — all numbers come straight from the public
// api.mainnet-beta.solana.com RPC: getSlot, getBlockHeight, getEpochInfo,
// getRecentPerformanceSamples (TPS + slot time) and getVersion. Price comes
// from the same public CoinGecko call the dashboard uses.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity,
  ExternalLink,
  Gauge,
  Layers,
  Radio,
  Timer,
  TrendingUp,
  Zap,
} from 'lucide-react'
import type { ChainConfig } from '@/lib/chainConfigs'
import {
  fetchSolanaDetail,
  median,
  type SolanaDetailData,
} from '@/lib/fetchDetailData'
import { fetchPrices, type PriceInfo } from '@/lib/fetchChainData'
import { fmtAge, fmtChange, fmtCompact, fmtInt, fmtLatency, fmtPrice } from '@/lib/format'
import {
  ConnectingNote,
  ExternalLinkMini,
  OfflineNote,
  Panel,
  PanelStateTag,
  ParamRow,
  Tile,
  useNow,
} from '@/components/detail/atoms'
import { ChainDetailShell } from '@/components/detail/ChainDetailShell'

const POLL_MS = 10_000
const PRICE_POLL_MS = 60_000

interface PollState {
  data: SolanaDetailData | null
  state: 'loading' | 'online' | 'offline'
  updatedAt: number | null
}

const initialPoll: PollState = { data: null, state: 'loading', updatedAt: null }

export function SolanaDetail({ config }: { config: ChainConfig }) {
  const now = useNow(1000)
  const [poll, setPoll] = useState<PollState>(initialPoll)
  const [price, setPrice] = useState<PriceInfo | null>(null)
  const [priceUpdatedAt, setPriceUpdatedAt] = useState<number | null>(null)
  const inFlight = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      const data = await fetchSolanaDetail()
      setPoll({ data, state: data === null ? 'offline' : 'online', updatedAt: Date.now() })
    } finally {
      inFlight.current = false
    }
  }, [])

  const refreshPrice = useCallback(async () => {
    const prices = await fetchPrices()
    const p = prices[config.coinGeckoId ?? '']
    if (p && p.usd > 0) {
      setPrice(p)
      setPriceUpdatedAt(Date.now())
    }
  }, [config.coinGeckoId])

  useEffect(() => {
    void refresh()
    const id = setInterval(() => void refresh(), POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  useEffect(() => {
    // Deferred out of the synchronous effect body (set-state-in-effect lint).
    const t = window.setTimeout(() => void refreshPrice(), 0)
    const id = setInterval(() => void refreshPrice(), PRICE_POLL_MS)
    return () => {
      clearTimeout(t)
      clearInterval(id)
    }
  }, [refreshPrice])

  const status = poll.state === 'loading' ? 'connecting' : poll.state === 'online' ? 'online' : 'offline'
  const d = poll.data

  const feeValues = d ? d.priorityFeeSamples.map((s) => s.feeLamports) : []
  const feeLatest = d && d.priorityFeeSamples.length > 0 ? d.priorityFeeSamples[0].feeLamports : null
  const feeMed = d ? median(feeValues) : null
  const feeMax = feeValues.length > 0 ? Math.max(...feeValues) : null
  const epochPct = d && d.slotsInEpoch > 0 ? (d.slotIndex / d.slotsInEpoch) * 100 : null
  const tpsAvg = d && d.perfSamples.length > 0 ? d.tps : null

  return (
    <ChainDetailShell
      config={config}
      status={status}
      description={
        <>
          Neon reads slots, epoch progress, performance samples and version straight from the public
          Solana RPC — TPS and slot time are computed from real 60-second performance samples.
        </>
      }
      actions={
        <a
          href={config.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white/75 transition-colors hover:border-white/25 hover:text-white"
        >
          {config.explorerLabel}
          <ExternalLink size={13} className="text-white/35" />
        </a>
      }
      note={
        <>
          Every number here is a live HTTP response from the public Solana RPC or CoinGecko — when a
          source is down, Neon says so. Data refreshes every {POLL_MS / 1000} seconds; the price
          every {PRICE_POLL_MS / 60}s.
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: chain-state panels */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Epoch */}
          <Panel
            title="Epoch"
            icon={<Gauge size={13} />}
            tag={
              <PanelStateTag
                state={poll.state}
                text={
                  poll.state === 'online' && d
                    ? `epoch ${fmtInt(d.epoch)} · ${fmtAge(poll.updatedAt, now)}`
                    : undefined
                }
              />
            }
          >
            {poll.state === 'loading' ? (
              <ConnectingNote />
            ) : poll.state === 'offline' || d === null ? (
              <OfflineNote>
                The public Solana RPC did not answer the last poll. Epoch progress and slot data stay
                cleared until it recovers.
              </OfflineNote>
            ) : (
              <>
                <div className="mb-3 flex items-end justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
                      Slot {fmtInt(d.slotIndex)} of {fmtInt(d.slotsInEpoch)}
                    </div>
                    <div className="mt-1 font-mono text-[22px] font-semibold leading-none tracking-tight text-white">
                      {epochPct !== null ? `${epochPct.toFixed(1)}%` : '—'}
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-white/30">
                    through epoch
                  </span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]"
                  role="progressbar"
                  aria-valuenow={epochPct ?? 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Epoch progress"
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(0, Math.min(100, epochPct ?? 0))}%`,
                      background: `linear-gradient(90deg, ${config.color}, ${config.accent})`,
                    }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Tile
                    label="Epoch"
                    value={fmtInt(d.epoch)}
                    caption="current epoch"
                  />
                  <Tile
                    label="Slot index"
                    value={fmtInt(d.slotIndex)}
                    caption="slots into epoch"
                  />
                  <Tile
                    label="Slots / epoch"
                    value={fmtInt(d.slotsInEpoch)}
                    caption="expected duration"
                  />
                  <Tile
                    label="Tx count"
                    value={d.transactionCount !== null ? fmtCompact(d.transactionCount) : '—'}
                    caption="getEpochInfo · cumulative"
                  />
                </div>
              </>
            )}
          </Panel>

          {/* Performance */}
          <Panel
            title="Performance"
            icon={<Zap size={13} />}
            tag={
              <span className="inline-flex items-center rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-white/35">
                {d?.coreVersion ? `solana-core ${d.coreVersion}` : 'getRecentPerformanceSamples'}
              </span>
            }
          >
            {poll.state === 'loading' ? (
              <ConnectingNote />
            ) : poll.state === 'offline' || d === null ? (
              <OfflineNote>
                No performance samples while the public Solana RPC is unreachable.
              </OfflineNote>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
                      TPS
                    </div>
                    <div className="mt-1 font-mono text-[26px] font-semibold leading-none tracking-tight text-white">
                      {tpsAvg !== null ? fmtInt(tpsAvg) : '—'}
                    </div>
                    <div className="mt-1.5 text-[10px] text-white/30">
                      avg of {d.perfSamples.length} × 60s performance samples
                    </div>
                  </div>
                  <Tile
                    label="Latest sample"
                    value={d.perfSamples.length > 0 ? fmtInt(d.perfSamples[0].tps) : '—'}
                    caption="60s window"
                  />
                  <Tile
                    label="Slot time"
                    value={d.slotTimeSec !== null ? `${(d.slotTimeSec * 1000).toFixed(0)}ms` : '—'}
                    caption="est. from samples"
                  />
                  <Tile
                    label="Priority fee · median"
                    value={feeMed !== null ? feeMed.toLocaleString('en-US') : '—'}
                    caption="lamports · getRecentPrioritizationFees"
                  />
                  <Tile
                    label="Priority fee · latest"
                    value={feeLatest !== null ? feeLatest.toLocaleString('en-US') : '—'}
                    caption={feeMax !== null ? `max ${feeMax.toLocaleString('en-US')} in sample` : 'no sample'}
                  />
                </div>
                <div className="mt-3">
                  <SparklineBars samples={d.perfSamples} color={config.accent} />
                </div>
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
                getSlot
              </span>
            }
          >
            {poll.state === 'loading' ? (
              <ConnectingNote />
            ) : poll.state === 'offline' || d === null ? (
              <div className="flex flex-col gap-2">
                <OfflineNote>
                  The public Solana RPC did not answer the last poll. Slot and block-height values
                  stay cleared until it recovers.
                </OfflineNote>
                <p className="text-[10.5px] text-white/25">
                  Last successful poll: {poll.updatedAt ? fmtAge(poll.updatedAt, now) : 'never'}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                  <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
                    <span>Latest slot</span>
                    <span className="font-mono normal-case tracking-normal text-white/25">
                      mainnet-beta
                    </span>
                  </div>
                  <div className="mt-1 truncate font-mono text-[26px] font-semibold leading-none tracking-tight text-white">
                    {fmtInt(d.slot)}
                  </div>
                </div>
                <Tile
                  label="Block height"
                  icon={<Layers size={11} />}
                  value={fmtInt(d.blockHeight)}
                  caption="confirmed blocks"
                />
                <Tile
                  label="Latency"
                  icon={<Timer size={11} />}
                  value={d.latencyMs !== null ? fmtLatency(d.latencyMs) : '—'}
                  caption={`last poll ${poll.updatedAt ? fmtAge(poll.updatedAt, now) : '—'}`}
                />
              </div>
            )}
            <p className="mt-3 text-[10px] leading-relaxed text-white/25">
              Polled straight from https://api.mainnet-beta.solana.com every {POLL_MS / 1000} seconds.
              No API key, no middleman.
            </p>
          </Panel>

          {/* Market */}
          <Panel
            title="Market"
            icon={<TrendingUp size={13} />}
            tag={
              priceUpdatedAt ? (
                <span className="inline-flex items-center rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-white/35">
                  CoinGecko · {fmtAge(priceUpdatedAt, now)}
                </span>
              ) : undefined
            }
          >
            {price ? (
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
                    SOL price · 24h
                  </div>
                  <div className="mt-1 font-mono text-[26px] font-semibold leading-none tracking-tight text-white">
                    {fmtPrice(price.usd)}
                  </div>
                </div>
                <span
                  className={`font-mono text-sm font-medium tabular-nums ${
                    price.usd_24h_change >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {fmtChange(price.usd_24h_change)}
                </span>
              </div>
            ) : (
              <div className="text-[11.5px] text-white/30">
                No market feed right now — price comes from the public CoinGecko API.
              </div>
            )}
          </Panel>

          {/* Chain params */}
          <Panel title="Chain" icon={<Activity size={13} />}>
            <dl className="flex flex-col gap-2.5 text-[12.5px]">
              <ParamRow label="Network" value="Mainnet · SVM L1" />
              <ParamRow label="Height metric" value="Slot (getSlot)" />
              <ParamRow label="RPC" value="https://api.mainnet-beta.solana.com" mono truncate />
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-white/[0.05] pt-2.5">
                <ExternalLinkMini href={config.explorerUrl} label={config.explorerLabel} />
                <ExternalLinkMini href="https://docs.solana.com" label="Solana docs" />
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </ChainDetailShell>
  )
}

/** Tiny per-sample TPS bars rendered with plain divs (no chart dependency). */
function SparklineBars({
  samples,
  color,
}: {
  samples: { tps: number }[]
  color: string
}) {
  const max = Math.max(1, ...samples.map((s) => s.tps))
  return (
    <div>
      <div className="mb-1 text-[9.5px] uppercase tracking-[0.12em] text-white/25">
        TPS · last {samples.length} samples
      </div>
      <div className="flex h-10 items-end gap-1">
        {samples.length === 0 ? (
          <span className="text-[10px] text-white/25">no samples yet</span>
        ) : (
          samples.map((s, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all duration-500"
              style={{
                height: `${Math.max(6, (s.tps / max) * 100)}%`,
                background: `linear-gradient(180deg, ${color}, ${color}55)`,
                opacity: 0.85 - i * 0.04,
              }}
              title={`${fmtInt(s.tps)} TPS`}
            />
          ))
        )}
      </div>
    </div>
  )
}
