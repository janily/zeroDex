# zeroDex 用户使用说明

zeroDex 是一个运行在 Sepolia 测试网的 MetaNodeSwap DEX 前端。用户可以通过 MetaMask 连接钱包，查看链上交易池、获取 Swap 报价、创建交易池、添加流动性，并管理 LP Position。

本文面向使用者，介绍如何启动、连接钱包以及完成主要业务操作。

## 1. 使用前准备

### 1.1 浏览器与钱包

请准备：

- Chrome 或其他支持 MetaMask 的浏览器。
- MetaMask 钱包。
- Sepolia 测试网账户。
- 少量 Sepolia ETH，用于支付测试网 gas。
- MNTA、MNTB、MNTC、MNTD 测试代币，用于 Swap 和添加流动性。

### 1.2 支持网络

zeroDex 当前只支持 Sepolia：

```text
Network: Sepolia
Chain ID: 11155111
```

如果钱包连接到了其他网络，页面会提示切换到 Sepolia。

### 1.3 本地启动

在项目根目录执行：

```bash
npm install
npm run dev
```

启动后访问终端中显示的本地地址，例如：

```text
http://localhost:5173/
```

如果端口被占用，Vite 会自动使用新的端口，例如 `5174`。

## 2. 页面结构

zeroDex 主界面分为四个页面：

- **Swap**：选择代币和金额，获取最优交易池报价并发起兑换。
- **Pools**：查看交易池列表、筛选交易池、创建池、添加流动性。
- **Positions**：查看和管理 LP Position，包括 Collect、Burn 和手动查询。
- **Activity**：查看交易流程状态和最近操作记录。

右侧 Context 面板会展示当前选中交易池、模拟余额、交易时间线和快捷操作入口。

## 3. 连接钱包

1. 打开 zeroDex 页面。
2. 点击右上角钱包按钮。
3. 如果按钮显示 `Install MetaMask`，说明当前浏览器没有检测到 MetaMask。
4. 如果按钮显示 `Connect wallet`，点击后在 MetaMask 中确认连接。
5. 如果按钮显示 `Switch to Sepolia`，点击后在 MetaMask 中切换网络。
6. 连接成功后，按钮会显示缩写地址，例如：

```text
0xde56...f6e8
```

连接后页面会读取链上交易池、ERC20 余额和可用 Position 数据。

## 4. Pools 页面

Pools 页面用于查看和管理交易池。

### 4.1 查看交易池

交易池表格包含：

- Pair：交易对。
- Index：该交易对下的池子序号。
- Fee：手续费档位。
- Current rate：当前价格或 tick。
- Range：价格区间。
- Liquidity：流动性。
- Status：池子状态。

常见状态：

- `Tradable`：可交易。
- `No liquidity`：没有流动性。
- `At boundary`：当前价格位于边界，通常不适合作为 Swap 路由。

### 4.2 搜索和筛选

可以使用顶部工具栏：

- 搜索框：按交易对或 index 搜索。
- Fee 下拉框：按手续费筛选。
- Hide empty：隐藏没有流动性的池子。

注意：链上不同交易对可能存在相同 index，页面会根据交易对和 index 共同识别池子。

### 4.3 创建交易池

点击 `Create pool` 打开创建池抽屉。

需要填写：

- Token 0。
- Token 1。
- Fee tier。
- Initial rate。
- Minimum rate。
- Maximum rate。

提交前需要满足：

- 两个 token 不能相同。
- 价格必须满足：

```text
Minimum rate < Initial rate < Maximum rate
```

- 钱包已连接 Sepolia。

点击 `Create pool` 后，MetaMask 会弹出签名和交易确认。交易成功后页面会刷新交易池列表。

### 4.4 添加流动性

在选中的池子详情中点击 `Add liquidity`。

需要填写：

- token0 数量。
- token1 数量。

提交前页面会检查 ERC20 授权：

- 如果授权不足，主按钮会先显示 `Approve <Token>`。
- 完成授权后，再点击按钮提交 mint 交易。

## 5. Swap 页面

Swap 页面用于兑换代币。

