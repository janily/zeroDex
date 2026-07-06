# zeroDex 产品需求文档

## 1. 背景与目标

zeroDex 是基于 MetaNodeSwap 合约实现的简版 DEX 前端，面向前端开发落地。产品运行在 Sepolia 测试网，使用已部署的 MetaNodeSwap 合约与 4 个测试 ERC20，支持用户完成换币、查看和创建池子、管理流动性头寸。

MetaNodeSwap 与 Uniswap V3 的核心差异是：每个池子自身拥有固定价格范围，用户添加流动性时不能自定义 tick 区间，只能向某个已有池子的价格区间添加流动性。同一交易对和费率可以存在多个池子，Swap 时前端需要从多个池子中选择更优路径。

### 1.1 产品目标

- 提供面向普通测试用户的 DEX 操作体验，隐藏 `sqrtPriceX96` 等底层表示。
- 支持 `Swap`、`Pool`、`Position` 三个核心页面。
- 使用 MetaMask 连接 Sepolia，并完成网络切换、余额读取、Approve、交易提交和交易结果反馈。
- 通过链上合约读取池子与交易对信息，通过 ZAN Advanced API 获取用户 ERC721 头寸。
- 为前端开发提供清晰的页面、状态、链上调用和验收规格。

### 1.2 非目标

- 不支持主网或其他测试网。
- 不支持跨交易对路由，例如 A -> B -> C。
- 不实现服务端索引器；除 ZAN NFT 查询外，池子与交易对数据优先直接读链。
- 不支持用户在添加流动性时自定义 tickLower 或 tickUpper。
- 不实现复杂的专业交易图表、K 线、订单簿或历史成交分析。

## 2. 用户与场景

### 2.1 目标用户

- 前端开发者：根据本 PRD 实现 zeroDex。
- DEX 测试用户：使用 Sepolia 测试币体验 Swap、创建池子、添加和管理流动性。
- 课程或合约学习者：通过 UI 理解 MetaNodeSwap 的池子、价格范围与 LP 头寸机制。

### 2.2 核心场景

- 用户连接 MetaMask，切换到 Sepolia，领取或准备测试代币。
- 用户在 Swap 页面选择两个测试代币，输入支付或期望获得数量，前端自动报价并选择最优池路径，用户授权后执行交易。
- 用户在 Pool 页面查看所有池子，按交易对筛选，也可以创建新的池子。
- 用户在 Position 页面查看自己持有的 LP NFT，添加流动性、移除流动性并领取可提取代币或手续费。

## 3. 基础配置

### 3.1 网络

- 网络：Sepolia
- Chain ID：`11155111`
- 钱包：MetaMask
- 前端必须在用户未连接钱包时展示连接入口。
- 当前网络不是 Sepolia 时，前端必须提示并发起切换网络。
- 用户拒绝连接或拒绝切网时，页面应保持可浏览状态，但禁用写交易操作。

### 3.2 测试 ERC20

| Token | Address |
| --- | --- |
| MNTokenA | `0x4798388e3adE569570Df626040F07DF71135C48E` |
| MNTokenB | `0x5A4eA3a013D42Cfd1B1609d19f6eA998EeE06D30` |
| MNTokenC | `0x86B5df6FF459854ca91318274E47F4eEE245CF28` |
| MNTokenD | `0x7af86B1034AC4C925Ef5C3F637D1092310d83F03` |

前端一期只展示上述 4 个 Token。Token 名称、符号、精度可通过 ERC20 标准接口读取，也可以在本地配置中缓存。

测试币 mint 可引导用户到 Sepolia Etherscan 的测试代币写合约页面执行，例如 MNTokenA：

`https://sepolia.etherscan.io/address/0x4798388e3adE569570Df626040F07DF71135C48E#writeContract`

### 3.3 MetaNodeSwap 合约

| 合约 | Address |
| --- | --- |
| PoolManager | `0xddC12b3F9F7C91C79DA7433D8d212FB78d609f7B` |
| PositionManager | `0xbe766Bf20eFfe431829C5d5a2744865974A0B610` |
| SwapRouter | `0xD2c220143F5784b3bD84ae12747d97C8A36CeCB2` |

ABI 来源以 Sepolia Etherscan 已验证代码为准，例如 PoolManager：

`https://sepolia.etherscan.io/address/0xddC12b3F9F7C91C79DA7433D8d212FB78d609f7B#code`

