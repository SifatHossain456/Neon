'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchMonadBlock,
  fetchSuiBlock,
  fetchAptosBlock,
  fetchSolanaBlock,
  fetchArcBlock,
  fetchPrices,
  type ChainPollResult,
  type PriceInfo,
} from '@/lib/fetchChainData'
import type { ChainId } from '@/lib/chainConfigs'

export interface ChainLive {
  blockNumber: number | null
  tps: number | null
  latency: number | null
  gasPriceGwei: number | null
  /** True while the very first poll is still in flight. */
  loading: boolean
  /** True when the most recent poll for this chain returned real data. */
  online: boolean
  /** Polls attempted since this page loaded (successes + failures). */
  polls: number
  /** Polls that returned real data since this page loaded. */
  successes: number
  /**
   * Seconds per block estimated from consecutive successful polls
   * (Δt / Δblock). Only meaningful for EVM chains (Arc, Monad).
   */
  blockTimeSec: number | null
  /** How many intervals the block-time average is based on. */
  blockTimeN: number
}

export type ChainState = Record<ChainId, ChainLive>

export interface LiveData {
  chains: ChainState
  prices: Record<string, PriceInfo>
  /** Rolling real latency samples (ms) per chain — feeds the sparklines. */
  history: Record<ChainId, number[]>
  lastUpdated: number | null
}

/** Keep this many latency samples per chain (persisted to localStorage). */
export const HISTORY_CAP = 200
/** Average block-time over at most this many poll intervals. */
const BLOCK_TIME_MAX_SAMPLES = 20

export const REFRESH_INTERVAL_MS = 12_000

/** localStorage key for the persisted latency history. */
const LS_KEY = 'neon.latency.v1'

const ALL_IDS: ChainId[] = ['monad', 'sui', 'aptos', 'solana', 'arc']
const EVM_IDS: ChainId[] = ['monad', 'arc']

const emptyChain = (loading: boolean): ChainLive => ({
  blockNumber: null,
  tps: null,
  latency: null,
  gasPriceGwei: null,
  loading,
  online: false,
  polls: 0,
  successes: 0,
  blockTimeSec: null,
  blockTimeN: 0,
})

const emptyHistory = (): Record<ChainId, number[]> => ({
  monad: [],
  sui: [],
  aptos: [],
  solana: [],
  arc: [],
})

const initialData: LiveData = {
  chains: {
    monad: emptyChain(true),
    sui: emptyChain(true),
    aptos: emptyChain(true),
    solana: emptyChain(true),
    arc: emptyChain(true),
  },
  prices: {},
  history: emptyHistory(),
  lastUpdated: null,
}

function pushSample(list: number[], value: number | null): number[] {
  if (value === null || !isFinite(value) || value <= 0) return list
  list.push(Math.round(value))
  if (list.length > HISTORY_CAP) list.splice(0, list.length - HISTORY_CAP)
  return list
}

function loadPersistedHistory(): Record<ChainId, number[]> {
  const out = emptyHistory()
  if (typeof window === 'undefined') return out
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return out
    const parsed = JSON.parse(raw) as Partial<Record<ChainId, unknown>>
    for (const id of ALL_IDS) {
      const arr = parsed[id]
      if (Array.isArray(arr)) {
        out[id] = arr
          .filter((v): v is number => typeof v === 'number' && isFinite(v) && v > 0)
          .map((v) => Math.round(v))
          .slice(-HISTORY_CAP)
      }
    }
  } catch {
    // Corrupt or unavailable storage — start fresh, never crash the feed.
  }
  return out
}

function persistHistory(history: Record<ChainId, number[]>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(history))
  } catch {
    // Storage full / private mode — the in-memory feed keeps working.
  }
}

type ChainFetch = ChainPollResult | null

