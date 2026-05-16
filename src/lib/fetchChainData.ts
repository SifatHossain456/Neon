// Fetches real on-chain data from public RPCs

export async function fetchMonadBlock(): Promise<{ blockNumber: number; latency: number } | null> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch('https://testnet-rpc.monad.xyz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    const data = await res.json()
    return {
      blockNumber: parseInt(data.result, 16),
      latency: Date.now() - start,
    }
  } catch {
    return null
  }
}

export async function fetchSuiBlock(): Promise<{ blockNumber: number; tps: number; latency: number } | null> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch('https://fullnode.mainnet.sui.io:443', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'sui_getLatestCheckpointSequenceNumber', params: [] }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    const data = await res.json()
    const latency = Date.now() - start

    // Get TPS from recent checkpoints
    let tps = null
    try {
      const controller2 = new AbortController()
      const timer2 = setTimeout(() => controller2.abort(), 5000)
      const tpsRes = await fetch('https://fullnode.mainnet.sui.io:443', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 2, method: 'sui_getCheckpoint',
          params: [data.result],
        }),
        signal: controller2.signal,
      })
      clearTimeout(timer2)
      const tpsData = await tpsRes.json()
      if (tpsData.result?.transactions) {
        tps = Math.round(tpsData.result.transactions.length / 3)
      }
    } catch { /* ignore */ }

    return {
      blockNumber: parseInt(data.result),
      tps: tps ?? 0,
      latency,
    }
  } catch {
    return null
  }
}

export async function fetchAptosBlock(): Promise<{ blockNumber: number; tps: number; latency: number } | null> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch('https://fullnode.mainnet.aptoslabs.com/v1', {
      signal: controller.signal,
    })
    clearTimeout(timer)
    const data = await res.json()
    return {
      blockNumber: parseInt(data.block_height ?? '0'),
      tps: Math.round(parseInt(data.ledger_version ?? '0') / 3),
      latency: Date.now() - start,
    }
  } catch {
    return null
  }
}

export async function fetchSolanaBlock(): Promise<{ blockNumber: number; tps: number; latency: number } | null> {
  const start = Date.now()
  try {
    const controller1 = new AbortController()
    const timer1 = setTimeout(() => controller1.abort(), 5000)
    const controller2 = new AbortController()
    const timer2 = setTimeout(() => controller2.abort(), 5000)

    const [slotRes, perfRes] = await Promise.all([
      fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot' }),
        signal: controller1.signal,
      }),
      fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 2, method: 'getRecentPerformanceSamples',
          params: [1],
        }),
        signal: controller2.signal,
      }),
    ])
    clearTimeout(timer1)
    clearTimeout(timer2)
    const slotData = await slotRes.json()
    const perfData = await perfRes.json()
    const sample = perfData.result?.[0]
    const tps = sample ? Math.round(sample.numTransactions / sample.samplePeriodSecs) : 0
    return {
      blockNumber: slotData.result,
      tps,
      latency: Date.now() - start,
    }
  } catch {
    return null
  }
}

export async function fetchPrices(): Promise<Record<string, { usd: number; usd_24h_change: number }>> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=sui%2Captos%2Csolana&vs_currencies=usd&include_24hr_change=true',
      { signal: controller.signal }
    )
    clearTimeout(timer)
    return await res.json()
  } catch {
    return {}
  }
}
