import { ShieldCheck, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { TOKENS } from "../config/tokens";
import { useAllowances } from "../hooks/useAllowances";
import type { TokenBalance } from "../hooks/useDexData";
import { getMintAllowancePlan, getSwapAllowancePlan } from "../lib/allowance";
import { formatTokenAmount, parseTokenAmount } from "../lib/amount";
import { buildCreatePoolParams } from "../lib/createPool";
import { shortAddress, tokenSymbol } from "../lib/uiFormat";
import type { SwapExecutionPayload } from "../lib/swapExecution";
import type { Address, DisplayPool, TransactionStage } from "../types/domain";
import type { CreateDrawerState, DrawerType, LiquidityDrawerState, RunTransaction } from "../types/app";
import type { Pool } from "../types/ui";
import { TxTimeline } from "./common";
import { CreatePoolForm, LiquidityForm, SwapDrawerForm } from "./forms";

export function Drawer({
  type,
  onClose,
  selectedPool,
  selectedDisplayPool,
  txStage,
  txError,
  txSyncError,
  transactionPending,
  tokenBalances,
  chainDataLoading,
  approveToken,
  resetTransaction,
  walletAccount,
  swapExecution,
  swapSummary,
  swapHasInputBalance = true,
  swapInputBalanceKnown = true,
  runTransaction,
  isReady,
}: {
  type: DrawerType;
  onClose: () => void;
  selectedPool: Pool;
  selectedDisplayPool?: DisplayPool;
  txStage: TransactionStage;
  txError?: string;
  approveToken: (token: Address, spender: Address, amount: bigint) => Promise<boolean>;
  resetTransaction: () => void;
  txSyncError?: string;
  transactionPending: boolean;
  tokenBalances: TokenBalance[];
  chainDataLoading: boolean;
  walletAccount?: `0x${string}`;
  swapExecution?: SwapExecutionPayload;
  swapSummary?: {
    route?: string;
    pay: string;
    receive: string;
    slippage: string;
  };
  swapHasInputBalance?: boolean;
  swapInputBalanceKnown?: boolean;
  runTransaction: RunTransaction;
  isReady: boolean;
}) {
  const [createForm, setCreateForm] = useState<CreateDrawerState>({
    type: "create",
    tokenA: TOKENS[0].address,
    tokenB: TOKENS[1].address,
    feePercent: "0.30%",
    initialRate: "",
    minRate: "",
    maxRate: "",
  });
  const [liquidityForm, setLiquidityForm] = useState<LiquidityDrawerState>({
    type: "liquidity",
    amount0: "",
    amount1: "",
  });
  const title = type === "create" ? "Create pool" : type === "liquidity" ? "Add liquidity" : "Review swap";
  const action = type === "create" ? "create" : type === "liquidity" ? "mint" : "swap";
  const payload = type === "create" ? createForm : type === "liquidity" ? liquidityForm : swapExecution;
  const createError = useMemo(() => {
    if (type !== "create") return undefined;
    try {
      buildCreatePoolParams(createForm);
      return undefined;
    } catch (caught) {
      return caught instanceof Error ? caught.message : "Invalid pool parameters";
    }
  }, [createForm, type]);
  const liquidityValidation = useMemo(() => {
    if (type !== "liquidity" || !selectedDisplayPool) return { error: undefined };
    try {
      const amount0 = parseTokenAmount(liquidityForm.amount0, selectedDisplayPool.token0.decimals);
      const amount1 = parseTokenAmount(liquidityForm.amount1, selectedDisplayPool.token1.decimals);
      if (amount0 <= 0n || amount1 <= 0n) throw new Error("Both liquidity amounts must be greater than zero");
      return { amount0, amount1, error: undefined };
    } catch (caught) {
      return { error: caught instanceof Error ? caught.message : "Invalid liquidity amounts" };
    }
  }, [liquidityForm.amount0, liquidityForm.amount1, selectedDisplayPool, type]);
  const allowanceChecks = useMemo(() => {
    if (!selectedDisplayPool) return [];
    if (type === "liquidity" && liquidityValidation.amount0 !== undefined && liquidityValidation.amount1 !== undefined) {
      return getMintAllowancePlan({
        token0: selectedDisplayPool.token0.address,
        token1: selectedDisplayPool.token1.address,
        amount0Desired: liquidityValidation.amount0,
        amount1Desired: liquidityValidation.amount1,
      });
    }
    if (type === "swap" && swapExecution) {
      const amountIn = swapExecution.mode === "exact-input" ? swapExecution.amountIn : 0n;
      const amountInMaximum = swapExecution.mode === "exact-output" ? swapExecution.amountInMaximum : amountIn;
      return [
        getSwapAllowancePlan({
          tokenIn: swapExecution.tokenIn,
          mode: swapExecution.mode,
          amountIn,
          amountInMaximum,
        }),
      ];
    }
    return [];
  }, [liquidityValidation.amount0, liquidityValidation.amount1, selectedDisplayPool, swapExecution, type]);
  const transactionCompleted = txStage === "success";
  const allowances = useAllowances(walletAccount, allowanceChecks, isReady && type !== "create" && !transactionCompleted);
  const balance0 = selectedDisplayPool
    ? tokenBalances.find((balance) => balance.token.toLowerCase() === selectedDisplayPool.token0.address.toLowerCase())?.value
    : undefined;
  const balance1 = selectedDisplayPool
    ? tokenBalances.find((balance) => balance.token.toLowerCase() === selectedDisplayPool.token1.address.toLowerCase())?.value
    : undefined;
  const mintBalancesKnown = balance0 !== undefined && balance1 !== undefined;
  const mintHasBalances =
    liquidityValidation.amount0 !== undefined &&
    liquidityValidation.amount1 !== undefined &&
    balance0 !== undefined &&
    balance1 !== undefined &&
    balance0 >= liquidityValidation.amount0 &&
    balance1 >= liquidityValidation.amount1;
  const balanceLabel = (balance: bigint | undefined, decimals: number | undefined) => {
    if (balance !== undefined && decimals !== undefined) return `Balance ${formatTokenAmount(balance, decimals)}`;
    return chainDataLoading ? "Loading balance..." : "Balance unavailable";
  };
  const allowanceReady = type === "create" || (allowances.ready && !allowances.error);
  const canSubmit =
    isReady &&
    (type === "create" || Boolean(selectedDisplayPool)) &&
    (type !== "create" || !createError) &&
    (type !== "liquidity" || (!liquidityValidation.error && mintBalancesKnown && mintHasBalances)) &&
    (type !== "swap" || (Boolean(swapExecution) && swapHasInputBalance)) &&
    allowanceReady &&
    !transactionPending;
  const nextAllowance = transactionCompleted ? undefined : allowances.next;
  const completedWrite = transactionCompleted;
  const primaryText = !isReady
    ? "Connect wallet"
    : completedWrite
      ? "Close review"
    : nextAllowance
      ? `Approve ${tokenSymbol(nextAllowance.token)}`
      : primaryLabel(type, txStage);
  return (
    <div className="drawer-backdrop">
      <aside className="drawer">
        <header className="drawer-head">
          <div>
            <span className="label">{selectedPool.pair}</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </header>
        {type === "create" ? (
          <CreatePoolForm value={createForm} onChange={setCreateForm} />
        ) : type === "liquidity" ? (
          <LiquidityForm
            selectedPool={selectedPool}
            value={liquidityForm}
            onChange={setLiquidityForm}
            balance0Label={balanceLabel(balance0, selectedDisplayPool?.token0.decimals)}
            balance1Label={balanceLabel(balance1, selectedDisplayPool?.token1.decimals)}
          />
        ) : (
          <SwapDrawerForm selectedPool={selectedPool} summary={swapSummary} />
        )}
        {!selectedDisplayPool && type !== "create" && (
          <div className="inline-error compact-error">
            <X size={16} />
            <div>
              <strong>Chain pool required</strong>
              <span>Connect Sepolia and refresh pools before submitting this write.</span>
            </div>
          </div>
        )}
        {type === "create" && createError && (
          <div className="inline-error compact-error">
            <X size={16} />
            <div>
              <strong>Invalid pool parameters</strong>
              <span>{createError}</span>
            </div>
          </div>
        )}
        {type === "liquidity" && liquidityValidation.error && (
          <div className="inline-error compact-error">
            <X size={16} />
            <div>
              <strong>Invalid liquidity amounts</strong>
              <span>{liquidityValidation.error}</span>
            </div>
          </div>
        )}
        {type === "liquidity" && !liquidityValidation.error && !mintBalancesKnown && (
          <div className="inline-error compact-error">
            <X size={16} />
            <div>
              <strong>Balances unavailable</strong>
              <span>Refresh chain data before minting.</span>
            </div>
          </div>
        )}
        {type === "liquidity" && !liquidityValidation.error && mintBalancesKnown && !mintHasBalances && (
          <div className="inline-error compact-error">
            <X size={16} />
            <div>
              <strong>Insufficient balance</strong>
              <span>Both token balances must cover the desired amounts.</span>
            </div>
          </div>
        )}
        {type === "swap" && !swapExecution && (
          <div className="inline-error compact-error">
            <X size={16} />
            <div>
              <strong>Swap quote required</strong>
              <span>Select a tradable route and enter a valid amount before submitting.</span>
            </div>
          </div>
        )}
        {type === "swap" && swapExecution && !swapInputBalanceKnown && (
          <div className="inline-error compact-error">
            <X size={16} />
            <div>
              <strong>Balance unavailable</strong>
              <span>Refresh chain data before submitting this swap.</span>
            </div>
          </div>
        )}
        {type === "swap" && swapExecution && swapInputBalanceKnown && !swapHasInputBalance && (
          <div className="inline-error compact-error">
            <X size={16} />
            <div>
              <strong>Insufficient balance</strong>
              <span>Your input token balance does not cover this swap.</span>
            </div>
          </div>
        )}
        {txError && (
          <div className="inline-error compact-error">
            <X size={16} />
            <div>
              <strong>Transaction failed</strong>
              <span>{txError}</span>
            </div>
          </div>
        )}
        {txSyncError && (
          <div className="chain-banner">
            <Loader2 size={16} />
            <div>
              <strong>Transaction confirmed; refresh incomplete</strong>
              <span>{txSyncError}</span>
            </div>
          </div>
        )}
        {(allowances.loading || allowances.error || nextAllowance) && (
          <div className={allowances.error ? "inline-error compact-error" : "chain-banner"}>
            {allowances.error ? <X size={16} /> : allowances.loading ? <Loader2 size={16} /> : <ShieldCheck size={16} />}
            <div>
              <strong>{allowances.error ? "Allowance check failed" : allowances.loading ? "Checking allowances" : "Approval required"}</strong>
              <span>
                {allowances.error ??
                  (nextAllowance
                    ? `${tokenSymbol(nextAllowance.token)} needs approval for ${shortAddress(nextAllowance.spender)}`
                    : "Reading ERC20 allowance.")}
              </span>
            </div>
          </div>
        )}
        <TxTimeline stage={txStage} />
        <button
          className="primary-button wide"
          disabled={!completedWrite && (!canSubmit || allowances.loading || transactionPending)}
          onClick={() => {
            if (completedWrite) {
              onClose();
              return;
            }
            if (nextAllowance) {
              void approveToken(nextAllowance.token, nextAllowance.spender, nextAllowance.required).then(async (approved) => {
                if (!approved) return;
                await allowances.refresh();
                resetTransaction();
              });
              return;
            }
            if (!payload) return;
            void runTransaction(action, payload);
          }}
        >
          {primaryText}
        </button>
      </aside>
    </div>
  );
}

function primaryLabel(type: DrawerType, stage: TransactionStage) {
  if (stage === "waiting-signature") return "Waiting for signature";
  if (stage === "submitted") return "Submitted";
  if (stage === "confirming") return "Confirming";
  if (stage === "success") return "Close review";
  if (type === "create") return "Create pool";
  if (type === "liquidity") return "Approve and mint";
  return "Approve and swap";
}
