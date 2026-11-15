// The game's rules: the level ladder, the daily cube, and what a solve pays.
import { randomMoves, seeded } from "./cube/scramble";
import { inverseAll, simplify, type Move } from "./cube/state";

/** Scramble length for each level. The last level is a full scramble. */
export const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20, 25];
export const FULL = 25;
export const LAST_LEVEL = LEVELS.length;
export const scrambleLength = (level: number) =>
  LEVELS[Math.min(Math.max(level, 1), LAST_LEVEL) - 1];
export const isFull = (length: number) => length >= FULL;

/** A fresh scramble for a level. */
export const levelScramble = (level: number, rand = Math.random) =>
  randomMoves(scrambleLength(level), rand);

/** Today's UTC day, as 2026-11-15. */
export const utcDay = (now = new Date()) => now.toISOString().slice(0, 10);
/** Everyone gets the same full scramble on the same UTC day. */
export const dailyScramble = (day: string) =>
  randomMoves(FULL, seeded(`rubikscube-daily-${day}`));

/**
 * dingn coins for a solve: more for longer scrambles, up to 10. Hints halve
 * it. sdk.rewards.earn caps what a game pays a player each day.
 */
export function coinsFor(length: number, hints: number) {
  const base = Math.min(10, Math.max(1, Math.round(length * 0.4)));
  return hints ? Math.max(1, Math.floor(base / 2)) : base;
}

/**
 * The quickest known way back: undo the scramble and the player's turns,
 * merged. Used for hints when it is shorter than the solver's answer.
 */
export const undoPath = (history: Move[]) => inverseAll(simplify(history));

/** 83456 → "1:23.4". */
export function formatTime(ms: number) {
  const tenths = Math.floor(ms / 100);
  const m = Math.floor(tenths / 600);
  const s = Math.floor((tenths % 600) / 10);
  return `${m}:${String(s).padStart(2, "0")}.${tenths % 10}`;
}
