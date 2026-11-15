// The beginner's layer-by-layer solver, ported from the original JavaScript
// version (www/js/bottomupsolver.js) by Ligang Wang.
//
// 1. Pick the first layer X: the face with the most edge, then corner,
//    stickers already in place. Z is the opposite face.
// 2. Solve X's four edges (the cross), then its four corners.
// 3. Solve the four middle-layer edges, bringing each one up from Z.
// 4. On Z: make the cross, put its edges in place, put its corners in place,
//    then twist the corners.
// 5. Turn X and Z to line up with the centres.
import {
  CUBE_FACES,
  CubeState,
  FACE_CYCLES,
  FACE_NAMES,
  OPPOSITE,
  inverse,
  moveForPath,
  simplify,
  sortName,
  type Face,
  type Move,
} from "./state";

export type StageId =
  | "cross"
  | "corners"
  | "middle"
  | "top-cross"
  | "top-edges"
  | "top-corners"
  | "top-twist"
  | "finish";
export type Stage = { id: StageId; moves: Move[] };

export const STAGE_NAMES: Record<StageId, string> = {
  cross: "First layer cross",
  corners: "First layer corners",
  middle: "Middle layer edges",
  "top-cross": "Last layer cross",
  "top-edges": "Last layer edges",
  "top-corners": "Place last layer corners",
  "top-twist": "Twist last layer corners",
  finish: "Line up the layers",
};

const LIMIT = 200;
const must = (m: Move | null): Move => {
  if (!m) throw new Error("solver: no move for that path");
  return m;
};

export class BottomUpSolver {
  private cube: CubeState;
  private steps = 0;
  private ops: Move[] = [];
  /** The first layer the solver picked. */
  X: Face = "D";

  constructor(state: string | CubeState) {
    this.cube = typeof state === "string" ? new CubeState(state) : state.clone();
  }

  private guard() {
    if (++this.steps > LIMIT) throw new Error("solver: too many steps");
  }

  private do(...moves: Move[]) {
    for (const m of moves) {
      this.cube.move(m);
      this.ops.push(m);
    }
  }

  private cubie(loc: string) {
    return this.cube.locToCubie[loc];
  }

  /** The solution, stage by stage. Empty stages are left out. */
  solveStages(): Stage[] {
    const stages: Stage[] = [];
    if (this.cube.isSolved()) return stages;
    const X = (this.X = this.firstLayer());
    const Z = OPPOSITE[X];
    const run = (id: StageId, solve: () => void) => {
      this.ops = [];
      this.steps = 0;
      solve();
      const moves = simplify(this.ops);
      if (moves.length) stages.push({ id, moves });
    };
    run("cross", () => this.firstLayerEdges(X));
    run("corners", () => this.firstLayerCorners(X, Z));
    run("middle", () => this.secondLayerEdges(Z));
    run("top-cross", () => this.thirdLayerCross(Z));
    run("top-edges", () => this.thirdLayerEdgePositions(Z));
    run("top-corners", () => this.thirdLayerCornerPositions(Z));
    run("top-twist", () => this.thirdLayerCornerTwists(X, Z));
    run("finish", () => {
      this.alignLayer(X);
      this.alignLayer(Z);
    });
    if (!this.cube.isSolved()) throw new Error("solver: cube not solved");
    return stages;
  }

  solve(): Move[] {
    return this.solveStages().flatMap((s) => s.moves);
  }

  // 1. The face with the most edge stickers in place, then corner stickers.
  private firstLayer(): Face {
    let best: Face = FACE_NAMES[0];
    let bestKey = -1;
    for (const face of FACE_NAMES) {
      const locs = CUBE_FACES[face];
      const key =
        this.cube.facetsSolved(locs.filter((l) => l.length === 2)) * 100 +
        this.cube.facetsSolved(locs.filter((l) => l.length === 3));
      if (key >= bestKey) {
        bestKey = key;
        best = face;
      }
    }
    return best;
  }

  // 2a. The cross on X: for each edge XY, put Y in place, then X.
  private firstLayerEdges(X: Face) {
    for (;;) {
      const todo = FACE_CYCLES[X]
        .map((side) => {
          const c = this.cubie(sortName(side + X));
          return { side, hasX: X in c.locToFacet, solved: c.facetsSolved() };
        })
        .filter((s) => s.solved !== 2)
        .sort(
          (a, b) =>
            Number(a.hasX) - Number(b.hasX) ||
            a.solved - b.solved ||
            (a.side < b.side ? -1 : 1),
        );
      if (!todo.length) return;
      const side = todo[0].side;
      const name = sortName(side + X);
      this.edgeFacet(side, X, name, X);
      this.edgeFacet(X, side, name, X);
      this.guard();
    }
  }

