// Rubik's Cube's dingn badges. They are declared in game.json (dingn checks
// that list and decides what each tier pays); this file says when they are
// earned.
import type { DingnGame } from "../sdk/dingn-sdk.js";

/** A badge for clearing each of these levels. */
export const LEVEL_MILESTONES = [3, 5, 8, 11, 14];
export const levelBadge = (level: number) => `level-${level}`;
export const FULL_SOLVE = "full-solve";
/** Full-scramble solves without hints or the solver, under these times. */
export const FULL_TIMES: [number, string][] = [
  [5 * 60_000, "full-5min"],
  [2 * 60_000, "full-2min"],
  [60_000, "full-1min"],
];
export const DAILY = "daily-cube";
export const WATCH = "watch-solver";

/** The level badges for having cleared up to `level`. */
export const levelBadges = (level: number) =>
  LEVEL_MILESTONES.filter((m) => m <= level).map(levelBadge);

/** The badges a full-scramble solve earned. */
export function fullBadges(ms: number, assisted: boolean) {
  if (assisted) return [];
  return [
    FULL_SOLVE,
    ...FULL_TIMES.filter(([limit]) => ms < limit).map(([, id]) => id),
  ];
}

type Badged = Pick<DingnGame, "player"> & {
  rewards: Pick<DingnGame["rewards"], "unlock" | "list">;
};

/**
 * Unlocks badges, skipping ones the player already has. dingn shows the
 * popups and pays the coins. Never throws: badges must not get in the way.
 */
export function createBadgeTracker() {
  let earned: Promise<Set<string>> | null = null;
  const known = (sdk: Badged) =>
    (earned ??= sdk.rewards
      .list()
      .then((all) => new Set(all.filter((b) => b.earned).map((b) => b.id)))
      .catch(() => new Set<string>()));
  return {
    reset() {
      earned = null;
    },
    async unlock(sdk: Badged, ids: string[]) {
      if (!sdk.player.signedIn || !ids.length) return [];
      const have = await known(sdk);
      const unlocked: string[] = [];
      for (const id of ids) {
        if (have.has(id)) continue;
        try {
          await sdk.rewards.unlock(id);
          have.add(id);
          unlocked.push(id);
        } catch {}
      }
      return unlocked;
    },
  };
}
export const badges = createBadgeTracker();
