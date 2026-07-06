import { describe, expect, it, vi } from "vitest";
import { CONTRACTS } from "../config/contracts";
import { TOKENS } from "../config/tokens";
import { extractPositionIds, fetchPositionIdsFromZan } from "./zan";

describe("ZAN position service", () => {
  it("extracts position ids from common response shapes", () => {
    expect(
      extractPositionIds({
        result: {
          data: [
            { contractAddress: CONTRACTS.positionManager, tokenId: "12" },
            { contractAddress: TOKENS[0].address, tokenId: "99" },
          ],
        },
      }),
    ).toEqual(["12"]);
  });

  it("fetches ids with owner and contract query params", async () => {
    const fetchMock = vi.fn(async (_url: URL, _init?: RequestInit) => ({
      ok: true,
      json: async () => ({ data: [{ contract_address: CONTRACTS.positionManager, token_id: "42" }] }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchPositionIdsFromZan({
        owner: "0x1111111111111111111111111111111111111111",
        endpoint: "https://example.test/nfts",
        apiKey: "key",
      }),
    ).resolves.toEqual(["42"]);

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(String(url)).toContain("owner=0x1111111111111111111111111111111111111111");
    expect(String(url)).toContain(`contractAddress=${CONTRACTS.positionManager}`);
    expect(init).toEqual({ headers: { "x-api-key": "key" } });
  });
});
