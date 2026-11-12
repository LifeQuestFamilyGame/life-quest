import { ECONOMY } from '../content/family.js';

// ---- Levels and chapters -------------------------------------------------
// 5 chapters x 10 levels. XP per level rises each chapter.
export const XP_PER_LEVEL = [350, 700, 900, 1100, 1300];
export const CHAPTER_NAMES = ['Primary school', 'High school', 'Young adult', 'Career', 'Building a life'];

export function levelInfo(xp) {
  let level = 1, floor = 0;
  for (let c = 0; c < 5; c++) {
    for (let i = 0; i < 10; i++) {
      const size = XP_PER_LEVEL[c];
      if (xp < floor + size || (c === 4 && i === 9)) {
        return {
          level, chapter: c + 1, chapterName: CHAPTER_NAMES[c],
          into: Math.max(0, xp - floor), size, toNext: floor + size - xp,
          weeklyCap: ECONOMY.weeklyCaps[c],
          nextChapterLevel: c < 4 ? (c + 1) * 10 + 1 : null,
          nextChapterCap: c < 4 ? ECONOMY.weeklyCaps[c + 1] : null
        };
      }
      floor += size; level++;
    }
  }
}

// ---- Dice ---------------------------------------------------------------
export function rollD6(rng = Math.random) { return 1 + Math.floor(rng() * 6); }

export function band(total) {
  if (total <= 2) return 'disaster';
  if (total <= 5) return 'setback';
  if (total <= 8) return 'normal';
  if (total <= 11) return 'good';
  return 'lucky';
}
export const BAND_ORDER = ['disaster', 'setback', 'normal', 'good', 'lucky'];
export const BAND_NAMES = { disaster: 'Disaster', setback: 'Setback', normal: 'Normal', good: 'Good break', lucky: 'Lucky break' };
export function atLeast(b, floor) {
  return BAND_ORDER.indexOf(b) < BAND_ORDER.indexOf(floor) ? floor : b;
}

export function statMod(value) {
  if (value >= 70) return 1;
  if (value < 30) return -1;
  return 0;
}
// Each crack in a shield is -1 on rolls in that area, but never more than -2 in total (changed from -4 on 12 Nov 2026).
export function riskMod(tokens) { return -Math.min(tokens || 0, 2); }

// Roll two dice with a list of named modifiers.
export function roll(mods, rng = Math.random, forced) {
  const d1 = forced ? forced[0] : rollD6(rng);
  const d2 = forced ? forced[1] : rollD6(rng);
  const active = mods.filter((m) => m.value !== 0 || m.show);
  const total = d1 + d2 + active.reduce((s, m) => s + m.value, 0);
  return { d1, d2, mods: active, total, band: band(total) };
}

// ---- Streak XP boost: +5% per full streak week, up to x1.5 ------------------
export function xpMultiplier(streakCount) {
  const weeks = Math.min(Math.floor((streakCount || 0) / 7), 10);
  return 1 + 0.05 * weeks;
}

export const clampStat = (v) => Math.max(0, Math.min(100, Math.round(v)));

export function pick(list, rng = Math.random) { return list[Math.floor(rng() * list.length)]; }

// Pull a coin amount out of story text like "-30 coins" or "a 50-coin bill".
export function coinsInText(text) {
  if (!text) return 0;
  let m = text.match(/-(\d+) coins/);
  if (m) return Number(m[1]);
  m = text.match(/(\d+)-coin (bill|fine)/);
  if (m) return Number(m[1]);
  return 0;
}
