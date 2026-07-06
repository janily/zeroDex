import type { TokenConfig } from "../types/domain";

export const TOKENS = [
  {
    name: "MNTokenA",
    symbol: "MNTA",
    address: "0x4798388e3adE569570Df626040F07DF71135C48E",
    decimals: 18,
    mintUrl: "https://sepolia.etherscan.io/address/0x4798388e3adE569570Df626040F07DF71135C48E#writeContract",
  },
  {
    name: "MNTokenB",
    symbol: "MNTB",
    address: "0x5A4eA3a013D42Cfd1B1609d19f6eA998EeE06D30",
    decimals: 18,
    mintUrl: "https://sepolia.etherscan.io/address/0x5A4eA3a013D42Cfd1B1609d19f6eA998EeE06D30#writeContract",
  },
  {
    name: "MNTokenC",
    symbol: "MNTC",
    address: "0x86B5df6FF459854ca91318274E47F4eEE245CF28",
    decimals: 18,
    mintUrl: "https://sepolia.etherscan.io/address/0x86B5df6FF459854ca91318274E47F4eEE245CF28#writeContract",
  },
  {
    name: "MNTokenD",
    symbol: "MNTD",
    address: "0x7af86B1034AC4C925Ef5C3F637D1092310d83F03",
    decimals: 18,
    mintUrl: "https://sepolia.etherscan.io/address/0x7af86B1034AC4C925Ef5C3F637D1092310d83F03#writeContract",
  },
] as const satisfies readonly TokenConfig[];

export function getTokenByAddress(address: string): TokenConfig | undefined {
  return TOKENS.find((token) => token.address.toLowerCase() === address.toLowerCase());
}
