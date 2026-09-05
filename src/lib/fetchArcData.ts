// Arc testnet (chainId 5042002) data for the /chain/arc detail page.
// Primary source: Blockscout ArcScan free API (https://testnet.arcscan.app/api/v2).
// The live block feed falls back to the public RPC when the API is unreachable.
// Every network call can return `null`/an empty result — the UI then shows an
// honest offline state instead of invented numbers.

import { getJson, rpcPost } from '@/lib/fetchChainData'

export const ARC_EXPLORER = 'https://testnet.arcscan.app'
export const ARC_RPC = 'https://rpc.testnet.arc.network'
export const ARC_CHAIN_ID = 5042002
export const ARC_CHAIN_ID_HEX = '0x4cef52'
export const ARC_FAUCET = 'https://faucet.circle.com'
export const ARC_STATUS_PAGE = 'https://status.arc.io'

/** Cost of a plain 21000-gas USDC transfer — the number Neon quotes. */
export const ARC_TRANSFER_GAS = 21_000

export interface ArcStats {
  /** Gas tiers in gwei, exactly as Blockscout reports them. */
  gasSlowGwei: number | null
  gasAverageGwei: number | null
  gasFastGwei: number | null
  gasUpdatedAt: string | null
  transactionsToday: number | null
  totalTransactions: number | null
  totalAddresses: number | null
  /** 0-100 %, from Blockscout. */
  utilizationPct: number | null
  /** Average block time in milliseconds. */
  avgBlockTimeMs: number | null
  /** True when the API responded at all (even if a field was missing). */
  online: boolean
}

export interface ArcBlockFeedItem {
  height: number
  /** Epoch ms. */
  timestamp: number
  txCount: number
  gasUsed: number
  gasLimit: number | null
  baseFeeGwei: number | null
  hash: string
  miner: string | null
  /** Which endpoint actually produced this row. */
  source: 'blockscout' | 'rpc'
}

export interface ArcBlocksResult {
  items: ArcBlockFeedItem[]
  source: 'blockscout' | 'rpc'
}

function asFinite(v: unknown): number | null {
  if (typeof v === 'number' && isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return isFinite(n) ? n : null
  }
  return null
}

function hexToInt(hex: unknown): number | null {
  if (typeof hex !== 'string') return null
  const n = parseInt(hex, 16)
  return isFinite(n) ? n : null
}

/**
 * GET /api/v2/stats — network-level counters. Returns null only when the
 * request itself fails (the page then shows that panel as offline).
 */
export async function fetchArcStats(): Promise<ArcStats | null> {
  const raw = await getJson<Record<string, unknown>>(`${ARC_EXPLORER}/api/v2/stats`)
  if (!raw) return null
  const gas = (raw.gas_prices ?? {}) as Record<string, unknown>
  return {
    gasSlowGwei: asFinite(gas.slow),
    gasAverageGwei: asFinite(gas.average),
    gasFastGwei: asFinite(gas.fast),
    gasUpdatedAt: typeof raw.gas_price_updated_at === 'string' ? raw.gas_price_updated_at : null,
    transactionsToday: asFinite(raw.transactions_today),
    totalTransactions: asFinite(raw.total_transactions),
    totalAddresses: asFinite(raw.total_addresses),
    utilizationPct: asFinite(raw.network_utilization_percentage),
    avgBlockTimeMs: asFinite(raw.average_block_time),
    online: true,
  }
}

function parseBlockscoutItem(item: Record<string, unknown>): ArcBlockFeedItem | null {
  const height = asFinite(item.height)
  const timestamp =
    typeof item.timestamp === 'string'
      ? Date.parse(item.timestamp)
      : asFinite(item.timestamp) !== null
        ? (asFinite(item.timestamp) as number) * 1000
        : NaN
  const miner = item.miner as Record<string, unknown> | null
  return {
    height: height ?? NaN,
    timestamp: isFinite(timestamp) ? timestamp : NaN,
    txCount: asFinite(item.tx_count) ?? 0,
    gasUsed: asFinite(item.gas_used) ?? 0,
    gasLimit: asFinite(item.gas_limit),
    baseFeeGwei: asFinite(item.base_fee_per_gas) !== null ? (asFinite(item.base_fee_per_gas) as number) / 1e9 : null,
    hash: typeof item.hash === 'string' ? item.hash : '',
    miner: typeof miner?.hash === 'string' ? (miner.hash as string) : null,
    source: 'blockscout',
  }
}

function parseRpcBlock(block: Record<string, unknown>): ArcBlockFeedItem | null {
  const height = hexToInt(block.number)
  if (height === null) return null
  const tsSec = hexToInt(block.timestamp)
  const txList = Array.isArray(block.transactions) ? block.transactions : []
  return {
    height,
    timestamp: tsSec !== null ? tsSec * 1000 : NaN,
    txCount: txList.length,
    gasUsed: hexToInt(block.gasUsed) ?? 0,
    gasLimit: hexToInt(block.gasLimit),
    baseFeeGwei: hexToInt(block.baseFeePerGas) !== null ? (hexToInt(block.baseFeePerGas) as number) / 1e9 : null,
    hash: typeof block.hash === 'string' ? block.hash : '',
    miner: typeof block.miner === 'string' ? block.miner : null,
    source: 'rpc',
  }
}

/**
 * Latest blocks feed. Tries the Blockscout blocks list first; if that fails
 * it falls back to RPC `eth_getBlockByNumber('latest')` (one row). Returns
 * null only when both endpoints are unreachable.
 */
export async function fetchArcLatestBlocks(limit = 12): Promise<ArcBlocksResult | null> {
  const raw = await getJson<{ items?: unknown[] }>(`${ARC_EXPLORER}/api/v2/blocks?type=block`)
  if (raw && Array.isArray(raw.items) && raw.items.length > 0) {
    const items: ArcBlockFeedItem[] = []
    for (const it of raw.items) {
      const parsed = parseBlockscoutItem(it as Record<string, unknown>)
      if (parsed && isFinite(parsed.height)) items.push(parsed)
      if (items.length >= limit) break
    }
    if (items.length > 0) return { items, source: 'blockscout' }
  }

  // Honest RPC fallback: latest block only.
  const block = await rpcPost(ARC_RPC, 'eth_getBlockByNumber', ['latest', false])
  if (block && typeof block === 'object') {
    const parsed = parseRpcBlock(block as Record<string, unknown>)
    if (parsed && isFinite(parsed.height)) return { items: [parsed], source: 'rpc' }
  }
  return null
}

export type AddWalletResult = 'added' | 'rejected' | 'unsupported' | 'error'

interface WalletLike {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

function getWallet(): WalletLike | null {
  if (typeof window === 'undefined') return null
  const eth = (window as unknown as { ethereum?: WalletLike }).ethereum
  return eth && typeof eth.request === 'function' ? eth : null
}

/** True when a browser extension wallet (MetaMask etc.) is installed. */
export function hasWallet(): boolean {
  return getWallet() !== null
}

/** Adds Arc testnet to the connected wallet via EIP-3085 wallet_addEthereumChain. */
export async function addArcToWallet(): Promise<AddWalletResult> {
  const wallet = getWallet()
  if (!wallet) return 'unsupported'
  try {
    await wallet.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: ARC_CHAIN_ID_HEX,
          chainName: 'Arc Testnet',
          nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 18 },
          rpcUrls: [ARC_RPC],
          blockExplorerUrls: [ARC_EXPLORER],
        },
      ],
    })
    return 'added'
  } catch (err) {
    const code = (err as { code?: unknown })?.code
    return code === 4001 ? 'rejected' : 'error'
  }
}
