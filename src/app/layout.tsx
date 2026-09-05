import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Neon — Live Multi-Chain Dashboard', template: '%s — Neon' },
  description:
    'Live on-chain data for Monad, Sui, Aptos, Solana and Arc (testnet) — block heights, TPS, gas prices, latency and token prices polled straight from public RPCs. No API keys, no wallet.',
  keywords: [
    'Monad',
    'Sui',
    'Aptos',
    'Solana',
    'Arc testnet',
    'Arc network 5042002',
    'multi-chain',
    'blockchain dashboard',
    'block explorer',
    'TPS',
    'gas price',
    'live RPC data',
  ],
  applicationName: 'Neon',
  openGraph: {
    title: 'Neon — Live Multi-Chain Dashboard',
    description:
      'Real-time block heights, TPS, gas and token prices across Monad, Sui, Aptos, Solana and Arc.',
    type: 'website',
    siteName: 'Neon',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neon — Live Multi-Chain Dashboard',
    description:
      'Live block data for Monad, Sui, Aptos, Solana and Arc testnet from public RPCs — no API keys.',
  },
}

export const viewport: Viewport = {
  themeColor: '#07070d',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