function toLive(result: ChainFetch): ChainLive {
  return {
    blockNumber: result?.blockNumber ?? null,
    tps: result?.tps ?? null,
    latency: result?.latency ?? null,
    gasPriceGwei: result?.gasPriceGwei ?? null,
    loading: false,
    online: result !== null,
    polls: 0,
    successes: 0,
    blockTimeSec: null,
    blockTimeN: 0,
  }
}

export function useChainData() {
  const [data, setData] = useState<LiveData>(initialData)
  // Guards against overlapping refreshes (manual click while a poll is running).
  const inFlight = useRef(false)

  // Mutable per-chain bookkeeping that never needs to trigger a render on its
  // own — it is snapshotted into state after every successful refresh round.
  const counts = useRef<Record<ChainId, { polls: number; successes: number }>>({
    monad: { polls: 0, successes: 0 },
    sui: { polls: 0, successes: 0 },
    aptos: { polls: 0, successes: 0 },
    solana: { polls: 0, successes: 0 },
    arc: { polls: 0, successes: 0 },
  })
  const history = useRef<Record<ChainId, number[]>>(emptyHistory())
  const blockSamples = useRef<Record<ChainId, number[]>>(emptyHistory())
  const prevPoll = useRef<Record<ChainId, { block: number; at: number } | null>>({
    monad: null,
    sui: null,
    aptos: null,
    solana: null,
    arc: null,
  })

  const refresh = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      const [monad, sui, aptos, solana, arc, prices] = await Promise.all([
        fetchMonadBlock(),
        fetchSuiBlock(),
        fetchAptosBlock(),
        fetchSolanaBlock(),
        fetchArcBlock(),
        fetchPrices(),
      ])
      const results: ChainFetch[] = [monad, sui, aptos, solana, arc]
      const now = Date.now()

      const chains = {} as ChainState
      const historySnapshot = {} as Record<ChainId, number[]>

      ALL_IDS.forEach((id, i) => {
        const res = results[i]
        const c = counts.current[id]
        c.polls += 1
        const ok = res !== null
        if (ok) c.successes += 1

        const live = toLive(res)
        live.polls = c.polls
        live.successes = c.successes

        if (ok && res) {
          pushSample(history.current[id], res.latency)

          if (EVM_IDS.includes(id)) {
            const prev = prevPoll.current[id]
            if (prev !== null && res.blockNumber > prev.block) {
              const dtMs = Math.max(250, now - prev.at)
              const blocks = res.blockNumber - prev.block
              const msPerBlock = dtMs / blocks
              // Sanity bounds (~20ms to ~2min per block) keep one flaky
              // interval from corrupting the average.
              if (msPerBlock >= 20 && msPerBlock <= 120_000) {
                const arr = blockSamples.current[id]
                arr.push(msPerBlock)
                if (arr.length > BLOCK_TIME_MAX_SAMPLES) arr.shift()
                live.blockTimeSec = arr.reduce((a, b) => a + b, 0) / arr.length / 1000
                live.blockTimeN = arr.length
              }
            }
            prevPoll.current[id] = { block: res.blockNumber, at: now }
          }
        } else {
          // A failed poll breaks the interval chain so the next estimate does
          // not silently include the downtime gap.
          prevPoll.current[id] = null
        }

        chains[id] = live
        historySnapshot[id] = [...history.current[id]]
      })

      persistHistory(history.current)

      setData({
        chains,
        prices,
        history: historySnapshot,
        lastUpdated: now,
      })
    } finally {
      inFlight.current = false
    }
  }, [])

  // Restore persisted latency history and start the live loop. The restore is
  // deferred out of the synchronous effect body (set-state-in-effect lint) and
  // lands before the first refresh round resolves.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const restored = loadPersistedHistory()
      history.current = restored
      setData((prev) => ({ ...prev, history: restored }))
      void refresh()
    }, 0)
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => {
      clearTimeout(t)
      clearInterval(interval)
    }
  }, [refresh])

  return { data, refresh }
}
