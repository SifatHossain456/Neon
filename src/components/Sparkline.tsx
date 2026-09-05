'use client'
import { useId } from 'react'

interface SparklineProps {
  values: number[]
  color: string
  /** True when the latest sample came from a live response. */
  live?: boolean
}

/** Tiny SVG trend of real measured latency samples (ms). */
export function Sparkline({ values, color, live = true }: SparklineProps) {
  const gradientId = useId()

  if (values.length < 2) {
    return (
      <div className="flex h-8 w-full items-center text-white/20">
        <div className="h-px w-full border-t border-dashed border-white/10" />
      </div>
    )
  }

  const width = 120
  const height = 32
  const pad = 3
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(1, max - min)

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (width - pad * 2) + pad
    const y = height - pad - ((v - min) / span) * (height - pad * 2)
    return [x, y] as const
  })

  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`
  const stroke = live ? color : 'rgba(255,255,255,0.15)'

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-8 w-full"
      role="img"
      aria-label="RPC latency trend"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