## 4. 信息架构

### 4.1 页面结构

- `Swap`：换币、报价、自动路径选择、Approve、提交交易。
- `Pool`：展示全部池子、筛选池子、创建池子。
- `Position`：展示用户 LP 头寸、添加流动性、移除流动性、领取代币与手续费。

### 4.2 全局组件

- 顶部导航：`Swap`、`Pool`、`Position`。
- 钱包入口：连接状态、账户地址缩写、Sepolia 网络状态。
- 全局交易反馈：等待签名、交易提交、确认中、成功、失败。
- Token 选择器：仅展示 MNTokenA/B/C/D。
- 数量输入：支持余额展示、`Max`、输入校验。
- Approve 操作区：在授权不足时展示授权按钮。

## 5. 通用规则

### 5.1 钱包与网络

- 未安装 MetaMask：提示用户安装 MetaMask。
- 未连接：写操作按钮显示为 `连接钱包`。
- 网络错误：写操作按钮显示为 `切换到 Sepolia`。
- 切网失败：保留错误提示，允许用户重试。

### 5.2 数量与精度

- 用户输入使用十进制字符串。
- 调用合约前必须根据 token decimals 转换为最小单位。
- 展示结果时按 token decimals 格式化，默认保留 4 到 6 位有效小数。
- 极小值可显示为 `<0.000001`。

### 5.3 价格展示

前端面向用户展示汇率，不直接展示 `sqrtPriceX96` 作为主要信息。

- 当前价：`1 token0 = x token1`，同时可展示反向价格。
- 价格范围：`1 token0 = min-max token1`。
- 创建池子时用户输入初始汇率和价格范围，前端转换为 tick 与 `sqrtPriceX96`。
- tick 与价格换算可使用 Uniswap V3 SDK 的 `TickMath` 工具作为实现参考。

### 5.4 Approve

在 `mint` 和 `swap` 之前，前端必须检查 ERC20 allowance。

- Swap Exact Input：检查 `tokenIn` 对 `SwapRouter` 的 allowance 是否大于等于 `amountIn`。
- Swap Exact Output：检查 `tokenIn` 对 `SwapRouter` 的 allowance 是否大于等于 `amountInMaximum`。
- 添加流动性 mint：分别检查 `token0` 和 `token1` 对 `PositionManager` 的 allowance 是否满足预计投入数量。
- 授权不足时先引导用户调用 ERC20 `approve(spender, amount)`。
- `spender` 必须是实际拉取代币的合约地址，不允许错误授权给 PoolManager 或 Pool。

参考 ERC20 授权语义：`approve` 允许 `spender` 从用户账户花费指定数量 token，后续由合约通过 `transferFrom` 完成转账。

### 5.5 报价调用

`quoteExactInput` 和 `quoteExactOutput` 不发送真实交易，必须使用静态调用。

- ethers v6：使用 `contract.quoteExactInput.staticCall(params)` 或 `contract.quoteExactOutput.staticCall(params)`。
- wagmi/viem：使用 `simulateContract` 模拟调用，并传入当前 connector/account。
- 报价失败时不能直接清空用户输入，应展示失败原因，并允许用户调整数量、池子或滑点。

## 6. Swap 页面

### 6.1 页面目标

让用户在 MNTokenA/B/C/D 之间完成兑换。用户可以选择 Exact Input 或 Exact Output 两种模式，前端自动基于池子报价选择最优路径。

### 6.2 页面元素

- 支付 Token 选择器。
- 获得 Token 选择器。
- 支付数量输入。
- 获得数量输入。
- 切换方向按钮。
- 模式切换：`按输入兑换`、`按输出兑换`。
- 当前最优路径摘要：池子数量、预计成交、价格影响或成交说明。
- 汇率展示：`1 tokenIn = x tokenOut`。
- 最低获得或最多支付。
- 滑点设置。
- Approve / Swap 主按钮。

### 6.3 Exact Input 流程

1. 用户选择 `tokenIn` 和 `tokenOut`。
2. 用户输入 `amountIn`。
3. 前端调用 `PoolManager.getAllPools()`，筛选同交易对池子。
4. 前端为候选池子或候选路径调用 `SwapRouter.quoteExactInput` 静态报价。
5. 选择 `amountOut` 最大的路径作为最优路径。
6. 根据滑点计算 `amountOutMinimum`。
7. 检查用户 `tokenIn` 余额。
8. 检查 `tokenIn` 对 `SwapRouter` 的 allowance。
9. 授权足够后，调用 `SwapRouter.exactInput(params)`。
10. 交易成功后刷新余额、池子数据和报价。

