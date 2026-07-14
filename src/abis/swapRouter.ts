export const swapRouterAbi = [
  "function quoteExactInput(tuple(address tokenIn,address tokenOut,uint32[] indexPath,uint256 amountIn,uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut)",
  "function quoteExactOutput(tuple(address tokenIn,address tokenOut,uint32[] indexPath,uint256 amountOut,uint160 sqrtPriceLimitX96) params) returns (uint256 amountIn)",
  "function exactInput(tuple(address tokenIn,address tokenOut,uint32[] indexPath,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut)",
  "function exactOutput(tuple(address tokenIn,address tokenOut,uint32[] indexPath,address recipient,uint256 deadline,uint256 amountOut,uint256 amountInMaximum,uint160 sqrtPriceLimitX96) params) returns (uint256 amountIn)",
] as const;
