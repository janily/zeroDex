# Real DEX Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current zeroDex mock data prototype with a real Sepolia MetaMask DEX frontend that reads MetaNodeSwap contracts, checks balances/allowances, quotes swaps, submits writes, and manages LP positions.

**Architecture:** Keep the existing Vite/React UI, but split the single prototype file into config, ABI, wallet, contract, pricing, routing, transaction, and feature modules. Chain state flows through small React hooks; pure bigint/math/routing functions are tested with Vitest before UI wiring. Contract calls use ethers v6 directly to avoid introducing a larger wagmi stack until the app needs connector abstraction.

**Tech Stack:** React 18, TypeScript, Vite, ethers v6, Vitest, Testing Library, jsdom, lucide-react.

---

## File Structure

- `src/config/chains.ts`: Sepolia chain metadata and network switching params.
- `src/config/contracts.ts`: PoolManager, PositionManager, SwapRouter addresses.
- `src/config/tokens.ts`: MNTokenA/B/C/D local token metadata and mint links.
- `src/abis/*.ts`: Minimal typed ABI fragments required by the PRD.
- `src/types/domain.ts`: Token, pool, position, quote, transaction status domain types.
- `src/lib/amount.ts`: Decimal string parsing/formatting with bigint.
- `src/lib/price.ts`: Price/tick/sqrtPrice helpers and user-facing rate formatting.
- `src/lib/pool.ts`: Pool normalization, token ordering, status derivation.
- `src/lib/routing.ts`: Same-pair pool filtering and best quote selection.
- `src/lib/allowance.ts`: Allowance planning for swap and mint flows.
- `src/lib/contracts.ts`: ethers provider/signer/contract factory helpers.
- `src/services/zan.ts`: ZAN NFT query plus manual position fallback.
- `src/hooks/useWallet.ts`: MetaMask detection, connection, account, chain switching.
- `src/hooks/useDexData.ts`: pools, token balances, token metadata, refresh orchestration.
- `src/hooks/useSwapQuote.ts`: exact input/output static quote orchestration.
- `src/hooks/useTransactions.ts`: approve/write transaction status machine.
- `src/features/*`: Swap, Pool, Position UI connected to hooks.
- `src/components/*`: Sidebar, Topbar, Drawer, TokenAmount, status controls.
- `src/test/*`: deterministic unit tests and lightweight component tests.

## Task 1: Test Harness And Dependency Baseline

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/smoke.test.ts`

- [ ] **Step 1: Install runtime and test dependencies**

Run:

```bash
npm install ethers
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Expected: npm exits 0 and `package.json` contains `ethers`, `vitest`, Testing Library packages, and `jsdom`.

- [ ] **Step 2: Add scripts and Vitest config**

Add these scripts to `package.json`:

