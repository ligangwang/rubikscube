// dingn game SDK, protocol version 1.
//
// A game runs inside a sandboxed frame on dingn.com and talks to the website
// only through these calls. It never sees the player's account details beyond
// a display name, and never touches the website's cookies or storage.
//
//   import { connect } from "./dingn-sdk.js";
//   const dingn = await connect();
//   dingn.locale;                         // "en" or "zh-CN"
//   dingn.player;                         // { signedIn, name, avatar }
//   dingn.onPlayer((player) => …);        // sign-in or sign-out
//   await dingn.storage.set("best", 12);  // this device only
//   await dingn.progress.save({ level }); // follows a signed-in player
//   dingn.requestSignIn();
//   await dingn.rewards.unlock("level-10"); // a badge from game.json, once
//   await dingn.rewards.list();           // the game's badges, and which are earned
//   await dingn.rewards.spend("power-1"); // buy an upgrade from game.json's shop
//   await dingn.rewards.shop();           // the shop, and which upgrades are owned
//   await dingn.rewards.earn(3);          // a few coins for play, capped each day
//   dingn.navigate("/");                  // leave the game for a dingn page
//   dingn.ready();                        // hide the website's loading screen
//
// Opened on its own (not inside dingn), connect() still works in a local
// mode: signed out, English, and storage that lasts until the page closes.
export const PROTOCOL = 1;
const TIMEOUT_MS = 10000;
const SPEND_TIMEOUT_MS = 5 * 60 * 1000;

/** @returns {Promise<DingnGame>} */
export function connect({ timeout = TIMEOUT_MS } = {}) {
  const host =
    typeof window !== "undefined" && window.parent !== window
      ? window.parent
      : null;
  return host ? connectToHost(host, timeout) : Promise.resolve(standalone());
}

function connectToHost(host, timeout) {
  let nextId = 1;
  const pending = new Map();
  const listeners = new Set();
  let game;

  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (
      event.source !== host ||
      !msg ||
      msg.dingn !== "host" ||
      msg.v !== PROTOCOL
    )
      return;
    if (msg.event === "player") {
      if (game) game.player = msg.data;
      for (const fn of listeners) fn(msg.data);
      return;
    }
    const call = pending.get(msg.id);
    if (!call) return;
    pending.delete(msg.id);
    clearTimeout(call.timer);
    if (msg.error)
      call.reject(
        Object.assign(new Error(msg.error.message || msg.error.code), {
          code: msg.error.code,
        }),
      );
    else call.resolve(msg.result);
  });

  function request(method, params, wait = timeout) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(
          Object.assign(new Error("dingn did not answer"), { code: "timeout" }),
        );
      }, wait);
      pending.set(id, { resolve, reject, timer });
      // The host's origin is dingn.com, but a sandboxed frame cannot name it;
      // nothing sent here is secret.
      host.postMessage({ dingn: "game", v: PROTOCOL, id, method, params }, "*");
    });
  }
  const notify = (method, params) =>
    host.postMessage({ dingn: "game", v: PROTOCOL, method, params }, "*");

  return request("init").then((info) => {
    game = {
      gameId: info.gameId,
      version: info.version,
      locale: info.locale,
      player: info.player,
      embedded: true,
      onPlayer(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      storage: {
        get: (key) => request("storage.get", { key }),
        set: (key, value) => request("storage.set", { key, value }),
      },
      progress: {
        load: () => request("progress.load"),
        save: (data) => request("progress.save", { data }),
      },
      rewards: {
        unlock: (id) => request("rewards.unlock", { id }),
        list: () => request("rewards.list"),
        // dingn asks the player to confirm first, so allow time to answer.
        spend: (id) => request("rewards.spend", { id }, SPEND_TIMEOUT_MS),
        shop: () => request("rewards.shop"),
        earn: (coins) => request("rewards.earn", { coins }),
      },
      requestSignIn: () => notify("signIn"),
      navigate: (path) => notify("navigate", { path }),
      ready: () => notify("ready"),
    };
    return game;
  });
}

function standalone() {
  const memory = new Map();
  const signedOut = () =>
    Promise.reject(
      Object.assign(new Error("Sign in to save progress."), {
        code: "signed_out",
      }),
    );
  const lang = (typeof navigator !== "undefined" && navigator.language) || "en";
  return {
    gameId: "",
    version: "",
    locale: lang.toLowerCase().startsWith("zh") ? "zh-CN" : "en",
    player: { signedIn: false, name: "", avatar: "" },
    embedded: false,
    onPlayer: () => () => {},
    storage: {
      get: async (key) =>
        memory.has(key) ? JSON.parse(memory.get(key)) : null,
      set: async (key, value) => void memory.set(key, JSON.stringify(value)),
    },
    progress: { load: async () => null, save: signedOut },
    rewards: {
      unlock: signedOut,
      list: async () => [],
      spend: signedOut,
      shop: async () => [],
      earn: signedOut,
    },
    requestSignIn() {},
    navigate(path) {
      location.href = path;
    },
    ready() {},
  };
}
