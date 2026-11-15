export declare const PROTOCOL: 1;
export type Locale = "en" | "zh-CN";
export type Player = { signedIn: boolean; name: string; avatar: string };
export type Json =
  null | boolean | number | string | Json[] | { [key: string]: Json };
export type BadgeTier = "bronze" | "silver" | "gold" | "diamond";
/** A badge from the game's game.json, in the player's language. */
export type Badge = {
  id: string;
  tier: BadgeTier;
  /** A level badge shows this number; other badges show `icon`. */
  level?: number;
  icon?: string;
  coins: number;
  title: string;
  earned: boolean;
};
export type BadgeUnlock = {
  /** False when the player already had this badge. */
  new: boolean;
  /** dingn coins this unlock paid. */
  coins: number;
  /** True in a version dingn has not reviewed, or in the playground: nothing was saved. */
  test?: boolean;
};
/** An upgrade from the `shop` in the game's game.json, in the player's language. */
export type ShopItem = {
  id: string;
  /** dingn coins. */
  price: number;
  /** An upgrade that must be bought first. */
  requires?: string;
  title: string;
  /** Bought by the signed-in player. Upgrades are bought once and kept. */
  owned: boolean;
};
export type Purchase = {
  /** False when the player already owned it: nothing was charged. */
  new: boolean;
  /** dingn coins this purchase cost. */
  coins: number;
  /** True in a version dingn has not reviewed, or in the playground: nothing was charged. */
  test?: boolean;
};
export type Earning = {
  /** dingn coins paid: less than asked, or 0, once today's allowance is used up. */
  coins: number;
  /** Coins this game can still pay the player today, or null in a test. */
  left: number | null;
  /** True in a version dingn has not reviewed, or in the playground: nothing was paid. */
  test?: boolean;
};
export type DingnGame = {
  gameId: string;
  version: string;
  locale: Locale;
  player: Player;
  /** False when the game was opened on its own, outside dingn. */
  embedded: boolean;
  onPlayer(listener: (player: Player) => void): () => void;
  /** Saved on this device only. Keys: letters, digits, `._-`, up to 64. Values up to 16 KB as JSON. */
  storage: {
    get(key: string): Promise<Json>;
    set(key: string, value: Json): Promise<void>;
  };
  /** Saved to the signed-in player's account, up to 16 KB as JSON. save() rejects with code "signed_out" otherwise. */
  progress: { load(): Promise<Json>; save(data: Json): Promise<void> };
  /**
   * Badges and dingn coins. List badges in game.json; unlock(id) awards one to
   * the signed-in player (each pays once) and dingn shows a "Badge earned"
   * popup. unlock() rejects with code "signed_out" for a signed-out player.
   * Players spend coins on upgrades listed in game.json's `shop`.
   */
  rewards: {
    unlock(id: string): Promise<BadgeUnlock>;
    list(): Promise<Badge[]>;
    /**
     * Buys an upgrade from game.json's `shop` with the player's dingn coins.
     * dingn asks the player to confirm first. Rejects with code "cancelled"
     * (the player said no), "not_enough_coins", "requires" (buy the upgrade
     * it requires first) or "signed_out".
     */
    spend(id: string): Promise<Purchase>;
    shop(): Promise<ShopItem[]>;
    /**
     * Pays the signed-in player 1-10 dingn coins for play itself, such as a
     * failed level that still got somewhere. Each game can pay a player at
     * most 200 coins a day this way, on top of its badges. Rejects with code
     * "signed_out" for a signed-out player.
     */
    earn(coins: number): Promise<Earning>;
  };
  requestSignIn(): void;
  /** Leaves the game for a dingn page, such as "/" for the game list. The website keeps the player's language. */
  navigate(path: string): void;
  ready(): void;
};
export declare function connect(options?: {
  timeout?: number;
}): Promise<DingnGame>;
