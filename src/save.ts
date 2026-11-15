// What the game remembers: the highest level cleared, the best full-scramble
// time and today's daily cube. Saved on the device (sdk.storage) and, for a
// signed-in player, to their dingn account (sdk.progress).
import type { DingnGame, Json } from "../sdk/dingn-sdk.js";
import { LAST_LEVEL } from "./levels";

export type Saved = {
  /** The highest level cleared, 0 for none. */
  level: number;
  /** Best full-scramble time in ms without hints or the solver, 0 for none. */
  best: number;
  /** Full scrambles solved. */
  solves: number;
  /** The last daily cube solved: its UTC day and time. */
  daily: { day: string; ms: number } | null;
};
type Sdk = Pick<DingnGame, "storage" | "progress" | "player">;

export const empty = (): Saved => ({
  level: 0,
  best: 0,
  solves: 0,
  daily: null,
});
const whole = (value: unknown, max: number) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : 0;
};
const DAY = 24 * 3600_000;

/** Reads a saved value, ignoring anything that isn't the right shape. */
export function parse(value: Json): Saved {
  const saved = empty();
  if (!value || typeof value !== "object" || Array.isArray(value)) return saved;
  saved.level = whole(value.level, LAST_LEVEL);
  saved.best = whole(value.best, DAY);
  saved.solves = whole(value.solves, 1e7);
  const d = value.daily;
  if (
    d &&
    typeof d === "object" &&
    !Array.isArray(d) &&
    typeof d.day === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(d.day) &&
    whole(d.ms, DAY) > 0
  )
    saved.daily = { day: d.day, ms: whole(d.ms, DAY) };
  return saved;
}

const faster = (a: number, b: number) => (a && b ? Math.min(a, b) : a || b);

/** Combines two saves, keeping the better of each. */
export function merge(a: Saved, b: Saved): Saved {
  let daily = a.daily ?? b.daily;
  if (a.daily && b.daily)
    daily =
      a.daily.day !== b.daily.day
        ? a.daily.day > b.daily.day
          ? a.daily
          : b.daily
        : { day: a.daily.day, ms: Math.min(a.daily.ms, b.daily.ms) };
  return {
    level: Math.max(a.level, b.level),
    best: faster(a.best, b.best),
    solves: Math.max(a.solves, b.solves),
    daily,
  };
}

const KEY = "rubikscube";
export async function loadSaved(sdk: Sdk): Promise<Saved> {
  let device = empty();
  try {
    device = parse(await sdk.storage.get(KEY));
  } catch {}
  if (!sdk.player.signedIn) return device;
  try {
    return merge(parse(await sdk.progress.load()), device);
  } catch {
    return device;
  }
}
export async function store(sdk: Sdk, saved: Saved) {
  const value = saved as unknown as Json;
  await sdk.storage.set(KEY, value).catch(() => {});
  if (sdk.player.signedIn) await sdk.progress.save(value).catch(() => {});
}