### 5.1 选择模式

Swap 支持两种模式：

- **Exact input**：输入固定支付数量，页面估算可获得数量。
- **Exact output**：输入固定获得数量，页面估算最多需要支付数量。

### 5.2 选择代币与金额

操作步骤：

1. 选择 Pay token。
2. 输入 Pay 数量。
3. 选择 Receive token。
4. 页面会自动筛选同交易对的候选池。
5. 页面会对候选池发起报价，选择最优路线。

可以点击中间的切换按钮交换 Pay/Receive 方向。

### 5.3 报价信息

报价区会展示：

- Best route：当前最优池子的 index。
- Candidates：候选池数量。
- Quoted output 或 Quoted input：报价结果。

右侧 Route candidates 会展示候选池列表。

如果所有候选池都无法报价，会显示：

```text
No route quoted successfully
```

如果钱包未连接或网络不正确，会显示连接或切换网络提示。

### 5.4 发起 Swap

当满足以下条件时，`Review swap` 按钮可用：

- 钱包已连接。
- 网络是 Sepolia。
- 存在有效报价。
- 输入 token 余额足够。
- 当前路线可交易。

点击 `Review swap` 后会打开确认抽屉。

确认抽屉会展示：

- Route。
- Pay。
- Receive。
- Slippage。
- 授权状态。
- 交易时间线。

如果授权不足，需要先完成 ERC20 Approve。授权完成后，再提交 Swap 交易。

## 6. Positions 页面

Positions 页面用于查看和管理 LP Position。

### 6.1 Position 数据来源

页面优先使用 ZAN 查询当前钱包拥有的 Position NFT。

可选环境变量配置在项目根目录的 `.env.local` 中，可以先复制模板：

```bash
cp .env.example .env.local
```

```bash
# 推荐填后端代理地址，由后端携带真正的 ZAN key 请求 ZAN。
VITE_ZAN_NFT_ENDPOINT=/api/zan/nfts-by-owner

# 仅本地/演示直连 ZAN 时使用；VITE_* 会暴露到浏览器，不要放生产私钥。
VITE_ZAN_API_KEY=
```

`VITE_ZAN_NFT_ENDPOINT` 是前端用于发现 Position NFT 的 URL。前端会自动追加 `owner=<当前钱包地址>` 和 `contractAddress=<PositionManager 地址>` 查询参数，并从 `result.data`、`result.list` 或 `data` 中提取 `tokenId` / `token_id` / `tokenID`。

修改 `.env.local` 后需要重启 `npm run dev`。如果没有配置 ZAN，Positions 页面不会自动列出钱包里的 LP NFT；此时需要先通过 `Mint position` / `Add liquidity` 创建头寸，或使用手动 `positionId` 查询。

### 6.2 手动查询 Position

如果 ZAN 未配置、查询失败，或当前钱包没有被索引到的 Position NFT，页面会显示手动查询区域：

1. 输入当前连接钱包拥有的 `positionId`。
2. 点击 `Query`。

页面会先校验 `ownerOf(positionId)`，再优先调用 PositionManager 的 `getPositionInfo(positionId)`；如果该读取接口在当前合约上不可用，会回退尝试常见的 `positions(positionId)` 读取方式。

`getPositionInfo` 是课程/业务文档里的自定义便捷读取接口，不是 ERC721 标准接口。链上 NFT 页面能看到 `TokenID`，只代表 `ownerOf(tokenId)` 这类 ERC721 数据存在；如果当前部署版本没有实现同名 helper、helper 内部依赖的 position 映射和 NFT tokenId 不一致，或 helper 做了额外校验，就可能 revert。`positions(tokenId)` 更接近合约公开存储 getter，因此前端把它作为兼容回退。

### 6.3 positionId 去哪里找

`positionId` 本质上是 PositionManager 这个 ERC721 NFT 的 `tokenId`。常见获取方式：

