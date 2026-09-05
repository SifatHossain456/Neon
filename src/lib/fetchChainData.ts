// Fetches real on-chain data straight from public RPCs.
// Every network call is wrapped so a failure returns `null` — the UI then
// shows an honest OFFLINE state instead of invented numbers.

const REQUEST_TIMEOUT_MS = 6000

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, cancel: () => clearTimeout(timer) }
}

/** Minimal JSON-RPC 2.0 POST. Returns `result` or `null` on any failure. */
export async function rpcPost(url: string, method: string, params: unknown[] = []): Promise<unknown | null> {
  const { signal, cancel } = withTimeout(REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: { result?: unknown; error?: unknown } = await res.json()
    if (data.error !== undefined) throw new Error('RPC error')
    return data.result ?? null
  } catch {
    return null
  } finally {
    cancel()
  }
}

/** Plain GET returning parsed JSON, or `null` on any failure. */
export async function getJson<T>(url: string): Promise<T | null> {
  const { signal, cancel } = withTimeout(REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } catch {
    return null
  } finally {
    cancel()
  }
}

function hexToInt(hex: unknown): number {
  if (typeof hex !== 'string') throw new Error('bad hex')
  return parseInt(hex, 16)
}

export interface ChainPollResult {
  blockNumber: number
  tps: number | null
  /** eth_gasPrice converted to gwei (wei ÷ 1e9), as block explorers quote it. */
  gasPriceGwei: number | null
  latency: number
}

/** Shared EVM poller: eth_blockNumber + eth_gasPrice in parallel. */
async function fetchEvmBlockAndGas(rpcUrl: string): Promise<ChainPollResult | null> {
  const start = Date.now()
  const [blockHex, gasHex] = await Promise.all([
    rpcPost(rpcUrl, 'eth_blockNumber'),
    rpcPost(rpcUrl, 'eth_gasPrice'),
  ])
  if (blockHex === null || gasHex === null) return null
  try {
    return {
      blockNumber: hexToInt(blockHex),
      tps: null,
      gasPriceGwei: Number(BigInt(String(gasHex))) / 1e9,
      latency: Date.now() - start,
    }
  } catch {
    return null
  }
}

export function fetchMonadBlock(): Promise<ChainPollResult | null> {
  return fetchEvmBlockAndGas('https://testnet-rpc.monad.xyz')
}

export function fetchArcBlock(): Promise<ChainPollResult | null> {
  return fetchEvmBlockAndGas('https://rpc.testnet.arc.network')
}

export async function fetchSuiBlock(): Promise<ChainPollResult | null> {
  const start = Date.now()
  const checkpoint = await rpcPost(
    'https://fullnode.mainnet.sui.io:443',
    'sui_getLatestCheckpointSequenceNumber',
    []
  )
  if (checkpoint === null) return null
  const latency = Date.now() - start
  const blockNumber = hexToInt(checkpoint)

  // Approximate TPS from the transaction count inside the latest checkpoint.
  let tps: number | null = null
  const cp = await rpcPost(
    'https://fullnode.mainnet.sui.io:443',
    'sui_getCheckpoint',
    [checkpoint]
  )
  const txCount = (cp as { transactions?: unknown[] } | null)?.transactions?.length
  if (typeof txCount === 'number' && txCount > 0) {
    tps = Math.round(txCount / 3)
  }

  return { blockNumber, tps, gasPriceGwei: null, latency }
}

export async function fetchAptosBlock(): Promise<ChainPollResult | null> {
  const start = Date.now()
  const data = await getJson<{
    block_height?: string
    ledger_version?: string
    ledger_timestamp?: string
  }>('https://fullnode.mainnet.aptoslabs.com/v1')
  if (!data || !data.ledger_version) return null

  const ledgerVersion = parseInt(data.ledger_version, 10)
  const ledgerTimestampUs = parseInt(data.ledger_timestamp ?? '0', 10)
  const tps =
    ledgerTimestampUs > 0 ? Math.round(ledgerVersion / (ledgerTimestampUs / 1_000_000)) : null

  return {
    blockNumber: parseInt(data.block_height ?? '0', 10) || ledgerVersion,
    tps: tps !== null && isFinite(tps) ? tps : null,
    gasPriceGwei: null,
    latency: Date.now() - start,
  }
}

export async function fetchSolanaBlock(): Promise<ChainPollResult | null> {
  const rpc = 'https://api.mainnet-beta.solana.com'
  const start = Date.now()
  const [slot, perf] = await Promise.all([
    rpcPost(rpc, 'getSlot'),
    rpcPost(rpc, 'getRecentPerformanceSamples', [1]),
  ])
  if (slot === null || perf === null) return null

  const sample = (perf as { numTransactions?: number; samplePeriodSecs?: number }[] | null)?.[0]
  const tps =
    sample &&
    typeof sample.numTransactions === 'number' &&
    typeof sample.samplePeriodSecs === 'number' &&
    sample.samplePeriodSecs > 0
      ? Math.round(sample.numTransactions / sample.samplePeriodSecs)
      : null

  return {
    blockNumber: hexToInt(slot),
    tps: tps !== null && isFinite(tps) ? tps : null,
    gasPriceGwei: null,
    latency: Date.now() - start,
  }
}

export interface PriceInfo {
  usd: number
  usd_24h_change: number
}

/** Public CoinGecko simple/price endpoint — no API key required. */
export async function fetchPrices(): Promise<Record<string, PriceInfo>> {
  const data = await getJson<Record<string, PriceInfo>>(
    'https://api.coingecko.com/api/v3/simple/price?ids=sui%2Captos%2Csolana&vs_currencies=usd&include_24hr_change=true'
  )
  if (!data) return {}
  const clean: Record<string, PriceInfo> = {}
  for (const [id, p] of Object.entries(data)) {
    if (p && typeof p.usd === 'number' && isFinite(p.usd)) {
      clean[id] = {
        usd: p.usd,
        usd_24h_change: Number.isFinite(p.usd_24h_change) ? p.usd_24h_change : 0,
      }
    }
  }
  return clean
}
