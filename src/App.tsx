import { useEffect, useMemo, useState } from "react";
import { Drawer } from "./components/Drawer";
import { ContextPanel, Sidebar, Topbar } from "./components/layout";
import { TOKENS } from "./config/tokens";
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
import type { Page, Pool } from "./types/ui";

const emptyPool: Pool = {
  id: "no-pool",
  index: 0,
  pair: "No pool selected",
  token0: "—",
  token1: "—",
  fee: "—",
  price: "No on-chain pool data",
  range: "—",
  liquidity: 0,
  status: "No liquidity",
  volume: "—",
};

export function App() {
  const [page, setPage] = useState<Page>("pools");
  const [query, setQuery] = useState("");
  const [fee, setFee] = useState("All fees");
  const [hideEmpty, setHideEmpty] = useState(true);
  const [selectedPoolId, setSelectedPoolId] = useState<string>();
  const [drawer, setDrawer] = useState<DrawerType | null>(null);
  const [manualPosition, setManualPosition] = useState("");
  const [manualPositionError, setManualPositionError] = useState<string>();
  const [manualQueriedPosition, setManualQueriedPosition] = useState<{ id: string; raw: unknown } | undefined>();
  const [swapMode, setSwapMode] = useState<"input" | "output">("input");
  const [swapIn, setSwapIn] = useState("");
  const [swapOut, setSwapOut] = useState("");
  const [swapTokenIn, setSwapTokenIn] = useState<TokenAddress>(TOKENS[0].address);
  const [swapTokenOut, setSwapTokenOut] = useState<TokenAddress>(TOKENS[1].address);

  const wallet = useWallet();
  const isReady = wallet.status === "connected";
  const transactions = useTransactions();
  const dexData = useDexData(wallet.account, isReady);
  const positionData = usePositions(wallet.account, isReady);
  const activePools = dexData.pools.map(displayPoolToUiPool);
  const chainPositions = [
    ...positionData.positions,
    ...(manualQueriedPosition && !positionData.positions.some((position) => position.id === manualQueriedPosition.id)
      ? [manualQueriedPosition]
      : []),
  ];
  const activePositions = chainPositions.map(positionDetailsToUiPosition);
  const canWritePositions = isReady && chainPositions.length > 0;

  useEffect(() => {
    setManualQueriedPosition(undefined);
    setManualPosition("");
    setManualPositionError(undefined);
    setSelectedPoolId(undefined);
    setDrawer(null);
    transactions.reset();
  }, [wallet.account, transactions.reset]);

  const filteredPools = useMemo(() => {
    return activePools.filter((pool) => {
      const matchesQuery = `${pool.pair} ${pool.index}`.toLowerCase().includes(query.toLowerCase());
      const matchesFee = fee === "All fees" || pool.fee === fee;
      const matchesEmpty = !hideEmpty || pool.liquidity > 0;
      return matchesQuery && matchesFee && matchesEmpty;
    });
  }, [activePools, fee, hideEmpty, query]);

  const selectedPool = activePools.find((pool) => pool.id === selectedPoolId) ?? activePools[0] ?? emptyPool;
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
  const swapOutputBalance = dexData.balances.find((balance) => balance.token.toLowerCase() === swapTokenOut.toLowerCase())?.value;
  const swapInputBalanceKnown = swapInputBalance !== undefined;
  const swapHasInputBalance = swapRequiredInput !== undefined && swapInputBalance !== undefined && swapInputBalance >= swapRequiredInput;
  const swapInputDecimals = TOKENS.find((token) => token.address.toLowerCase() === swapTokenIn.toLowerCase())?.decimals ?? 18;
  const swapOutputDecimals = TOKENS.find((token) => token.address.toLowerCase() === swapTokenOut.toLowerCase())?.decimals ?? 18;
  const displayedSwapIn =
    swapMode === "output" ? (swapQuote.quote ? formatTokenAmount(swapQuote.quote.amountIn, swapInputDecimals) : "") : swapIn;
  const displayedSwapOut =
    swapMode === "input" ? (swapQuote.quote ? formatTokenAmount(swapQuote.quote.amountOut, swapOutputDecimals) : "") : swapOut;
  const formatBalanceLabel = (balance: bigint | undefined, decimals: number) => {
    if (!isReady) return "Connect wallet to view balance";
    if (balance !== undefined) return `Balance ${formatTokenAmount(balance, decimals)}`;
    return dexData.loading ? "Loading balance..." : "Balance unavailable";
  };
  const activeSwapAmount = swapMode === "input" ? parsedSwapIn : parsedSwapOut;
  const swapReviewDisabledReason = !isReady
    ? undefined
    : swapTokenIn.toLowerCase() === swapTokenOut.toLowerCase()
      ? "Choose two different tokens."
      : activeSwapAmount === undefined || activeSwapAmount <= 0n
        ? `Enter a valid ${swapMode === "input" ? "pay" : "receive"} amount.`
        : swapQuote.loading
          ? "Refreshing the on-chain quote..."
          : swapQuote.error
            ? swapQuote.error
            : swapQuote.candidates.length === 0
              ? "No tradable pool is available for this pair."
              : !swapExecution
                ? "A valid quote is required before review."
                : undefined;
  const swapSummary = {
    route: swapExecution ? swapExecution.poolIndices.map((index) => `#${index}`).join(" → ") : undefined,
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
  const drawerSelectedPool = drawer === "swap" && swapQuote.quote ? displayPoolToUiPool(swapQuote.quote.pool) : selectedPool;
  const drawerSelectedDisplayPool = drawer === "swap" ? swapQuote.quote?.pool : selectedDisplayPool;
  const contextPool = page === "swap" && swapQuote.quote ? displayPoolToUiPool(swapQuote.quote.pool) : selectedPool;
  const openDrawer = (type: DrawerType) => {
    if (transactions.isPending) return;
    transactions.reset();
    setDrawer(type);
  };
  const refreshAll = async () => {
    if (!isReady) {
      await wallet.refresh();
      return;
    }
    await Promise.allSettled([dexData.refresh(), positionData.refresh(), swapQuote.refresh()]);
  };
  const openSwapForPool = (pool: Pool) => {
    const displayPool = dexData.pools.find((candidate) => displayPoolToUiPool(candidate).id === pool.id);
    if (!displayPool) return;
    setSelectedPoolId(pool.id);
    setSwapTokenIn(displayPool.token0.address as TokenAddress);
    setSwapTokenOut(displayPool.token1.address as TokenAddress);
    setSwapMode("input");
    setDrawer(null);
    setPage("swap");
  };

  const runTransaction: RunTransaction = async (kind, payload) => {
    if (!isReady || !wallet.account || !window.ethereum) return;
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
            indexPath: payload.poolIndices,
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
            indexPath: payload.poolIndices,
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
        const results = await Promise.allSettled([dexData.refresh(), positionData.refresh(), swapQuote.refresh()]);
        const failed = results.find((result) => result.status === "rejected");
        if (failed?.status === "rejected") throw failed.reason;
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
          disconnect={wallet.disconnect}
          switchAccount={wallet.switchAccount}
          switchToSepolia={wallet.switchToSepolia}
          refresh={refreshAll}
          refreshing={dexData.loading || positionData.loading || swapQuote.loading}
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
            openDrawer={openDrawer}
            isReady={isReady}
            chainLoading={dexData.loading}
            chainError={dexData.error}
            refreshChainData={dexData.refresh}
            onSwapPool={openSwapForPool}
            hasSelectedChainPool={Boolean(selectedDisplayPool)}
          />
        )}
        {page === "swap" && (
          <SwapPage
            swapMode={swapMode}
            setSwapMode={setSwapMode}
            swapIn={displayedSwapIn}
            swapOut={displayedSwapOut}
            setSwapIn={setSwapIn}
            setSwapOut={setSwapOut}
            tokenIn={swapTokenIn}
            tokenOut={swapTokenOut}
            setTokenIn={setSwapTokenIn}
            setTokenOut={setSwapTokenOut}
            quote={swapQuote}
            openDrawer={openDrawer}
            isReady={isReady}
            canReview={Boolean(swapExecution)}
            payBalanceLabel={formatBalanceLabel(swapInputBalance, swapInputDecimals)}
            receiveBalanceLabel={formatBalanceLabel(swapOutputBalance, swapOutputDecimals)}
            reviewDisabledReason={swapReviewDisabledReason}
          />
        )}
        {page === "positions" && (
          <PositionsPage
            manualPosition={manualPosition}
            setManualPosition={setManualPosition}
            manualPositionError={manualPositionError}
            runTransaction={runTransaction}
            openDrawer={openDrawer}
            canAddLiquidity={isReady && Boolean(selectedDisplayPool)}
            canWritePositions={canWritePositions}
            walletAccount={wallet.account}
            positions={activePositions}
            positionsLoading={positionData.loading}
            positionsError={positionData.error}
            isReady={isReady}
            showManualLookup={isReady && !positionData.loading && positionData.positions.length === 0}
            queryManualPosition={async (positionId) => {
              setManualPositionError(undefined);
              try {
                const next = await positionData.fetchManualPosition(positionId);
                setManualQueriedPosition(next);
                setManualPosition(next.id);
              } catch (caught) {
                setManualQueriedPosition(undefined);
                setManualPositionError(caught instanceof Error ? caught.message : "Unable to query position");
              }
            }}
          />
        )}
        {page === "activity" && <ActivityPage txStage={transactions.stage} hash={transactions.hash} error={transactions.error} syncError={transactions.syncError} />}
      </section>
      <ContextPanel
        selectedPool={contextPool}
        txStage={transactions.stage}
        openDrawer={openDrawer}
        balances={dexData.balances}
        balancesLoading={dexData.loading}
        isReady={isReady && Boolean(selectedDisplayPool) && page !== "swap"}
      />
      {drawer && (
        <Drawer
          type={drawer}
          onClose={() => setDrawer(null)}
          selectedPool={drawerSelectedPool}
          selectedDisplayPool={drawerSelectedDisplayPool}
          txStage={transactions.stage}
          txError={transactions.error}
          txSyncError={transactions.syncError}
          transactionPending={transactions.isPending}
          approveToken={transactions.approveToken}
          resetTransaction={transactions.reset}
          walletAccount={wallet.account}
          swapExecution={swapExecution}
          swapSummary={swapSummary}
          swapHasInputBalance={swapHasInputBalance}
          swapInputBalanceKnown={swapInputBalanceKnown}
          tokenBalances={dexData.balances}
          chainDataLoading={dexData.loading}
          runTransaction={runTransaction}
          isReady={isReady}
        />
      )}
    </main>
  );
}
