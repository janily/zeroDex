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

Position NFT discovery can use ZAN when these environment variables are configured:

```bash
VITE_ZAN_NFT_ENDPOINT=
VITE_ZAN_API_KEY=
```

If ZAN is unavailable, the Position screen keeps a manual `positionId` lookup path.

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
