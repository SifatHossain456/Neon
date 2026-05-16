'use client'
import { motion } from 'framer-motion'
import { WalletButton } from './WalletButton'

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
      >
        <div className="w-6 h-6 rounded bg-gradient-to-br from-[#836ef9] to-[#4da2ff] flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">N</span>
        </div>
        <span className="text-white font-semibold tracking-tight">Neon</span>
        <span className="text-white/20 text-xs ml-1">multichain</span>
      </motion.div>
      <WalletButton />
    </header>
  )
}