### 6.4 Exact Output 流程

1. 用户选择 `tokenIn` 和 `tokenOut`。
2. 用户输入期望获得的 `amountOut`。
3. 前端筛选同交易对池子。
4. 前端为候选池子或候选路径调用 `SwapRouter.quoteExactOutput` 静态报价。
5. 选择 `amountIn` 最小的路径作为最优路径。
6. 根据滑点计算 `amountInMaximum`。
7. 检查用户 `tokenIn` 余额。
8. 检查 `tokenIn` 对 `SwapRouter` 的 allowance 是否覆盖 `amountInMaximum`。
9. 授权足够后，调用 `SwapRouter.exactOutput(params)`。
10. 交易成功后刷新余额、池子数据和报价。

### 6.5 自动最优路径规则

一期仅支持同一交易对下的多池路径，不支持跨交易对中转。

候选池子来源：

- 从 `getAllPools()` 获取全部池子。
- 按 token 对筛选，兼容用户选择顺序与合约 `token0 < token1` 排序。
- 排除流动性为 0 的池子。
- 排除当前价格不在可交易范围内的池子。

路径选择规则：

- Exact Input：优先选择报价 `amountOut` 最大的路径。
- Exact Output：优先选择报价 `amountIn` 最小的路径。
- 当单池无法完全满足交易时，允许组合多个池子形成 `indexPath`，按报价优劣排序尝试补足成交。
- 若所有池子都只能部分成交，页面必须明确提示预计部分成交或无法满足用户指定输出。
- `sqrtPriceLimitX96` 由前端根据池子价格范围和交易方向设置，不能越过池子的 tick 上下界。

### 6.6 SwapRouter 参数

Exact Input:

```ts
{
  tokenIn,
  tokenOut,
  indexPath,
  recipient,
  deadline,
  amountIn,
  amountOutMinimum,
  sqrtPriceLimitX96
}
```

Exact Output:

```ts
{
  tokenIn,
  tokenOut,
  indexPath,
  recipient,
  deadline,
  amountOut,
  amountInMaximum,
  sqrtPriceLimitX96
}
```

`recipient` 默认为当前连接钱包地址。`deadline` 默认可设置为当前时间加 20 分钟。

## 7. Pool 页面

### 7.1 页面目标

展示 MetaNodeSwap 中全部池子，让用户理解每个池子的交易对、费率、价格范围、当前价格与流动性，并支持创建新池子。

### 7.2 池子列表

数据来源：`PoolManager.getAllPools()`。

展示字段：

- 交易对：`MNTokenA / MNTokenB`。
- Pool Index：用于开发调试和路由识别。
- 费率。
- 当前汇率：`1 token0 = x token1`。
- 价格范围：`1 token0 = min-max token1`。
- 总流动性。
- 池子状态：可交易、无流动性、价格到达边界。

筛选能力：

- 按 token0/token1 筛选。
- 按费率筛选。
- 隐藏无流动性池子。

### 7.3 创建池子

用户可以创建新池子。创建池子页面或弹窗包含：

- token0。
- token1。
- 费率。
- 初始汇率。
- 最低汇率。
- 最高汇率。

前端规则：

- token0 和 token1 不能相同。
- 合约要求 `token0 < token1`，前端必须自动排序或阻止错误顺序。
- 用户输入的是汇率，前端负责转换为 `tickLower`、`tickUpper`、`sqrtPriceX96`。
- `tickLower < 当前 tick < tickUpper`。
- 创建池子不在本流程中添加初始流动性；初始流动性通过 Position 页面 mint 完成。

调用方法：

```ts
PoolManager.createAndInitializePoolIfNecessary({
  token0,
  token1,
  fee,
  tickLower,
  tickUpper,
  sqrtPriceX96
})
```

成功后：

- 刷新池子列表。
- 新池子可在 Position 添加流动性时选择。
- 提示用户可以继续添加流动性。

## 8. Position 页面

### 8.1 页面目标

让用户查看和管理自己通过 PositionManager 创建的 LP NFT 头寸。

### 8.2 头寸列表

用户连接钱包后，前端通过 ZAN Advanced API 获取用户持有的 PositionManager ERC721 NFT。

数据流程：

