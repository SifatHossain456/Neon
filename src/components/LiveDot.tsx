'use client'
import { motion } from 'framer-motion'

export function LiveDot({ color = '#22c55e' }: { color?: string }) {
  return (
    <span className="relative inline-flex items-center justify-center w-2 h-2">
      <motion.span
        className="absolute inline-flex rounded-full opacity-75"
        style={{ backgroundColor: color, width: 8, height: 8 }}
        animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="relative inline-flex rounded-full w-2 h-2" style={{ backgroundColor: color }} />
    </span>
  )
}
