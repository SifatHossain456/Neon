# Neon — Multi-Chain Dashboard

Live on-chain data for Monad, Sui, Aptos, Solana, and Arc — block numbers, TPS, latency, and token prices updated in real time. No wallet required, no API keys needed.

## Features

- **Live block numbers** — fetched directly from public RPCs every few seconds
- **TPS tracking** — derived from recent block transaction counts
- **Latency measurement** — round-trip time measured per request to each RPC
- **Token prices** — SOL, SUI, APT live from CoinGecko
- **Chain cards** — color-coded per ecosystem with direct explorer links

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| Styling | Tailwind CSS v4 |
| Data | Public JSON-RPC endpoints + CoinGecko |
| Fonts | Geist Sans + Geist Mono |

## Getting Started

```bash
git clone https://github.com/SifatHossain456/Neon.git
cd Neon
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No `.env` required.

## Chains

| Chain | Network | Data Points |
|-------|---------|-------------|
| Monad | Testnet | Block, Latency |
| Sui | Mainnet | Block, TPS, Latency |
| Aptos | Mainnet | Block, TPS, Latency |
| Solana | Mainnet | Slot, TPS, Latency |
| Arc | Testnet | Block, Latency |

## License

MIT
