import { RefreshCw, Wallet, X } from "lucide-react";
import type { DiscoveredWallet } from "../lib/walletProvider";

export function WalletSelector({ wallets, busyWalletId, onRefresh, onSelect, onClose }: {
  wallets: DiscoveredWallet[];
  busyWalletId?: string;
  onRefresh: () => void;
  onSelect: (wallet: DiscoveredWallet) => Promise<void>;
  onClose: () => void;
}) {
  return <div className="wallet-selector-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="wallet-selector" role="dialog" aria-modal="true" aria-labelledby="wallet-selector-title">
      <header>
        <div><span className="label">Wallets</span><h2 id="wallet-selector-title">Connect a wallet</h2></div>
        <button className="icon-button" title="Close" onClick={onClose}><X size={17} /></button>
      </header>
      <div className="wallet-options">
        {wallets.map((wallet) => <button className="wallet-option" key={wallet.info.uuid} disabled={Boolean(busyWalletId)} onClick={() => void onSelect(wallet)}>
          <span className="wallet-option-icon">{wallet.info.icon ? <img src={wallet.info.icon} alt="" /> : <Wallet size={20} />}</span>
          <span><strong>{wallet.info.name}</strong><small>{wallet.info.rdns}</small></span>
          {busyWalletId === wallet.info.uuid && <span className="wallet-connecting">Connecting...</span>}
        </button>)}
        {!wallets.length && <div className="wallet-empty"><Wallet size={25} /><strong>No wallets detected</strong><span>Install or enable an EIP-6963 compatible browser wallet.</span></div>}
      </div>
      <footer><button className="ghost-button" onClick={onRefresh}><RefreshCw size={15} /> Refresh wallets</button></footer>
    </section>
  </div>;
}
