import { Interface } from "ethers";
import { describe, expect, it } from "vitest";
import { positionManagerAbi } from "./positionManager";

describe("positionManager ABI", () => {
  it("decodes the documented PositionInfo field order", () => {
    const deployedShape = new Interface([
      "function getPositionInfo(uint256) view returns (tuple(address owner,address token0,address token1,uint32 index,uint24 fee,uint128 liquidity,int24 tickLower,int24 tickUpper,uint256 tokensOwed0,uint256 tokensOwed1))",
    ]);
    const appShape = new Interface(positionManagerAbi);
    const encoded = deployedShape.encodeFunctionResult("getPositionInfo", [[
      "0x1111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222",
      "0x3333333333333333333333333333333333333333",
      7,
      3000,
      123,
      -10,
      10,
      5,
      6,
    ]]);

    const decoded = appShape.decodeFunctionResult("getPositionInfo", encoded)[0];

    expect(decoded.owner).toBe("0x1111111111111111111111111111111111111111");
    expect(decoded.token0).toBe("0x2222222222222222222222222222222222222222");
    expect(decoded.token1).toBe("0x3333333333333333333333333333333333333333");
    expect(decoded.index).toBe(7n);
    expect(decoded.fee).toBe(3000n);
    expect(decoded.liquidity).toBe(123n);
    expect(decoded.tickLower).toBe(-10n);
    expect(decoded.tickUpper).toBe(10n);
    expect(decoded.tokensOwed0).toBe(5n);
    expect(decoded.tokensOwed1).toBe(6n);
  });
});
