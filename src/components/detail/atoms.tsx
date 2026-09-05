'use client'
// Shared visual atoms for the per-chain detail pages (generalized from the
// Phase-1 ArcDetail page so every chain gets the same premium glass look).

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertCircle, ArrowUpRight, RefreshCw } from 'lucide-react'

/** 1-second clock so relative ages re-render without re-polling. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export function Panel({
  title,
  icon,
  tag,
  children,
  className = '',
}: {
  title: string
  icon: ReactNode
  tag?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-[0_2px_24px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl ${className}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.05] px-4 py-3 sm:px-5">
        <h2 className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
          <span className="text-white/35">{icon}</span>
          {title}
        </h2>
        {tag}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

export function Tile({
  label,
  value,
  caption,
  dot,
  icon,
}: {
  label: string
  value: ReactNode
  caption?: ReactNode
  dot?: string
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-colors duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
        {icon ? (
          <span className="text-white/30">{icon}</span>
        ) : dot ? (
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot }} />
        ) : null}
        <span>{label}</span>
      </div>
      <div className="font-mono text-[17px] font-semibold leading-none tracking-tight text-white/95 tabular-nums">
        {value}
      </div>
      {caption && <div className="text-[10px] leading-tight text-white/30">{caption}</div>}
    </div>
  )
}

export function OfflineNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-red-400/15 bg-red-400/[0.05] px-3.5 py-3 text-[12.5px] leading-relaxed text-white/50">
      <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400/80" />
      <div>{children}</div>
    </div>
  )
}

export function ConnectingNote() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-[12.5px] text-white/40">
      <RefreshCw size={13} className="animate-spin text-white/30" />
      Connecting&hellip;
    </div>
  )
}

export function PanelStateTag({
  state,
  text,
}: {
  state: 'loading' | 'online' | 'offline'
  text?: string
}) {
  if (state === 'loading') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[9.5px] font-mono uppercase tracking-[0.12em] text-amber-300/80">
        <RefreshCw size={9} className="animate-spin" /> syncing
      </span>
    )
  }
  if (state === 'online') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-2 py-0.5 text-[9.5px] font-mono uppercase tracking-[0.12em] text-emerald-300/70">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {text}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-400/[0.06] px-2 py-0.5 text-[9.5px] font-mono uppercase tracking-[0.12em] text-red-300/70">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      offline
    </span>
  )
}

export function ParamRow({
  label,
  value,
  mono,
  truncate,
}: {
  label: string
  value: string
  mono?: boolean
  truncate?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-white/30">{label}</dt>
      <dd
        className={`text-right text-white/70 ${mono ? 'font-mono text-[11.5px]' : ''} ${
          truncate ? 'max-w-[230px] truncate' : ''
        }`}
        title={truncate ? value : undefined}
      >
        {value}
      </dd>
    </div>
  )
}

export function ExternalLinkMini({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] text-white/55 transition-colors hover:text-white"
    >
      {label}
      <ArrowUpRight size={10} className="text-white/30" />
    </a>
  )
}
