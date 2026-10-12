/* 猫咪肢体动作系统 —— 让静态立绘"活"起来
 *
 * 背景：素材是 6 猫 × 4 阶段的单张静态 PNG（无分层、无骨骼），
 * 无法做真正的骨骼动画。因此采用「程序化动作」：组合变换序列
 * + 环境粒子 + 地面阴影，模拟出肢体动作的观感。
 *
 * 四层结构（由外到内，每层一个职责，避免 transform 互相覆盖）：
 *   .cat-actor    整体体态/位移：蹦跳 · 蹭人 · 吃饭低头咀嚼
 *   .cat-body     常驻姿态：坐姿 / 趴下(lying) · 摇尾巴 · 伸懒腰
 *   .cat-breathe  呼吸循环（CSS 常驻；播放动作期间暂停）
 *   img           局部动作：眨眼 · 歪头
 */
import { REDUCED, haptic, blip, chime, blipDown, burst } from './anim';

export type ActionName =
  | 'eat'
  | 'wag'
  | 'stretch'
  | 'lick'
  | 'blink'
  | 'tilt'
  | 'happy'
  | 'sad';

export type Pose = 'sit' | 'lie';
export type Mood = 'happy' | 'hungry';

type Layer = 'actor' | 'body' | 'img';

interface Step {
  /** 作用层 */
  l: Layer;
  /** 关键帧 */
  k: Keyframe[];
  /** 时长 ms */
  d: number;
  /** easing */
  e?: string;
  /** 音效 */
  s?: 'blip' | 'chime' | 'down';
  /** 环境粒子（在动画开始时触发） */
  fx?: 'heart' | 'sparkle' | 'zzz' | 'crumb';
}

/* ---------- 动作库 ---------- */

