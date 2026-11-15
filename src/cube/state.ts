// The cube's state in Singmaster positional notation, ported from the original
// JavaScript version (www/js/cubestate.js) by Ligang Wang.
//
// A "cubicle" is a fixed place on the cube, named by the faces it touches
// (sorted, such as "FRU"). A "cubie" is the piece sitting there, named by the
// faces it belongs to. Each cubie maps its facets (stickers) to the faces of
// the cubicle it is in.

export type Face = "U" | "D" | "F" | "B" | "L" | "R";
/** A quarter turn ("R", "R'") or a half turn ("R2"). */
export type Move = string;

export const FACE_PAIRS: [Face, Face][] = [
  ["F", "B"],
  ["L", "R"],
  ["U", "D"],
];
export const FACE_NAMES: Face[] = FACE_PAIRS.flat();
export const SOLVED_STATE =
  "UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR";
const SOLVED_SLOTS = SOLVED_STATE.split(" ");
const ALL_SLOTS = [...SOLVED_SLOTS, ...FACE_NAMES];

export const OPPOSITE = {} as Record<Face, Face>;
for (const [a, b] of FACE_PAIRS) {
  OPPOSITE[a] = b;
  OPPOSITE[b] = a;
}

export const sortName = (s: string) => s.split("").sort().join("");

/** The four side faces each face's clockwise quarter turn carries round, in order (R: F→U→B→D). */
export const FACE_CYCLES: Record<string, Face[]> = {
  R: ["F", "U", "B", "D"],
  U: ["F", "L", "B", "R"],
  F: ["U", "R", "D", "L"],
};
FACE_CYCLES.L = [...FACE_CYCLES.R].reverse();
FACE_CYCLES.D = [...FACE_CYCLES.U].reverse();
FACE_CYCLES.B = [...FACE_CYCLES.F].reverse();
for (const f of FACE_NAMES) FACE_CYCLES[f + "'"] = [...FACE_CYCLES[f]].reverse();

/** The 12 quarter turns. */
export const QUARTER_TURNS = FACE_NAMES.flatMap((f) => [f, f + "'"]);

/** Where each face goes under a quarter turn; the turning face stays put. */
const FACE_MAP: Record<string, Record<string, Face>> = {};
for (const op of QUARTER_TURNS) {
  const cycle = FACE_CYCLES[op];
  const map: Record<string, Face> = {};
  cycle.forEach((f, i) => (map[f] = cycle[(i + 1) % cycle.length]));
  map[op[0]] = op[0] as Face;
  FACE_MAP[op] = map;
}

/** Every cubicle on each face. */
export const CUBE_FACES = {} as Record<Face, string[]>;
for (const f of FACE_NAMES) CUBE_FACES[f] = [];
for (const slot of ALL_SLOTS) {
  const loc = sortName(slot);
  for (const f of loc) CUBE_FACES[f as Face].push(loc);
}

