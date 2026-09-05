'use client'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { fmtChange, fmtPrice } from '@/lib/format'

export interface TickerItem {
  symbol: string
  color: string
  price: number
  change24h: number
}

export function PriceTicker({ items }: { items: TickerItem[] }) {
  if (items.length === 0) return null

  const doubled = [...items, ...items]

  return (
    <div className="relative overflow-hidden border-b border-white/[0.04] bg-white/[0.015] py-2 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="ticker-track group flex w-max whitespace-nowrap">
        {doubled.map((item, i) => {
          const up = item.change24h >= 0
          const Trend = up ? TrendingUp : TrendingDown
          return (
            <span
              key={`${item.symbol}-${i}`}
              aria-hidden={i >= items.length}
              className="inline-flex items-center gap-2 px-5 text-xs"
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-mono font-semibold tracking-wide text-white/70">
                {item.symbol}
              </span>
              <span className="font-mono font-medium text-white tabular-nums">
                {fmtPrice(item.price)}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 font-mono tabular-nums ${
                  up ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                <Trend size={11} strokeWidth={2.5} />
                {fmtChange(item.change24h)}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
