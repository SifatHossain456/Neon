export type ChainId = 'monad' | 'sui' | 'aptos' | 'solana' | 'arc'

export interface ChainConfig {
  id: ChainId
  name: string
  initials: string
  tagline: string
  color: string
  accent: string
  nativeToken: string
  nativeTokenName: string
  coinGeckoId: string | null
  rpcUrl: string
  explorerUrl: string
  explorerLabel: string
  chainId: number | null
  network: 'mainnet' | 'testnet'
  /** What the RPC "height" metric actually is — we label it honestly per chain. */
  blockLabel: 'Block' | 'Slot' | 'Checkpoint'
  showTps: boolean
  showGas: boolean
  hasPrice: boolean
  note: string
}

export const CHAIN_CONFIGS: ChainConfig[] = [
  {
    id: 'monad',
    name: 'Monad',
    initials: 'M',
    tagline: 'EVM L1 · testnet',
    color: '#8b7cf8',
    accent: '#b9a8ff',
    nativeToken: 'MON',
    nativeTokenName: 'Monad',
    coinGeckoId: null,
    rpcUrl: 'https://testnet-rpc.monad.xyz',
    explorerUrl: 'https://testnet.monadexplorer.com',
    explorerLabel: 'MonaExplorer',
    chainId: 10143,
    network: 'testnet',
    blockLabel: 'Block',
    showTps: false,
    showGas: true,
    hasPrice: false,
    note: 'Gas from eth_gasPrice on the public testnet RPC.',
  },
  {
    id: 'sui',
    name: 'Sui',
    initials: 'S',
    tagline: 'Move L1 · mainnet',
    color: '#4da2ff',
    accent: '#63e2ff',
    nativeToken: 'SUI',
    nativeTokenName: 'Sui',
    coinGeckoId: 'sui',
    rpcUrl: 'https://fullnode.mainnet.sui.io:443',
    explorerUrl: 'https://suiscan.xyz',
    explorerLabel: 'Suiscan',
    chainId: null,
    network: 'mainnet',
    blockLabel: 'Checkpoint',
    showTps: true,
    showGas: false,
    hasPrice: true,
    note: 'TPS estimated from the latest checkpoint window.',
  },
  {
    id: 'aptos',
    name: 'Aptos',
    initials: 'A',
    tagline: 'Move L1 · mainnet',
    color: '#00d4aa',
    accent: '#3cf5c6',
    nativeToken: 'APT',
    nativeTokenName: 'Aptos',
    coinGeckoId: 'aptos',
    rpcUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
    explorerUrl: 'https://explorer.aptoslabs.com',
    explorerLabel: 'Aptos Explorer',
    chainId: null,
    network: 'mainnet',
    blockLabel: 'Block',
    showTps: true,
    showGas: false,
    hasPrice: true,
    note: 'TPS derived from ledger growth reported by the fullnode.',
  },
  {
    id: 'solana',
    name: 'Solana',
    initials: 'S',
    tagline: 'SVM L1 · mainnet',
    color: '#9945ff',
    accent: '#14f195',
    nativeToken: 'SOL',
    nativeTokenName: 'Solana',
    coinGeckoId: 'solana',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    explorerLabel: 'Solana Explorer',
    chainId: null,
    network: 'mainnet',
    blockLabel: 'Slot',
    showTps: true,
    showGas: false,
    hasPrice: true,
    note: 'TPS from recent performance samples on the public RPC.',
  },
  {
    id: 'arc',
    name: 'Arc',
    initials: 'A',
    tagline: 'EVM L1 · gas in USDC',
    color: '#ff6b6b',
    accent: '#ffa26b',
    nativeToken: 'USDC',
    nativeTokenName: 'USD Coin',
    coinGeckoId: null,
    rpcUrl: 'https://rpc.testnet.arc.network',
    explorerUrl: 'https://testnet.arcscan.app',
    explorerLabel: 'ArcScan',
    chainId: 5042002,
    network: 'testnet',
    blockLabel: 'Block',
    showTps: false,
    showGas: true,
    hasPrice: false,
    note: 'Chain 5042002 · gas is paid in USDC (6 decimals) on testnet.',
  },
]

export const CHAIN_BY_ID: Record<ChainId, ChainConfig> = Object.fromEntries(
  CHAIN_CONFIGS.map((c) => [c.id, c])
) as Record<ChainId, ChainConfig>
