import { ShieldCheck, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { TOKENS } from "../config/tokens";
import { useAllowances } from "../hooks/useAllowances";
import { getMintAllowancePlan, getSwapAllowancePlan } from "../lib/allowance";
import { parseTokenAmount } from "../lib/amount";
import { shortAddress, tokenSymbol } from "../lib/uiFormat";
import type { Address, DisplayPool, TransactionStage } from "../types/domain";
import type { CreateDrawerState, DrawerSubmitPayload, DrawerType, LiquidityDrawerState, RunTransaction, SwapDrawerState } from "../types/app";
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
  approveToken,
  walletAccount,
  runTransaction,
  isReady,
}: {
  type: DrawerType;
  onClose: () => void;
  selectedPool: Pool;
  selectedDisplayPool?: DisplayPool;
  txStage: TransactionStage;
  txError?: string;
  approveToken: (token: Address, spender: Address, amount: bigint) => Promise<void>;
  walletAccount?: `0x${string}`;
  runTransaction: RunTransaction;
  isReady: boolean;
}) {
  const [createForm, setCreateForm] = useState<CreateDrawerState>({
    type: "create",
    tokenA: TOKENS[0].address,
    tokenB: TOKENS[1].address,
    feePercent: "0.30%",
    initialRate: "1.2",
    minRate: "1.0",
    maxRate: "1.5",
  });
  const [liquidityForm, setLiquidityForm] = useState<LiquidityDrawerState>({
    type: "liquidity",
    amount0: "140",
    amount1: "179.84",
  });
  const [swapForm, setSwapForm] = useState<SwapDrawerState>({
    type: "swap",
    amountIn: "250",
  });
  const title = type === "create" ? "Create pool" : type === "liquidity" ? "Add liquidity" : "Swap through pool";
  const action = type === "create" ? "create" : type === "liquidity" ? "mint" : "swap";
  const payload: DrawerSubmitPayload = type === "create" ? createForm : type === "liquidity" ? liquidityForm : swapForm;
  const allowanceChecks = useMemo(() => {
    if (!selectedDisplayPool) return [];
    try {
      if (type === "liquidity") {
        return getMintAllowancePlan({
          token0: selectedDisplayPool.token0.address,
          token1: selectedDisplayPool.token1.address,
          amount0Desired: parseTokenAmount(liquidityForm.amount0, selectedDisplayPool.token0.decimals),
          amount1Desired: parseTokenAmount(liquidityForm.amount1, selectedDisplayPool.token1.decimals),
        });
      }
      if (type === "swap") {
        const amountIn = parseTokenAmount(swapForm.amountIn, selectedDisplayPool.token0.decimals);
        return [
          getSwapAllowancePlan({
            tokenIn: selectedDisplayPool.token0.address,
            mode: "exact-input",
            amountIn,
            amountInMaximum: amountIn,
          }),
        ];
      }
    } catch {
      return [];
    }
    return [];
  }, [liquidityForm.amount0, liquidityForm.amount1, selectedDisplayPool, swapForm.amountIn, type]);
  const allowances = useAllowances(walletAccount, allowanceChecks, isReady && type !== "create");
  const canSubmit = isReady && (type === "create" || Boolean(selectedDisplayPool));
  const nextAllowance = allowances.next;
  const primaryText = !isReady
    ? "Connect wallet"
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
          <LiquidityForm selectedPool={selectedPool} value={liquidityForm} onChange={setLiquidityForm} />
        ) : (
          <SwapDrawerForm selectedPool={selectedPool} value={swapForm} onChange={setSwapForm} />
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
        {txError && (
          <div className="inline-error compact-error">
            <X size={16} />
            <div>
              <strong>Transaction failed</strong>
              <span>{txError}</span>
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
          disabled={!canSubmit || allowances.loading}
          onClick={() => {
            if (nextAllowance) {
              void approveToken(nextAllowance.token, nextAllowance.spender, nextAllowance.required).then(() => allowances.refresh());
              return;
            }
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
  if (stage === "success") return "Submitted";
  if (type === "create") return "Create pool";
  if (type === "liquidity") return "Approve and mint";
  return "Approve and swap";
}
