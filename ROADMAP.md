# Neon Roadmap

Live status of the project plan. Checked items are shipped on `main`.

## Phase 1 — Arc detail page & honest health metrics ✅

- [x] `/chain/arc` detail page: Blockscout stats grid (gas tiers in gwei + $ per
      21k-gas transfer, tx today, total tx, addresses, utilization %, avg block
      time), live latest-block feed with RPC fallback, chain params, faucet and
      EIP-3085 add-to-wallet.
- [x] Detail links from the dashboard (Arc live; other chains show an honest
      "coming soon" state).
- [x] Real block-time estimates for EVM chains (Arc, Monad) from consecutive
      poll deltas — labeled `est. from last N polls`.
- [x] Uptime % per chain since page load (successful polls / total polls, N
      shown on every card).
- [x] Latency history persisted to `localStorage` (200 samples/chain) so
      sparklines survive reloads.
- [x] PWA web manifest, dynamic OG image, `/api/status` JSON endpoint, roadmap.

## Phase 2 — Parity detail pages & comparison

- [ ] Detail pages for Monad, Sui, Aptos and Solana (per-chain data sources:
      explorer APIs where available, RPC otherwise).
- [ ] Side-by-side compare view (select 2–5 chains, overlay metrics).
- [ ] Keyboard shortcuts (`1`–`5` to focus a chain, `r` refresh, `c` compare).

## Phase 3 — Price robustness

- [ ] CoinGecko response caching (short TTL) to smooth rate limits.
- [ ] DefiLlama price fallback when CoinGecko is unreachable.
- [ ] 7-day price sparklines on cards + detail pages.

## Phase 4 — Alerts & sharing

- [ ] Local alerts (offline, latency spikes, gas above a threshold) with
      per-chain toggle, persisted in the browser.
- [ ] Shareable snapshot link (compact URL encoding the latest poll state).

## Phase 5 — Quality gates

- [ ] Vitest unit tests for fetchers, formatters and persistence helpers.
- [ ] Lighthouse ≥ 95 across performance, accessibility and best practices.
- [ ] Full a11y pass (keyboard nav, focus traps, screen-reader labels).

## Not adding

- Wallets, portfolios or balances — Neon watches networks, not accounts.
- Unrelated DeFi / NFT feeds — scope stays on core chain health metrics.
