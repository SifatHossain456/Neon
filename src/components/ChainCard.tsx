'use client'
import { motion } from 'framer-motion'
import { ExternalLink, Zap, Clock, Cpu } from 'lucide-react'
import { LiveDot } from './LiveDot'

interface ChainCardProps {
  name: string
  color: string
  nativeToken: string
  description: string
  isTestnet: boolean
  explorer: string
  blockNumber: number | null
  tps: number | null
  latency: number | null
  price: number | null
  change24h: number | null
  isLoading: boolean
  index: number
}

function StatRow({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string | null; unit?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2 text-white/40 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-white/80 text-xs font-mono">
        {value != null ? (
          <>
            {value}
            {unit && <span className="text-white/30 ml-1">{unit}</span>}
          </>
        ) : (
          <span className="text-white/20">—</span>
        )}
      </span>
    </div>
  )
}

export function ChainCard({
  name, color, nativeToken, description, isTestnet, explorer,
  blockNumber, tps, latency, price, change24h, isLoading, index,
}: ChainCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 overflow-hidden group"
    >
      {/* Subtle top glow on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold text-sm">{name}</h3>
              <LiveDot color={color} />
            </div>
            <p className="text-white/30 text-xs">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isTestnet && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-yellow-500/30 text-yellow-500/70">
              testnet
            </span>
          )}
          {explorer && (
            <a href={explorer} target="_blank" rel="noopener noreferrer" aria-label={`${name} explorer`} className="text-white/20 hover:text-white/60 transition-colors">
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Price */}
      {price !== null ? (
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              ${price < 0.01 ? price.toFixed(6) : price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
            {change24h !== null && (
              <span className={`text-xs font-mono ${change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
              </span>
            )}
          </div>
          <p className="text-white/30 text-xs mt-0.5">{nativeToken}</p>
        </div>
      ) : (
        <div className="mb-4">
          <div className="text-white/20 text-xs font-mono">Price TBA</div>
          <p className="text-white/30 text-xs mt-0.5">{nativeToken}</p>
        </div>
      )}

      {/* Stats */}
      <div className="space-y-0">
        <StatRow
          icon={<Cpu size={10} />}
          label="Block"
          value={blockNumber ? `#${blockNumber.toLocaleString()}` : null}
        />
        {tps !== null && (
          <StatRow
            icon={<Zap size={10} />}
            label="TPS"
            value={tps ? tps.toLocaleString() : '0'}
          />
        )}
        <StatRow
          icon={<Clock size={10} />}
          label="Latency"
          value={latency ? `${latency}` : null}
          unit="ms"
        />
      </div>

      {/* Loading shimmer overlay */}
      {isLoading && (
        <div className="absolute inset-0 rounded-2xl bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="w-4 h-4 border border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      )}
    </motion.div>
  )
}
