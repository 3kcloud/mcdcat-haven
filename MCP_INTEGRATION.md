# MCP_INTEGRATION.md — 麦当劳 MCP 真实调用说明

> 本仓库已通过真机验证调用麦当劳中国官方 MCP Server（`mcd-mcp` v1.0.0，共 35 个 tools）。
> 验证日期：2026-10-11。本文档供评委与开发者核查真实调用链路。

## 1. 服务接入

| 项 | 值 |
|---|---|
| 端点 | `https://mcp.mcd.cn` |
| 协议 | Streamable HTTP（JSON-RPC 2.0） |
| 鉴权 | `Authorization: Bearer <MCP_TOKEN>` |
| 限流 | 600 次/分钟（超出返回 429） |
| 客户端 | 本项目自建轻量代理层（`server/mcpClient.ts`），不依赖第三方 MCP SDK |

## 2. 调用时序

1. `POST initialize` → 返回 `protocolVersion` / `sessionId`
2. `POST notifications/initialized`（通知，无响应）
3. `POST tools/list` → 列出全部 tools
4. `POST tools/call { name, arguments }` → 调用具体能力

> 本项目服务端统一封装，前端只与本项目后端通信，规避浏览器 CORS 跨域（这也是后端必须存在的刚性理由）。

## 3. 本项目真实调用的 Tools

| 用途 | Tool | 数据层 | 用于 |
|---|---|---|---|
| 订单金额 → 猫粮换算 | `order-list` | 个人（需 Token） | 主线喂养（A 通道） |
| 菜单/餐品数据 | `query-meals` | 公开 | 爱心餐素材、任务系统 |
| 营养数据 | `list-nutrition-foods` | 公开 | 营养正向展示（仅蛋白质/均衡） |
| 一键领券 | `auto-bind-coupons` | 个人（需 Token） | 成长里程碑真实奖励 |

## 4. 关键返回结构（经真机验证，已脱敏）

### order-list（订单金额 → 猫粮核心）
```json
{
  "data": {
    "list": [{
      "orderId": "********",
      "orderType": "1|2",
      "createTime": "2026-xx-xx xx:xx:xx",
      "storeName": "麦当劳xxx餐厅",
      "orderStatus": "已完成",
      "orderProductList": [{ "productName": "巨无霸", "quantity": 1 }],
      "realTotalAmount": "35.00"
    }]
  }
}
```
→ 取 `realTotalAmount` 求和，按 **¥1 = 10g 猫粮** 换算。仅读取金额数值，**不存储订单明细、不记录商品清单**。

### query-meals
```json
{
  "data": {
    "categories": [{ "name": "超值套餐", "meals": [{ "code": "...", "name": "巨无霸套餐", "tags": ["..."] }] }],
    "meals": { "<code>": { "name": "...", "image": "https://img.mcd.cn/...", "currentPrice": "24.50", "originalPrice": "29.00", "discountType": null } } }
  }
}
```

### list-nutrition-foods
```json
{ "data": "<文本表>\n  中薯条,null,1210,289,4,12,38,165,18\n  麦乐鸡5块,null,890,213,12,12,13,422,9\n  ..." }
```
→ 解析字段：`productName, energyKj, energyKcal, protein, fat, carbohydrate, sodium, calcium`
→ **仅正向展示蛋白质/均衡搭配，不展示总热量数字**（合规：规避"宣扬不健康饮食 / 热量焦虑"红线）。

### auto-bind-coupons（已真机验证，真实领券成功）
返回领取的券列表（含 `couponId` / `couponCode` / 图片 URL）。
→ **仅在玩家主动授权 Token、且达成成长里程碑时调用**；券由游戏成就解锁，与 GitHub Star **完全脱钩**（合规：不触发"Star 换券"）。

## 5. 安全与合规

- `MCP_TOKEN` 仅存于服务端环境变量，**绝不写入前端代码或公开仓库**（见 `.gitignore`）。
- 个人数据（订单金额、券码）仅在服务端/客户端内存中使用，不落库、不上送第三方。
- 公开层数据（菜单/营养/活动）由开发者 Token 在服务端缓存后下发，全员共享，规避 600/min 限流。
- 本项目形式符合大赛"应用程序"定义，真实全链路 MCP 调用已验证。

## 6. 验证记录

- 服务端：`mcd-mcp` 1.0.0，共 35 个 tools 可用
- 结果：上述 4 个 Tool 全部返回 200 成功，含 `auto-bind-coupons` 真实领券（返回券列表成功）
- 端点连通性：Streamable HTTP + Bearer 鉴权验证通过
