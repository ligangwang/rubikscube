/**
 * The 3D cube, drawn with three.js.
 *
 * The 26 cubies never move for good: a turn swings one layer round, then puts
 * the cubies back and recolours every sticker from the cube's state. So what
 * is drawn always matches the state, whatever happens to an animation.
 *
 * Coordinates: R is +x, U is +y and F is +z, one unit per cubie.
 *
 * The cube can also unfold into a flat net and fold back, like the original
 * game: F stays put, U, D, L and R hinge out from its edges, and B hinges out
 * from R.
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  CubeState,
  FACE_NAMES,
  quarterTurns,
  sortName,
  type Face,
  type Move,
} from "./cube/state";

export const COLORS: Record<Face, number> = {
  U: 0xf4f4f0,
  D: 0xffd500,
  F: 0x009e60,
  B: 0x0051ba,
  R: 0xc41e3a,
  L: 0xff5800,
};

const NORMALS: Record<Face, THREE.Vector3> = {
  R: new THREE.Vector3(1, 0, 0),
  L: new THREE.Vector3(-1, 0, 0),
  U: new THREE.Vector3(0, 1, 0),
  D: new THREE.Vector3(0, -1, 0),
  F: new THREE.Vector3(0, 0, 1),
  B: new THREE.Vector3(0, 0, -1),
};

/** The face whose outward normal is closest to `v`. */
function faceOf(v: THREE.Vector3): Face {
  let best: Face = "F";
  let dot = -Infinity;
  for (const f of FACE_NAMES) {
    const d = NORMALS[f].dot(v);
    if (d > dot) {
      dot = d;
      best = f;
    }
  }
  return best;
}

/** The cubicle at grid position (x, y, z), each -1, 0 or 1. */
function cubicleAt(x: number, y: number, z: number) {
  let name = "";
  if (x) name += x > 0 ? "R" : "L";
  if (y) name += y > 0 ? "U" : "D";
  if (z) name += z > 0 ? "F" : "B";
  return sortName(name);
}

/** The angle a move turns its face by, about the face's outward normal. Clockwise is negative. */
export function moveAngle(move: Move) {
  return move.endsWith("2")
    ? -Math.PI
    : move.endsWith("'")
      ? Math.PI / 2
      : -Math.PI / 2;
}

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** A rounded square, the shape the original game drew its stickers with. */
function stickerGeometry(size: number, radius: number) {
  const s = new THREE.Shape();
  const x = -size / 2;
  const y = -size / 2;
  s.moveTo(x, y + radius);
  s.lineTo(x, y + size - radius);
  s.quadraticCurveTo(x, y + size, x + radius, y + size);
  s.lineTo(x + size - radius, y + size);
  s.quadraticCurveTo(x + size, y + size, x + size, y + size - radius);
  s.lineTo(x + size, y + radius);
  s.quadraticCurveTo(x + size, y, x + size - radius, y);
  s.lineTo(x + radius, y);
  s.quadraticCurveTo(x, y, x, y + radius);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 6,
  });
  g.translate(0, 0, -0.012);
  return g;
}

function letterTexture(letter: string) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.font = "700 76px 'Space Grotesk Variable', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(12, 14, 20, 0.78)";
  ctx.fillText(letter, 64, 70);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

type Sticker = {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
  loc: string;
  face: Face;
};
type Cubie = { group: THREE.Group; grid: THREE.Vector3; stickers: Sticker[] };

type Tween = {
  start: number;
  duration: number;
  ease: (t: number) => number;
  update: (k: number) => void;
  done: () => void;
};

export type TurnSource = "drag" | "button" | "scramble" | "solver" | "undo";
export type SceneOptions = {
  /** A turn finished: the scene's state has it applied. */
  onTurn?: (move: Move, source: TurnSource) => void;
  /** A turn started moving: a queued turn began, or a drag picked its layer. */
  onBegin?: (source: TurnSource) => void;
  /** Says whether the player may turn layers by dragging right now. */
  canDrag?: () => boolean;
};

