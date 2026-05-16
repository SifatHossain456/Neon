export interface ChainData {
  id: string
  name: string
  color: string
  nativeToken: string
  blockNumber: number | null
  tps: number | null
  latency: number | null
  isLoading: boolean
  isTestnet: boolean
  explorer: string
  description: string
}

export interface TokenPrice {
  symbol: string
  price: number
  change24h: number
  coinGeckoId: string
}
