export const positionManagerAbi = [
  "function getPositionInfo(uint256 positionId) view returns (tuple(address owner,address token0,address token1,uint32 index,uint24 fee,uint128 liquidity,int24 tickLower,int24 tickUpper,uint256 tokensOwed0,uint256 tokensOwed1))",
  "function mint(tuple(address token0,address token1,uint32 index,uint256 amount0Desired,uint256 amount1Desired,address recipient,uint256 deadline) params) returns (uint256 tokenId,uint128 liquidity,uint256 amount0,uint256 amount1)",
  "function burn(uint256 positionId) returns (uint256 amount0,uint256 amount1)",
  "function collect(uint256 positionId,address recipient) returns (uint256 amount0,uint256 amount1)",
  "function ownerOf(uint256 tokenId) view returns (address)",
] as const;
