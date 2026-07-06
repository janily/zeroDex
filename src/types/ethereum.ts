export type EthereumRequestArgs = {
  method: string;
  params?: unknown[];
};

export type EthereumProvider = {
  request<T = unknown>(args: EthereumRequestArgs): Promise<T>;
  on?(event: "accountsChanged" | "chainChanged", listener: (...args: unknown[]) => void): void;
  removeListener?(event: "accountsChanged" | "chainChanged", listener: (...args: unknown[]) => void): void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
