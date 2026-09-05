'use client'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.05] bg-[#07070d]/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3.5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#8b7cf8] via-[#9945ff] to-[#4da2ff] shadow-[0_0_20px_rgba(139,124,248,0.35)]">
            <span className="text-sm font-black tracking-tight text-white">N</span>
          </div>
          <div className="leading-tight">
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-bold tracking-tight text-white">Neon</span>
              <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.14em] text-white/40 sm:inline">
                v0.2
              </span>
            </div>
            <p className="text-[11px] text-white/35">Multi-chain live dashboard</p>
          </div>
        </motion.div>

        <motion.a
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          href="https://github.com/SifatHossain456/Neon"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white"
        >
          GitHub
          <ArrowUpRight size={13} className="text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white/70" />
        </motion.a>
      </div>
    </header>
  )
}