type Drag = {
  pointer: number;
  x: number;
  y: number;
  grid: THREE.Vector3;
  normal: Face;
  point: THREE.Vector3;
  // Decided once the pointer has moved far enough:
  axis?: THREE.Vector3;
  face?: Face;
  screenDir?: THREE.Vector2;
  pixelsPerTurn?: number;
  angle?: number;
  ignored?: boolean;
};

const CAMERA_HOME = new THREE.Vector3(6.6, 5.4, 8.8);
/** Looking a little below the cube lifts it clear of the move pad. */
const CUBE_TARGET = new THREE.Vector3(0, -0.55, 0);
const NET_TARGET = new THREE.Vector3(1.5, -0.7, 1.5);

export class CubeScene {
  readonly state: CubeState;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  private controls: OrbitControls;
  private root = new THREE.Group();
  private cube = new THREE.Group();
  private pivot = new THREE.Group();
  private cubies: Cubie[] = [];
  private stickers: Sticker[] = [];
  private letters: THREE.Mesh[] = [];
  private net = new THREE.Group();
  private netStickers: Sticker[] = [];
  private hinges: { pivot: THREE.Object3D; axis: "x" | "y"; angle: number }[] =
    [];
  private tweens: Tween[] = [];
  private queue: { move: Move; source: TurnSource; duration: number }[] = [];
  private turning = false;
  private folding = false;
  private drag: Drag | null = null;
  private raycaster = new THREE.Raycaster();
  private hint: Face | null = null;
  private frame = 0;
  private observer: ResizeObserver;
  private disposed = false;
  /** Milliseconds a quarter turn takes. */
  turnTime = 220;
  unfolded = false;

