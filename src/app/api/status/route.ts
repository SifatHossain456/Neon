import { NextResponse } from 'next/server'
import {
  fetchAptosBlock,
  fetchArcBlock,
  fetchMonadBlock,
  fetchSolanaBlock,
  fetchSuiBlock,
} from '@/lib/fetchChainData'
import type { ChainId } from '@/lib/chainConfigs'

export const dynamic = 'force-dynamic'

export interface ChainStatus {
  id: ChainId
  online: boolean
  blockNumber: number | null
  latencyMs: number | null
}

/**
 * GET /api/status — lightweight health snapshot of every tracked chain.
 * Same server-safe fetchers as the dashboard, one request per chain,
 * always generated on demand (never cached).
 */
export async function GET() {
  const startedAt = Date.now()
  try {
    const [monad, sui, aptos, solana, arc] = await Promise.all([
      fetchMonadBlock(),
      fetchSuiBlock(),
      fetchAptosBlock(),
      fetchSolanaBlock(),
      fetchArcBlock(),
    ])

    const toStatus = (
      id: ChainId,
      res: Awaited<ReturnType<typeof fetchMonadBlock>>
    ): ChainStatus => ({
      id,
      online: res !== null,
      blockNumber: res?.blockNumber ?? null,
      latencyMs: res?.latency ?? null,
    })

    const chains: ChainStatus[] = [
      toStatus('monad', monad),
      toStatus('sui', sui),
      toStatus('aptos', aptos),
      toStatus('solana', solana),
      toStatus('arc', arc),
    ]

    return NextResponse.json({
      chains,
      generatedAt: new Date().toISOString(),
      tookMs: Date.now() - startedAt,
    })
  } catch (err) {
    console.error('[api/status] failed to assemble snapshot:', err)
    return NextResponse.json(
      {
        chains: [],
        generatedAt: new Date().toISOString(),
        error: 'Status snapshot failed to assemble.',
      },
      { status: 500 }
    )
  }
}