```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Write the failing smoke test**

Create `src/test/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("runs deterministic unit tests", () => {
    expect("zeroDex").toContain("Dex");
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test
```

Expected: `1 passed`.

- [ ] **Step 5: Commit**

Run:

```bash
git add package.json package-lock.json vitest.config.ts src/test
git commit -m "test: add vitest harness"
```

## Task 2: Static Chain, Token, Contract, ABI Modules

**Files:**
- Create: `src/config/chains.ts`
- Create: `src/config/contracts.ts`
- Create: `src/config/tokens.ts`
- Create: `src/abis/erc20.ts`
- Create: `src/abis/poolManager.ts`
- Create: `src/abis/positionManager.ts`
- Create: `src/abis/swapRouter.ts`
- Create: `src/types/domain.ts`
- Test: `src/config/config.test.ts`

- [ ] **Step 1: Write config tests**

Create `src/config/config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SEPOLIA_CHAIN_ID, SEPOLIA_HEX_CHAIN_ID } from "./chains";
import { CONTRACTS } from "./contracts";
import { TOKENS } from "./tokens";

describe("zeroDex static config", () => {
  it("uses Sepolia as the only supported chain", () => {
    expect(SEPOLIA_CHAIN_ID).toBe(11155111);
    expect(SEPOLIA_HEX_CHAIN_ID).toBe("0xaa36a7");
  });

  it("defines the three MetaNodeSwap contracts", () => {
    expect(CONTRACTS.poolManager).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(CONTRACTS.positionManager).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(CONTRACTS.swapRouter).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("defines exactly four test tokens", () => {
    expect(TOKENS).toHaveLength(4);
    expect(TOKENS.map((token) => token.symbol)).toEqual(["MNTA", "MNTB", "MNTC", "MNTD"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/config/config.test.ts
```

Expected: FAIL because config modules do not exist yet.

- [ ] **Step 3: Add config and ABI modules**

Create `src/config/chains.ts`:

```ts
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_HEX_CHAIN_ID = "0xaa36a7";

export const SEPOLIA_PARAMS = {
  chainId: SEPOLIA_HEX_CHAIN_ID,
  chainName: "Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.sepolia.org"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
} as const;
```

Create `src/config/contracts.ts`:

```ts
export const CONTRACTS = {
  poolManager: "0xddC12b3F9F7C91C79DA7433D8d212FB78d609f7B",
  positionManager: "0xbe766Bf20eFfe431829C5d5a2744865974A0B610",
  swapRouter: "0xD2c220143F5784b3bD84ae12747d97C8A36CeCB2",
} as const;
```

Create `src/config/tokens.ts` with MNTA/MNTB/MNTC/MNTD addresses from `docs/zeroDex.md` and default decimals `18`.

Create ABI files with only functions used by the PRD: ERC20 `symbol`, `decimals`, `balanceOf`, `allowance`, `approve`; PoolManager `getPairs`, `getAllPools`, `createAndInitializePoolIfNecessary`; PositionManager `getPositionInfo`, `mint`, `burn`, `collect`, `ownerOf`; SwapRouter `quoteExactInput`, `quoteExactOutput`, `exactInput`, `exactOutput`.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- src/config/config.test.ts
npm run build
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/config src/abis src/types package.json package-lock.json
git commit -m "feat: add chain contract token config"
```

## Task 3: Amount And Price Utilities

**Files:**
- Create: `src/lib/amount.ts`
- Create: `src/lib/price.ts`
- Test: `src/lib/amount.test.ts`
- Test: `src/lib/price.test.ts`

- [ ] **Step 1: Write failing amount tests**

Create `src/lib/amount.test.ts` with cases for `parseTokenAmount("1.23", 18)`, rejecting negative values, rejecting too many decimal places, and formatting tiny non-zero values as `<0.000001`.

- [ ] **Step 2: Implement amount utilities**

Add:

```ts
export function parseTokenAmount(value: string, decimals: number): bigint;
export function formatTokenAmount(value: bigint, decimals: number, maxFractionDigits?: number): string;
export function isPositiveAmount(value: string): boolean;
```

Use string splitting and bigint only; never use JavaScript `number` for chain integers.

- [ ] **Step 3: Write and implement price tests**

Create `src/lib/price.test.ts` for `formatRate`, `formatRange`, `derivePoolStatus`, and `sortTokenAddresses`. Implement these in `src/lib/price.ts`.

- [ ] **Step 4: Run verification**

Run:

```bash
npm test -- src/lib/amount.test.ts src/lib/price.test.ts
npm run build
```

Expected: all tests and build pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/lib
git commit -m "feat: add amount and price utilities"
```

## Task 4: Wallet Hook

**Files:**
- Create: `src/hooks/useWallet.ts`
- Create: `src/hooks/useWallet.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write wallet tests**

Test that no `window.ethereum` returns `installed: false`, `connect()` calls `eth_requestAccounts`, and wrong chain calls `wallet_switchEthereumChain` with `0xaa36a7`.

- [ ] **Step 2: Implement `useWallet`**

Expose:

```ts
type WalletStatus = "missing" | "disconnected" | "wrong-network" | "connected" | "error";
export function useWallet(): {
  status: WalletStatus;
  account?: string;
  chainId?: number;
  error?: string;
  connect(): Promise<void>;
  switchToSepolia(): Promise<void>;
}
```

- [ ] **Step 3: Wire Topbar**

Replace mock wallet state in `App.tsx` with `useWallet`. Buttons must show `Install MetaMask`, `Connect wallet`, `Switch to Sepolia`, or abbreviated account.

- [ ] **Step 4: Run verification**

Run:

```bash
npm test -- src/hooks/useWallet.test.tsx
npm run build
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/hooks src/App.tsx
git commit -m "feat: connect metamask wallet state"
```

## Task 5: Contract Factories And Pool Reads

**Files:**
- Create: `src/lib/contracts.ts`
- Create: `src/hooks/useDexData.ts`
- Create: `src/lib/pool.ts`
- Test: `src/lib/pool.test.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write pool normalization tests**

Test token symbol lookup, pool status for zero liquidity and boundary tick, and pool filtering by query/fee/hideEmpty.

- [ ] **Step 2: Implement contracts and pool normalization**

Use `ethers.BrowserProvider` and `ethers.Contract`. `useDexData` must read token decimals/symbols, ERC20 balances for connected account, and `PoolManager.getAllPools()`.

- [ ] **Step 3: Wire Pool page**

Replace mock pools with hook data. Keep existing Linear console UI and show loading, empty, and error states.

- [ ] **Step 4: Run verification**

Run:

```bash
npm test -- src/lib/pool.test.ts
npm run build
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/lib src/hooks src/App.tsx
git commit -m "feat: read pools and balances from chain"
```

## Task 6: Allowance And Transaction Status Machine

**Files:**
- Create: `src/lib/allowance.ts`
- Create: `src/hooks/useTransactions.ts`
- Test: `src/lib/allowance.test.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write allowance tests**

Test swap exact input spender is SwapRouter, swap exact output uses `amountInMaximum`, and mint requires token0/token1 allowances to PositionManager.

- [ ] **Step 2: Implement allowance planning**

Add `getSwapAllowancePlan`, `getMintAllowancePlan`, and a hook that calls ERC20 `approve(spender, amount)` then waits for `tx.wait()`.

- [ ] **Step 3: Wire transaction timeline**

Replace fake timers with real stages: `waiting-signature`, `submitted`, `confirming`, `success`, `error`, `rejected`.

- [ ] **Step 4: Run verification**

Run:

```bash
npm test -- src/lib/allowance.test.ts
npm run build
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/lib src/hooks src/App.tsx
git commit -m "feat: add approvals and transaction state"
```

## Task 7: Swap Quote And Execution

**Files:**
- Create: `src/lib/routing.ts`
- Create: `src/hooks/useSwapQuote.ts`
- Test: `src/lib/routing.test.ts`
- Modify: `src/features/swap/SwapPage.tsx` or `src/App.tsx` during refactor

- [ ] **Step 1: Write routing tests**

Test same-pair pool filtering handles reversed token order, excludes zero-liquidity pools, excludes boundary pools, exact input picks maximum amountOut, exact output picks minimum amountIn.

- [ ] **Step 2: Implement route selection**

Add pure routing helpers and `useSwapQuote` that calls `quoteExactInput.staticCall(params)` or `quoteExactOutput.staticCall(params)` for each candidate route.

- [ ] **Step 3: Wire Swap page**

Token selectors must show four configured tokens. Exact input/output must preserve user input on quote errors, display route candidates, minimum received or maximum paid, and enable Approve/Swap only when wallet, network, balance, and allowance are valid.

- [ ] **Step 4: Run verification**

Run:

```bash
npm test -- src/lib/routing.test.ts
npm run build
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/lib src/hooks src/App.tsx src/features
git commit -m "feat: quote and execute swaps"
```

## Task 8: Pool Creation

**Files:**
- Modify: `src/lib/price.ts`
- Create: `src/features/pools/CreatePoolDrawer.tsx`
- Test: `src/lib/createPool.test.ts`

- [ ] **Step 1: Write validation tests**

Test token equality rejection, address sorting, `min < initial < max`, and fee conversion.

- [ ] **Step 2: Implement create pool form**

Use controlled inputs for token0/token1/fee/initial/min/max. Convert rates to ticks and `sqrtPriceX96` using local helpers, then call `PoolManager.createAndInitializePoolIfNecessary(params)`.

- [ ] **Step 3: Wire success refresh**

After receipt, refresh pool list and show a prompt to add liquidity to the new pool.

- [ ] **Step 4: Run verification**

Run:

```bash
npm test -- src/lib/createPool.test.ts
npm run build
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/lib src/features src/App.tsx
git commit -m "feat: create pools on sepolia"
```

## Task 9: Position Query, Mint, Burn, Collect

**Files:**
- Create: `src/services/zan.ts`
- Create: `src/hooks/usePositions.ts`
- Create: `src/features/positions/PositionsPage.tsx`
- Test: `src/services/zan.test.ts`

- [ ] **Step 1: Write ZAN fallback tests**

Test ZAN response position ID extraction and manual `positionId` fallback when ZAN throws.

- [ ] **Step 2: Implement position reads**

Fetch owned NFT IDs through ZAN when `VITE_ZAN_API_KEY` and endpoint are configured. For each ID, call `PositionManager.getPositionInfo(positionId)`. If ZAN fails, expose manual ID query.

- [ ] **Step 3: Implement mint/burn/collect**

Mint uses selected existing pool index and desired token amounts only. Burn calls `PositionManager.burn(positionId)`. Collect calls `PositionManager.collect(positionId, account)`.

- [ ] **Step 4: Run verification**

Run:

```bash
npm test -- src/services/zan.test.ts
npm run build
```

- [ ] **Step 5: Commit**

Run:

```bash
git add src/services src/hooks src/features src/App.tsx
git commit -m "feat: manage lp positions"
```

## Task 10: Feature Refactor And End-To-End UI QA

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/*`
- Create: `src/features/swap/*`
- Create: `src/features/pools/*`
- Create: `src/features/positions/*`
- Modify: `src/styles.css`
- Modify: `README.md`

- [ ] **Step 1: Split large `App.tsx`**

Move UI components into focused feature/component files while preserving behavior.

- [ ] **Step 2: Add README setup**

Document:

```bash
npm install
npm run dev
npm test
npm run build
```

Document required browser wallet: MetaMask on Sepolia. Document optional env:

```bash
VITE_ZAN_API_KEY=
VITE_ZAN_NFT_ENDPOINT=
```

- [ ] **Step 3: Run final verification**

Run:

```bash
npm test
npm run build
```

Manually verify in browser:

- Connect wallet.
- Switch to Sepolia.
- Pool list loads or displays chain error.
- Swap form quotes or preserves input on quote error.
- Create pool validates rates.
- Position page handles ZAN failure and manual ID input.

- [ ] **Step 4: Commit**

Run:

```bash
git add src README.md
git commit -m "refactor: organize dex feature modules"
```

## Self-Review

- Spec coverage: wallet/network, tokens, pools, swap, create pool, approve, mint, burn, collect, ZAN fallback, amount precision, transaction feedback, empty/error states are covered by Tasks 1-10.
- Scope note: this is intentionally staged because the PRD spans multiple subsystems. Each task leaves the app buildable and testable.
- Placeholder scan: no plan step relies on unspecified future behavior; contract ABI fragments are constrained to the PRD-listed methods.
- Type consistency: wallet, pool, quote, allowance, and transaction modules are introduced before feature UI uses them.
