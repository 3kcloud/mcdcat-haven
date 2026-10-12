/* 动效层 —— 全站交互反馈的统一出口
 *
 * 原则：玩家每个操作都要在 100ms 内有可见回应。
 * 三层叠加：触感（振动）→ 声音（WebAudio 合成，无外部资源）→ 视觉（粒子 / 弹跳 / 数字滚动）
 * 无障碍：尊重 prefers-reduced-motion，降级为"只变色不运动"。
 */

const prefersReduce: boolean =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

export const REDUCED: boolean = prefersReduce;

const EASE_OUT = 'cubic-bezier(.2,.7,.3,1)';
const EASE_SOFT = 'cubic-bezier(.36,.07,.19,.97)';

function center(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** 触感反馈（移动端） */
export function haptic(ms: number | number[] = 12): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* 设备不支持振动则静默忽略 */
  }
}

/* ---------- 音效：WebAudio 合成，零外部依赖 ---------- */

let audioCtx: AudioContext | null = null;

export function blip(freq = 880, dur = 0.09, type: OscillatorType = 'sine'): void {
  if (REDUCED) return;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    audioCtx = audioCtx ?? new Ctor();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch {
    /* 音频不可用不影响玩法 */
  }
}

/** 上行琶音：升级 / 解锁 */
export function chime(notes: number[] = [660, 880, 1175]): void {
  notes.forEach((f, i) => window.setTimeout(() => blip(f, 0.16, 'triangle'), i * 115));
}

/** 下行音：消耗 / 否定 */
export function blipDown(): void {
  blip(430, 0.13, 'sine');
}

/* ---------- 视觉反馈 ---------- */

/** 元素弹跳 */
export function pop(el: HTMLElement, scale = 1.12, dur = 380): void {
  if (REDUCED) {
    el.animate([{ opacity: 1 }, { opacity: 0.55 }, { opacity: 1 }], { duration: dur });
    return;
  }
  el.animate(
    [
      { transform: 'scale(1)' },
      { transform: `scale(${scale})` },
      { transform: 'scale(.97)' },
      { transform: 'scale(1)' },
    ],
    { duration: dur, easing: EASE_OUT }
  );
}

/** 左右晃动：否定反馈 */
export function shake(el: HTMLElement): void {
  if (REDUCED) return;
  el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 340, easing: 'ease-in-out' }
  );
}

/** 光环脉冲：数值变化时高亮 */
export function pulse(el: HTMLElement, color = 'rgba(232,162,61,.5)'): void {
  if (REDUCED) return;
  el.animate(
    [
      { boxShadow: `0 0 0 0 ${color}` },
      { boxShadow: '0 0 0 16px rgba(232,162,61,0)' },
    ],
    { duration: 720, easing: EASE_OUT }
  );
}

export interface FlyOptions {
  emoji?: string;
  count?: number;
  spread?: number;
  duration?: number;
  rise?: number;
  size?: number;
}

/** 粒子抛物线飞行（投喂：猫粮飞向猫咪） */
export function fly(from: HTMLElement, to: HTMLElement, o: FlyOptions = {}): void {
  const emoji = o.emoji ?? '🌾';
  const count = o.count ?? 5;
  const spread = o.spread ?? 48;
  const rise = o.rise ?? 66;
  if (REDUCED) return;
  const a = center(from);
  const b = center(to);
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'fx-particle';
    el.textContent = emoji;
    el.style.left = `${a.x}px`;
    el.style.top = `${a.y}px`;
    el.style.fontSize = `${(o.size ?? 1) * (17 + Math.random() * 9)}px`;
    document.body.appendChild(el);
    const jx = (Math.random() * 2 - 1) * spread;
    const jy = (Math.random() * 2 - 1) * spread * 0.35;
    const mx = (a.x + b.x) / 2 + jx - a.x;
    const my = Math.min(a.y, b.y) - rise + jy - a.y;
    const anim = el.animate(
      [
        { transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 },
        { transform: `translate(${mx}px,${my}px) scale(1.15)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${b.x - a.x}px,${b.y - a.y}px) scale(.5)`, opacity: 0 },
      ],
      { duration: (o.duration ?? 900) + i * 55, delay: i * 62, easing: EASE_SOFT }
    );
    anim.onfinish = (): void => el.remove();
  }
}

