/* 成就体系：把"喂养里程碑"变成可分享的成就卡
 *
 * 设计要点：每张成就卡都自带仓库短链 —— 玩家晒成就 = 给仓库引流，
 * 这是大众玩家 → GitHub Star 的核心转化钩子。
 * 合规底线：成就只由游戏进度解锁，与 GitHub Star 完全无关。
 */

import { CATS, CONFIG, TITLES } from './data';
import type { GameState } from './logic';

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  how: string; // 未解锁时的引导文案
  catId?: string;
  stage?: number;
}

/** 四个成长阶段对应的成就文案 */
export const STAGE_META: Record<number, { emoji: string; title: string; subtitle: string }> = {
  1: { emoji: '🌱', title: '初次相遇', subtitle: '它第一次没有躲开你递出的手' },
  2: { emoji: '🍚', title: '慢慢熟悉', subtitle: '它开始记住你的脚步声' },
  3: { emoji: '💛', title: '全然信赖', subtitle: '它把最柔软的肚皮交给了你' },
  4: { emoji: '🎀', title: '有了新家', subtitle: '红领巾系好，它不再流浪' },
};

export function stageAchId(catId: string, stage: number): string {
  return `stage:${catId}:${stage}`;
}

export function adoptedCount(s: GameState): number {
  return CATS.filter((c) => s.progress[c.id]?.adopted).length;
}

/** 某只猫已走完的阶段数 */
export function doneStages(s: GameState, catId: string): number {
  const p = s.progress[catId];
  if (!p) return 0;
  return p.adopted ? CONFIG.STAGES : p.stage - 1;
}

/** 全部成就清单（含未解锁） */
export function catalog(): Achievement[] {
  const out: Achievement[] = [];

  // 阶段成就：6 猫 × 4 阶段
  for (const c of CATS) {
    for (let st = 1; st <= CONFIG.STAGES; st++) {
      const m = STAGE_META[st];
      out.push({
        id: stageAchId(c.id, st),
        catId: c.id,
        stage: st,
        emoji: m.emoji,
        title: m.title,
        subtitle: `${c.name} · ${m.subtitle}`,
        how: `陪伴 ${c.name} 走完阶段 ${st}`,
      });
    }
  }

  // 称号成就：8 级
  for (const t of TITLES) {
    out.push({
      id: `title:${t.lv}`,
      emoji: '🏅',
      title: t.name,
      subtitle: `爱心等级 Lv.${t.lv} 达成`,
      how: `累计获得 ${t.min}g 爱心猫粮`,
    });
  }

  // 收藏成就
  out.push({
    id: 'collect:3',
    emoji: '🏡',
    title: '猫屋三剑客',
    subtitle: '3 只猫咪找到了家',
    how: '帮助 3 只猫咪完成领养',
  });
  out.push({
    id: 'collect:6',
    emoji: '👑',
    title: '麦门守护者',
    subtitle: '6 只猫咪全部安家',
    how: '帮助全部 6 只猫咪完成领养',
  });

  // 隐藏成就
  out.push({
    id: 'friend:20000',
    emoji: '🌟',
    title: '流浪猫之友',
    subtitle: '隐藏成就 · 累计 20000g 爱心猫粮',
    how: '累计获得 20000g 爱心猫粮',
  });

  return out;
}

/** 当前已达成的所有成就 id */
export function earnedIds(s: GameState): string[] {
  const ids: string[] = [];

  for (const c of CATS) {
    const done = doneStages(s, c.id);
    for (let st = 1; st <= done; st++) ids.push(stageAchId(c.id, st));
  }
  for (const t of TITLES) if (s.kibbleTotal >= t.min) ids.push(`title:${t.lv}`);

  const n = adoptedCount(s);
  if (n >= 3) ids.push('collect:3');
  if (n >= 6) ids.push('collect:6');
  if (s.kibbleTotal >= 20000) ids.push('friend:20000');

  return ids;
}

/** 比对并写入新解锁成就，返回「本次新解锁」列表 */
export function sync(s: GameState): Achievement[] {
  const all = catalog();
  const now = earnedIds(s);
  const fresh = now.filter((id) => !s.achievements.includes(id));
  if (fresh.length) s.achievements = s.achievements.concat(fresh);
  return fresh
    .map((id) => all.find((a) => a.id === id))
    .filter((a): a is Achievement => Boolean(a));
}
