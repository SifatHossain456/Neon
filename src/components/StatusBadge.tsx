'use client'

export type HealthState = 'online' | 'offline' | 'connecting'

const STYLES: Record<HealthState, { label: string; classes: string; dot: string; pulse: boolean }> = {
  online: {
    label: 'Live',
    classes: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
    dot: 'bg-emerald-400',
    pulse: true,
  },
  offline: {
    label: 'Offline',
    classes: 'text-red-300 border-red-400/30 bg-red-400/10',
    dot: 'bg-red-400',
    pulse: false,
  },
  connecting: {
    label: 'Syncing',
    classes: 'text-amber-300 border-amber-400/30 bg-amber-400/10',
    dot: 'bg-amber-300',
    pulse: true,
  },
}

export function StatusBadge({ state }: { state: HealthState }) {
  const s = STYLES[state]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] ${s.classes}`}
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        {s.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${s.dot}`}
          />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${s.dot}`} />
      </span>
      {s.label}
    </span>
  )
}