1. **优先自动查询**：配置好 ZAN 后，Positions 页面会自动查询当前钱包持有的 PositionManager NFT，并把每个 NFT 的 `tokenId` 当作 `positionId`。
2. **从添加流动性交易里找**：完成 `Add liquidity` / `Mint position` 后，复制 Activity 或 MetaMask 中的交易 hash，在 Sepolia Etherscan 打开该交易。
3. **看 NFT Transfer 日志**：在交易详情的 Logs 或 ERC-721 Token Transfers 中，找到 PositionManager 合约 `0xbe766Bf20eFfe431829C5d5a2744865974A0B610` 发出的 `Transfer` 记录，其中的 `Token ID` 就是 `positionId`。
4. **看 PositionManager 的 NFT 转账页**：也可以打开 `https://sepolia.etherscan.io/address/0xbe766Bf20eFfe431829C5d5a2744865974A0B610#tokentxnsErc721`，按自己的钱包地址筛选最近的 ERC721 转账。

只有当前连接钱包拥有的 `positionId` 才能通过手动查询并执行 Collect / Burn。查询时前端会用当前连接钱包地址发起链上读取，因为部分 PositionManager 读取逻辑依赖 `msg.sender` / NFT 所有权。如果手动查询提示 position 读取失败，通常说明填的不是 PositionManager NFT 的 Token ID、该 ID 不在 Sepolia 当前合约上，或它不属于当前连接钱包。

### 6.4 Collect、Burn 和 Review

当页面展示真实链上 Position 时：

- `Collect`：领取 position 中可领取的 token。
- `Burn`：移除 position 流动性。
- `Review`：查看已关闭或不可直接操作的 position。

所有写操作都需要钱包连接 Sepolia，并在 MetaMask 中确认交易。

## 7. Activity 页面

Activity 页面展示：

- 当前交易时间线。
- 最近读写操作。
- Quote、Allowance、Pool sync、Position sync 等状态。

交易时间线包含：

```text
Sign -> Submit -> Confirm -> Complete
```

如果用户拒绝签名或交易失败，页面会展示错误状态。

## 8. 常见问题

### 8.1 页面提示 Install MetaMask

说明当前浏览器没有检测到 MetaMask。请安装 MetaMask，或确认正在使用安装了 MetaMask 的浏览器。

### 8.2 页面提示 Switch to Sepolia

说明钱包连接到了非 Sepolia 网络。点击按钮，按 MetaMask 提示切换网络。

### 8.3 Swap 一直没有可用路线

可能原因：

- 当前交易对没有可交易池。
- 候选池没有流动性。
- 当前池子处于边界状态。
- 输入金额过大。
- 链上 quote 调用失败。

可以尝试：

- 换一个交易对。
- 降低输入金额。
- 查看 Route candidates 是否有 `Tradable` 池。
- 回到 Pools 页面确认池子状态。

### 8.4 Review swap 按钮不可点击

常见原因：

- 钱包未连接。
- 当前网络不是 Sepolia。
- 没有有效报价。
- 输入 token 余额不足。
- 候选池不可交易。

### 8.5 Add liquidity 或 Swap 需要先 Approve

这是 ERC20 的正常授权流程。Approve 只授权指定合约使用指定 token，不等于已经完成 Swap 或 mint。

完成 Approve 后，需要再次点击主按钮提交实际交易。

### 8.6 Positions 页面显示示例数据

如果没有配置 ZAN，或者 ZAN 查询失败，页面会展示示例数据帮助理解界面。示例数据不会允许真实 Collect/Burn 交易。

可以通过手动输入 positionId 查询链上 position。

## 9. 安全提示

- zeroDex 当前运行在 Sepolia 测试网，请不要在主网资产场景中使用。
- 每次 MetaMask 弹窗都应检查交易内容和目标网络。
- Approve、Swap、Mint、Burn、Collect 都是链上写操作，会消耗 Sepolia ETH。
- 不要在不信任的页面输入助记词或私钥。
- 如果页面显示异常，请先刷新页面，再确认钱包网络和账户是否正确。

## 10. 开发与验证命令

开发环境：

```bash
npm run dev
```

运行测试：

```bash
npm test
```

构建生产包：

```bash
npm run build
```

当前推荐在功能改动后同时执行测试和构建，确认链路没有被破坏。
