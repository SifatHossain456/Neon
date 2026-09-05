'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Radio } from 'lucide-react'
import { useChainData, type ChainLive } from '@/hooks/useChainData'
import { CHAIN_CONFIGS, type ChainId } from '@/lib/chainConfigs'
import type { PriceInfo } from '@/lib/fetchChainData'
import { Header } from '@/components/Header'
import { PriceTicker } from '@/components/PriceTicker'
import { StatusBar } from '@/components/StatusBar'
import { ChainCard } from '@/components/ChainCard'

export default function Home() {
  const { data, refresh } = useChainData()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refresh()
    } finally {
      setRefreshing(false)
    }
  }

  const tickerItems = CHAIN_CONFIGS.filter((c) => c.hasPrice)
    .map((c) => {
      const p = data.prices[c.coinGeckoId ?? '']
      if (!p || p.usd <= 0) return null
      return { symbol: c.nativeToken, color: c.color, price: p.usd, change24h: p.usd_24h_change }
    })
    .filter((t): t is { symbol: string; color: string; price: number; change24h: number } => t !== null)

  const onlineCount = Object.values(data.chains).filter((c: ChainLive) => c.online).length
  const firstSyncDone = data.lastUpdated !== null

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(1100px 700px at 12% -10%, rgba(139,124,248,0.12), transparent 60%), radial-gradient(900px 600px at 88% -5%, rgba(77,162,255,0.09), transparent 55%), radial-gradient(800px 600px at 50% 115%, rgba(153,69,255,0.08), transparent 60%)',
          }}
        />
        <div className="absolute inset-0 bg-faint-grid" />
      </div>

      <Header />
      {tickerItems.length > 0 && <PriceTicker items={tickerItems} />}

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-6 sm:py-10">
        {/* Title block */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mb-6"
        >
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            <Radio size={11} className="text-emerald-400" />
            Real-time feed · no API keys
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[34px] sm:leading-[1.15]">
            The pulse of{' '}
            <span className="bg-gradient-to-r from-[#b9a8ff] via-[#63e2ff] to-[#14f195] bg-clip-text text-transparent">
              five chains
            </span>
            , live.
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/40">
            Latest block heights, TPS, gas prices and token prices — polled straight from public
            RPC endpoints and CoinGecko. Testnets can be flaky, so when an endpoint doesn&apos;t
            answer, Neon says offline. No guesses, ever.
          </p>
        </motion.div>

        <StatusBar
          onlineCount={firstSyncDone ? onlineCount : 0}
          total={CHAIN_CONFIGS.length}
          lastUpdated={data.lastUpdated}
          busy={refreshing}
          onRefresh={handleRefresh}
        />

        {/* Chain grid */}
        <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {CHAIN_CONFIGS.map((config, i) => {
            const live = data.chains[config.id as ChainId]
            const price: PriceInfo | null =
              config.coinGeckoId && data.prices[config.coinGeckoId]
                ? data.prices[config.coinGeckoId]
                : null
            return (
              <ChainCard
                key={config.id}
                config={config}
                live={live}
                price={price}
                history={data.history[config.id as ChainId]}
                index={i}
              />
            )
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-5 text-center text-[11px] leading-relaxed text-white/25"
        >
          All figures come from live RPC responses (EVM eth_blockNumber / eth_gasPrice, Sui
          checkpoints, Aptos ledger, Solana slots &amp; performance samples) and CoinGecko&apos;s
          public price API. Data refreshes every 12 seconds.
        </motion.p>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] bg-white/[0.015]">
        <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#8b7cf8] via-[#9945ff] to-[#4da2ff]">
                <span className="text-xs font-black text-white">N</span>
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-white/85">Neon</p>
                <p className="text-[11px] text-white/30">
                  Open-source multi-chain dashboard · MIT
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-1.5" aria-label="Block explorers">
              {CHAIN_CONFIGS.map((c) => (
                <a
                  key={c.id}
                  href={c.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2 py-1 text-[11px] text-white/45 transition-colors hover:border-white/20 hover:text-white"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.explorerLabel}
                  <ArrowUpRight
                    size={11}
                    className="text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </a>
              ))}
            </nav>
          </div>

          <div className="mt-5 flex flex-col items-start justify-between gap-2 border-t border-white/[0.04] pt-4 text-[11px] text-white/25 sm:flex-row sm:items-center">
            <p>
              Live data from public JSON-RPC endpoints + CoinGecko — no API keys, no wallet, no
              middlemen.
            </p>
            <a
              href="https://github.com/SifatHossain456/Neon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-white/35 transition-colors hover:text-white/70"
            >
              github.com/SifatHossain456/Neon
              <ArrowUpRight size={11} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