  private hasSolvedEdge(face: Face) {
    return FACE_CYCLES[face].some((side) =>
      this.cubie(sortName(side + face)).isSolved(),
    );
  }

  /** Moves the cubie `name` until its `facet` sticker is on that face. */
  private edgeFacet(facet: Face, other: Face, name: string, X: Face) {
    for (;;) {
      this.guard();
      const c = this.cubie(this.cube.cubieToLoc[name]);
      const facetLoc = c.facetToLoc[facet];
      const otherLoc = c.facetToLoc[other];
      if (facetLoc === facet) return;
      if (otherLoc === facet || otherLoc === OPPOSITE[facet]) {
        this.do(
          facetLoc !== X && facetLoc !== OPPOSITE[X]
            ? must(moveForPath(facetLoc, X, otherLoc))
            : facetLoc,
        );
      } else if (otherLoc === X && this.hasSolvedEdge(X)) {
        this.do(facetLoc + "2"); // take it down to Z first
      } else {
        this.do(must(moveForPath(otherLoc, facetLoc, facet)));
      }
    }
  }

  // 2b. X's corners.
  private firstLayerCorners(X: Face, Z: Face) {
    for (;;) {
      this.guard();
      const zCorners = CUBE_FACES[Z].filter((l) => l.length === 3);
      // A corner on Z whose X sticker faces sideways.
      const sideways = zCorners.filter((loc) => {
        const c = this.cubie(loc);
        return X in c.facetToLoc && c.facetToLoc[X] !== Z;
      });
      if (sideways.length) {
        const loc =
          sideways.find((l) => {
            const c = this.cubie(l);
            const xOn = c.facetToLoc[X];
            const side = [...l].find((f) => f !== Z && f !== xOn) as Face;
            return c.locToFacet[side] === side;
          }) ?? sideways[0];
        const c = this.cubie(loc);
        const xOn = c.facetToLoc[X];
        const side = [...loc].find((f) => f !== Z && f !== xOn) as Face;
        const sideFacet = c.locToFacet[side];
        if (side !== sideFacet) {
          this.do(must(moveForPath(Z, side, sideFacet)));
        } else {
          const push = must(moveForPath(xOn, X, side));
          this.do(push, must(moveForPath(Z, xOn, side)), inverse(push));
        }
        continue;
      }
      // A corner on Z with its X sticker facing Z.
      const down = zCorners.filter(
        (loc) => this.cubie(loc).facetToLoc[X] === Z,
      );
      if (down.length) {
        const pick = (l: string) => {
          const [a, b] = [...l].filter((f) => f !== Z) as Face[];
          return { a, b, c: this.cubie(l) };
        };
        const loc =
          down.find((l) => {
            const { a, b, c } = pick(l);
            return c.locToFacet[a] === b;
          }) ?? down[0];
        const { a, b, c } = pick(loc);
        const aFacet = c.locToFacet[a];
        const bFacet = c.locToFacet[b];
        if (b !== aFacet) {
          this.do(must(moveForPath(Z, b, aFacet)));
        } else {
          const push = must(moveForPath(aFacet, X, bFacet));
          const z = must(moveForPath(Z, bFacet, aFacet));
          this.do(push, ...simplify([z, z]), inverse(push), z);
        }
        continue;
      }
      // A corner stuck in X the wrong way: take it down to Z.
      const stuck = CUBE_FACES[X].filter(
        (l) => l.length === 3 && !this.cubie(l).isSolved(),
      );
      if (!stuck.length) return;
      const [a, b] = [...stuck[0]].filter((f) => f !== X) as Face[];
      const push = must(moveForPath(a, X, b));
      this.do(push, must(moveForPath(Z, b, a)), inverse(push));
    }
  }

  /** Moves the edge on Z above face m down into the middle layer beside y. */
  private edgeDown(m: Face, Z: Face, y: Face) {
    const c = must(moveForPath(Z, m, y));
    const j = must(moveForPath(y, m, Z));
    const k = must(moveForPath(m, y, Z));
    this.do(inverse(c), j, c, inverse(j), c, k, inverse(c), inverse(k));
  }

  // 3. The middle layer.
  private secondLayerEdges(Z: Face) {
    for (;;) {
      this.guard();
      const onZ = CUBE_FACES[Z].filter(
        (l) => l.length === 2 && !(Z in this.cubie(l).facetToLoc),
      ).sort(
        (a, b) =>
          this.cubie(b).facetsSolved() - this.cubie(a).facetsSolved() ||
          (a < b ? -1 : 1),
      );
      if (onZ.length) {
        const loc = onZ[0];
        const side = [...loc].find((f) => f !== Z) as Face;
        const c = this.cubie(loc);
        const sideFacet = c.locToFacet[side];
        if (side !== sideFacet) this.do(must(moveForPath(Z, side, sideFacet)));
        else this.edgeDown(sideFacet, Z, c.locToFacet[Z]);
        continue;
      }
      // An edge in the middle layer, but in the wrong place or flipped: take it out.
      const cycle = FACE_CYCLES[Z];
      const wrong = cycle
        .map((f, i) => sortName(f + cycle[(i + 1) % 4]))
        .filter((loc) => !this.cubie(loc).isSolved());
      if (!wrong.length) return;
      const [m, y] = [...wrong[0]] as Face[];
      this.edgeDown(m, Z, y);
    }
  }

