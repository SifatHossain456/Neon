'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  fetchMonadBlock,
  fetchSuiBlock,
  fetchAptosBlock,
  fetchSolanaBlock,
  fetchPrices,
} from '@/lib/fetchChainData'

export interface LiveChainData {
  monad: { blockNumber: number | null; latency: number | null; loading: boolean }
  sui: { blockNumber: number | null; tps: number | null; latency: number | null; loading: boolean }
  aptos: { blockNumber: number | null; tps: number | null; latency: number | null; loading: boolean }
  solana: { blockNumber: number | null; tps: number | null; latency: number | null; loading: boolean }
  prices: Record<string, { usd: number; usd_24h_change: number }>
}

const initial: LiveChainData = {
  monad: { blockNumber: null, latency: null, loading: true },
  sui: { blockNumber: null, tps: null, latency: null, loading: true },
  aptos: { blockNumber: null, tps: null, latency: null, loading: true },
  solana: { blockNumber: null, tps: null, latency: null, loading: true },
  prices: {},
}

export function useChainData() {
  const [data, setData] = useState<LiveChainData>(initial)

  const refresh = useCallback(async () => {
    const [monad, sui, aptos, solana, prices] = await Promise.all([
      fetchMonadBlock(),
      fetchSuiBlock(),
      fetchAptosBlock(),
      fetchSolanaBlock(),
      fetchPrices(),
    ])
    setData({
      monad: { blockNumber: monad?.blockNumber ?? null, latency: monad?.latency ?? null, loading: false },
      sui: { blockNumber: sui?.blockNumber ?? null, tps: sui?.tps ?? null, latency: sui?.latency ?? null, loading: false },
      aptos: { blockNumber: aptos?.blockNumber ?? null, tps: aptos?.tps ?? null, latency: aptos?.latency ?? null, loading: false },
      solana: { blockNumber: solana?.blockNumber ?? null, tps: solana?.tps ?? null, latency: solana?.latency ?? null, loading: false },
      prices,
    })
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 12000)
    return () => clearInterval(interval)
  }, [refresh])

  return { data, refresh }
}
