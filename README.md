# Neon — Live Multi-Chain Dashboard

A real-time dashboard for **Monad, Sui, Aptos, Solana and Arc** — latest block heights/slots, TPS, gas prices, RPC latency and token prices, all polled straight from **public endpoints**. No API keys. No wallet. No middlemen. No invented numbers: if an RPC doesn't answer, Neon shows an honest `OFFLINE` state.

## Features

- **Live chain data** — EVM chains (Monad, Arc) report `eth_blockNumber` + `eth_gasPrice`; Sui reports its latest checkpoint; Aptos its ledger height; Solana its latest slot plus recent performance samples. Every card also shows real **RPC round-trip latency**.
- **Per-chain identity** — each chain gets its own gradient, accent color and honest metric labels (Block vs Slot vs Checkpoint).
- **Unambiguous health** — every chain card carries a `LIVE` / `OFFLINE` / `SYNCING` badge derived from the last actual RPC response.
- **Status summary bar** — “x/5 chains online · last updated Ns ago” with a **manual refresh** button (auto-poll runs every 12 seconds).
- **Real latency sparklines** — tiny SVG trend of the last measured samples per chain, **persisted to `localStorage`** (up to 200/chain) so they survive reloads.
- **Honest health metrics** — per-chain **uptime % since page load** (`ok polls / total polls`, with N shown) and real **block-time estimates** for EVM chains (Arc, Monad) measured from consecutive poll deltas (`est. from last N polls`).
- **Chain detail pages** — `/chain/arc` (Phase 1) shows a live Blockscout stats grid, gas in gwei **and in $ per 21k-gas USDC transfer**, a live block feed with RPC fallback, chain params, faucet and an **EIP-3085 add-to-wallet** button. Other chains get an honest “coming soon” page until Phase 2.
- **Installable PWA** — web manifest with the Neon icon and theme colors.
- **Status API** — `GET /api/status` returns a machine-readable health snapshot of all five chains.
- **Token prices** — SUI, APT, SOL with 24h change via the public **CoinGecko simple/price** endpoint.
- **Glass dark UI** — animated stat transitions, hover micro-interactions, responsive grid that flows from 1 → 2 → 3 → 5 columns.
- **Explorer deep links** — each card and the footer link out to the chain’s block explorer.

> **Honesty policy:** every number on screen comes from a live HTTP response. Testnet RPCs can be flaky or slow; when one is unreachable the card shows `OFFLINE` and the last good value is cleared — nothing is faked or hardcoded.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Motion / icons | framer-motion, lucide-react |
| Fonts | Inter + JetBrains Mono (next/font) |
| Data | Public JSON-RPC endpoints + CoinGecko public API (raw `fetch`, no SDKs) |

## Getting Started

```bash
git clone https://github.com/SifatHossain456/Neon.git
cd Neon
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No `.env` required — everything runs against public endpoints.

Production build:

```bash
npm run build
```

## Chains

| Chain | Network | Chain ID | Public RPC | Explorer | Data points |
|---|---|---|---|---|---|
| Monad | Testnet | 10143 | `https://testnet-rpc.monad.xyz` | [monadexplorer.com](https://testnet.monadexplorer.com) | Block, Gas (gwei), Latency |
| Sui | Mainnet | n/a | `https://fullnode.mainnet.sui.io:443` | [suiscan.xyz](https://suiscan.xyz) | Checkpoint, TPS, Latency |
| Aptos | Mainnet | n/a | `https://fullnode.mainnet.aptoslabs.com/v1` | [explorer.aptoslabs.com](https://explorer.aptoslabs.com) | Block, TPS, Latency |
| Solana | Mainnet | n/a | `https://api.mainnet-beta.solana.com` | [explorer.solana.com](https://explorer.solana.com) | Slot, TPS, Latency |
| **Arc** | **Testnet** | **5042002** | **`https://rpc.testnet.arc.network`** | **[testnet.arcscan.app](https://testnet.arcscan.app)** | **Block, Gas (USDC, gwei), Latency** |

Arc is an EVM chain whose gas token is **USDC** (6 decimals). Neon verifies the chain by its chain ID (`5042002`) and quotes the live gas price in gwei from `eth_gasPrice`, matching how ArcScan displays it.

## Data Sources

- Block height / slot / checkpoint + gas price: direct JSON-RPC `POST`s to each chain’s public RPC.
- TPS: derived from real on-chain samples (checkpoint transaction counts, ledger growth, Solana performance samples).
- Token prices: `https://api.coingecko.com/api/v3/simple/price` (SUI, APT, SOL) — 24h change included.
- Arc network stats + blocks: [ArcScan](https://testnet.arcscan.app)'s free **Blockscout API** (`/api/v2/stats`, `/api/v2/blocks`), with an automatic RPC fallback for the block feed.

## Status API

`GET /api/status` — never cached, polls every chain once and returns a health snapshot:

```bash
curl https://<your-host>/api/status
```

```json
{
  "chains": [
    { "id": "monad", "online": true, "blockNumber": 1543210, "latencyMs": 143 },
    { "id": "sui", "online": true, "blockNumber": 987654, "latencyMs": 88 }
  ],
  "generatedAt": "2026-09-05T18:00:00.000Z",
  "tookMs": 620
}
```

## Roadmap

See [ROADMAP.md](ROADMAP.md) — Phase 1 is shipped; Phase 2 (other detail pages, compare view, shortcuts) is next.

## License

MIT
