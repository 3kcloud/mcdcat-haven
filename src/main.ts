/* 入口：路由 home / cat / cert / ach + 动效编排
 *
 * 关键约定：投喂/获取猫粮后走「局部刷新」（syncCatView），
 * 不整体重建 DOM —— 否则动画会在播完前被销毁，手感发木。
 */
import './style.css';
import * as L from './logic';
import * as A from './anim';
import * as M from './motion';
import * as Ach from './achievements';
import { mountFloatingBg } from './deco';
import { CATS, CONFIG } from './data';
import {
  renderHome,
  renderCat,
  renderCert,
  renderAchWall,
  renderAchCard,
  syncCatView,
} from './ui';
import { capture, captureCert } from './share';

let state: L.GameState = L.loadState();
let route = 'home';
let curCat = '';

const app = document.getElementById('app') as HTMLElement;

/* ---------- 台词 ---------- */

const LINES = ['喵～', '好好吃！', '谢谢你…', '（蹭蹭）', '呼噜噜～', '再来一口？'];

function pickLine(): string {
  return LINES[Math.floor(Math.random() * LINES.length)];
}

let bubbleTimer = 0;

function showBubble(text: string): void {
  const b = document.getElementById('bubble');
  if (!b) return;
  b.textContent = text;
  b.classList.remove('show');
  void b.offsetWidth;
  b.classList.add('show');
  window.clearTimeout(bubbleTimer);
  bubbleTimer = window.setTimeout(() => b.classList.remove('show'), 1700);
}

/* ---------- 路由 ---------- */

function go(r: string, id = ''): void {
  route = r;
  curCat = id;
  window.scrollTo(0, 0);
  render();
}

function render(): void {
  // 重建 DOM 前先停掉待机调度，避免旧引用残留
  M.stopIdleLoop();
  if (route === 'cat') {
    app.innerHTML = renderCat(state, curCat);
    bindCat();
  } else if (route === 'cert') {
    app.innerHTML = renderCert(state, curCat);
    bindCert();
  } else if (route === 'ach') {
    app.innerHTML = renderAchWall(state);
    bindAchWall();
  } else {
    app.innerHTML = renderHome(state);
    bindHome();
  }
  // 重放进场动画
  app.classList.remove('view');
  void app.offsetWidth;
  app.classList.add('view');
}

/* ---------- 首页 ---------- */

function bindHome(): void {
  app.querySelectorAll<HTMLElement>('.cat').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.id as string;
      A.haptic(10);
      L.adoptCat(state, id);
      L.saveState(state);
      go('cat', id);
    });
  });
  app.querySelector('#ach')?.addEventListener('click', () => {
    A.haptic(8);
    go('ach');
  });
}

/* ---------- 详情页 ---------- */

function bindCat(): void {
  app.querySelector('#back')?.addEventListener('click', () => {
    A.haptic(8);
    go('home');
  });

  // 摸摸头：猫咪开心蹦跳
  app.querySelector<HTMLImageElement>('#cat-img')?.addEventListener('click', (ev) => {
    const img = ev.currentTarget as HTMLImageElement;
    M.play(img, 'happy');
    A.haptic(10);
    showBubble(pickLine());
  });

  app.querySelector<HTMLButtonElement>('#feed')?.addEventListener('click', () => {
    void doFeed();
  });

  app.querySelector<HTMLButtonElement>('#signin')?.addEventListener('click', (ev) => {
    gain(100, 'signin', ev.currentTarget as HTMLButtonElement, 'signin');
  });

  app.querySelector<HTMLButtonElement>('#task')?.addEventListener('click', (ev) => {
    gain(150, 'task', ev.currentTarget as HTMLButtonElement, 'task');
  });

  app.querySelector<HTMLButtonElement>('#demo')?.addEventListener('click', (ev) => {
    const yuan = L.demoOrderTotal();
    const g = L.amountToKibble(yuan);
    gain(g, 'order', ev.currentTarget as HTMLButtonElement);
    showBubble(`这是 ¥${yuan} 的一餐～`);
  });

  // A 通道：真机订单（需后端代理 /api/mcp-order），失败自动降级演示模式
  app.querySelector<HTMLButtonElement>('#order')?.addEventListener('click', async (ev) => {
    const btn = ev.currentTarget as HTMLButtonElement;
    btn.disabled = true;
    const old = btn.textContent;
    btn.textContent = '🔄 正在读取订单…';
    try {
      const r = await fetch('/api/mcp-order');
      if (!r.ok) throw new Error('api-not-ready');
      const j = (await r.json()) as { total?: number };
      if (typeof j.total !== 'number') throw new Error('no-total');
      gain(L.amountToKibble(j.total), 'order', btn);
      showBubble(`你的订单 ¥${j.total}，换来了它的晚餐 💛`);
    } catch (e) {
      const yuan = L.demoOrderTotal();
      gain(L.amountToKibble(yuan), 'order', btn);
      showBubble('暂未授权，先用演示订单试试～');
    } finally {
      btn.disabled = false;
      btn.textContent = old;
    }
  });

  // 常驻姿态 + 待机动作循环 —— 让猫咪"一直在动"
  const bigImg = app.querySelector<HTMLImageElement>('#cat-img');
  if (bigImg) M.setPose(bigImg, state.kibble >= CONFIG.PER_FEED ? 'sit' : 'lie');
  M.startIdleLoop(
    () => app.querySelector<HTMLImageElement>('#cat-img'),
    () => (state.kibble >= CONFIG.PER_FEED ? 'happy' : 'hungry')
  );
}

/* ---------- 投喂：完整反馈序列 ---------- */

