'use client'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { motion } from 'framer-motion'
import { Wallet, LogOut } from 'lucide-react'

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
          {address.slice(0, 6)}&hellip;{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="p-1.5 text-white/40 hover:text-white/80 transition-colors"
        >
          <LogOut size={14} />
        </button>
      </div>
    )
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[#836ef9]/40 text-[#836ef9] hover:bg-[#836ef9]/10 transition-colors disabled:opacity-50"
    >
      <Wallet size={14} />
      {isPending ? 'Connecting…' : 'Connect Wallet'}
    </motion.button>
  )
}
