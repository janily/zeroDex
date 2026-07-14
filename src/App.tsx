import { useMemo, useState } from "react";
import { Drawer } from "./components/Drawer";
import { ContextPanel, Sidebar, Topbar } from "./components/layout";
import { TOKENS } from "./config/tokens";
import { mockPools, mockPositions } from "./data/mockData";
import { useDexData } from "./hooks/useDexData";
import { usePositions } from "./hooks/usePositions";
import { useSwapQuote } from "./hooks/useSwapQuote";
import { useTransactions } from "./hooks/useTransactions";
import { useWallet } from "./hooks/useWallet";
import { formatTokenAmount, parseTokenAmount } from "./lib/amount";
import { getWriteContracts } from "./lib/contracts";
import { buildCreatePoolParams } from "./lib/createPool";
import { buildSwapExecution } from "./lib/swapExecution";
import { displayPoolToUiPool, positionDetailsToUiPosition, safeParseSwapAmount, tokenSymbol } from "./lib/uiFormat";
import { ActivityPage } from "./pages/ActivityPage";
import { PoolsPage } from "./pages/PoolsPage";
import { PositionsPage } from "./pages/PositionsPage";
import { SwapPage } from "./pages/SwapPage";
import type { DrawerType, RunTransaction, TokenAddress } from "./types/app";
import type { Page } from "./types/ui";

