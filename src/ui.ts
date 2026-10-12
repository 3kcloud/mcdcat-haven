// UI 层：渲染首页 / 猫详情 / 成就墙 / 成就卡 / 领养证书
// 约定：render* 负责产出骨架 HTML，sync* 负责"局部刷新"，避免全量重建 DOM 打断动画
import { CATS, CONFIG, STAGE_NAMES } from './data';
import type { Cat } from './data';
import type { GameState } from './logic';
import { getTitle, today, demoOrderTotal } from './logic';
import * as A from './anim';
import * as M from './motion';
import * as Ach from './achievements';
import { ICON, BTN_ICON, stripeTag } from './deco';

// ⚠️ 仓库短链：分享卡转化的唯一桥梁
export const REPO_URL = 'https://github.com/3kcloud/mcdcat-haven';

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
}

/* ---------- 顶部数值条 ---------- */

export function renderTopBar(s: GameState): string {
  const t = getTitle(s.kibbleTotal);
  return `<div class="bar" id="bar">
    <span>${ICON.kibble} 猫粮 <b id="kibble-val">${s.kibble}g</b></span>
    <span>${ICON.bowl} 可投喂 <b id="feeds-val">${Math.floor(s.kibble / CONFIG.PER_FEED)}</b> 次</span>
    <span>${ICON.star} 称号 <b id="title-val">Lv.${t.lv} ${t.name}</b></span>
  </div>`;
}

/** 局部刷新顶部数值；传入 prev 时做数字滚动 */
export function updateTopBar(s: GameState, prev?: number): void {
  const kv = document.getElementById('kibble-val');
  const fv = document.getElementById('feeds-val');
  const tv = document.getElementById('title-val');
  const t = getTitle(s.kibbleTotal);

  if (kv) {
    if (typeof prev === 'number' && prev !== s.kibble) {
      A.countUp(kv, prev, s.kibble, 800, 'g');
    } else {
      kv.textContent = `${s.kibble}g`;
    }
  }
  if (fv) fv.textContent = String(Math.floor(s.kibble / CONFIG.PER_FEED));
  if (tv) tv.textContent = `Lv.${t.lv} ${t.name}`;
}

/* ---------- 首页 ---------- */

