// 逻辑层：状态管理 / 猫粮换算 / 投喂成长 / 称号
import { CONFIG, TITLES, DEMO_ORDERS } from './data';

export interface CatProgress {
  catId: string;
  stage: number;
  feedsInStage: number;
  totalFeeds: number;
  adopted: boolean;
}

export interface GameState {
  adopted: string[];
  progress: Record<string, CatProgress>;
  kibble: number; // 当前可用猫粮 (g)
  kibbleTotal: number; // 累计获得猫粮 (g) —— 称号依据
  byChannel: { order: number; task: number; signin: number };
  signinDay: string;
  taskDay: string;
  certDone: string[];
}

const KEY = 'mcdcat_v1';

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function defaultState(): GameState {
  return {
    adopted: [],
    progress: {},
    kibble: 0,
    kibbleTotal: 0,
    byChannel: { order: 0, task: 0, signin: 0 },
    signinDay: '',
    taskDay: '',
    certDone: [],
  };
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaultState(), ...(JSON.parse(raw) as GameState) };
  } catch (e) {
    /* 存档损坏则用默认 */
  }
  return defaultState();
}

export function saveState(s: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    /* 隐私模式下忽略 */
  }
}

// ¥1 = 10g 猫粮
export function amountToKibble(yuan: number): number {
  return Math.max(0, Math.floor(yuan * CONFIG.RATE));
}
// 每 100g = 1 次投喂
export function feedsFromKibble(g: number): number {
  return Math.floor(g / CONFIG.PER_FEED);
}

export function adoptCat(s: GameState, id: string): CatProgress {
  const exist = s.progress[id];
  if (exist) return exist;
  const p: CatProgress = { catId: id, stage: 1, feedsInStage: 0, totalFeeds: 0, adopted: false };
  s.progress[id] = p;
  if (!s.adopted.includes(id)) s.adopted.push(id);
  return p;
}

export function addKibble(s: GameState, grams: number, ch: 'order' | 'task' | 'signin'): void {
  s.kibble += grams;
  s.kibbleTotal += grams;
  s.byChannel[ch] += grams;
}

export interface FeedResult {
  ok: boolean;
  leveledUp: boolean;
  adopted: boolean;
}

export function feedOnce(s: GameState, id: string): FeedResult {
  const p = s.progress[id];
  if (!p || s.kibble < CONFIG.PER_FEED) return { ok: false, leveledUp: false, adopted: false };
  s.kibble -= CONFIG.PER_FEED;
  p.feedsInStage += 1;
  p.totalFeeds += 1;
  let leveledUp = false;
  let adopted = false;
  if (p.feedsInStage >= CONFIG.FEEDS_PER_STAGE) {
    if (p.stage < CONFIG.STAGES) {
      p.stage += 1;
      p.feedsInStage = 0;
      leveledUp = true;
    } else {
      p.adopted = true;
      adopted = true;
    }
  }
  saveState(s);
  return { ok: true, leveledUp, adopted };
}

export function getTitle(total: number) {
  let t = TITLES[0];
  for (const x of TITLES) if (total >= x.min) t = x;
  return t;
}

export function demoOrderTotal(): number {
  return DEMO_ORDERS.reduce((a, b) => a + b.amount, 0);
}

export function canSignin(s: GameState): boolean {
  return s.signinDay !== today();
}
export function canTask(s: GameState): boolean {
  return s.taskDay !== today();
}
