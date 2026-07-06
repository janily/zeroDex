import { CONTRACTS } from "../config/contracts";
import type { Address } from "../types/domain";

type ZanNftItem = {
  tokenId?: string;
  token_id?: string;
  tokenID?: string;
  contractAddress?: string;
  contract_address?: string;
};

type ZanResponse = {
  result?: {
    data?: ZanNftItem[];
    list?: ZanNftItem[];
  };
  data?: ZanNftItem[];
};

export function extractPositionIds(response: ZanResponse, positionManager: string = CONTRACTS.positionManager): string[] {
  const items = response.result?.data ?? response.result?.list ?? response.data ?? [];
  return items
    .filter((item) => {
      const contract = item.contractAddress ?? item.contract_address;
      return !contract || contract.toLowerCase() === positionManager.toLowerCase();
    })
    .map((item) => item.tokenId ?? item.token_id ?? item.tokenID)
    .filter((id): id is string => Boolean(id));
}

export async function fetchPositionIdsFromZan(input: {
  owner: Address;
  endpoint: string;
  apiKey?: string;
  positionManager?: Address;
}): Promise<string[]> {
  const url = new URL(input.endpoint);
  url.searchParams.set("owner", input.owner);
  url.searchParams.set("contractAddress", input.positionManager ?? CONTRACTS.positionManager);

  const response = await fetch(url, {
    headers: input.apiKey ? { "x-api-key": input.apiKey } : undefined,
  });
  if (!response.ok) {
    throw new Error(`ZAN request failed with ${response.status}`);
  }
  return extractPositionIds((await response.json()) as ZanResponse, input.positionManager);
}