  constructor(
    private host: HTMLElement,
    private options: SceneOptions = {},
    state = new CubeState(),
  ) {
    this.state = state.clone();
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    const r = this.renderer;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.toneMapping = THREE.NeutralToneMapping;
    r.toneMappingExposure = 0.95;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.domElement.className = "cube-canvas";
    host.appendChild(r.domElement);

    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(
      new RoomEnvironment(),
      0.04,
    ).texture;
    pmrem.dispose();
    this.scene.environmentIntensity = 0.55;

    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(4, 9, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -5;
    key.shadow.camera.right = key.shadow.camera.top = 5;
    key.shadow.radius = 6;
    key.shadow.bias = -0.0005;
    this.scene.add(key, new THREE.HemisphereLight(0xdde6ff, 0x1a1c24, 0.35));

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(9, 48),
      new THREE.ShadowMaterial({ opacity: 0.28 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.3;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.scene.add(this.root);
    this.root.add(this.cube, this.net);
    this.cube.add(this.pivot);
    this.buildCube();
    this.buildNet();
    this.net.visible = false;
    this.recolor();

    this.camera.position.copy(CAMERA_HOME);
    // Our pointer handlers run first (capture), so a press on the cube turns
    // a layer instead of orbiting the camera.
    const canvas = r.domElement;
    canvas.addEventListener("pointerdown", this.onPointerDown, true);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
    this.controls = new OrbitControls(this.camera, canvas);
    Object.assign(this.controls, {
      enableDamping: true,
      dampingFactor: 0.12,
      enablePan: false,
      minDistance: 7,
      maxDistance: 20,
      rotateSpeed: 0.8,
      autoRotateSpeed: 1.2,
    });
    this.controls.target.copy(CUBE_TARGET);

    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    this.frame = requestAnimationFrame(this.loop);
  }

  // ---------------------------------------------------------------- building

  private buildCube() {
    const body = new RoundedBoxGeometry(0.97, 0.97, 0.97, 4, 0.11);
    const plastic = new THREE.MeshPhysicalMaterial({
      color: 0x15171d,
      roughness: 0.42,
      metalness: 0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.35,
    });
    const stickerGeo = stickerGeometry(0.82, 0.14);
    const letterGeo = new THREE.PlaneGeometry(0.62, 0.62);
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          if (!x && !y && !z) continue;
          const group = new THREE.Group();
          group.position.set(x, y, z);
          const mesh = new THREE.Mesh(body, plastic);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          group.add(mesh);
          const loc = cubicleAt(x, y, z);
          const cubie: Cubie = {
            group,
            grid: new THREE.Vector3(x, y, z),
            stickers: [],
          };
          for (const face of loc.split("") as Face[]) {
            const n = NORMALS[face];
            const sticker = this.makeSticker(stickerGeo, face, loc);
            sticker.mesh.position.copy(n).multiplyScalar(0.487);
            sticker.mesh.lookAt(n.clone().multiplyScalar(2));
            group.add(sticker.mesh);
            cubie.stickers.push(sticker);
            this.stickers.push(sticker);
            if (loc.length === 1) {
              const letter = new THREE.Mesh(
                letterGeo,
                new THREE.MeshBasicMaterial({
                  map: letterTexture(face),
                  transparent: true,
                  depthWrite: false,
                }),
              );
              letter.position.copy(n).multiplyScalar(0.502);
              letter.lookAt(n.clone().multiplyScalar(2));
              letter.visible = false;
              group.add(letter);
              this.letters.push(letter);
            }
          }
          this.cube.add(group);
          this.cubies.push(cubie);
        }
  }

  private makeSticker(geo: THREE.BufferGeometry, face: Face, loc: string) {
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshPhysicalMaterial({
        color: COLORS[face],
        roughness: 0.38,
        clearcoat: 0.45,
        clearcoatRoughness: 0.25,
        emissive: 0xffffff,
        emissiveIntensity: 0,
      }),
    );
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    return { mesh, loc, face } as Sticker;
  }

  /** The flat net: six 3×3 panels on hinges, folded into a cube at first. */
  private buildNet() {
    const stickerGeo = stickerGeometry(0.84, 0.14);
    const backing = new RoundedBoxGeometry(2.98, 2.98, 0.08, 3, 0.04);
    const dark = new THREE.MeshPhysicalMaterial({
      color: 0x15171d,
      roughness: 0.5,
      clearcoat: 0.3,
    });
    const hinge = (
      parent: THREE.Object3D,
      at: THREE.Vector3,
      axis: "x" | "y",
      angle: number,
    ) => {
      const pivot = new THREE.Object3D();
      // Pivots are built unrotated, so a world position less the parent's
      // world position is the local one.
      const parentAt = new THREE.Vector3();
      parent.getWorldPosition(parentAt);
      pivot.position.copy(at).sub(parentAt);
      parent.add(pivot);
      this.hinges.push({ pivot, axis, angle });
      return pivot;
    };
    this.net.updateMatrixWorld(true);
    const holders = {
      F: this.net,
      U: hinge(this.net, new THREE.Vector3(0, 1.5, 1.5), "x", Math.PI / 2),
      D: hinge(this.net, new THREE.Vector3(0, -1.5, 1.5), "x", -Math.PI / 2),
      L: hinge(this.net, new THREE.Vector3(-1.5, 0, 1.5), "y", Math.PI / 2),
      R: hinge(this.net, new THREE.Vector3(1.5, 0, 1.5), "y", -Math.PI / 2),
    } as Partial<Record<Face, THREE.Object3D>>;
    this.net.updateMatrixWorld(true);
    holders.B = hinge(
      holders.R!,
      new THREE.Vector3(1.5, 0, -1.5),
      "y",
      -Math.PI / 2,
    );
    this.net.updateMatrixWorld(true);
    for (const face of FACE_NAMES) {
      const holder = holders[face]!;
      const origin = new THREE.Vector3();
      holder.getWorldPosition(origin);
      const n = NORMALS[face];
      const local = (v: THREE.Vector3) => v.clone().sub(origin);
      const plate = new THREE.Mesh(backing, dark);
      plate.position.copy(local(n.clone().multiplyScalar(1.46)));
      plate.lookAt(plate.position.clone().add(n));
      plate.castShadow = true;
      holder.add(plate);
      for (let a = -1; a <= 1; a++)
        for (let b = -1; b <= 1; b++) {
          // Grid positions on this face.
          const g = n.clone().multiplyScalar(1);
          const free = (["x", "y", "z"] as const).filter((k) => !n[k]);
          g[free[0]] = a;
          g[free[1]] = b;
          const sticker = this.makeSticker(
            stickerGeo,
            face,
            cubicleAt(g.x, g.y, g.z),
          );
          sticker.mesh.position.copy(
            local(g.clone().add(n.clone().multiplyScalar(0.52))),
          );
          sticker.mesh.lookAt(sticker.mesh.position.clone().add(n));
          holder.add(sticker.mesh);
          this.netStickers.push(sticker);
        }
    }
  }

  // ---------------------------------------------------------------- state

  private recolor() {
    for (const s of [...this.stickers, ...this.netStickers])
      s.mesh.material.color.setHex(COLORS[this.state.sticker(s.loc, s.face)]);
  }

  /** Shows a new state at once, with no animation. */
  setState(state: CubeState) {
    this.queue = [];
    const fresh = state.getState();
    // CubeState has no setter, so copy the cubies across.
    const copy = new CubeState(fresh);
    this.state.locToCubie = copy.locToCubie;
    this.state.cubieToLoc = copy.cubieToLoc;
    this.recolor();
  }

  /** Queues a turn. It plays after the turns before it. */
  turn(move: Move, source: TurnSource = "button", duration?: number) {
    quarterTurns(move); // throws on a move that isn't one
    this.queue.push({
      move,
      source,
      duration:
        duration ?? (move.endsWith("2") ? this.turnTime * 1.5 : this.turnTime),
    });
    this.next();
  }

  /** Drops turns that haven't started yet. */
  clearQueue() {
    this.queue = [];
  }

  get busy() {
    return this.turning || this.folding || this.queue.length > 0 || !!this.drag?.axis;
  }

  private next() {
    if (this.turning || this.folding || this.drag?.axis) return;
    const item = this.queue.shift();
    if (!item) return;
    const { move, source, duration } = item;
    this.options.onBegin?.(source);
    if (this.unfolded || duration <= 0) {
      this.finishTurn(move, source);
      this.next();
      return;
    }
    this.turning = true;
    const face = move[0] as Face;
    this.gather(face);
    const axis = NORMALS[face];
    const angle = moveAngle(move);
    this.animate(duration, easeInOut, (k) => {
      this.pivot.quaternion.setFromAxisAngle(axis, angle * k);
    }).then(() => {
      this.turning = false;
      this.finishTurn(move, source);
      this.next();
    });
  }

  /** Puts the layer of `face` on the pivot. */
  private gather(face: Face) {
    const n = NORMALS[face];
    this.pivot.quaternion.identity();
    for (const c of this.cubies)
      if (c.grid.dot(n) > 0.5) this.pivot.attach(c.group);
  }

  /** Puts every cubie back home and recolours from the state. */
  private release() {
    for (const c of this.cubies) {
      this.cube.attach(c.group);
      c.group.position.copy(c.grid);
      c.group.quaternion.identity();
    }
    this.pivot.quaternion.identity();
  }

  private finishTurn(move: Move, source: TurnSource) {
    this.state.move(move);
    this.release();
    this.recolor();
    if (this.unfolded) this.pulse(move[0] as Face);
    this.options.onTurn?.(move, source);
  }

  // ---------------------------------------------------------------- effects

  private animate(
    duration: number,
    ease: (t: number) => number,
    update: (k: number) => void,
  ) {
    return new Promise<void>((done) => {
      if (duration <= 0) {
        update(1);
        done();
        return;
      }
      this.tweens.push({
        start: performance.now(),
        duration,
        ease,
        update,
        done,
      });
    });
  }

  /** A short glow on the stickers a turn moved, for the flat net. */
  private pulse(face: Face) {
    const moved = this.netStickers.filter((s) => s.loc.includes(face));
    this.animate(450, easeOut, (k) => {
      for (const s of moved)
        s.mesh.material.emissiveIntensity = 0.35 * (1 - k);
    });
  }

  /** Makes the layer of `face` glow until cleared with null. */
  setHint(face: Face | null) {
    this.hint = face;
    if (!face)
      for (const s of [...this.stickers, ...this.netStickers])
        s.mesh.material.emissiveIntensity = 0;
  }

  showLetters(show: boolean) {
    for (const l of this.letters) l.visible = show;
  }

  /** Spins the cube once, for a solve. */
  celebrate() {
    const start = this.root.rotation.y;
    return this.animate(1300, easeInOut, (k) => {
      this.root.rotation.y = start + k * Math.PI * 2;
      this.root.position.y = Math.sin(k * Math.PI) * 0.35;
    }).then(() => {
      this.root.rotation.y = start;
      this.root.position.y = 0;
    });
  }

  setIdle(idle: boolean) {
    this.controls.autoRotate = idle;
  }

  resetView() {
    const from = this.camera.position.clone();
    const target = this.controls.target.clone();
    const to = this.unfolded ? this.netCamera() : CAMERA_HOME;
    const toTarget = this.unfolded ? NET_TARGET : CUBE_TARGET;
    return this.animate(600, easeInOut, (k) => {
      this.camera.position.lerpVectors(from, to, k);
      this.controls.target.lerpVectors(target, toTarget, k);
    });
  }

  private netCamera() {
    // Far enough back to fit the 12 × 9 net.
    const aspect = Math.max(this.camera.aspect, 0.4);
    const fov = (this.camera.fov * Math.PI) / 180;
    // The side panels and the move pad cover the edges of the frame.
    const fit = Math.max(9.6 / 2 / 0.68, 12.6 / 2 / aspect / 0.56);
    const dist = fit / Math.tan(fov / 2);
    return NET_TARGET.clone().add(new THREE.Vector3(0, 0.3, dist));
  }

  /** Unfolds the cube into a flat net, or folds it back. */
  async setUnfolded(unfold: boolean) {
    if (unfold === this.unfolded || this.folding) return;
    // Let queued turns finish first.
    while (this.turning || this.queue.length)
      await new Promise((r) => setTimeout(r, 30));
    this.folding = true;
    this.unfolded = unfold;
    const from = this.camera.position.clone();
    const target = this.controls.target.clone();
    const to = unfold ? this.netCamera() : CAMERA_HOME;
    const toTarget = unfold ? NET_TARGET : CUBE_TARGET;
    this.cube.visible = false;
    this.net.visible = true;
    if (unfold) this.controls.maxDistance = 60;
    await this.animate(1100, easeInOut, (k) => {
      const t = unfold ? k : 1 - k;
      for (const h of this.hinges) h.pivot.rotation[h.axis] = h.angle * t;
      this.camera.position.lerpVectors(from, to, k);
      this.controls.target.lerpVectors(target, toTarget, k);
    });
    this.cube.visible = !unfold;
    this.net.visible = unfold;
    if (!unfold) this.controls.maxDistance = 20;
    this.folding = false;
    this.next();
  }

  // ---------------------------------------------------------------- dragging

  private pointerNdc(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  private toScreen(v: THREE.Vector3) {
    const p = v.clone().project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((p.x + 1) / 2) * rect.width,
      ((1 - p.y) / 2) * rect.height,
    );
  }

  private onPointerDown = (e: PointerEvent) => {
    this.controls.enabled = true;
    if (e.button !== 0 || this.unfolded || this.drag) return;
    if (this.options.canDrag && !this.options.canDrag()) return;
    if (this.turning || this.folding || this.queue.length) return;
    this.raycaster.setFromCamera(this.pointerNdc(e), this.camera);
    const hits = this.raycaster.intersectObject(this.cube, true);
    const hit = hits[0];
    if (!hit || !hit.face) return;
    const cubie = this.cubies.find((c) => {
      let o: THREE.Object3D | null = hit.object;
      while (o && o !== c.group) o = o.parent;
      return !!o;
    });
    if (!cubie) return;
    // The face of the cube the press landed on.
    const local = hit.point.clone();
    this.cube.worldToLocal(local);
    // Stickers sit just outside 1.5; a press on a body edge uses its normal.
    const out = new THREE.Vector3(
      Math.abs(local.x) > 1.45 ? Math.sign(local.x) : 0,
      Math.abs(local.y) > 1.45 ? Math.sign(local.y) : 0,
      Math.abs(local.z) > 1.45 ? Math.sign(local.z) : 0,
    );
    const normal = faceOf(
      out.lengthSq() === 1
        ? out
        : hit.face.normal.clone().transformDirection(hit.object.matrixWorld),
    );
    this.controls.enabled = false;
    this.drag = {
      pointer: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      grid: cubie.grid.clone(),
      normal,
      point: hit.point.clone(),
    };
  };

  private onPointerMove = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointer || d.ignored) return;
    const move = new THREE.Vector2(e.clientX - d.x, e.clientY - d.y);
    if (!d.axis) {
      if (move.length() < 8) return;
      // Which way along the pressed face is the pointer going?
      const n = NORMALS[d.normal];
      const at = this.toScreen(d.point);
      let best: { dir: THREE.Vector3; screen: THREE.Vector2; dot: number } | null =
        null;
      for (const k of ["x", "y", "z"] as const) {
        if (n[k]) continue;
        const dir = new THREE.Vector3();
        dir[k] = 1;
        const screen = this.toScreen(d.point.clone().add(dir)).sub(at);
        const dot = move.dot(screen.clone().normalize());
        if (!best || Math.abs(dot) > Math.abs(best.dot))
          best = { dir, screen, dot };
      }
      if (!best) return;
      const sign = Math.sign(best.dot) || 1;
      const dir = best.dir.multiplyScalar(sign);
      // The layer turns about n × dir; that moves the pressed point along dir.
      const axis = new THREE.Vector3().crossVectors(n, dir).round();
      const layer = d.grid.dot(axis);
      if (Math.abs(layer) < 0.5) {
        // The middle layer has no move of its own here.
        d.ignored = true;
        return;
      }
      d.axis = axis;
      d.face = faceOf(axis.clone().multiplyScalar(Math.sign(layer)));
      d.screenDir = best.screen.clone().normalize().multiplyScalar(sign);
      d.pixelsPerTurn = Math.max(60, best.screen.length() * 2.2);
      d.angle = 0;
      this.gather(d.face);
      this.options.onBegin?.("drag");
    }
    const along = move.dot(d.screenDir!);
    const limit = Math.PI / 2;
    d.angle = Math.max(
      -limit,
      Math.min(limit, (along / d.pixelsPerTurn!) * (Math.PI / 2)),
    );
    this.pivot.quaternion.setFromAxisAngle(d.axis!, d.angle);
  };

  private onPointerUp = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointer) return;
    this.drag = null;
    this.controls.enabled = true;
    if (!d.axis || d.angle === undefined) return;
    const axis = d.axis;
    const from = d.angle;
    const commit = Math.abs(from) > Math.PI / 5;
    const to = commit ? (Math.sign(from) * Math.PI) / 2 : 0;
    this.turning = true;
    this.animate(140 + 160 * Math.abs(to - from), easeOut, (k) => {
      this.pivot.quaternion.setFromAxisAngle(axis, from + (to - from) * k);
    }).then(() => {
      this.turning = false;
      if (commit) {
        // Turning about `axis` by `to` is turning about the face's normal by:
        const aboutFace = axis.dot(NORMALS[d.face!]) * to;
        const move = aboutFace < 0 ? d.face! : d.face! + "'";
        this.finishTurn(move, "drag");
      } else this.release();
      this.next();
    });
  };

  // ---------------------------------------------------------------- loop

  private resize() {
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Keep the whole cube in view on narrow screens.
    this.camera.fov = w / h < 0.8 ? 44 : 32;
    this.camera.updateProjectionMatrix();
  }

  private loop = (now: number) => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.loop);
    const running = this.tweens;
    this.tweens = [];
    for (const t of running) {
      const k = Math.min(1, (now - t.start) / t.duration);
      t.update(t.ease(Math.max(0, k)));
      if (k >= 1) t.done();
      else this.tweens.push(t);
    }
    if (this.hint) {
      const glow = 0.12 + 0.12 * Math.sin(now / 160);
      const n = NORMALS[this.hint];
      for (const c of this.cubies)
        if (c.grid.dot(n) > 0.5)
          for (const s of c.stickers) s.mesh.material.emissiveIntensity = glow;
      for (const s of this.netStickers)
        if (s.loc.includes(this.hint)) s.mesh.material.emissiveIntensity = glow;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointerdown", this.onPointerDown, true);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
    this.controls.dispose();
    this.renderer.dispose();
    canvas.remove();
  }
}
