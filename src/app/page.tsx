'use client'
import { useChainData } from '@/hooks/useChainData'
import { Header } from '@/components/Header'
import { PriceTicker } from '@/components/PriceTicker'
import { ChainCard } from '@/components/ChainCard'
import { CHAIN_CONFIGS } from '@/lib/chainConfigs'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function Home() {
  const { data, refresh } = useChainData()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  const tickerItems = [
    { symbol: 'SOL', price: data.prices['solana']?.usd ?? 0, change24h: data.prices['solana']?.usd_24h_change ?? 0 },
    { symbol: 'SUI', price: data.prices['sui']?.usd ?? 0, change24h: data.prices['sui']?.usd_24h_change ?? 0 },
    { symbol: 'APT', price: data.prices['aptos']?.usd ?? 0, change24h: data.prices['aptos']?.usd_24h_change ?? 0 },
  ].filter(t => t.price > 0)

  const chainDataMap = {
    monad: {
      blockNumber: data.monad.blockNumber,
      tps: null,
      latency: data.monad.latency,
      isLoading: data.monad.loading,
      price: null,
      change24h: null,
    },
    sui: {
      blockNumber: data.sui.blockNumber,
      tps: data.sui.tps,
      latency: data.sui.latency,
      isLoading: data.sui.loading,
      price: data.prices['sui']?.usd ?? null,
      change24h: data.prices['sui']?.usd_24h_change ?? null,
    },
    aptos: {
      blockNumber: data.aptos.blockNumber,
      tps: data.aptos.tps,
      latency: data.aptos.latency,
      isLoading: data.aptos.loading,
      price: data.prices['aptos']?.usd ?? null,
      change24h: data.prices['aptos']?.usd_24h_change ?? null,
    },
    solana: {
      blockNumber: data.solana.blockNumber,
      tps: data.solana.tps,
      latency: data.solana.latency,
      isLoading: data.solana.loading,
      price: data.prices['solana']?.usd ?? null,
      change24h: data.prices['solana']?.usd_24h_change ?? null,
    },
    arc: {
      blockNumber: null,
      tps: null,
      latency: null,
      isLoading: false,
      price: null,
      change24h: null,
    },
  }

  const allLoading = Object.values(chainDataMap).some(c => c.isLoading)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#08080e' }}>
      <Header />
      {tickerItems.length > 0 && <PriceTicker items={tickerItems} />}

      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        {/* Title row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-white font-semibold text-xl">Ecosystem</h1>
            <p className="text-white/30 text-sm mt-0.5">Live on-chain data &middot; refreshes every 12s</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={allLoading || refreshing}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors disabled:opacity-30"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </motion.div>

        {/* Chain cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {CHAIN_CONFIGS.map((chain, i) => {
            const live = chainDataMap[chain.id as keyof typeof chainDataMap]
            return (
              <ChainCard
                key={chain.id}
                name={chain.name}
                color={chain.color}
                nativeToken={chain.nativeToken}
                description={chain.description}
                isTestnet={chain.isTestnet}
                explorer={chain.explorer}
                blockNumber={live.blockNumber}
                tps={live.tps}
                latency={live.latency}
                price={live.price}
                change24h={live.change24h}
                isLoading={live.isLoading}
                index={i}
              />
            )
          })}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 pt-6 border-t border-white/[0.04] flex items-center justify-between text-white/20 text-xs"
        >
          <span>Neon &mdash; Open source multi-chain dashboard</span>
          <a
            href="https://github.com/SifatHossain456/Neon"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/40 transition-colors"
          >
            GitHub
          </a>
        </motion.div>
      </main>
    </div>
  )
}