/** 粒子向上飘散（爱心 / 星星） */
export function burst(host: HTMLElement, o: FlyOptions = {}): void {
  const emoji = o.emoji ?? '💛';
  const count = o.count ?? 6;
  if (REDUCED) return;
  const a = center(host);
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'fx-particle';
    el.textContent = emoji;
    el.style.left = `${a.x + (Math.random() * 2 - 1) * 34}px`;
    el.style.top = `${a.y - 10}px`;
    el.style.fontSize = `${13 + Math.random() * 11}px`;
    document.body.appendChild(el);
    const dx = (Math.random() * 2 - 1) * 78;
    const dy = -(80 + Math.random() * 80);
    const anim = el.animate(
      [
        { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
        { transform: `translate(${dx * 0.45}px,${dy * 0.5}px) scale(1)`, opacity: 1, offset: 0.32 },
        { transform: `translate(${dx}px,${dy}px) scale(.55)`, opacity: 0 },
      ],
      { duration: 1150 + i * 55, delay: i * 75, easing: EASE_OUT }
    );
    anim.onfinish = (): void => el.remove();
  }
}

/** 飘字：+150g / -100g / 喵～ */
export function floatText(
  host: HTMLElement,
  text: string,
  kind: 'gain' | 'cost' | 'love' = 'gain'
): void {
  const r = host.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = `fx-float fx-${kind}`;
  el.textContent = text;
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top + r.height * 0.2}px`;
  document.body.appendChild(el);
  const anim = el.animate(
    [
      { transform: 'translate(-50%,0) scale(.6)', opacity: 0 },
      { transform: 'translate(-50%,-20px) scale(1.12)', opacity: 1, offset: 0.26 },
      { transform: 'translate(-50%,-70px) scale(1)', opacity: 0 },
    ],
    { duration: REDUCED ? 700 : 1150, easing: EASE_OUT }
  );
  anim.onfinish = (): void => el.remove();
}

/** 数字滚动：让数值"长"上去，而不是瞬间跳变 */
export function countUp(
  el: HTMLElement,
  from: number,
  to: number,
  dur = 750,
  suffix = ''
): void {
  if (REDUCED || from === to) {
    el.textContent = `${to}${suffix}`;
    return;
  }
  const t0 = performance.now();
  const step = (now: number): void => {
    const t = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = `${Math.round(from + (to - from) * eased)}${suffix}`;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- 撒花：成就解锁 / 领养成功 ---------- */

const CONFETTI_COLORS = ['#F5C46B', '#E8A23D', '#7BB661', '#C9B6D6', '#F2A0A0', '#9BD1E5'];

export function confetti(host: HTMLElement, count = 30): void {
  if (REDUCED) return;
  const a = center(host);
  for (let i = 0; i < count; i++) {
    const el = document.createElement('i');
    el.className = 'fx-confetti';
    el.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const w = 5 + Math.random() * 6;
    el.style.width = `${w}px`;
    el.style.height = `${w * (0.5 + Math.random() * 0.9)}px`;
    el.style.left = `${a.x + (Math.random() * 2 - 1) * 46}px`;
    el.style.top = `${a.y - 24}px`;
    document.body.appendChild(el);
    const dx = (Math.random() * 2 - 1) * 190;
    const dy = 130 + Math.random() * 240;
    const rot = (Math.random() * 2 - 1) * 760;
    const anim = el.animate(
      [
        { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: 1250 + Math.random() * 700, delay: i * 20, easing: 'cubic-bezier(.15,.6,.4,1)' }
    );
    anim.onfinish = (): void => el.remove();
  }
}

/** 组合庆祝：撒花 + 琶音 + 触感 */
export function celebrate(host: HTMLElement): void {
  confetti(host, 34);
  chime();
  haptic([10, 30, 16]);
}
