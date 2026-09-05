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
}

export type ChainState = Record<ChainId, ChainLive>

export interface LiveData {
  chains: ChainState
  prices: Record<string, PriceInfo>
  /** Rolling real latency samples (ms) per chain — feeds the sparklines. */
  history: Record<ChainId, number[]>
  lastUpdated: number | null
}

const HISTORY_LIMIT = 24
export const REFRESH_INTERVAL_MS = 12_000

const emptyChain = (loading: boolean): ChainLive => ({
  blockNumber: null,
  tps: null,
  latency: null,
  gasPriceGwei: null,
  loading,
  online: false,
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
  history: { monad: [], sui: [], aptos: [], solana: [], arc: [] },
  lastUpdated: null,
}

function pushSample(list: number[], value: number | null): number[] {
  if (value === null || !isFinite(value) || value <= 0) return list
  return [...list, Math.round(value)].slice(-HISTORY_LIMIT)
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
  }
}

export function useChainData() {
  const [data, setData] = useState<LiveData>(initialData)
  // Guards against overlapping refreshes (manual click while a poll is running).
  const inFlight = useRef(false)

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

      setData((prev) => ({
        chains: {
          monad: toLive(monad),
          sui: toLive(sui),
          aptos: toLive(aptos),
          solana: toLive(solana),
          arc: toLive(arc),
        },
        prices,
        history: {
          monad: pushSample(prev.history.monad, monad?.latency ?? null),
          sui: pushSample(prev.history.sui, sui?.latency ?? null),
          aptos: pushSample(prev.history.aptos, aptos?.latency ?? null),
          solana: pushSample(prev.history.solana, solana?.latency ?? null),
          arc: pushSample(prev.history.arc, arc?.latency ?? null),
        },
        lastUpdated: Date.now(),
      }))
    } finally {
      inFlight.current = false
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [refresh])

  return { data, refresh }
}
