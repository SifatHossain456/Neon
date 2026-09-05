'use client'
// Monad testnet (chain 10143) detail page. EVM L1 — all data comes straight
// from the public testnet RPC: eth_blockNumber, eth_gasPrice, eth_chainId and
// a walking eth_getBlockByNumber feed. No explorer API dependency.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  Blocks,
  Check,
  ExternalLink,
  Fuel,
  Radio,
  Timer,
  Wallet,
} from 'lucide-react'
import type { ChainConfig } from '@/lib/chainConfigs'
import {
  fetchMonadBlocks,
  fetchMonadDetail,
  MONAD_CHAIN_ID,
  MONAD_CHAIN_ID_HEX,
  MONAD_EXPLORER,
  MONAD_RPC,
  type MonadBlockInfo,
  type MonadDetailData,
} from '@/lib/fetchDetailData'
import { addEvmChainToWallet, type AddWalletResult } from '@/lib/wallet'
import { fmtAge, fmtBlock, fmtCompact, fmtGwei, fmtInt, fmtLatency } from '@/lib/format'
import {
  ConnectingNote,
  ExternalLinkMini,
  OfflineNote,
  Panel,
  PanelStateTag,
  ParamRow,
  Tile,
  useNow,
} from '@/components/detail/atoms'
import { ChainDetailShell } from '@/components/detail/ChainDetailShell'

const POLL_MS = 10_000
const TRANSFER_GAS = 21_000

/** Native MON cost of a 21k-gas transfer at the live gas price. */
function transferMon(gwei: number | null): number | null {
  if (gwei === null || !isFinite(gwei)) return null
  return (gwei * 1e9 * TRANSFER_GAS) / 1e18
}

function fmtMon(n: number): string {
  if (n >= 1) return `${n.toFixed(4)} MON`
  if (n >= 0.001) return `${n.toFixed(6)} MON`
  return `${n.toPrecision(3)} MON`
}

interface PollState {
  data: MonadDetailData | null
  state: 'loading' | 'online' | 'offline'
  updatedAt: number | null
}

const initialPoll: PollState = { data: null, state: 'loading', updatedAt: null }

