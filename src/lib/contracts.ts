import { BrowserProvider, Contract, JsonRpcSigner } from "ethers";
import { erc20Abi } from "../abis/erc20";
import { poolManagerAbi } from "../abis/poolManager";
import { positionManagerAbi } from "../abis/positionManager";
import { swapRouterAbi } from "../abis/swapRouter";
import { CONTRACTS } from "../config/contracts";
import type { Address } from "../types/domain";
import type { EthereumProvider } from "../types/ethereum";

export function getBrowserProvider(ethereum: EthereumProvider): BrowserProvider {
  return new BrowserProvider(ethereum);
}

export async function getSigner(ethereum: EthereumProvider): Promise<JsonRpcSigner> {
  return getBrowserProvider(ethereum).getSigner();
}

export function getReadContracts(ethereum: EthereumProvider) {
  const provider = getBrowserProvider(ethereum);
  return {
    provider,
    poolManager: new Contract(CONTRACTS.poolManager, poolManagerAbi, provider),
    positionManager: new Contract(CONTRACTS.positionManager, positionManagerAbi, provider),
    swapRouter: new Contract(CONTRACTS.swapRouter, swapRouterAbi, provider),
    erc20(address: Address) {
      return new Contract(address, erc20Abi, provider);
    },
  };
}

export async function getWriteContracts(ethereum: EthereumProvider) {
  const signer = await getSigner(ethereum);
  return {
    signer,
    poolManager: new Contract(CONTRACTS.poolManager, poolManagerAbi, signer),
    positionManager: new Contract(CONTRACTS.positionManager, positionManagerAbi, signer),
    swapRouter: new Contract(CONTRACTS.swapRouter, swapRouterAbi, signer),
    erc20(address: Address) {
      return new Contract(address, erc20Abi, signer);
    },
  };
}
