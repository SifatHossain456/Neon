'use client'
import { motion } from 'framer-motion'

interface TickerItem {
  symbol: string
  price: number
  change24h: number
}

export function PriceTicker({ items }: { items: TickerItem[] }) {
  if (items.length === 0) return null

  const displayItems = [...items, ...items, ...items]

  return (
    <div className="border-b border-white/5 overflow-hidden bg-white/[0.02] py-2">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: [0, -600] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        {displayItems.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-sm">
            <span className="text-white/50 font-mono">{item.symbol}</span>
            <span className="text-white font-mono font-medium">${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
            <span className={`text-xs font-mono ${item.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
            </span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}
