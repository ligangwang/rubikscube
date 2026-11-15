import React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { DingnGame, Locale } from "../sdk/dingn-sdk.js";
import { RubiksGame, type Mode } from "../src/game";
import { DingnProvider } from "../src/dingn";
import { empty, type Saved } from "../src/save";

// A stand-in for the three.js scene: turns apply at once, through the same
// callbacks the real scene uses.
const mocks = vi.hoisted(() => ({
  scene: null as null | {
    turns: string[];
    state: import("../src/cube/state").CubeState;
  },
}));
vi.mock("../src/cube-scene", async () => {
  const { CubeState } = await import("../src/cube/state");
  type Opts = {
    onTurn?: (m: string, s: string) => void;
    onBegin?: (s: string) => void;
  };
  return {
    CubeScene: class {
      state = new CubeState();
      turns: string[] = [];
      turnTime = 200;
      unfolded = false;
      busy = false;
      constructor(
        _host: HTMLElement,
        private options: Opts,
      ) {
        mocks.scene = this;
      }
      turn(move: string, source = "button") {
        this.turns.push(move);
        this.options.onBegin?.(source);
        this.state.move(move);
        this.options.onTurn?.(move, source);
      }
      setState(s: InstanceType<typeof CubeState>) {
        this.state = s.clone();
      }
      clearQueue() {}
      setHint() {}
      showLetters() {}
      setIdle() {}
      celebrate() {
        return Promise.resolve();
      }
      resetView() {}
      async setUnfolded(u: boolean) {
        this.unfolded = u;
      }
      dispose() {}
    },
  };
});

let stored: Map<string, unknown>;
let sdk: DingnGame;
const calls = {
  save: vi.fn(),
  earn: vi.fn(),
  unlock: vi.fn(),
};
function fakeSdk(signedIn: boolean, locale: Locale = "en") {
  stored = new Map();
  calls.save.mockReset().mockResolvedValue(undefined);
  calls.earn.mockReset().mockImplementation(async (coins: number) => ({ coins, left: 100 }));
  calls.unlock.mockReset().mockResolvedValue({ new: true, coins: 10 });
  sdk = {
    gameId: "rubikscube",
    version: "2.0.0",
    locale,
    player: { signedIn, name: signedIn ? "Ada" : "", avatar: "" },
    embedded: true,
    onPlayer: () => () => {},
    storage: {
      get: async (key) => (stored.get(key) ?? null) as never,
      set: async (key, value) => void stored.set(key, value),
    },
    progress: { load: async () => null, save: calls.save },
    rewards: {
      unlock: calls.unlock,
      list: async () => [],
      spend: async () => ({ new: true, coins: 0 }),
      shop: async () => [],
      earn: calls.earn,
    },
    requestSignIn: () => {},
    navigate: () => {},
    ready() {},
  };
}
const play = (saved: Saved = empty(), mode?: Mode) =>
  render(
    <DingnProvider sdk={sdk}>
      <RubiksGame initial={saved} initialMode={mode} />
    </DingnProvider>,
  );
const undoScramble = () => {
  const scene = mocks.scene!;
  const scramble = [...scene.turns];
  const inverse = (m: string) =>
    m.endsWith("2") ? m : m.endsWith("'") ? m[0] : m + "'";
  for (const m of scramble.reverse())
    for (const q of m.endsWith("2") ? [m[0], m[0]] : [inverse(m)])
      fireEvent.click(screen.getByRole("button", { name: q }));
};

beforeEach(() => fakeSdk(true));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("clearing a level pays coins, saves progress and opens the next level", async () => {
  play(empty());
  expect(screen.getByRole("heading", { name: "Undo a 1-move scramble" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Scramble and start" }));
  expect(mocks.scene!.turns.length).toBe(1);
  expect(mocks.scene!.state.isSolved()).toBe(false);
  await act(async () => undoScramble());
  expect(await screen.findByText("Solved!")).toBeTruthy();
  expect(screen.getByText("1 move")).toBeTruthy();
  expect(calls.earn).toHaveBeenCalledWith(1);
  expect(await screen.findByText("+1 coins")).toBeTruthy();
  expect(calls.save).toHaveBeenCalledWith(expect.objectContaining({ level: 1 }));
  fireEvent.click(screen.getByRole("button", { name: "Next level" }));
  expect(mocks.scene!.turns.length).toBe(1 + 1 + 2);
});

test("a full scramble earns the full-solve badges", async () => {
  play({ ...empty(), level: 14 });
  expect(screen.getByRole("heading", { name: "Solve a fully scrambled cube" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Scramble and start" }));
  expect(mocks.scene!.turns.length).toBe(25);
  await act(async () => undoScramble());
  expect(await screen.findByText("Solved!")).toBeTruthy();
  expect(calls.earn).toHaveBeenCalledWith(10);
  await vi.waitFor(() =>
    expect(calls.unlock.mock.calls.map((c) => c[0])).toEqual(
      expect.arrayContaining(["level-14", "full-solve", "full-1min"]),
    ),
  );
});

test("the solver solves it, but pays nothing", async () => {
  play({ ...empty(), level: 4 });
  fireEvent.click(screen.getByRole("button", { name: "Scramble and start" }));
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: /Solve for me/ })),
  );
  expect(mocks.scene!.state.isSolved()).toBe(true);
  expect(await screen.findByText("Solved by the solver")).toBeTruthy();
  expect(calls.earn).not.toHaveBeenCalled();
});

test("a hint names a move that helps", async () => {
  play();
  fireEvent.click(screen.getByRole("button", { name: "Scramble and start" }));
  fireEvent.click(screen.getByRole("button", { name: /Hint/ }));
  const scrambled = mocks.scene!.turns[0];
  const inverse = scrambled.endsWith("'") ? scrambled[0] : scrambled + "'";
  expect(document.querySelector(".rc-hint b")!.textContent).toBe(inverse);
});

test("free play checks positions and runs notation", async () => {
  play(empty(), "free");
  const box = screen.getByPlaceholderText(/UF UR UB UL/);
  fireEvent.change(box, { target: { value: "UR UF UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR" } });
  fireEvent.click(screen.getByRole("button", { name: "Set" }));
  expect(screen.getByText("That isn't a position a real cube can reach.")).toBeTruthy();
  fireEvent.change(screen.getByPlaceholderText("R U R' U'"), { target: { value: "R U R' U'" } });
  fireEvent.click(screen.getByRole("button", { name: "Run" }));
  expect(mocks.scene!.turns).toEqual(["R", "U", "R'", "U'"]);
  fireEvent.click(screen.getByRole("button", { name: "Get" }));
  expect((box as HTMLTextAreaElement).value).toBe(mocks.scene!.state.getState());
});

test("speaks Chinese", () => {
  fakeSdk(false, "zh-CN");
  play();
  expect(screen.getByRole("heading", { name: "还原打乱 1 步的魔方" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "打乱并开始" })).toBeTruthy();
  expect(screen.getByText("登录以赚取金币和徽章")).toBeTruthy();
});
