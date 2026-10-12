/* 麦当劳视觉元素层
 *
 * ⚠️ 合规说明（重要，勿删）
 * 金色拱门「M」图形是麦当劳的注册商标。本模块刻意**不复制、不临摹**该图形，
 * 改用两层安全资产营造「麦当劳感」：
 *   1. 品牌配色（麦当劳红 / 金黄）—— 颜色本身不受商标保护
 *   2. 通用餐饮 emoji（🍔🍟🥤🍦）—— 通用符号，非任何品牌的商标
 * 大赛规则禁止的是：贬损品牌、与他牌对比、侵犯第三方知识产权。
 * 因此：不画 M 拱门、不写「官方」字样、不暗示官方出品。
 */
import { REDUCED } from './anim';

/** 品牌配色（仅作视觉呼应，不使用商标图形） */
export const MCD_RED = '#DA291C';
export const MCD_YELLOW = '#FFC72C';

/** 通用餐饮图标（emoji，非商标） */
export const ICON = {
  burger: '🍔',
  fries: '🍟',
  drink: '🥤',
  sundae: '🍦',
  chicken: '🍗',
  pancake: '🥞',
  coffee: '☕',
  kibble: '🌾',
  heart: '💛',
  paw: '🐾',
  home: '🏠',
  calendar: '📅',
  gift: '🎁',
  trophy: '🏆',
  star: '⭐',
  sparkle: '✨',
  bowl: '🍽️',
  link: '🔗',
} as const;

/* ---------- 背景：漂浮的餐点图标 ---------- */

const FLOATERS: string[] = [
  ICON.burger,
  ICON.fries,
  ICON.drink,
  ICON.sundae,
  ICON.chicken,
  ICON.pancake,
  ICON.coffee,
  ICON.burger,
  ICON.fries,
  ICON.drink,
  ICON.sundae,
  ICON.chicken,
];

/** 缓慢上浮 + 轻微旋转的餐点图标，透明度极低，只做氛围不抢内容 */
export function mountFloatingBg(): void {
  if (REDUCED) return;
  let host = document.querySelector<HTMLElement>('.mcd-bg');
  if (!host) {
    host = document.createElement('div');
    host.className = 'mcd-bg';
    host.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(host, document.body.firstChild);
  }
  host.innerHTML = FLOATERS.map((e, i) => {
    const left = ((i * 37) % 92) + 2;
    const size = 20 + ((i * 13) % 26);
    const dur = 16 + ((i * 7) % 12);
    const delay = (i * 1.7) % 14;
    return `<i class="mcd-float" style="left:${left}%;font-size:${size}px;animation-duration:${dur}s;animation-delay:-${delay}s">${e}</i>`;
  }).join('');
}

/* ---------- 按钮图标 ---------- */

/** 交互按钮的统一图标口径 */
export const BTN_ICON = {
  feed: ICON.bowl,
  order: ICON.link,
  signin: ICON.calendar,
  task: ICON.gift,
  demo: '🎮',
  ach: ICON.trophy,
  back: '←',
  save: '💾',
} as const;

/* ---------- 装饰纹样 ---------- */

/** 卡片顶部的红黄条纹（餐饮业通用装饰，非商标） */
export function stripeTag(): string {
  return `<i class="mcd-stripe" aria-hidden="true"></i>`;
}
