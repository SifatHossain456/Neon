// Formatting helpers shared across the dashboard. Values passed in here are
// always real measured/fetched numbers — never placeholders.

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-US')
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