export function MonadDetail({ config }: { config: ChainConfig }) {
  const now = useNow(1000)
  const [poll, setPoll] = useState<PollState>(initialPoll)
  const [blocks, setBlocks] = useState<{
    items: MonadBlockInfo[]
    state: 'loading' | 'online' | 'offline'
    updatedAt: number | null
  }>({ items: [], state: 'loading', updatedAt: null })
  const [walletMsg, setWalletMsg] = useState<string | null>(null)
  const [walletBusy, setWalletBusy] = useState(false)
  const inFlight = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      const [detail, blockList] = await Promise.all([
        fetchMonadDetail(),
        fetchMonadBlocks(10),
      ])
      setPoll({
        data: detail,
        state: detail === null ? 'offline' : 'online',
        updatedAt: Date.now(),
      })
      setBlocks({
        items: blockList ?? [],
        state: blockList === null ? 'offline' : 'online',
        updatedAt: Date.now(),
      })
    } finally {
      inFlight.current = false
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = setInterval(() => void refresh(), POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  const handleAddWallet = async () => {
    if (walletBusy) return
    setWalletBusy(true)
    setWalletMsg(null)
    const result: AddWalletResult = await addEvmChainToWallet({
      chainId: MONAD_CHAIN_ID_HEX,
      chainName: 'Monad Testnet',
      nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
      rpcUrls: [MONAD_RPC],
      blockExplorerUrls: [config.explorerUrl],
    })
    const text: Record<AddWalletResult, string> = {
      added: 'Monad testnet was added to your wallet.',
      rejected: 'The wallet request was rejected.',
      unsupported: 'No browser wallet detected (e.g. MetaMask).',
      error: 'Could not add the chain — check the wallet for details.',
    }
    setWalletMsg(text[result])
    setWalletBusy(false)
  }

  const status = poll.state === 'loading' ? 'connecting' : poll.state === 'online' ? 'online' : 'offline'
  const d = poll.data
  const head = d?.latest ?? null
  const gasPrice = d?.gasPriceGwei ?? null
  const monCost = transferMon(gasPrice)

  return (
    <ChainDetailShell
      config={config}
      status={status}
      description={
        <>
          Gas is paid in native <span className="text-white/55">MON</span> — Neon converts the live
          gas price into the estimated cost of a plain 21,000-gas transfer.
        </>
      }
      actions={
        <>
          <a
            href={config.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white/75 transition-colors hover:border-white/25 hover:text-white"
          >
            {config.explorerLabel}
            <ExternalLink size={13} className="text-white/35" />
          </a>
          <button
            type="button"
            onClick={handleAddWallet}
            disabled={walletBusy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/85 transition-all hover:border-white/25 hover:bg-white/[0.07] hover:text-white active:scale-[0.98] disabled:opacity-60"
          >
            <Wallet size={13} className="text-white/45" />
            {walletBusy ? 'Adding…' : 'Add to wallet'}
          </button>
        </>
      }
      note={
        <>
          Every number here is a live HTTP response from the public Monad testnet RPC — when it is
          down, Neon says so. Data refreshes every {POLL_MS / 1000} seconds.
        </>
      }
    >
      {walletMsg && (
        <p className="mb-4 text-xs text-white/45">{walletMsg}</p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: block feed */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel
            title="Live blocks"
            icon={<Blocks size={13} />}
            tag={
              <PanelStateTag
                state={blocks.state}
                text={
                  blocks.state === 'online'
                    ? `RPC · ${fmtAge(blocks.updatedAt, now)}`
                    : undefined
                }
              />
            }
          >
            {blocks.state === 'loading' ? (
              <ConnectingNote />
            ) : blocks.state === 'offline' || blocks.items.length === 0 ? (
              <OfflineNote>
                The public Monad testnet RPC did not answer the last poll. The feed resumes
                automatically once it recovers — nothing is estimated or cached.
              </OfflineNote>
            ) : (
              <ul className="flex flex-col divide-y divide-white/[0.04]">
                {blocks.items.map((b, i) => (
                  <BlockRow key={`${b.number}-${i}`} block={b} now={now} isLatest={i === 0} />
                ))}
              </ul>
            )}
            <p className="mt-3 text-[10px] leading-relaxed text-white/25">
              Latest {blocks.items.length > 0 ? `${blocks.items.length} blocks` : 'blocks'} by walking{' '}
              eth_getBlockByNumber backwards from the chain head. Utilization is gas used ÷ gas limit
              on each block.
            </p>
          </Panel>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-4">
          {/* RPC live */}
          <Panel
            title="RPC status"
            icon={<Radio size={13} />}
            tag={
              <span className="inline-flex items-center rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-white/35">
                eth_blockNumber
              </span>
            }
          >
            {poll.state === 'loading' ? (
              <ConnectingNote />
            ) : poll.state === 'offline' || d === null ? (
              <div className="flex flex-col gap-2">
                <OfflineNote>
                  The public Monad testnet RPC did not answer the last poll. Latest block and gas
                  values stay cleared until it recovers.
                </OfflineNote>
                <p className="text-[10.5px] text-white/25">
                  Last successful poll: {poll.updatedAt ? fmtAge(poll.updatedAt, now) : 'never'}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                  <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
                    <span>Latest block</span>
                    <span className="font-mono normal-case tracking-normal text-white/25">
                      chain {MONAD_CHAIN_ID}
                    </span>
                  </div>
                  <div className="mt-1 truncate font-mono text-[26px] font-semibold leading-none tracking-tight text-white">
                    {d.blockNumber !== null ? fmtBlock(d.blockNumber) : '—'}
                  </div>
                  {head && (
                    <div className="mt-1.5 text-[10px] text-white/30">
                      {fmtInt(head.txCount)} tx · {fmtCompact(head.gasUsed)} gas ·{' '}
                      {head.utilizationPct.toFixed(1)}% utilized
                    </div>
                  )}
                </div>
                <Tile
                  label="Gas · MON"
                  icon={<Fuel size={11} />}
                  value={gasPrice !== null ? fmtGwei(gasPrice) : '—'}
                  caption={
                    monCost !== null ? `≈ ${fmtMon(monCost)} / 21k-gas transfer` : '21k-gas transfer'
                  }
                />
                <Tile
                  label="Latency"
                  icon={<Timer size={11} />}
                  value={d.latencyMs !== null ? fmtLatency(d.latencyMs) : '—'}
                  caption={`last poll ${poll.updatedAt ? fmtAge(poll.updatedAt, now) : '—'}`}
                />
              </div>
            )}
            <p className="mt-3 text-[10px] leading-relaxed text-white/25">
              Polled straight from {MONAD_RPC} every {POLL_MS / 1000} seconds. No API key, no
              middleman.
            </p>
          </Panel>

          {/* Chain params */}
          <Panel title="Chain" icon={<Activity size={13} />}>
            <dl className="flex flex-col gap-2.5 text-[12.5px]">
              <ParamRow label="Chain ID" value={fmtInt(MONAD_CHAIN_ID)} mono />
              <ParamRow label="Network" value="Testnet · EVM L1" />
              <ParamRow label="Gas token" value="MON (native · 18 dec)" />
              <ParamRow label="RPC" value={MONAD_RPC} mono truncate />
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-white/[0.05] pt-2.5">
                <ExternalLinkMini href={config.explorerUrl} label={config.explorerLabel} />
                <ExternalLinkMini href="https://docs.monad.xyz" label="Monad docs" />
              </div>
            </dl>
            <button
              type="button"
              onClick={handleAddWallet}
              disabled={walletBusy}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs font-semibold text-white/85 transition-all hover:border-white/25 hover:bg-white/[0.07] hover:text-white active:scale-[0.99] disabled:opacity-60"
            >
              {walletMsg?.startsWith('Monad testnet was added') ? (
                <Check size={13} className="text-emerald-400" />
              ) : (
                <Wallet size={13} className="text-white/45" />
              )}
              {walletBusy ? 'Adding chain…' : 'Add Monad testnet to wallet'}
            </button>
            <p className="mt-2 text-[10px] leading-relaxed text-white/25">
              Uses EIP-3085 (wallet_addEthereumChain). Requires a browser wallet like MetaMask.
            </p>
          </Panel>
        </div>
      </div>
    </ChainDetailShell>
  )
}

function BlockRow({
  block,
  now,
  isLatest,
}: {
  block: MonadBlockInfo
  now: number
  isLatest: boolean
}) {
  return (
    <li className="px-1 py-2.5 transition-colors hover:bg-white/[0.02]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isLatest && (
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-400" />
          )}
          <a
            href={`${MONAD_EXPLORER}/block/${block.number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate font-mono text-[13px] font-medium text-white/85 tabular-nums transition-colors hover:text-white"
          >
            {fmtBlock(block.number)}
          </a>
          {block.hash && (
            <span className="hidden font-mono text-[10px] text-white/25 md:inline">
              {block.hash.slice(0, 8)}…{block.hash.slice(-6)}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="font-mono text-[11px] text-white/60 tabular-nums">
            {fmtInt(block.txCount)} tx
          </span>
          {block.baseFeeGwei !== null && (
            <span className="hidden font-mono text-[10.5px] text-white/30 tabular-nums sm:inline">
              base {fmtGwei(block.baseFeeGwei)}
            </span>
          )}
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 pl-3.5">
        <span className="font-mono text-[10px] text-white/30 tabular-nums">
          {isFinite(block.timestampMs) ? fmtAge(block.timestampMs, now) : '—'}
        </span>
        <span className="font-mono text-[10px] text-white/25 tabular-nums">
          {fmtCompact(block.gasUsed)} gas · {block.utilizationPct.toFixed(1)}%
          <ArrowUpRight size={9} className="ml-1 inline text-white/20" />
        </span>
      </div>
    </li>
  )
}
