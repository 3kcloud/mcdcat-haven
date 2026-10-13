# 麦麦猫屋 McdCat Haven · 项目完整对话记录

> 生成时间：2026-10-13
> 范围：从「麦当劳程序员创意开发大赛」创意探索，到作品成型、报名提交、链接排障的完整对话沉淀。
> 脱敏说明：对话中曾出现过的麦当劳 MCP Token 已脱敏，真实值仅存于服务端环境变量（Vercel），未入库、未在本文出现。

---

## 0. 背景与目标

- 赛事：2026 麦当劳程序员创意开发大赛（官方报名仓库 `M-China/mcd-developer-innovation-challenge`）。
- 排名规则：以 **GitHub Star 在 2026-10-26 00:00 的快照**为准，同一账号单 Public 仓库且仅 Star 最高者进榜；无评委打分；反作弊。
- 合规红线：禁止不健康饮食引导、贬损品牌、侵权、拜金主义、虚假捐赠。
- 作品定位：基于麦当劳 MCP 的「领养流浪猫公益养成 H5」——**麦麦猫屋 McdCat Haven**。
- 工具：全程由 WorkBuddy 辅助开发。

---

## 1. 创意探索：从红海到蓝海，再到公益叙事

**用户**：希望做营销向、能引起会员共鸣的玩法（麦金卡影响力 / 麦当劳主题小游戏如消消乐+排名积分换券，要有传播与品牌影响力）。要求先问问题直到 95% 信心再给 3–5 个创意。

**助手**：
- 去 GitHub 检索现成方案并做统计：省钱类 114、人格/品牌类 22、终端/CLI 类 9、游戏类 12。
- 结论：终端、人格、省钱是红海；**小游戏（消消乐）是相对蓝海**，竞品少。
- 初定坚持「消消乐 + 排名积分」方向，并识别死穴：玩法不好 + 无传播钩子。

**用户**：改方向——领养具麦当劳特色的小猫，公益向（流浪/遗弃），6 只猫，喂订单食物 N 次成长。

**助手**：纠偏——不能喂薯条/汉堡（合规红线：不健康饮食 + 真实食品喂猫意象）。改为「查订单金额 → 换算为虚拟猫粮」。

**用户**：目标用户定为高频消费者。

**助手**：补全「双通道」设计，确保程序员也能走到结局、不被 Star 卡住：
- 通道 A：订单金额换算猫粮（无日上限，真实数据驱动）。
- 通道 B：签到 + 任务（不依赖订单也能推进）。

**用户**：证书用「爱心等级/称号」而非金额。

**助手**：采纳，规避拜金主义红线。

---

## 2. PRD 与核心机制确立

核心换算与成长模型（v2.1）：
- `¥1 = 10g` 爱心猫粮。
- `100g = 1 次投喂`；每只猫分 4 阶段（相遇→熟悉→信赖→新家），每阶段 5 次投喂，共 20 次投喂达成领养。
- 8 级爱心称号：拾粮人 → … → 流浪猫之友（Lv8，≥20000g）。
- 6 只麦当劳特色流浪猫：小橘🍟 / 奶昔🍦 / 芝麻🍔 / 团子🍗 / 玄米🥤 / 芋圆🥧，各有被遗弃/流浪身世设定。

合规底线（写入 PRD 与参赛说明）：
1. 猫粮只作游戏内虚拟喂养量，绝不出现「喂猫吃人类食品」意象。
2. 不承诺任何形式的真实捐赠。
3. 猫咪角色与故事均为虚构，倡导「领养代替购买」「科学喂养」「TNR 绝育」。
4. 称号替代金额，规避拜金。
5. 麦当劳视觉仅用通用 emoji + 品牌配色（红 #DA291C / 金 #FFC72C），**不仿金色拱门 M 商标**。

---

## 3. 美术素材：锁定风格基准 + 24 张真透明立绘

**用户**：先锁猫咪风格基准图；最终锁定文件 `T10-32-46`（治愈手绘水彩风）。

**助手**：
- 澄清候选图序号混淆，以 `T10-32-46` 为准，写入 `STYLE_BASELINE.md`。
- 用户自生成 24 图并提供；归档建库（`assets/美术素材总表.md`、`CAT_PROMPT_SHEET.md`、`STYLE_BASELINE.md`）。
- 验证 24 张图边缘透明比 0.51–0.69、四角 alpha=0 → **全真透明，免抠图**（曾误装 rembg，确认免抠后删除 cutout 流程）。
- 落库：`assets/cats/`（原图）、`public/assets/cats/`（512×512 压缩真透明立绘，供前端加载）。

---

## 4. 技术实现：真实 MCP + 前端动效 + 多层增强

**4.1 麦当劳 MCP（已真机验证 4 个 tool）**
- `order-list`：取历史订单（`realTotalAmount` 累加 → 猫粮）。
- `query-meals`：菜单数据，用于爱心餐素材。
- `list-nutrition-foods`：营养数据，用于营养正向展示。
- `auto-bind-coupons`：成长里程碑一键领取真实优惠券（已验证真实写入用户账户）。
- 数据分层：菜单/营养等公开数据由服务端用开发者 Token 缓存共享（零门槛）；订单/领券等个人数据需玩家主动授权，Token 仅经服务端环境变量中转、不落库不留存。