export function renderHome(s: GameState): string {
  const cards = CATS.map((c, i) => {
    const p = s.progress[c.id];
    const adopted = p?.adopted;
    const cur = p ? c.stages[p.stage - 1] : c.stages[0];
    const badge = adopted
      ? '<span class="badge done">已找到家</span>'
      : p
        ? `<span class="badge">阶段${p.stage}·${STAGE_NAMES[p.stage - 1]}</span>`
        : '<span class="badge new">等待领养</span>';

    return `<div class="cat" data-id="${c.id}" style="--c:${c.color};--d:${(i * 0.33).toFixed(2)}s">
      <span class="cat-img-wrap"><span class="cat-body"><img src="${cur.img}" alt="${esc(c.name)}" loading="lazy" /></span></span>
      <div class="nm">${esc(c.name)}<span class="tag">${c.icon} ${esc(c.mcd)}</span></div>
      ${badge}
      <div class="st">${esc(c.story)}</div>
    </div>`;
  }).join('');

  const total = Ach.catalog().length;
  const got = s.achievements.length;

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
    <div class="row" style="margin-top:12px">
      <button class="ghost" id="ach">${BTN_ICON.ach} 成就墙 ${got}/${total}</button>
    </div>
    <footer class="ft">🐙 基于麦当劳 MCP 构建 · <a href="${REPO_URL}" target="_blank" rel="noopener">${REPO_URL.replace('https://github.com/', '')}</a></footer>`;
}

/* ---------- 猫详情页 ---------- */

function dotsHtml(s: GameState, id: string): string {
  const p = s.progress[id];
  const stage = p ? p.stage : 1;
  const done = Ach.doneStages(s, id);
  return STAGE_NAMES.map((n, i) => {
    const cls = i < done ? 'done' : i + 1 === stage ? 'now' : '';
    return `<span class="dot ${cls}">${n}</span>`;
  }).join('<i>→</i>');
}

export function renderCat(s: GameState, id: string): string {
  const c = CATS.find((x) => x.id === id)!;
  const p = s.progress[id]!;
  const cur = c.stages[p.stage - 1];
  const pct = Math.min(100, (p.feedsInStage / CONFIG.FEEDS_PER_STAGE) * 100);
  const canFeed = s.kibble >= CONFIG.PER_FEED;

  return `<header class="hd sm">
      <button class="ghost" id="back">← 猫屋</button>
      <h1>${esc(c.name)}<span class="tag">${c.icon} ${esc(c.mcd)}</span></h1>
    </header>
    ${renderTopBar(s)}
    <div class="detail" style="--c:${c.color}">
      <div class="stage-badge" id="stage-badge">阶段 ${p.stage} · ${cur.name}</div>
      <div class="big-wrap" id="big-wrap">
        <i class="cat-shadow"></i>
        <div class="bubble" id="bubble"></div>
        <div class="cat-actor" id="cat-actor">
          <div class="cat-body js-ctrl" id="cat-body">
            <div class="cat-breathe" id="cat-breathe">
              <img id="cat-img" class="big" src="${cur.img}" alt="${esc(c.name)} ${cur.name}" />
            </div>
          </div>
        </div>
      </div>
      <p class="desc" id="desc">${esc(cur.desc)}</p>
      <div class="stages" id="stages">${dotsHtml(s, id)}</div>
      <div class="prog"><div class="fill" id="fill" style="width:${pct}%"></div></div>
      <div class="prog-t" id="prog-t">本阶段 ${p.feedsInStage}/${CONFIG.FEEDS_PER_STAGE} 次投喂</div>
      <button class="primary" id="feed" ${canFeed ? '' : 'disabled'}>
        ${canFeed ? `${BTN_ICON.feed} 投喂一次（-${CONFIG.PER_FEED}g）` : '猫粮不足'}
      </button>
    </div>

    <div class="gain">
      <h3>${ICON.kibble} 获取爱心猫粮</h3>
      ${stripeTag()}
      <p class="hint">A 麦门主食：真实订单金额换算（¥1 = ${CONFIG.RATE}g）</p>
      <button class="primary" id="order">${BTN_ICON.order} 授权并换算我的订单</button>
      <p class="hint">B 爱心任务：签到 / 浏览菜单 · 营养 · 活动（每日各一次）</p>
      <div class="row">
        <button id="signin" ${canSigninBtn(s) ? '' : 'disabled'}>${BTN_ICON.signin} 每日签到 +100g</button>
        <button id="task" ${canTaskBtn(s) ? '' : 'disabled'}>${BTN_ICON.task} 爱心任务 +150g</button>
      </div>
      <p class="hint">未授权也能完整体验：</p>
      <button id="demo">${BTN_ICON.demo} 演示模式（模拟 ¥${demoOrderTotal()} 订单）</button>
    </div>

    <div class="notice sm">⚠️ 现实中请勿随意投喂人类食品给猫咪，科学喂养请咨询兽医。本作为童话设定。</div>`;
}

function canSigninBtn(s: GameState): boolean {
  return s.signinDay !== today();
}
function canTaskBtn(s: GameState): boolean {
  return s.taskDay !== today();
}

/** 局部刷新详情页（保留 DOM，不打断动画） */
export function syncCatView(s: GameState, id: string, updateTop = true): void {
  const c = CATS.find((x) => x.id === id)!;
  const p = s.progress[id]!;
  const cur = c.stages[p.stage - 1];
  const pct = Math.min(100, (p.feedsInStage / CONFIG.FEEDS_PER_STAGE) * 100);

  const badge = document.getElementById('stage-badge');
  if (badge) badge.textContent = `阶段 ${p.stage} · ${cur.name}`;

  const desc = document.getElementById('desc');
  if (desc) desc.textContent = cur.desc;

  const stages = document.getElementById('stages');
  if (stages) stages.innerHTML = dotsHtml(s, id);

  const fill = document.getElementById('fill');
  if (fill) fill.style.width = `${pct}%`;

  const pt = document.getElementById('prog-t');
  if (pt) pt.textContent = `本阶段 ${p.feedsInStage}/${CONFIG.FEEDS_PER_STAGE} 次投喂`;

  const feed = document.getElementById('feed') as HTMLButtonElement | null;
  if (feed) {
    const can = s.kibble >= CONFIG.PER_FEED;
    feed.disabled = !can;
    feed.textContent = can ? `投喂一次（-${CONFIG.PER_FEED}g）` : '猫粮不足';
  }

  const img = document.getElementById('cat-img') as HTMLImageElement | null;
  if (img) {
    // 常驻姿态：有粮 = 坐姿精神；无粮 = 趴在地上（无精打采）
    M.setPose(img, s.kibble >= CONFIG.PER_FEED ? 'sit' : 'lie');
    const want = new URL(cur.img, location.href).href;
    if (img.src !== want) {
      img.classList.add('fade-out');
      window.setTimeout(() => {
        img.src = cur.img;
        img.classList.remove('fade-out');
        img.classList.add('pop-in');
        window.setTimeout(() => img.classList.remove('pop-in'), 560);
      }, 190);
    }
  }

  if (updateTop) updateTopBar(s);
}

/* ---------- 成就墙 ---------- */

export function renderAchWall(s: GameState): string {
  const all = Ach.catalog();
  const got = new Set(s.achievements);

  const items = all
    .map((a) => {
      const on = got.has(a.id);
      return `<div class="ach-item${on ? '' : ' locked'}">
        <div class="e">${on ? a.emoji : '🔒'}</div>
        <div class="t">${esc(a.title)}</div>
        <div class="s">${esc(on ? a.subtitle : a.how)}</div>
      </div>`;
    })
    .join('');

  return `<header class="hd sm">
      <button class="ghost" id="back">← 猫屋</button>
      <h1>成就墙</h1>
    </header>
    ${stripeTag()}
    <div class="notice sm">🏅 已解锁 <b>${got.size}</b> / ${all.length} 项成就</div>
    <div class="ach-grid">${items}</div>
    <footer class="ft">🐙 基于麦当劳 MCP 构建 · <a href="${REPO_URL}" target="_blank" rel="noopener">${REPO_URL.replace('https://github.com/', '')}</a></footer>`;
}

/* ---------- 成就卡（可保存分享） ---------- */

export function renderAchCard(a: Ach.Achievement, cat: Cat | undefined, s: GameState): string {
  const t = getTitle(s.kibbleTotal);
  const p = cat ? s.progress[cat.id] : undefined;
  const img = cat ? c_stage_img(cat, p) : '';

  return `<div class="ach-modal-bg"></div>
    <div class="ach-card-wrap">
      <div id="ach-card" class="ach-card" style="--c:${cat ? cat.color : '#E8A23D'}">
        <i class="mcd-corner tl" aria-hidden="true">${ICON.burger}</i>
        <i class="mcd-corner tr" aria-hidden="true">${ICON.fries}</i>
        <i class="mcd-corner bl" aria-hidden="true">${ICON.drink}</i>
        <i class="mcd-corner br" aria-hidden="true">${ICON.sundae}</i>
        <div class="ach-ribbon">成 就 解 锁</div>
        <div class="ach-emoji">${a.emoji}</div>
        ${img ? `<div class="ach-cat"><img src="${img}" alt="" /></div>` : ''}
        <h2>${esc(a.title)}</h2>
        <p class="ach-sub">${esc(a.subtitle)}</p>
        <div class="ach-meta">
          爱心等级 Lv.${t.lv} · 称号：${esc(t.name)}${p ? ` · 累计投喂 ${p.totalFeeds} 次` : ''}
        </div>
        <p class="cert-note">爱心猫粮为游戏内虚拟数值，不代表任何真实捐赠或实物兑换</p>
        <div class="cert-repo">🐙 基于麦当劳 MCP 构建<br/><a href="${REPO_URL}" target="_blank" rel="noopener">${REPO_URL}</a></div>
      </div>
      <div class="ach-actions">
        <button class="primary" id="ach-save">保存成就卡</button>
        <button class="ghost" id="ach-close">继续陪伴</button>
      </div>
    </div>`;
}

function c_stage_img(cat: Cat, p: { stage: number } | undefined): string {
  const idx = Math.min(CONFIG.STAGES, Math.max(1, p ? p.stage : 1));
  return cat_stage(cat, idx);
}

function cat_stage(cat: Cat, stage: number): string {
  const s = cat.stages.find((x) => x.stage === stage);
  return s ? s.img : cat.stages[0].img;
}

/* ---------- 领养证书 ---------- */

export function renderCert(s: GameState, id: string): string {
  const c = CATS.find((x) => x.id === id)!;
  const p = s.progress[id]!;
  const t = getTitle(s.kibbleTotal);
  return `<div class="cert-wrap">
    <div id="cert-card" class="cert" style="--c:${c.color}">
      ${stripeTag()}
      <div class="cert-hd">领 养 证 书</div>
      <div class="ba">
        <div><img src="${c.stages[0].img}" /><span>相遇</span></div>
        <div class="arrow">→</div>
        <div><img src="${c.stages[3].img}" /><span>新家</span></div>
      </div>
      <h2>${esc(c.name)} 找到了属于它的家</h2>
      <p class="lv">爱心等级 Lv.${t.lv} · 称号：${esc(t.name)}</p>
      <p class="meta">累计投喂 ${p.totalFeeds} 次 · 陪伴它走完 4 个阶段</p>
      <p class="cert-note">爱心猫粮为游戏内虚拟数值，不代表任何真实捐赠或实物兑换</p>
      <div class="cert-repo">🐙 基于麦当劳 MCP 构建<br/><a href="${REPO_URL}" target="_blank" rel="noopener">${REPO_URL}</a></div>
    </div>
    <button class="primary" id="save">保存分享图</button>
    <button class="ghost" id="home">回到猫屋</button>
    <p class="hint">保存后分享到朋友圈，让更多人看见流浪猫的故事 💛</p>
  </div>`;
}
