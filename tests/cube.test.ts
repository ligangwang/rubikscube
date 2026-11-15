import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CubeState,
  QUARTER_TURNS,
  SOLVED_STATE,
  inverseAll,
  isValidState,
  parseMoves,
  simplify,
} from "../src/cube/state";
import { solveStages } from "../src/cube/solver";
import { randomMoves, seeded } from "../src/cube/scramble";

test("a new cube is solved", () => {
  assert.equal(new CubeState().isSolved(), true);
  assert.equal(new CubeState().getState(), SOLVED_STATE);
});

test("each quarter turn has order 4 and is undone by its inverse", () => {
  for (const op of QUARTER_TURNS) {
    const c = new CubeState();
    c.move(op);
    assert.equal(c.isSolved(), false, op);
    c.apply([op, op, op]);
    assert.equal(c.isSolved(), true, op);
  }
});

test("the sexy move has order 6", () => {
  const c = new CubeState();
  for (let i = 0; i < 6; i++) c.apply(["R", "U", "R'", "U'"]);
  assert.equal(c.isSolved(), true);
});

test("R turns the front-right stickers up", () => {
  const c = new CubeState().apply(["R"]);
  // The cubie now at UFR came from DFR; its F sticker is now on U.
  assert.equal(c.sticker("FRU", "U"), "F");
  assert.equal(c.sticker("FRU", "F"), "D");
  assert.equal(c.sticker("FRU", "R"), "R");
});

test("valid and invalid positions", () => {
  assert.equal(isValidState(SOLVED_STATE), true);
  assert.equal(
    isValidState("UR UF UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR"),
    false,
  );
  assert.equal(
    isValidState("DL UR UB UL DF DR DB BR FR FL UF BL UFR URB UBL ULF DRF DFL DLB DBR"),
    true,
  );
  assert.equal(
    isValidState("UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB BRD"),
    false,
  );
  assert.equal(
    isValidState("FU UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR"),
    false,
  );
  assert.equal(isValidState("UF UR"), false);
  assert.equal(isValidState("UF UF UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR"), false);
});

test("every scrambled position is valid and survives a round trip", () => {
  const rand = seeded("states");
  for (let i = 0; i < 300; i++) {
    const c = new CubeState().apply(randomMoves(25, rand));
    const state = c.getState();
    assert.equal(isValidState(state), true, state);
    assert.equal(new CubeState(state).getState(), state);
  }
});

test("parseMoves reads notation", () => {
  assert.deepEqual(parseMoves("R U2 F' l"), ["R", "U2", "F'", "L"]);
  assert.deepEqual(parseMoves("RUR'U'"), ["R", "U", "R'", "U'"]);
  assert.deepEqual(parseMoves("R2'"), ["R2"]);
  assert.deepEqual(parseMoves(""), []);
  assert.equal(parseMoves("RX"), null);
});

test("simplify merges turns of the same face", () => {
  assert.deepEqual(simplify(["R", "R"]), ["R2"]);
  assert.deepEqual(simplify(["R", "R'"]), []);
  assert.deepEqual(simplify(["U", "R", "R'", "U"]), ["U2"]);
  assert.deepEqual(simplify(["R2", "R"]), ["R'"]);
});

test("the solver solves thousands of random cubes", () => {
  const rand = seeded("solver");
  let longest = 0;
  for (let i = 0; i < 3000; i++) {
    const scramble = randomMoves(1 + Math.floor(rand() * 30), rand);
    const c = new CubeState().apply(scramble);
    const moves = solveStages(c).flatMap((s) => s.moves);
    c.apply(moves);
    assert.equal(c.isSolved(), true, scramble.join(" "));
    longest = Math.max(longest, moves.length);
  }
  assert.ok(longest < 250, `longest ${longest}`);
});

test("a solved cube needs no moves", () => {
  assert.deepEqual(solveStages(new CubeState()), []);
});
