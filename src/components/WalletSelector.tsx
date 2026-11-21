import { ArrowUpRight, Loader2, RefreshCw, Wallet, X } from "lucide-react";
import type { DiscoveredWallet } from "../lib/walletProvider";
import { Modal } from "./Modal";

export function WalletSelector({ wallets, busyWalletId, onRefresh, onSelect, onClose }: {
  wallets: DiscoveredWallet[];
  busyWalletId?: string;
  onRefresh: () => void;
  onSelect: (wallet: DiscoveredWallet) => Promise<void>;
  onClose: () => void;
}) {
  return (
    <Modal variant="dialog" labelledBy="wallet-selector-title" onClose={onClose} dismissOnBackdrop={!busyWalletId}>
      <header className="modal-header">
        <h2 id="wallet-selector-title">Connect a wallet</h2>
        <button className="icon-button" title="Close" aria-label="Close wallet selector" disabled={Boolean(busyWalletId)} onClick={onClose}>
          <X size={18} />
        </button>
      </header>
      <div className="modal-body wallet-list">
        {wallets.map((wallet) => (
          <button
            className="wallet-choice"
            key={wallet.info.uuid}
            disabled={Boolean(busyWalletId)}
            onClick={() => void onSelect(wallet)}
          >
            <span className="wallet-provider-icon">{wallet.info.icon ? <img src={wallet.info.icon} alt="" /> : <Wallet size={21} />}</span>
            <span className="wallet-choice-details">
              <strong>{wallet.info.name}</strong>
              <small>{busyWalletId === wallet.info.uuid ? "Connecting…" : wallet.info.rdns}</small>
            </span>
            {busyWalletId === wallet.info.uuid ? <Loader2 size={16} className="wallet-spinner" /> : <ArrowUpRight size={16} />}
          </button>
        ))}
        {!wallets.length && (
          <div className="wallet-unavailable">
            <span className="wallet-empty-symbol"><Wallet size={26} strokeWidth={1.6} /></span>
            <strong>No wallets detected</strong>
            <p>Enable a compatible browser wallet, then refresh the list.</p>
          </div>
        )}
        {busyWalletId && <p className="wallet-progress" role="status">Confirm the connection in your wallet.</p>}
      </div>
      <footer className="modal-footer">
        <button className="ghost-button" onClick={onRefresh}><RefreshCw size={15} /> Refresh wallets</button>
      </footer>
    </Modal>
  );
}
