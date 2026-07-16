import { describe, expect, it } from "vitest";
import { normalizePositionLookupError } from "./usePositions";

describe("normalizePositionLookupError", () => {
  it("turns ethers call exceptions into an actionable position lookup message", () => {
    expect(
      normalizePositionLookupError(
        new Error('missing revert data (action="call", reason=null, code=CALL_EXCEPTION, version=6.17.0)'),
        "221",
      ),
    ).toBe("Position 221 could not be read from PositionManager. Check that the ID exists on Sepolia and belongs to the connected wallet.");
  });

  it("preserves ownership errors", () => {
    expect(normalizePositionLookupError(new Error("Position is not owned by the connected account"), "221")).toBe(
      "Position is not owned by the connected account",
    );
  });
});
