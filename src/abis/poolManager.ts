export const poolManagerAbi = [
  "function getPairs() view returns (address[] token0s, address[] token1s)",
  "function getAllPools() view returns (tuple(address pool,address token0,address token1,uint32 index,uint24 fee,int24 tickSpacing,int24 tickLower,int24 tickUpper,int24 tick,uint160 sqrtPriceX96,uint128 liquidity)[])",
  "function createAndInitializePoolIfNecessary(tuple(address token0,address token1,uint24 fee,int24 tickLower,int24 tickUpper,uint160 sqrtPriceX96) params) returns (address pool)",
] as const;
