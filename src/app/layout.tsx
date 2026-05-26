import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Neon — Multi-Chain Dashboard', template: '%s — Neon' },
  description: 'Live on-chain data for Monad, Sui, Aptos, Solana and Arc — block numbers, TPS, latency and token prices in real time.',
  keywords: ['Monad', 'Sui', 'Aptos', 'Solana', 'Arc', 'multi-chain', 'blockchain', 'dashboard', 'TPS', 'block explorer'],
  openGraph: {
    title: 'Neon — Multi-Chain Dashboard',
    description: 'Live on-chain data for Monad, Sui, Aptos, Solana and Arc.',
    type: 'website',
    siteName: 'Neon',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neon — Multi-Chain Dashboard',
    description: 'Real-time block numbers, TPS, latency and prices across 5 chains.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
