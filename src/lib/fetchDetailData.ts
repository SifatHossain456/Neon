// Detail-page fetchers for the Phase-2 chain pages (Monad, Solana here; Sui
// and Aptos live in fetchSuiAptosDetail.ts). Every network call is wrapped so
// a failure returns `null` / empty fields — the UI then shows an honest
// OFFLINE state instead of invented numbers. Same honesty policy as the
// dashboard pollers, just deeper per-chain questions.

import { rpcPost } from '@/lib/fetchChainData'

export const MONAD_CHAIN_ID = 10143
export const MONAD_CHAIN_ID_HEX = '0x279f'
export const MONAD_RPC = 'https://testnet-rpc.monad.xyz'
export const MONAD_EXPLORER = 'https://testnet.monadexplorer.com'

// ---------------------------------------------------------------------------
// Numeric tolerance helpers (EVM 0x-hex strings, JSON numbers, plain strings)
// ---------------------------------------------------------------------------

function hexToInt(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : null
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (s === '') return null
  const n = /^0x/i.test(s) ? parseInt(s, 16) : parseInt(s, 10)
  return Number.isFinite(n) ? n : null
}

function decToInt(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) && Number.isInteger(v) ? v : null
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) && Number.isInteger(n) ? n : null
  }
  return null
}

