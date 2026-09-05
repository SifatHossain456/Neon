import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Neon — Live Multi-Chain Dashboard',
    short_name: 'Neon',
    description:
      'Live block heights, TPS, gas and token prices for Monad, Sui, Aptos, Solana and Arc — straight from public RPCs.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#07070d',
    theme_color: '#07070d',
    categories: ['developer-tools', 'utilities', 'finance'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