  // 4a. The cross on Z.
  private thirdLayerCross(Z: Face) {
    for (;;) {
      this.guard();
      const up = FACE_CYCLES[Z].filter(
        (side) => this.cubie(sortName(side + Z)).locToFacet[Z] === Z,
      );
      if (up.length === 4) return;
      let m: Face;
      if (up.length === 0) m = FACE_CYCLES[Z][0];
      else if (up.length === 1) m = OPPOSITE[up[0]];
      else if (up.length === 2) {
        if (OPPOSITE[up[0]] === up[1])
          m = FACE_CYCLES[Z].find((s) => !up.includes(s))!;
        else
          m =
            moveForPath(Z, up[0], up[1]) === Z
              ? OPPOSITE[up[1]]
              : OPPOSITE[up[0]];
      } else throw new Error("solver: 3 edges up");
      // y: where a Z' turn takes the side m.
      const back = FACE_CYCLES[inverse(Z)];
      const y = back[(back.indexOf(m) + 1) % 4];
      this.do(m, Z, y, inverse(Z), inverse(y), inverse(m));
    }
  }

  // 4b. Z's edges in place.
  private thirdLayerEdgePositions(Z: Face) {
    const cycle = FACE_CYCLES[Z];
    for (;;) {
      this.guard();
      const at = cycle.map((side) =>
        cycle.indexOf(this.cubie(sortName(side + Z)).locToFacet[side]),
      );
      let m: Face | null = null;
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        if ((at[next] + 1) % 4 === at[i]) {
          m = cycle[next];
          break;
        }
      }
      if (m) {
        const p = OPPOSITE[m];
        this.do(p, Z, inverse(p), Z, p, Z + "2", inverse(p), Z);
        continue;
      }
      const side = cycle[0];
      const facet = this.cubie(sortName(side + Z)).locToFacet[side];
      if (side !== facet) this.do(must(moveForPath(Z, side, facet)));
      return;
    }
  }

  // 4c. Z's corners in place.
  private thirdLayerCornerPositions(Z: Face) {
    for (;;) {
      this.guard();
      const corners = CUBE_FACES[Z].filter((l) => l.length === 3);
      const placed = corners.filter((l) => this.cubie(l).name === l);
      if (placed.length === 4) return;
      if (placed.length === 2 || placed.length === 3)
        throw new Error("solver: corners can't be placed");
      let n: Face;
      if (placed.length === 1) {
        const [a, b] = [...placed[0]].filter((f) => f !== Z) as Face[];
        n = moveForPath(Z, a, b) === Z ? a : b;
      } else n = FACE_CYCLES[Z][0];
      const p = OPPOSITE[n];
      this.do(Z, n, inverse(Z), inverse(p), Z, inverse(n), inverse(Z), p);
    }
  }

  // 4d. Twist Z's corners, one at a time at the same spot.
  private thirdLayerCornerTwists(X: Face, Z: Face) {
    const wrong = CUBE_FACES[Z].filter(
      (l) => l.length === 3 && !this.cubie(l).isSolved(),
    );
    if (!wrong.length) return;
    const loc = wrong[0];
    const [a, b] = [...loc].filter((f) => f !== Z) as Face[];
    const n = moveForPath(Z, a, b) === Z ? a : b;
    for (;;) {
      this.guard();
      const corners = CUBE_FACES[Z].filter((l) => l.length === 3);
      if (corners.every((l) => this.cubie(l).locToFacet[Z] === Z)) return;
      while (this.cubie(loc).locToFacet[Z] === Z) {
        this.guard();
        this.do(inverse(Z));
      }
      const times = this.cubie(loc).locToFacet[n] === Z ? 2 : 4;
      for (let i = 0; i < times; i++)
        this.do(inverse(n), inverse(X), n, X);
    }
  }

  // 5. Turn a layer so its edges line up with the centres.
  private alignLayer(face: Face) {
    const side = FACE_CYCLES[face][0];
    const facet = this.cubie(sortName(side + face)).locToFacet[side];
    if (side !== facet) this.do(must(moveForPath(face, side, facet)));
  }
}

/** The beginner's method solution for a state, stage by stage. */
export const solveStages = (state: string | CubeState) =>
  new BottomUpSolver(state).solveStages();