**4.2 前端架构**
- Vite + TypeScript（strict）；DOM/CSS 动画；`html2canvas` 生成分享卡；`localStorage` 存档。
- 渲染改为「骨架 HTML + `syncCatView` 局部刷新」，避免全量 `innerHTML` 重建（这是早期交互僵硬的根源）。
- 后端：`api/mcp-order.js`（Vercel Serverless 代理 CORS，Token 走环境变量，仅取金额累加不落库）。

**4.3 三层动效封装（按用户反馈迭代）**
- `anim.ts`：反馈原语（fly 颗粒飞向猫 / burst 💛 / floatText / countUp / pop / shake / pulse）+ WebAudio 音效 + 触感/彩带。
- `motion.ts`：程序化肢体动作（eat / wag / stretch / lick / blink / tilt / happy / sad）+ 待机随机 3–7s 微动 + `setPose()`。
- `deco.ts`：麦当劳视觉（背景 12 漂浮 emoji、斜条纹、按钮/顶栏/成就卡/证书注入 icon）。

**4.4 四层立绘结构**
```
<div class="cat-actor"><div class="cat-body"><div class="cat-breathe"><img/></div></div></div>
```
配合 `.lying / .is-lying`（趴地阴影）、`reduced-motion` 降级。

**4.5 发布与修复**
- 构建 `tsc` 零错，13 modules（CSS 11.90KB / JS 231.33KB）。
- 线上静态托管：`https://mcdcat-haven.app.workbuddy.host/`（演示模式，`/api/mcp-order` 不可用；需 Vercel 才真机）。
- 多次按反馈修复：渲染重绘僵硬、setPose 阴影 bug（漏 `.is-lying`，已补）、emoji 入包校验（esbuild 转义不影响浏览器解析）。

---

## 5. 报名提交（Issue #518）

**用户**：去申请参赛。

**助手**：
- 定位官方报名仓库 `M-China/mcd-developer-innovation-challenge`（真实范本 Issue #516/#517）。
- 核验我方仓库 `3kcloud/mcdcat-haven` 为 **Public**，必须文件齐全（README / CONTEST_DECLARATION / MCP_INTEGRATION / workbuddy.md），创建时间 2026-10-12 落在窗口（2025-12-25 ~ 2026-10-25 23:59）。
- 正文满足三条硬约束：标题与正文间无空行、项目简介标签与内容同行、地址为裸 URL。
- 提交 Issue：**https://github.com/M-China/mcd-developer-innovation-challenge/issues/518**
- 机器人 `M-China-Official` 已回复：「您的作品已成功参赛，您可以通过官方项目的排行榜.md 查看排名」。

---

## 6. 报名链接排障（本会话）

**用户**：报名链接 `https://github.com/M-China/mcd-developer-innovation-challenge/issues/created_by/518**` 为什么提示 something went wrong？

**助手**：
- 先核验 Issue #518 真实存在、状态 OPEN、机器人已确认参赛 → **报名成功，无需重提**。
- 错误原因：链接被拼接错——
  1. 末尾 `**` 是 Markdown 加粗符号被带进 URL，GitHub 视为非法字符报错。
  2. 路径 `issues/created_by/518` 不对：`created_by/` 后应跟用户名而非 Issue 编号。
- 正确链接：
  - 报名记录：https://github.com/M-China/mcd-developer-innovation-challenge/issues/518
  - 决定排名的项目仓库（要冲 Star）：https://github.com/3kcloud/mcdcat-haven
- 提醒：传播时务必引导给别人点**项目仓库 Star**，而非 Issue 链接，否则拉不到排名。

---

## 7. 关键约束清单（评委核查口径）

| 项 | 内容 |
|---|---|
| 排名依据 | GitHub Star，2026-10-26 00:00 快照 |
| 仓库要求 | 单 Public 仓库，创建于 2025-12-25 ~ 2026-10-25 23:59 |
| 必须文件 | README.md / CONTEST_DECLARATION.md（官方原文不改）/ MCP_INTEGRATION.md |
| 真机 MCP | order-list / query-meals / list-nutrition-foods / auto-bind-coupons（均已验证） |
| 合规 | 虚拟猫粮、不承诺真实捐赠、虚构角色、称号替代金额、不仿商标 |
| 当前进度 | 已报名（Issue #518 确认）；Star 目标 ≥80 待冲 |

---

## 8. 待办 / 下一步

- [ ] 冲 Star：朋友圈 + 小红书双线传播，引导点 `3kcloud/mcdcat-haven` Star（目标 ≥80，定榜 10-26 00:00）。
- [ ] 可选：部署 Vercel 启用真机 `/api/mcp-order` 订单链路，强化「真实订单→猫粮」演示说服力。
- [ ] 可选：加早期即时成就（首次投喂 / 签到 / 授权）提升留存。
- [ ] 可选：加抽象「拱门弧线」装饰（当前刻意回避商标近似，需权衡）。

---

*本文由 WorkBuddy 依据项目对话沉淀整理，仅作项目存档与参赛备查。*