const ACTS: Record<ActionName, Step[]> = {
  /* 吃饭：低头 → 咀嚼 3 下 → 抬头满足 */
  eat: [
    {
      l: 'actor',
      d: 1580,
      e: 'ease-in-out',
      s: 'blip',
      fx: 'heart',
      k: [
        { transform: 'translateY(0) scale(1)', offset: 0 },
        { transform: 'translateY(7%) scale(1.06, .93)', offset: 0.16 },
        { transform: 'translateY(7.6%) scale(1.09, .90)', offset: 0.28 },
        { transform: 'translateY(6.8%) scale(1.03, .96)', offset: 0.4 },
        { transform: 'translateY(7.6%) scale(1.08, .91)', offset: 0.52 },
        { transform: 'translateY(6.8%) scale(1.03, .96)', offset: 0.64 },
        { transform: 'translateY(1%) scale(.97, 1.04)', offset: 0.82 },
        { transform: 'translateY(0) scale(1)', offset: 1 },
      ],
    },
  ],

  /* 摇尾巴：绕臀部原点左右摆动 */
  wag: [
    {
      l: 'body',
      d: 1240,
      e: 'ease-in-out',
      s: 'blip',
      k: [
        { transform: 'rotate(0deg)', offset: 0 },
        { transform: 'rotate(-4.5deg)', offset: 0.12 },
        { transform: 'rotate(4.5deg)', offset: 0.25 },
        { transform: 'rotate(-4deg)', offset: 0.38 },
        { transform: 'rotate(4deg)', offset: 0.51 },
        { transform: 'rotate(-3deg)', offset: 0.64 },
        { transform: 'rotate(2.4deg)', offset: 0.77 },
        { transform: 'rotate(-1.2deg)', offset: 0.89 },
        { transform: 'rotate(0deg)', offset: 1 },
      ],
    },
  ],

  /* 伸懒腰：前肢前伸拉长 → 保持 → 回落抖毛 */
  stretch: [
    {
      l: 'body',
      d: 1700,
      e: 'cubic-bezier(.2,.8,.3,1)',
      s: 'chime',
      k: [
        { transform: 'scale(1,1)', offset: 0 },
        { transform: 'scale(.93,1.14) translateY(-4%)', offset: 0.34 },
        { transform: 'scale(.92,1.15) translateY(-4.5%)', offset: 0.62 },
        { transform: 'scale(1.02,.98) translateY(1%)', offset: 0.82 },
        { transform: 'scale(1,1)', offset: 1 },
      ],
    },
  ],

  /* 舔爪：歪头 + 头部上下点动 */
  lick: [
    {
      l: 'actor',
      d: 1240,
      e: 'ease-in-out',
      s: 'blip',
      k: [
        { transform: 'rotate(0deg) translateY(0)', offset: 0 },
        { transform: 'rotate(-9deg) translateY(1%)', offset: 0.22 },
        { transform: 'rotate(-9deg) translateY(3.5%)', offset: 0.4 },
        { transform: 'rotate(-9deg) translateY(1%)', offset: 0.58 },
        { transform: 'rotate(-8deg) translateY(3%)', offset: 0.74 },
        { transform: 'rotate(0deg) translateY(0)', offset: 1 },
      ],
    },
  ],

  /* 眨眼 */
  blink: [
    {
      l: 'img',
      d: 260,
      e: 'ease-in-out',
      k: [
        { transform: 'scaleY(1)', offset: 0 },
        { transform: 'scaleY(.9)', offset: 0.5 },
        { transform: 'scaleY(1)', offset: 1 },
      ],
    },
  ],

  /* 歪头：好奇 */
  tilt: [
    {
      l: 'img',
      d: 1400,
      e: 'ease-in-out',
      k: [
        { transform: 'rotate(0deg)', offset: 0 },
        { transform: 'rotate(-8deg)', offset: 0.28 },
        { transform: 'rotate(-8deg)', offset: 0.68 },
        { transform: 'rotate(0deg)', offset: 1 },
      ],
    },
  ],

  /* 开心蹦跳 */
  happy: [
    {
      l: 'actor',
      d: 1080,
      e: 'ease-out',
      s: 'chime',
      fx: 'sparkle',
      k: [
        { transform: 'translateY(0) scale(1,1)', offset: 0 },
        { transform: 'translateY(-15px) scale(.97,1.05)', offset: 0.16 },
        { transform: 'translateY(0) scale(1.04,.95)', offset: 0.33 },
        { transform: 'translateY(-11px) scale(.98,1.03)', offset: 0.5 },
        { transform: 'translateY(0) scale(1.02,.98)', offset: 0.68 },
        { transform: 'translateY(-3px) scale(1,1)', offset: 0.85 },
        { transform: 'translateY(0) scale(1,1)', offset: 1 },
      ],
    },
  ],

  /* 无精打采：耳朵耷拉、身体下沉 */
  sad: [
    {
      l: 'actor',
      d: 1500,
      e: 'ease-in-out',
      s: 'down',
      k: [
        { transform: 'translateY(0) rotate(0deg)', offset: 0 },
        { transform: 'translateY(4%) rotate(-2deg)', offset: 0.3 },
        { transform: 'translateY(4.5%) rotate(-2deg)', offset: 0.7 },
        { transform: 'translateY(0) rotate(0deg)', offset: 1 },
      ],
    },
  ],
};

/* ---------- 层访问 ---------- */

interface CatLayers {
  actor: HTMLElement | null;
  body: HTMLElement | null;
  breathe: HTMLElement | null;
  img: HTMLElement;
}

function layersOf(img: HTMLElement): CatLayers {
  const breathe = img.parentElement;
  const body = breathe ? breathe.parentElement : null;
  const actor = body ? body.parentElement : null;
  return { actor, body, breathe, img };
}

function elFor(l: Layer, ls: CatLayers): HTMLElement | null {
  if (l === 'actor') return ls.actor;
  if (l === 'body') return ls.body;
  return ls.img;
}

/* ---------- 环境粒子 ---------- */