async function doFeed(): Promise<void> {
  const btn = app.querySelector<HTMLButtonElement>('#feed');
  const img = app.querySelector<HTMLImageElement>('#cat-img');
  if (!btn || !img) return;

  const before = state.kibble;
  const r = L.feedOnce(state, curCat);

  // 猫粮不足：否定反馈（晃动 + 下行音 + 长振动）
  if (!r.ok) {
    A.shake(btn);
    A.blipDown();
    A.haptic(45);
    showBubble('猫粮不够了…');
    return;
  }

  // ① 即时按压反馈
  A.pop(btn, 0.94);
  A.haptic(14);
  A.blip(760, 0.07);

  // ② 猫粮颗粒飞向猫咪 + 顶部数值滚动下降 + 飘字
  A.fly(btn, img, { emoji: '🌾', count: 7, rise: 72 });
  const kv = document.getElementById('kibble-val');
  if (kv) A.countUp(kv, before, state.kibble, 700, 'g');
  A.floatText(btn, `-${CONFIG.PER_FEED}g`, 'cost');

  // ③ 新解锁成就（先算出来，等动画后弹）
  const fresh = Ach.sync(state);
  if (fresh.length) L.saveState(state);

  // ④ 颗粒抵达：进食反应（低头 → 咀嚼 → 抬头，爱心上浮 + 台词）
  window.setTimeout(() => {
    M.play(img, 'eat');
    A.haptic([10, 25]);
    showBubble(pickLine());
  }, 540);

  // ⑤ 结算刷新（局部更新，不打断动画）
  window.setTimeout(() => {
    if (r.adopted) {
      if (!state.certDone.includes(curCat)) state.certDone.push(curCat);
      L.saveState(state);
      go('cert', curCat);
      const a = fresh[0];
      if (a) window.setTimeout(() => showAchievement(a), 480);
      return;
    }
    syncCatView(state, curCat, false);
    const a = fresh[0];
    if (a) window.setTimeout(() => showAchievement(a), 520);
  }, 720);
}

/* ---------- 获取猫粮：数值增长动效 ---------- */

function gain(
  grams: number,
  ch: 'order' | 'task' | 'signin',
  btn: HTMLElement,
  markDay?: 'signin' | 'task'
): void {
  const before = state.kibble;

  L.addKibble(state, grams, ch);
  if (markDay === 'signin') state.signinDay = L.today();
  if (markDay === 'task') state.taskDay = L.today();
  L.saveState(state);

  // 按压 + 音效 + 触感
  A.pop(btn, 0.95);
  A.haptic(10);
  A.blip(720, 0.07);
  A.chime([784, 1046]);

  // 猫粮颗粒飞入顶部计数器 + 数字滚动 + 飘字 + 数值条高亮
  const kv = document.getElementById('kibble-val');
  if (kv) {
    A.fly(btn, kv, { emoji: '🌾', count: 6, rise: 46, size: 0.9 });
    A.countUp(kv, before, state.kibble, 850, 'g');
  }
  A.floatText(btn, `+${grams}g`, 'gain');

  const bar = app.querySelector<HTMLElement>('#bar');
  if (bar) {
    bar.classList.remove('bump');
    void bar.offsetWidth;
    bar.classList.add('bump');
    A.pulse(bar);
  }

  const fresh = Ach.sync(state);
  if (fresh.length) {
    L.saveState(state);
    window.setTimeout(() => showAchievement(fresh[0]), 900);
  }

  // 刷新按钮状态（局部，保留动画）
  window.setTimeout(() => syncCatView(state, curCat, false), 240);
}

/* ---------- 成就解锁弹层 ---------- */

function showAchievement(a: Ach.Achievement): void {
  const cat = a.catId ? CATS.find((x) => x.id === a.catId) : undefined;
  const wrap = document.createElement('div');
  wrap.className = 'ach-modal';
  wrap.innerHTML = renderAchCard(a, cat, state);
  document.body.appendChild(wrap);

  const card = wrap.querySelector<HTMLElement>('#ach-card');
  if (card) A.confetti(card, 34);
  A.chime();
  A.haptic([10, 30, 16]);

  wrap.querySelector('.ach-modal-bg')?.addEventListener('click', () => closeAch(wrap));
  wrap.querySelector('#ach-close')?.addEventListener('click', () => closeAch(wrap));
  wrap.querySelector('#ach-save')?.addEventListener('click', () => {
    const c = wrap.querySelector<HTMLElement>('#ach-card');
    if (c) void capture(c, `麦麦猫屋-成就-${a.title}.png`);
  });
}

function closeAch(wrap: HTMLElement): void {
  wrap.classList.add('closing');
  window.setTimeout(() => wrap.remove(), 260);
}

/* ---------- 证书页 ---------- */

function bindCert(): void {
  app.querySelector('#home')?.addEventListener('click', () => go('home'));
  app.querySelector('#save')?.addEventListener('click', () => {
    const el = document.getElementById('cert-card');
    if (el) void captureCert(el);
  });
}

/* ---------- 成就墙 ---------- */

function bindAchWall(): void {
  app.querySelector('#back')?.addEventListener('click', () => {
    A.haptic(8);
    go('home');
  });
}

/* ---------- 全局按压涟漪：所有按钮统一手感 ---------- */

document.addEventListener(
  'click',
  (ev) => {
    const t = ev.target as HTMLElement | null;
    const btn = t?.closest('button') as HTMLButtonElement | null;
    if (!btn || btn.disabled) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const el = document.createElement('span');
    el.className = 'fx-ripple';
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.left = `${ev.clientX - r.left - size / 2}px`;
    el.style.top = `${ev.clientY - r.top - size / 2}px`;
    btn.appendChild(el);
    window.setTimeout(() => el.remove(), 640);
  },
  true
);

// 挂载麦当劳漂浮餐点背景（内部会尊重 prefers-reduced-motion 自动跳过）
mountFloatingBg();

render();
