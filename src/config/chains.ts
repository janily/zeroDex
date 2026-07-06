export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_HEX_CHAIN_ID = "0xaa36a7";

export const SEPOLIA_PARAMS = {
  chainId: SEPOLIA_HEX_CHAIN_ID,
  chainName: "Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.sepolia.org"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
} as const;
