// Scrambles: random moves that never turn the same face twice in a row, nor
// two opposite faces back and forth (R L R).
import { FACE_NAMES, OPPOSITE, type Move } from "./state";

/** A seeded random number generator (mulberry32 over a string hash). */
export function seeded(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SUFFIXES = ["", "'", "2"];

/** `length` random moves. Short scrambles use quarter turns only, so each move is one turn to undo. */
export function randomMoves(
  length: number,
  rand: () => number = Math.random,
  halfTurns = length > 10,
): Move[] {
  const moves: Move[] = [];
  while (moves.length < length) {
    const face = FACE_NAMES[Math.floor(rand() * 6)];
    const last = moves[moves.length - 1]?.[0];
    const before = moves[moves.length - 2]?.[0];
    if (face === last) continue;
    if (last === OPPOSITE[face] && before === face) continue;
    const suffix = SUFFIXES[Math.floor(rand() * (halfTurns ? 3 : 2))];
    moves.push(face + suffix);
  }
  return moves;
}
