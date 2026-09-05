# Neon — Live Multi-Chain Dashboard

A real-time dashboard for **Monad, Sui, Aptos, Solana and Arc** — latest block heights/slots, TPS, gas prices, RPC latency and token prices, all polled straight from **public endpoints**. No API keys. No wallet. No middlemen. No invented numbers: if an RPC doesn't answer, Neon shows an honest `OFFLINE` state.

## Features

- **Live chain data** — EVM chains (Monad, Arc) report `eth_blockNumber` + `eth_gasPrice`; Sui reports its latest checkpoint; Aptos its ledger height; Solana its latest slot plus recent performance samples. Every card also shows real **RPC round-trip latency**.
- **Per-chain identity** — each chain gets its own gradient, accent color and honest metric labels (Block vs Slot vs Checkpoint).
- **Unambiguous health** — every chain card carries a `LIVE` / `OFFLINE` / `SYNCING` badge derived from the last actual RPC response.
- **Status summary bar** — “x/5 chains online · last updated Ns ago” with a **manual refresh** button (auto-poll runs every 12 seconds).
- **Real latency sparklines** — tiny SVG trend of the last 24 measured samples per chain.
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

## License

MIT