1. 使用当前钱包地址和 PositionManager 合约地址调用 ZAN NFT 查询接口。
2. 获取 positionId 列表。
3. 对每个 positionId 调用 `PositionManager.getPositionInfo(positionId)`。
4. 合并展示头寸详情。

展示字段：

- 交易对。
- Pool Index。
- 价格范围，以汇率展示。
- 当前池子价格。
- 流动性数量。
- 可领取 token0。
- 可领取 token1。
- 头寸状态：活跃、已移除流动性、可领取。

如果 ZAN 查询失败：

- 展示失败提示。
- 允许用户手动输入 `positionId` 查询，作为降级路径。

### 8.3 添加流动性

添加流动性只能选择已有池子，不能输入 `tickLower` 或 `tickUpper`。

页面元素：

- 交易对选择。
- 池子选择：展示费率、价格范围、当前汇率和流动性。
- token0 数量输入。
- token1 数量输入。
- 余额展示。
- Approve / Mint 主按钮。

前端规则：

- 先选择交易对，再从 `getAllPools()` 过滤可添加流动性的池子。
- 选择池子后，价格范围直接来自池子。
- 用户不能修改价格范围。
- `MintParams` 不包含 tickLower 和 tickUpper。
- 前端根据池子当前价格和用户输入数量预估实际使用的 token0/token1，提交前检查余额和授权。

调用方法：

```ts
PositionManager.mint({
  token0,
  token1,
  index,
  amount0Desired,
  amount1Desired,
  recipient,
  deadline
})
```

Approve 目标：

- token0 approve 给 PositionManager。
- token1 approve 给 PositionManager。

成功后：

- 展示 positionId。
- 刷新头寸列表和池子流动性。

### 8.4 移除流动性

用户可以对自己拥有或授权的 positionId 执行 burn。

调用方法：

```ts
PositionManager.burn(positionId)
```

前端规则：

- 仅展示当前用户拥有的头寸操作按钮。
- burn 后需要刷新 `getPositionInfo`。
- burn 计算出的可提取 token 会计入 tokensOwed，用户还需要执行 collect 提取。

### 8.5 领取代币和手续费

用户可以领取 positionId 对应的 token0/token1，包括移除流动性产生的代币和手续费。

调用方法：

```ts
PositionManager.collect(positionId, recipient)
```

前端规则：

- `recipient` 默认当前钱包。
- 当 `tokensOwed0` 和 `tokensOwed1` 都为 0 时禁用 collect。
- collect 成功后刷新余额和头寸列表。
- 如果合约在 collect 后销毁 NFT，前端应从列表中移除该头寸或标记为已关闭。

## 9. 数据与合约接口

### 9.1 PoolManager

前端必须使用：

- `getPairs()`：获取支持的交易对。
- `getAllPools()`：获取池子列表与池子状态。
- `createAndInitializePoolIfNecessary(params)`：创建池子。

关键结构：

```ts
type PoolInfo = {
  token0: Address
  token1: Address
  index: number
  fee: number
  tickLower: number
  tickUpper: number
  tick: number
  sqrtPriceX96: bigint
  liquidity: bigint
}
```

### 9.2 PositionManager

前端必须使用：

- `getPositionInfo(positionId)`。
- `mint(params)`。
- `burn(positionId)`。
- `collect(positionId, recipient)`。
- ERC721 标准能力可用于 owner、授权与 NFT 展示。

### 9.3 SwapRouter

前端必须使用：

- `quoteExactInput(params)`：静态调用。
- `quoteExactOutput(params)`：静态调用。
- `exactInput(params)`。
- `exactOutput(params)`。

### 9.4 ERC20

前端必须使用：

- `symbol()`。
- `decimals()`。
- `balanceOf(address)`。
- `allowance(owner, spender)`。
- `approve(spender, amount)`。

## 10. 状态与异常

### 10.1 空状态

- 无钱包连接：展示连接钱包引导。
- 无池子：Pool 页面展示创建池子入口。
- 指定交易对无池子：Swap 页面提示暂无池子，提供跳转创建池子的入口。
- 无头寸：Position 页面展示添加流动性入口。

### 10.2 输入错误

- token 相同：禁止继续。
- 数量为 0 或非法数字：禁用提交。
- 余额不足：提示具体 token 余额不足。
- 授权不足：展示 Approve。
- 创建池子价格范围非法：提示最低价、当前价、最高价之间的关系。

