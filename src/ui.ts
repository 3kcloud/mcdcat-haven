// UI 层：渲染首页 / 猫详情 / 领养证书（返回 HTML 字符串）
import { CATS, CONFIG, STAGE_NAMES } from './data';
import type { GameState } from './logic';
import { getTitle, today, demoOrderTotal } from './logic';

// ⚠️ 仓库短链：分享卡转化的唯一桥梁。建仓后如仓库名不同，请改此处。
export const REPO_URL = 'https://github.com/3kcloud/mcdcat-haven';

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
}

export function renderTopBar(s: GameState): string {
  const t = getTitle(s.kibbleTotal);
  return `<div class="bar">
    <span>猫粮 <b>${s.kibble}g</b></span>
    <span>可投喂 <b>${Math.floor(s.kibble / CONFIG.PER_FEED)}</b> 次</span>
    <span>称号 <b>Lv.${t.lv} ${t.name}</b></span>
  </div>`;
}

export function renderHome(s: GameState): string {
  const cards = CATS.map((c) => {
    const p = s.progress[c.id];
    const adopted = p?.adopted;
    const cur = p ? c.stages[p.stage - 1] : c.stages[0];
    const badge = adopted
      ? '<span class="badge done">已找到家</span>'
      : p
        ? `<span class="badge">阶段${p.stage}·${STAGE_NAMES[p.stage - 1]}</span>`
        : '<span class="badge new">等待领养</span>';
    return `<div class="cat" data-id="${c.id}" style="--c:${c.color}">
      <img src="${cur.img}" alt="${esc(c.name)}" loading="lazy" />
      <div class="nm">${esc(c.name)}<span class="tag">${esc(c.mcd)}</span></div>
      ${badge}
      <div class="st">${esc(c.story)}</div>
    </div>`;
  }).join('');

  return `<header class="hd">
      <h1>麦麦猫屋</h1>
      <p class="sub">用你的一餐，换流浪猫的一餐</p>
    </header>
    <div class="notice">
      🌱 本作为公益倡导，倡导「领养代替购买」「科学喂养 · TNR」。
      <br/>猫咪为虚构角色，<b>爱心猫粮为游戏内虚拟数值，不代表任何真实捐赠或实物兑换</b>。
    </div>
    ${renderTopBar(s)}
    <div class="grid">${cards}</div>
    <footer class="ft">🐙 基于麦当劳 MCP 构建 · <a href="${REPO_URL}" target="_blank" rel="noopener">${REPO_URL.replace('https://github.com/', '')}</a></footer>`;
}

export function renderCat(s: GameState, id: string): string {
  const c = CATS.find((x) => x.id === id)!;
  const p = s.progress[id]!;
  const cur = c.stages[p.stage - 1];
  const pct = Math.min(100, (p.feedsInStage / CONFIG.FEEDS_PER_STAGE) * 100);
  const dots = STAGE_NAMES.map((n, i) => {
    const active = i + 1 < p.stage ? 'done' : i + 1 === p.stage ? 'now' : '';
    return `<span class="dot ${active}">${n}</span>`;
  }).join('<i>→</i>');
  const canFeed = s.kibble >= CONFIG.PER_FEED;

  return `<header class="hd sm">
      <button class="ghost" id="back">← 猫屋</button>
      <h1>${esc(c.name)}<span class="tag">${esc(c.mcd)}</span></h1>
    </header>
    ${renderTopBar(s)}
    <div class="detail" style="--c:${c.color}">
      <div class="stage-badge">阶段 ${p.stage} · ${cur.name}</div>
      <img class="big" src="${cur.img}" alt="${esc(c.name)} ${cur.name}" />
      <p class="desc">${esc(cur.desc)}</p>
      <div class="stages">${dots}</div>
      <div class="prog"><div class="fill" style="width:${pct}%"></div></div>
      <div class="prog-t">本阶段 ${p.feedsInStage}/${CONFIG.FEEDS_PER_STAGE} 次投喂</div>
      <button class="primary" id="feed" ${canFeed ? '' : 'disabled'}>
        ${canFeed ? `投喂一次（-${CONFIG.PER_FEED}g）` : '猫粮不足'}
      </button>
    </div>

    <div class="gain">
      <h3>获取爱心猫粮</h3>
      <p class="hint">A 麦门主食：真实订单金额换算（¥1 = ${CONFIG.RATE}g）</p>
      <button class="primary" id="order">🔗 授权并换算我的订单</button>
      <p class="hint">B 爱心任务：签到 / 浏览菜单 · 营养 · 活动（每日各一次）</p>
      <div class="row">
        <button id="signin" ${canSigninBtn(s) ? '' : 'disabled'}>每日签到 +100g</button>
        <button id="task" ${canTaskBtn(s) ? '' : 'disabled'}>爱心任务 +150g</button>
      </div>
      <p class="hint">未授权也能完整体验：</p>
      <button id="demo">演示模式（模拟 ¥${demoOrderTotal()} 订单）</button>
    </div>

    <div class="notice sm">⚠️ 现实中请勿随意投喂人类食品给猫咪，科学喂养请咨询兽医。本作为童话设定。</div>`;
}

function canSigninBtn(s: GameState): boolean {
  return s.signinDay !== today();
}
function canTaskBtn(s: GameState): boolean {
  return s.taskDay !== today();
}

export function renderCert(s: GameState, id: string): string {
  const c = CATS.find((x) => x.id === id)!;
  const p = s.progress[id]!;
  const t = getTitle(s.kibbleTotal);
  return `<div class="cert-wrap">
    <div id="cert-card" class="cert" style="--c:${c.color}">
      <div class="cert-hd">领 养 证 书</div>
      <div class="ba">
        <div><img src="${c.stages[0].img}" /><span>相遇</span></div>
        <div class="arrow">→</div>
        <div><img src="${c.stages[3].img}" /><span>新家</span></div>
      </div>
      <h2>${esc(c.name)} 找到了属于它的家</h2>
      <p class="lv">爱心等级 Lv.${t.lv} · 称号：${t.name}</p>
      <p class="meta">累计投喂 ${p.totalFeeds} 次 · 陪伴它走完 4 个阶段</p>
      <p class="cert-note">爱心猫粮为游戏内虚拟数值，不代表任何真实捐赠或实物兑换</p>
      <div class="cert-repo">🐙 基于麦当劳 MCP 构建<br/><a href="${REPO_URL}" target="_blank" rel="noopener">${REPO_URL}</a></div>
    </div>
    <button class="primary" id="save">保存分享图</button>
    <button class="ghost" id="home">回到猫屋</button>
    <p class="hint">保存后分享到朋友圈，让更多人看见流浪猫的故事 💛</p>
  </div>`;
}
