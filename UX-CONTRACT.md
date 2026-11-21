# zeroDex interaction contract

The four workspaces share one Sepolia wallet session. `src/App.tsx` owns the active page, pool filters, selection, swap inputs and review snapshot. Its initial page is Pools. Navigation between workspaces preserves those in-memory inputs. Account changes clear the selected pool, manual position lookup and open transaction review. Refer to [DESIGN.md](DESIGN.md) for presentation.

## Canonical UI map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Table Selection | PoolsPage and App | Pair and pool index identify a pool | Single pool for detail and related actions | Select pools with the same index and different pairs |
| Select/Listbox | Native select and shared TokenSelect | Token config and fee filter options | Token picker and fee filter | Use arrow keys, commit and restore selection |
| Form | Shared fields in components/common.tsx and transaction Drawer | Domain amount, allowance and pool helpers | Create pool, add liquidity, review swap | Drawer tests and swap page tests |
| Scrollbar | Application stylesheet | src/styles.css | Page content and constrained data or modal surfaces | Check overflow and keyboard access at phone width |
| CRUD | App, Drawer, useTransactions and domain hooks | Sepolia contract calls and transaction receipt | Create pool, mint, swap, burn and collect | Transaction, drawer and contract tests |

Native pickers use operating-system keyboard interaction and popup geometry. The four pages share in-memory navigation state. Pool search, fee and empty-liquidity filters operate on the current pool set. The directory displays ten matching pools per page and returns to the first page when a filter changes. Show the network, loading or error state when it explains an empty list.

## From intent to transaction

| Action | Decision before signing | Result and recovery |
| --- | --- | --- |
| Connect wallet | Choose an available EIP-6963 provider. Offer a network switch when a connected account is on the wrong chain. | Chain reads use the selected provider. Display discovery, connection or network errors at the wallet entry point. |
| Create pool | Review the token pair, fee, initial rate and bounds. The pool parameter builder validates the values. | The drawer shows the write state, then offers to close the review. |
| Swap | Exact input fixes Pay. Exact output fixes Receive. Opening the review captures the route, amounts, limits and slippage. | Show allowance and balance feedback before a write. Approval and swap are separate wallet actions. |
| Add liquidity | Start from a selected on-chain pool. Check both desired token amounts, balances and PositionManager allowances. | Complete required approvals before minting. Preserve transaction and refresh feedback. |
| Manage positions | Display owned NFT positions. Manual lookup checks a supplied position ID when discovery is unavailable or empty. | An owned active position can be burned. An owned collectable position can be collected. Report lookup errors beside the input. |
| Inspect activity | Use the transaction hook's current stage, hash, error and refresh status. | Distinguish a rejected signature, a failed write and a confirmed write followed by a failed refresh. |

## Data and feedback

Keep balance values from the provider distinct from unavailable values. Labels and helper text should identify the next prerequisite when the user needs to connect, switch network, enter an amount or approve a token. Pool and position reads are independent. A position-indexer failure leaves manual lookup available.

The wallet owns permission and signature prompts. The transaction hook prevents concurrent submissions. A confirmed write triggers a refresh. If the refresh fails, preserve the confirmed result so the user can retry the read without repeating the write. The latest transaction stage belongs to the current session.

## Verification

Run `npm test` and `npm run build`. Exercise the disconnected shell, wrong-network recovery, both swap modes, filter reset, wallet selection, review dismissal and return focus at desktop and phone widths. Use a controlled provider for transaction-state coverage. Inspect real amounts, selected pairs, addresses and action availability in every responsive presentation.