### 10.3 报价错误

- 没有可用流动性：提示该交易对暂无可交易流动性。
- 触及价格边界：提示交易会触及池子价格范围。
- 无法满足 Exact Output：提示降低输出数量或更换交易对。
- 静态调用失败：展示通用失败提示，并保留用户输入。

### 10.4 交易错误

- 用户拒绝签名：提示用户已取消。
- Approve 失败：保留授权按钮，允许重试。
- Swap 失败：展示失败原因，刷新报价。
- Mint 失败：提示检查余额、授权、池子状态。
- Burn 或 Collect 失败：提示检查 NFT 所有权或授权状态。

## 11. 前端实现建议

### 11.1 推荐模块

- `config/chains`：Sepolia 和合约地址配置。
- `config/tokens`：4 个测试 ERC20 配置。
- `abis`：从 Etherscan 导出的 ABI。
- `lib/contracts`：合约实例与读写方法封装。
- `lib/price`：tick、sqrtPriceX96、汇率换算。
- `lib/routing`：Swap 候选池筛选、静态报价、最优路径选择。
- `lib/allowance`：余额和授权检查。
- `services/zan`：ZAN NFT 查询。
- `components/wallet`：连接钱包与切网。
- `features/swap`、`features/pool`、`features/position`：三大业务模块。

### 11.2 技术约束

- 合约写操作必须在钱包连接且网络为 Sepolia 时才允许执行。
- 报价必须使用静态调用，不允许发送真实交易。
- 金额计算禁止使用 JavaScript `number` 直接处理链上整数，应使用 `bigint` 或可靠的大数库。
- 路由计算必须能处理池子 token 顺序和用户选择 token 顺序不一致的情况。
- 所有交易成功后需要等待 receipt，再刷新链上数据。

## 12. 验收标准

### 12.1 钱包与网络

- 用户可以连接 MetaMask。
- 用户在非 Sepolia 网络时可以收到切网提示并切换成功。
- 用户拒绝连接、拒绝切网、拒绝签名时均有明确反馈。

### 12.2 Swap

- 用户可以选择 MNTokenA/B/C/D 中任意两个不同 token。
- Exact Input 可以展示静态报价结果，并执行成功交易。
- Exact Output 可以展示静态报价结果，并执行成功交易。
- 授权不足时先出现 Approve，授权完成后可继续 Swap。
- 前端会自动选择最优池路径。
- 交易成功后余额和报价刷新。

### 12.3 Pool

- Pool 页面能展示 `getAllPools()` 返回的所有池子。
- 池子价格以汇率形式展示。
- 用户可以创建新池子。
- 创建池子成功后，新池子出现在列表中。

### 12.4 Position

- 用户可以通过 ZAN 查询自己持有的 PositionManager NFT。
- 用户可以选择已有池子添加流动性，且不能输入 tickLower/tickUpper。
- mint 前会分别检查 token0/token1 对 PositionManager 的授权。
- 用户可以 burn 自己的头寸。
- 用户可以 collect 可领取 token 和手续费。

### 12.5 降级与异常

- ZAN 查询失败时，用户可以手动输入 positionId 查询。
- 没有池子、没有流动性、余额不足、授权不足、报价失败、交易失败都有明确提示。

## 13. 参考资料

- MetaNodeSwap 合约设计：`docs/MetaNodeSwap合约设计.md`
- MetaNodeSwap 代码分析：`docs/MetaNodeSwap代码分析.md`
- MetaNodeSwap 合约地址：`docs/MetaNodeSwap合约地址.md`
- ethers v6 `staticCall`：`https://docs.ethers.org/v6/api/contract/#BaseContractMethod-staticCall`
- wagmi `simulateContract`：`https://wagmi.sh/core/api/actions/simulateContract#connector`
- Uniswap V3 SDK TickMath：`https://github.com/Uniswap/v3-sdk/blob/4e16fe8e56c8c26541545f138c89133794c7ce72/src/utils/tickMath.ts#L13`
- ERC20 approve 参考：`https://www.wtf.academy/zh/course/solidity103/ERC20`
- PoolManager ABI 示例：`https://sepolia.etherscan.io/address/0xddC12b3F9F7C91C79DA7433D8d212FB78d609f7B#code`
- 测试币 mint 示例：`https://sepolia.etherscan.io/address/0x4798388e3adE569570Df626040F07DF71135C48E#writeContract`