/** Splits "R U2 F'" or "RU2F'" into moves, or returns null if it isn't valid notation. */
export function parseMoves(text: string): Move[] | null {
  const moves: Move[] = [];
  const clean = text.replace(/[\s,]+/g, "").replace(/[’`]/g, "'");
  const re = /([UDFBLR])(2'?|'2?|)/giy;
  let m: RegExpExecArray | null;
  while (re.lastIndex < clean.length) {
    m = re.exec(clean);
    if (!m) return null;
    const face = m[1].toUpperCase();
    moves.push(m[2].includes("2") ? face + "2" : face + m[2]);
  }
  return moves;
}

/** The quarter turns that make up a move. */
export function quarterTurns(move: Move): Move[] {
  if (move.length === 2 && move[1] === "2") return [move[0], move[0]];
  if (!QUARTER_TURNS.includes(move)) throw new Error(`Unknown move: ${move}`);
  return [move];
}

export const inverse = (move: Move): Move =>
  move.endsWith("2") ? move : move.endsWith("'") ? move[0] : move + "'";
export const inverseAll = (moves: Move[]) => moves.map(inverse).reverse();

/** Quarter turns of a move, clockwise positive: R=1, R'=-1 (3), R2=2. */
const turnsOf = (m: Move) => (m.endsWith("2") ? 2 : m.endsWith("'") ? 3 : 1);
const moveOf = (face: string, turns: number) =>
  [null, face, face + "2", face + "'"][turns % 4];

/** Merges neighbouring turns of the same face: R R → R2, R R' → nothing. */
export function simplify(moves: Move[]): Move[] {
  const out: Move[] = [];
  for (const move of moves) {
    const last = out[out.length - 1];
    if (last && last[0] === move[0]) {
      out.pop();
      const merged = moveOf(move[0], turnsOf(last) + turnsOf(move));
      if (merged) out.push(merged);
    } else out.push(move);
  }
  return out;
}

export class CubieState {
  /** The cubie's name: the faces its facets belong to, sorted. */
  name: string;
  /** The cubicle it is in. */
  cubicle: string;
  locToFacet: Record<string, Face> = {};
  facetToLoc: Record<string, Face> = {};

  constructor(facets: string, locs: string) {
    this.name = sortName(facets);
    this.cubicle = sortName(locs);
    facets.split("").forEach((f, i) => {
      this.facetToLoc[f] = locs[i] as Face;
      this.locToFacet[locs[i]] = f as Face;
    });
  }

  /** Turns the cubie with a quarter turn and returns its new cubicle. */
  rotate(op: Move): string {
    const map = FACE_MAP[op];
    const locToFacet: Record<string, Face> = {};
    for (const [from, facet] of Object.entries(this.locToFacet)) {
      const to = map[from];
      locToFacet[to] = facet;
      this.facetToLoc[facet] = to;
    }
    this.locToFacet = locToFacet;
    this.cubicle = sortName(Object.keys(locToFacet).join(""));
    return this.cubicle;
  }

  isSolved() {
    return Object.entries(this.locToFacet).every(([loc, f]) => loc === f);
  }

  facetsSolved() {
    return Object.entries(this.facetToLoc).filter(([f, loc]) => f === loc)
      .length;
  }
}

export class CubeState {
  locToCubie: Record<string, CubieState> = {};
  cubieToLoc: Record<string, string> = {};

  constructor(state: string = SOLVED_STATE) {
    const cubies = [...state.trim().split(/\s+/), ...FACE_NAMES];
    if (cubies.length !== ALL_SLOTS.length)
      throw new Error("Expected 20 cubies in Singmaster notation");
    ALL_SLOTS.forEach((slot, i) => {
      const cubie = new CubieState(cubies[i], slot);
      this.locToCubie[cubie.cubicle] = cubie;
      this.cubieToLoc[cubie.name] = cubie.cubicle;
    });
  }

  /** The state in Singmaster positional notation. */
  getState(): string {
    return SOLVED_SLOTS.map((slot) =>
      slot
        .split("")
        .map((f) => this.locToCubie[sortName(slot)].locToFacet[f])
        .join(""),
    ).join(" ");
  }

  /** Applies a move ("R", "R'", "R2"). */
  move(move: Move) {
    for (const op of quarterTurns(move)) this.rotate(op);
  }
  apply(moves: Move[]) {
    for (const m of moves) this.move(m);
    return this;
  }

  /** A quarter turn. */
  rotate(op: Move) {
    const moved: Record<string, CubieState> = {};
    for (const from of CUBE_FACES[op[0] as Face]) {
      const cubie = this.locToCubie[from];
      const to = cubie.rotate(op);
      this.cubieToLoc[cubie.name] = to;
      moved[to] = cubie;
    }
    Object.assign(this.locToCubie, moved);
  }

  /** The colour (home face) of the sticker on `face` of cubicle `loc`. */
  sticker(loc: string, face: Face): Face {
    return this.locToCubie[loc].locToFacet[face];
  }

  isSolved() {
    return Object.values(this.locToCubie).every((c) => c.isSolved());
  }

  /** Stickers in place among these cubicles. */
  facetsSolved(locs: string[]) {
    return locs
      .map((loc) => this.locToCubie[loc].facetsSolved())
      .reduce((a, b) => a + b, 0);
  }

  clone() {
    return new CubeState(this.getState());
  }
}

/** Which face the quarter (or half) turn of `face` takes `from` to `to`, or null. */
export function moveForPath(face: Face, from: Face, to: Face): Move | null {
  const cycle = FACE_CYCLES[face];
  const start = cycle.indexOf(from);
  const end = cycle.indexOf(to);
  if (start < 0 || end < 0 || start === end) return null;
  const steps = (end - start + 4) % 4;
  return moveOf(face, steps);
}

/** True for a state a real cube can reach: every cubie once, and parity and twists that add up. */
export function isValidState(state: string): boolean {
  const cubies = state.trim().split(/\s+/);
  if (cubies.length !== SOLVED_SLOTS.length) return false;
  if (!cubies.every((c) => /^[UDFBLR]{2,3}$/.test(c))) return false;
  const slots = SOLVED_SLOTS.map(sortName);
  const sorted = cubies.map(sortName);
  if (new Set(sorted).size !== slots.length) return false;
  if (!sorted.every((c) => slots.includes(c))) return false;
  // Corners and edges stay apart, so each slot must hold a cubie of its kind.
  if (!sorted.every((c, i) => c.length === slots[i].length)) return false;
  // An even permutation…
  const seen = new Set<number>();
  let swaps = 0;
  for (let i = 0; i < slots.length; i++) {
    if (seen.has(i)) continue;
    let length = 0;
    for (let j = i; !seen.has(j); j = slots.indexOf(sorted[j])) {
      seen.add(j);
      length++;
    }
    swaps += length - 1;
  }
  if (swaps % 2) return false;
  // …corner twists that add up to a multiple of 3…
  const corners = cubies.filter((c) => c.length === 3);
  const twist = corners
    .map((c) => Math.max(c.indexOf("U"), c.indexOf("D")))
    .reduce((a, b) => a + b, 0);
  if (twist % 3) return false;
  // …and edge flips that add up to an even number.
  const flips = cubies
    .filter((c) => c.length === 2)
    // Every edge slot lists its U/D face first, or F/B where it has none.
    .map((c) => {
      const key = /[UD]/.test(c) ? "UD" : "FB";
      return key.includes(c[0]) ? 0 : 1;
    })
    .reduce<number>((a, b) => a + b, 0);
  return flips % 2 === 0;
}
