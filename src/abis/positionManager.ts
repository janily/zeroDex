export const positionManagerAbi = [
  "function getPositionInfo(uint256 positionId) view returns (tuple(address token0,address token1,uint256 index,uint24 fee,int24 tickLower,int24 tickUpper,uint128 liquidity,uint256 tokensOwed0,uint256 tokensOwed1))",
  "function mint(tuple(address token0,address token1,uint256 index,uint256 amount0Desired,uint256 amount1Desired,address recipient,uint256 deadline) params) returns (uint256 tokenId,uint128 liquidity,uint256 amount0,uint256 amount1)",
  "function burn(uint256 positionId)",
  "function collect(uint256 positionId,address recipient) returns (uint256 amount0,uint256 amount1)",
  "function ownerOf(uint256 tokenId) view returns (address)",
] as const;
