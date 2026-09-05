// Formatting helpers shared across the dashboard. Values passed in here are
// always real measured/fetched numbers — never placeholders.

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

/** Compact integer, e.g. 3509470 → "3.51M", 12345 → "12.35K". */
export function fmtCompact(n: number): string {
  if (!isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return `${Math.round(n)}`
}

export function fmtBlock(n: number): string {
  return `#${fmtInt(n)}`
}

export function fmtPrice(usd: number): string {
  if (usd < 0.01) return `$${usd.toFixed(6)}`
  return `$${usd.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`
}

export function fmtChange(v: number): string {
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(2)}%`
}

export function fmtLatency(ms: number): string {
  const rounded = Math.round(ms)
  return rounded >= 1000 ? `${(rounded / 1000).toFixed(2)}s` : `${rounded}ms`
}

/** Gas price in gwei — quoted the way EVM block explorers quote it. */
export function fmtGwei(gwei: number): string {
  if (!isFinite(gwei)) return '—'
  if (gwei >= 1000) return `${gwei.toFixed(0)} gwei`
  if (gwei >= 1) return `${gwei.toFixed(2)} gwei`
  // Sub-1 gwei: keep 3 significant digits without exponent blow-up.
  const s = gwei.toPrecision(3)
  return `${Number(s).toString()} gwei`
}

export function fmtAge(updatedAt: number | null, now: number): string {
  if (!updatedAt) return '—'
  const s = Math.max(0, Math.floor((now - updatedAt) / 1000))
  if (s < 1) return 'just now'
  if (s < 90) return `${s}s ago`
  return `${Math.round(s / 60)}m ago`
}

/**
 * Tiny dollar amounts (Arc testnet pays gas in USDC ≈ $1/native token).
 * A 21000-gas transfer at ~30-40 gwei is ~$0.0006, so keep 5 decimals
 * below a cent and only fall back to $x.xx formatting for real money.
 */
export function fmtGasUsd(usd: number): string {
  if (!isFinite(usd)) return '—'
  if (usd >= 1) return `$${usd.toFixed(2)}`
  return `$${usd.toFixed(5)}`
}

/** Seconds-per-block estimate, e.g. 0.51s → "510ms", 1.4s → "1.40s". */
export function fmtBlockTimeSec(sec: number | null): string {
  if (sec === null || !isFinite(sec)) return '—'
  if (sec < 0.1) return `${Math.round(sec * 1000)}ms`
  return `${sec.toFixed(2)}s`
}

/** Blockscout reports average block time in milliseconds. */
export function fmtAvgBlockTimeMs(ms: number | null): string {
  if (ms === null || !isFinite(ms)) return '—'
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`
}

/** Uptime percentage since page load, or null before the first poll ends. */
export function uptimePct(polls: number, successes: number): number | null {
  if (polls <= 0) return null
  return Math.round((successes / polls) * 100)
}