function playFx(kind: NonNullable<Step['fx']>, host: HTMLElement): void {
  if (REDUCED) return;
  switch (kind) {
    case 'heart':
      burst(host, { emoji: '💛', count: 7, duration: 1200 });
      break;
    case 'sparkle':
      burst(host, { emoji: '✨', count: 8, duration: 1100 });
      break;
    case 'zzz':
      burst(host, { emoji: '💤', count: 3, duration: 1500 });
      break;
    case 'crumb':
      burst(host, { emoji: '🍽️', count: 3, duration: 900 });
      break;
  }
}

function playSound(s: NonNullable<Step['s']>, delay = 0): void {
  if (REDUCED) return;
  const fn = (): void => {
    if (s === 'blip') blip(760, 0.08);
    else if (s === 'chime') chime([660, 990]);
    else blipDown();
  };
  if (delay > 0) window.setTimeout(fn, delay);
  else fn();
}

/* ---------- 播放 ---------- */

let seqLock = false;
const pending: ActionName[] = [];

/** 播放一个动作；若正在播放则排队（同一时刻只播一个，避免动作打架） */
export function play(img: HTMLElement | null, name: ActionName): void {
  if (!img || REDUCED) return;
  if (seqLock) {
    if (pending.length < 2) pending.push(name);
    return;
  }
  void runSeq(img, name);
}

async function runSeq(img: HTMLElement, name: ActionName): Promise<void> {
  seqLock = true;
  try {
    const steps = ACTS[name];
    const ls = layersOf(img);
    for (const st of steps) {
      const el = elFor(st.l, ls);
      if (!el) continue;
      if (st.fx) playFx(st.fx, img);
      if (st.s) playSound(st.s);
      const anim = el.animate(st.k, {
        duration: st.d,
        easing: st.e ?? 'ease-in-out',
      });
      // 动作期间暂停呼吸，避免两套 transform 叠加抖动
      ls.breathe?.classList.add('paused');
      try {
        await anim.finished;
      } catch {
        /* 动画被打断则忽略 */
      }
      ls.breathe?.classList.remove('paused');
    }
  } finally {
    seqLock = false;
  }
  const next = pending.shift();
  if (next) void runSeq(img, next);
}

/* ---------- 常驻姿态：坐姿 / 趴下 ---------- */

/** 设置猫咪常驻姿态（趴下 = 无精打采；坐姿 = 精神） */
export function setPose(img: HTMLElement | null, pose: Pose): void {
  const ls = img ? layersOf(img) : null;
  const body = ls?.body;
  if (!body) return;
  // 外层 wrap 同步标记：驱动地面阴影随姿态放大/收窄
  const wrap = ls?.actor?.parentElement;
  const lie = pose === 'lie';
  body.classList.toggle('lying', lie);
  wrap?.classList.toggle('is-lying', lie);
}

/* ---------- 待机动作调度 ---------- */

const IDLE_HAPPY: ActionName[] = ['tilt', 'wag', 'blink', 'lick', 'wag', 'stretch', 'blink'];
const IDLE_HUNGRY: ActionName[] = ['sad', 'blink', 'sad', 'blink'];

let idleTimer = 0;

/**
 * 启动待机动作循环：随机间隔播放小动作，让猫"一直在动"。
 * @param get 当前大图元素（详情页切换时会变，所以每次取）
 * @param getMood 心情：有粮=happy（摇尾/伸懒腰），无粮=hungry（趴着叹气）
 */
export function startIdleLoop(
  get: () => HTMLElement | null,
  getMood: () => Mood
): void {
  stopIdleLoop();
  const tick = (): void => {
    const img = get();
    if (img) {
      const mood = getMood();
      const pool = mood === 'hungry' ? IDLE_HUNGRY : IDLE_HAPPY;
      const name = pool[Math.floor(Math.random() * pool.length)];
      if (name) play(img, name);
    }
    idleTimer = window.setTimeout(tick, 3200 + Math.random() * 3800);
  };
  idleTimer = window.setTimeout(tick, 2600);
}

export function stopIdleLoop(): void {
  if (idleTimer) window.clearTimeout(idleTimer);
  idleTimer = 0;
}