function weiToGwei(v: unknown): number | null {
  if (v === null || v === undefined) return null
  try {
    const n = Number(BigInt(String(v)))
    return Number.isFinite(n) ? n / 1e9 : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Monad testnet (EVM L1, chain 10143)
// ---------------------------------------------------------------------------

export interface MonadBlockInfo {
  number: number
  /** Epoch ms. */
  timestampMs: number
  txCount: number
  gasUsed: number
  gasLimit: number
  /** 0-100 %, gasUsed / gasLimit. */
  utilizationPct: number
  baseFeeGwei: number | null
  hash: string
}

export interface MonadDetailData {
  blockNumber: number
  gasPriceGwei: number | null
  latest: MonadBlockInfo
  latencyMs: number
}

function parseEvmBlock(block: unknown): MonadBlockInfo | null {
  if (!block || typeof block !== 'object') return null
  const b = block as Record<string, unknown>
  const number = hexToInt(b.number)
  if (number === null) return null
  const tsSec = hexToInt(b.timestamp)
  const gasUsed = hexToInt(b.gasUsed) ?? 0
  const gasLimit = hexToInt(b.gasLimit)
  return {
    number,
    timestampMs: tsSec !== null ? tsSec * 1000 : NaN,
    txCount: Array.isArray(b.transactions) ? b.transactions.length : 0,
    gasUsed,
    gasLimit: gasLimit ?? 0,
    utilizationPct:
      gasLimit !== null && gasLimit > 0 && gasUsed > 0
        ? Math.min(100, Math.round((gasUsed / gasLimit) * 1000) / 10)
        : 0,
    baseFeeGwei: weiToGwei(b.baseFeePerGas),
    hash: typeof b.hash === 'string' ? b.hash : '',
  }
}

/** eth_chainId + eth_blockNumber + eth_gasPrice + latest block, in parallel. */
export async function fetchMonadDetail(): Promise<MonadDetailData | null> {
  const start = Date.now()
  const [chainIdHex, blockHex, gasHex, blockRaw] = await Promise.all([
    rpcPost(MONAD_RPC, 'eth_chainId'),
    rpcPost(MONAD_RPC, 'eth_blockNumber'),
    rpcPost(MONAD_RPC, 'eth_gasPrice'),
    rpcPost(MONAD_RPC, 'eth_getBlockByNumber', ['latest', false]),
  ])
  if (blockHex === null) return null
  const blockNumber = hexToInt(blockHex)
  const latest = parseEvmBlock(blockRaw)
  if (blockNumber === null || latest === null) return null
  // Sanity: the RPC should report the same head we just fetched.
  if (latest.number !== blockNumber) return null

  void chainIdHex // chain identity is verified statically in the UI config
  return {
    blockNumber,
    gasPriceGwei: weiToGwei(gasHex),
    latest,
    latencyMs: Date.now() - start,
  }
}

/** Latest N blocks by walking eth_getBlockByNumber backwards from the head. */
export async function fetchMonadBlocks(count: number): Promise<MonadBlockInfo[] | null> {
  const headHex = await rpcPost(MONAD_RPC, 'eth_blockNumber')
  const head = hexToInt(headHex)
  if (head === null) return null

  const heights: number[] = []
  for (let i = 0; i < count; i += 1) heights.push(head - i)

  const raws = await Promise.all(
    heights.map((h) => rpcPost(MONAD_RPC, 'eth_getBlockByNumber', ['0x' + h.toString(16), false]))
  )
  const blocks: MonadBlockInfo[] = []
  raws.forEach((raw) => {
    const parsed = parseEvmBlock(raw)
    if (parsed) blocks.push(parsed)
  })
  return blocks.length > 0 ? blocks : null
}

// ---------------------------------------------------------------------------
// Solana mainnet (SVM L1)
// ---------------------------------------------------------------------------

export interface SolanaPerformanceSample {
  slot: number
  tps: number
  numTransactions: number
  samplePeriodSecs: number
}

export interface SolanaPriorityFeeSample {
  slot: number
  feeLamports: number
}

export interface SolanaDetailData {
  slot: number
  blockHeight: number
  epoch: number
  slotIndex: number
  slotsInEpoch: number
  /** 0-100 %, slotIndex / slotsInEpoch. */
  epochProgressPct: number
  /** Transaction count reported by getEpochInfo (cumulative). */
  transactionCount: number | null
  /** Average TPS across the returned performance samples. */
  tps: number | null
  /** Seconds per slot, estimated from the same performance samples. */
  slotTimeSec: number | null
  perfSamples: SolanaPerformanceSample[]
  priorityFeeSamples: SolanaPriorityFeeSample[]
  /** solana-core version, e.g. "2.3.4". */
  coreVersion: string | null
  latencyMs: number
}

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com'

function median(nums: number[]): number | null {
  if (nums.length === 0) return null
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

export async function fetchSolanaDetail(): Promise<SolanaDetailData | null> {
  const start = Date.now()
  const [slotRes, blockHeightRes, epochRes, perfRes, prioRes, versionRes] = await Promise.all([
    rpcPost(SOLANA_RPC, 'getSlot'),
    rpcPost(SOLANA_RPC, 'getBlockHeight'),
    rpcPost(SOLANA_RPC, 'getEpochInfo'),
    rpcPost(SOLANA_RPC, 'getRecentPerformanceSamples', [10]),
    rpcPost(SOLANA_RPC, 'getRecentPrioritizationFees'),
    rpcPost(SOLANA_RPC, 'getVersion'),
  ])
  const slot = hexToInt(slotRes)
  if (slot === null) return null

  const epoch = (epochRes ?? {}) as Record<string, unknown>
  const slotIndex = decToInt(epoch.slotIndex)
  const slotsInEpoch = decToInt(epoch.slotsInEpoch)
  const epochNum = decToInt(epoch.epoch)
  const transactionCount = decToInt(epoch.transactionCount)

  // Weighted average TPS + slot time over the returned performance samples.
  let tps: number | null = null
  let slotTimeSec: number | null = null
  const perfSamples: SolanaPerformanceSample[] = []
  if (Array.isArray(perfRes)) {
    let txTotal = 0
    let secTotal = 0
    let slotTotal = 0
    for (const s of perfRes.slice(0, 10)) {
      const rec = s as Record<string, unknown>
      const numTx = decToInt(rec.numTransactions)
      const secs = decToInt(rec.samplePeriodSecs)
      const slots = decToInt(rec.numSlots)
      const sampleSlot = hexToInt(rec.slot) ?? 0
      if (numTx !== null && secs !== null && secs > 0) {
        perfSamples.push({
          slot: sampleSlot,
          tps: Math.round(numTx / secs),
          numTransactions: numTx,
          samplePeriodSecs: secs,
        })
        txTotal += numTx
        secTotal += secs
        if (slots !== null) slotTotal += slots
      }
    }
    if (secTotal > 0) tps = Math.round(txTotal / secTotal)
    if (slotTotal > 0 && secTotal > 0) {
      const secPerSlot = secTotal / slotTotal
      // Sanity: ~0.1s to ~5s per slot.
      if (secPerSlot >= 0.1 && secPerSlot <= 5) slotTimeSec = secPerSlot
    }
  }

  const priorityFeeSamples: SolanaPriorityFeeSample[] = []
  if (Array.isArray(prioRes)) {
    for (const s of prioRes.slice(0, 20)) {
      const rec = s as Record<string, unknown>
      const fee = decToInt(rec.prioritizationFee)
      const sampleSlot = hexToInt(rec.slot)
      if (fee !== null && sampleSlot !== null) {
        priorityFeeSamples.push({ slot: sampleSlot, feeLamports: fee })
      }
    }
  }

  const version = (versionRes ?? {}) as Record<string, unknown>

  return {
    slot,
    blockHeight: hexToInt(blockHeightRes) ?? 0,
    epoch: epochNum ?? 0,
    slotIndex: slotIndex ?? 0,
    slotsInEpoch: slotsInEpoch ?? 0,
    epochProgressPct:
      slotIndex !== null && slotsInEpoch !== null && slotsInEpoch > 0
        ? Math.min(100, (slotIndex / slotsInEpoch) * 100)
        : 0,
    transactionCount,
    tps,
    slotTimeSec,
    perfSamples,
    priorityFeeSamples,
    coreVersion: typeof version['solana-core'] === 'string' ? (version['solana-core'] as string) : null,
    latencyMs: Date.now() - start,
  }
}

export { median }
