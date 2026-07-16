# zeroDex

zeroDex is a Sepolia-only MetaNodeSwap frontend. It started as a Linear-style interactive prototype and is being upgraded into a real DEX frontend that connects MetaMask, reads deployed contracts, quotes swaps, handles ERC20 approvals, and manages LP NFT positions.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`.

## Verification

```bash
npm test
npm run build
```

## Wallet And Network

- Wallet: MetaMask
- Network: Sepolia
- Chain ID: `11155111`

The app remains browsable without a wallet. Write actions require MetaMask connected to Sepolia.

## Optional ZAN Position Lookup

Position NFT discovery can use ZAN when these environment variables are configured in `.env.local`:

```bash
cp .env.example .env.local
```

```bash
# Recommended: your own proxy endpoint that calls ZAN server-side.
VITE_ZAN_NFT_ENDPOINT=/api/zan/nfts-by-owner

# Optional for local/demo direct browser calls only. Vite exposes this value.
VITE_ZAN_API_KEY=
```

`VITE_ZAN_NFT_ENDPOINT` is the URL the frontend calls to discover PositionManager NFTs. The app automatically appends `owner=<connected wallet>` and `contractAddress=<PositionManager address>` query params, then reads token IDs from `result.data`, `result.list`, or `data`.

For authenticated ZAN access, use a same-origin/backend proxy and keep the real ZAN API key on the server. Only set `VITE_ZAN_API_KEY` for local/demo direct browser requests because every `VITE_*` variable is embedded into browser JavaScript.

After editing `.env.local`, restart `npm run dev`. If ZAN is unavailable, the Position screen keeps a manual `positionId` lookup path.

## Implementation Plan

The real DEX integration plan is saved at:

```text
docs/superpowers/plans/2026-07-06-real-dex-integration.md
```

Current implemented layers:

- React/Vite Linear-style prototype shell
- Static Sepolia/token/contract config
- Minimal ABI fragments
- bigint amount utilities
- price/pool/routing/allowance utilities
- MetaMask wallet state hook
- ethers contract factories
- PoolManager and ERC20 balance read hook
- swap quote and transaction state hooks
- ZAN position service and position hook
