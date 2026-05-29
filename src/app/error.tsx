'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Neon] Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="text-5xl mb-6">⚠️</div>
      <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text)' }}>Something went wrong</h1>
      <p className="mb-6 max-w-sm text-sm" style={{ color: 'var(--muted)' }}>
        {error.message || 'Failed to fetch chain data. The RPC endpoints may be temporarily unavailable.'}
      </p>
      {error.digest && (
        <p className="mb-6 text-xs font-mono" style={{ color: 'var(--muted)' }}>ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl font-semibold text-sm bg-violet-600 text-white hover:bg-violet-500 transition-colors"
        >
          Try again
        </button>
        <a
          href="/"
          className="px-6 py-3 rounded-xl font-semibold text-sm border border-white/10 text-gray-400 hover:text-white transition-colors"
        >
          Go home
        </a>
      </div>
    </div>
  )
}
