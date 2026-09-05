'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { fmtAge } from '@/lib/format'

interface StatusBarProps {
  onlineCount: number
  total: number
  lastUpdated: number | null
  busy: boolean
  onRefresh: () => void
}

export function StatusBar({ onlineCount, total, lastUpdated, busy, onRefresh }: StatusBarProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const allOnline = onlineCount === total
  const started = lastUpdated === null && busy

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4, ease: 'easeOut' }}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
        <span className="inline-flex items-center gap-2 font-medium text-white/90">
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-70 ${
                started || allOnline ? 'animate-ping bg-emerald-400' : ''
              }`}
              style={{ animationDuration: '1.8s' }}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                started ? 'bg-amber-300' : allOnline ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
          </span>
          <span className="tabular-nums">
            <span className={allOnline ? 'text-emerald-300' : 'text-white'}>
              {onlineCount}
            </span>
            <span className="text-white/35">/{total}</span>{' '}
            <span className="text-white/60">chains online</span>
          </span>
        </span>

        <span className="hidden text-white/15 sm:inline">|</span>

        <span className="inline-flex items-center gap-1.5 text-white/50">
          <span className="text-white/35">Last update</span>
          <span className="font-mono text-white/75 tabular-nums">{fmtAge(lastUpdated, now)}</span>
        </span>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={busy}
        className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw size={13} className={busy ? 'animate-spin' : 'transition-transform group-hover:rotate-180'} />
        {busy ? 'Refreshing…' : 'Refresh now'}
      </button>
    </motion.div>
  )
}