export function App() {
  const [page, setPage] = useState<Page>("pools");
  const [query, setQuery] = useState("");
  const [fee, setFee] = useState("All fees");
  const [hideEmpty, setHideEmpty] = useState(true);
  const [selectedPoolId, setSelectedPoolId] = useState<string>();
  const [drawer, setDrawer] = useState<DrawerType | null>(null);
  const [zanFailed, setZanFailed] = useState(false);
  const [manualPosition, setManualPosition] = useState("");
  const [manualQueriedPosition, setManualQueriedPosition] = useState<{ id: string; raw: unknown } | undefined>();
  const [swapMode, setSwapMode] = useState<"input" | "output">("input");
  const [swapIn, setSwapIn] = useState("250");
  const [swapOut, setSwapOut] = useState("319.42");
  const [swapTokenIn, setSwapTokenIn] = useState<TokenAddress>(TOKENS[0].address);
  const [swapTokenOut, setSwapTokenOut] = useState<TokenAddress>(TOKENS[1].address);

  const wallet = useWallet();
  const isReady = wallet.status === "connected";
  const transactions = useTransactions();
  const dexData = useDexData(wallet.account, isReady);
  const positionData = usePositions(wallet.account, isReady);
  const activePools = dexData.pools.length > 0 ? dexData.pools.map(displayPoolToUiPool) : mockPools;
  const chainPositions = [...positionData.positions, ...(manualQueriedPosition ? [manualQueriedPosition] : [])];
  const activePositions = chainPositions.length > 0 ? chainPositions.map(positionDetailsToUiPosition) : mockPositions;
  const canWritePositions = isReady && chainPositions.length > 0;

  const filteredPools = useMemo(() => {
    return activePools.filter((pool) => {
      const matchesQuery = `${pool.pair} ${pool.index}`.toLowerCase().includes(query.toLowerCase());
      const matchesFee = fee === "All fees" || pool.fee === fee;
      const matchesEmpty = !hideEmpty || pool.liquidity > 0;
      return matchesQuery && matchesFee && matchesEmpty;
    });
  }, [activePools, fee, hideEmpty, query]);

  const selectedPool = activePools.find((pool) => pool.id === selectedPoolId) ?? activePools[0] ?? mockPools[0];
  const selectedDisplayPool = dexData.pools.find(
    (pool) =>
      pool.index === selectedPool.index &&
      `${pool.token0.symbol} / ${pool.token1.symbol}` === selectedPool.pair,
  );
  const parsedSwapIn = useMemo(() => safeParseSwapAmount(swapIn, swapTokenIn), [swapIn, swapTokenIn]);
  const parsedSwapOut = useMemo(() => safeParseSwapAmount(swapOut, swapTokenOut), [swapOut, swapTokenOut]);
  const swapQuote = useSwapQuote({
    enabled: isReady && dexData.pools.length > 0 && swapTokenIn.toLowerCase() !== swapTokenOut.toLowerCase(),
    pools: dexData.pools,
    tokenIn: swapTokenIn,
    tokenOut: swapTokenOut,
    mode: swapMode === "input" ? "exact-input" : "exact-output",
    amountIn: parsedSwapIn,
    amountOut: parsedSwapOut,
    account: wallet.account,
    slippageBps: 50n,
  });
  const swapExecution = useMemo(() => {
    if (swapMode === "input" && parsedSwapIn === undefined) return undefined;
    if (swapMode === "output" && parsedSwapOut === undefined) return undefined;
    return buildSwapExecution({
      mode: swapMode === "input" ? "exact-input" : "exact-output",
      tokenIn: swapTokenIn,
      tokenOut: swapTokenOut,
      amountIn: parsedSwapIn ?? 0n,
      amountOut: parsedSwapOut ?? 0n,
      quote: swapQuote.quote,
      slippageBps: 50n,
    });
  }, [parsedSwapIn, parsedSwapOut, swapMode, swapQuote.quote, swapTokenIn, swapTokenOut]);
  const swapRequiredInput = swapExecution?.mode === "exact-input" ? swapExecution.amountIn : swapExecution?.amountInMaximum;
  const swapInputBalance = dexData.balances.find((balance) => balance.token.toLowerCase() === swapTokenIn.toLowerCase())?.value;
  const swapHasInputBalance = swapRequiredInput === undefined || (swapInputBalance !== undefined && swapInputBalance >= swapRequiredInput);
  const swapInputDecimals = TOKENS.find((token) => token.address.toLowerCase() === swapTokenIn.toLowerCase())?.decimals ?? 18;
  const swapOutputDecimals = TOKENS.find((token) => token.address.toLowerCase() === swapTokenOut.toLowerCase())?.decimals ?? 18;
  const swapSummary = {
    route: swapExecution ? `Pool #${swapExecution.poolIndex}` : undefined,
    pay:
      swapExecution?.mode === "exact-output"
        ? `${formatTokenAmount(swapExecution.amountInMaximum, swapInputDecimals)} ${tokenSymbol(swapTokenIn)} max`
        : `${swapIn} ${tokenSymbol(swapTokenIn)}`,
    receive:
      swapExecution?.mode === "exact-input"
        ? `${formatTokenAmount(swapExecution.amountOutMinimum, swapOutputDecimals)} ${tokenSymbol(swapTokenOut)} min`
        : `${swapOut} ${tokenSymbol(swapTokenOut)}`,
    slippage: "0.50%",
  };

  const runTransaction: RunTransaction = async (kind, payload) => {
    if (!isReady || !wallet.account || !window.ethereum) return;
    if (kind === "approve") return;

    await transactions.runWrite(
      async () => {
        const contracts = await getWriteContracts(window.ethereum!);
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);

        if (kind === "create" && payload?.type === "create") {
          return contracts.poolManager.createAndInitializePoolIfNecessary(buildCreatePoolParams(payload));
        }

        if (kind === "mint" && selectedDisplayPool && payload?.type === "liquidity") {
          return contracts.positionManager.mint({
            token0: selectedDisplayPool.token0.address,
            token1: selectedDisplayPool.token1.address,
            index: BigInt(selectedDisplayPool.index),
            amount0Desired: parseTokenAmount(payload.amount0, selectedDisplayPool.token0.decimals),
            amount1Desired: parseTokenAmount(payload.amount1, selectedDisplayPool.token1.decimals),
            recipient: wallet.account,
            deadline,
          });
        }

        if (kind === "swap" && payload?.type === "swap" && payload.mode === "exact-input") {
          return contracts.swapRouter.exactInput({
            tokenIn: payload.tokenIn,
            tokenOut: payload.tokenOut,
            indexPath: [payload.poolIndex],
            recipient: wallet.account,
            deadline,
            amountIn: payload.amountIn,
            amountOutMinimum: payload.amountOutMinimum,
            sqrtPriceLimitX96: payload.sqrtPriceLimitX96,
          });
        }

        if (kind === "swap" && payload?.type === "swap" && payload.mode === "exact-output") {
          return contracts.swapRouter.exactOutput({
            tokenIn: payload.tokenIn,
            tokenOut: payload.tokenOut,
            indexPath: [payload.poolIndex],
            recipient: wallet.account,
            deadline,
            amountOut: payload.amountOut,
            amountInMaximum: payload.amountInMaximum,
            sqrtPriceLimitX96: payload.sqrtPriceLimitX96,
          });
        }

        if (kind === "collect" && payload?.type === "position") {
          return contracts.positionManager.collect(BigInt(payload.positionId), wallet.account);
        }

        if (kind === "burn" && payload?.type === "position") {
          return contracts.positionManager.burn(BigInt(payload.positionId));
        }

        throw new Error("Load Sepolia pool data before submitting this transaction");
      },
      async () => {
        await dexData.refresh();
        await positionData.refresh();
      },
    );
  };

  return (
    <main className="shell">
      <Sidebar page={page} setPage={setPage} />
      <section className="workspace">
        <Topbar
          account={wallet.account}
          status={wallet.status}
          error={wallet.error}
          connect={wallet.connect}
          switchToSepolia={wallet.switchToSepolia}
        />
        {page === "pools" && (
          <PoolsPage
            query={query}
            setQuery={setQuery}
            fee={fee}
            setFee={setFee}
            hideEmpty={hideEmpty}
            setHideEmpty={setHideEmpty}
            pools={filteredPools}
            selectedPool={selectedPool}
            setSelectedPoolId={setSelectedPoolId}
            openDrawer={setDrawer}
            runTransaction={runTransaction}
            isReady={isReady}
            chainLoading={dexData.loading}
            chainError={dexData.error}
            refreshChainData={dexData.refresh}
          />
        )}
        {page === "swap" && (
          <SwapPage
            swapMode={swapMode}
            setSwapMode={setSwapMode}
            swapIn={swapIn}
            swapOut={swapOut}
            setSwapIn={setSwapIn}
            setSwapOut={setSwapOut}
            tokenIn={swapTokenIn}
            tokenOut={swapTokenOut}
            setTokenIn={setSwapTokenIn}
            setTokenOut={setSwapTokenOut}
            quote={swapQuote}
            openDrawer={setDrawer}
            runTransaction={runTransaction}
            isReady={isReady}
            canReview={Boolean(swapExecution) && swapHasInputBalance}
          />
        )}
        {page === "positions" && (
          <PositionsPage
            zanFailed={zanFailed}
            setZanFailed={setZanFailed}
            manualPosition={manualPosition}
            setManualPosition={setManualPosition}
            runTransaction={runTransaction}
            openDrawer={setDrawer}
            canWritePositions={canWritePositions}
            positions={activePositions}
            positionsLoading={positionData.loading}
            positionsError={positionData.error}
            queryManualPosition={async (positionId) => {
              const next = await positionData.fetchManualPosition(positionId);
              setManualQueriedPosition(next);
              setManualPosition(next.id);
            }}
          />
        )}
        {page === "activity" && <ActivityPage txStage={transactions.stage} />}
      </section>
      <ContextPanel selectedPool={selectedPool} txStage={transactions.stage} openDrawer={setDrawer} />
      {drawer && (
        <Drawer
          type={drawer}
          onClose={() => setDrawer(null)}
          selectedPool={selectedPool}
          selectedDisplayPool={selectedDisplayPool}
          txStage={transactions.stage}
          txError={transactions.error}
          approveToken={transactions.approveToken}
          walletAccount={wallet.account}
          swapExecution={swapExecution}
          swapSummary={swapSummary}
          swapHasInputBalance={swapHasInputBalance}
          runTransaction={runTransaction}
          isReady={isReady}
        />
      )}
    </main>
  );
}
