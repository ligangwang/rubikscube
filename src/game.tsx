// Rubik's Cube: the screens around the 3D cube. Three modes: the level
// ladder (short scrambles growing to a full one), the daily cube (the same
// full scramble for everyone each UTC day) and free play, which keeps the
// original game's tools: notation, Singmaster positions and the solver.
import { useCallback, useEffect, useRef, useState } from "react";
import { CubeScene, type TurnSource } from "./cube-scene";
import { solveStages, STAGE_NAMES, type Stage } from "./cube/solver";
import {
  CubeState,
  FACE_NAMES,
  inverse,
  isValidState,
  parseMoves,
  type Face,
  type Move,
} from "./cube/state";
import { randomMoves } from "./cube/scramble";
import { useDingn, useLocale } from "./dingn";
import {
  FULL,
  LAST_LEVEL,
  LEVELS,
  coinsFor,
  dailyScramble,
  formatTime,
  isFull,
  levelScramble,
  scrambleLength,
  undoPath,
  utcDay,
} from "./levels";
import {
  DAILY,
  WATCH,
  badges,
  fullBadges,
  levelBadges,
} from "./badges";
import { loadSaved, store, type Saved } from "./save";

export type Mode = "levels" | "daily" | "free";
type Phase = "ready" | "scrambling" | "playing" | "solving" | "done" | "sandbox";
type Attempt = {
  kind: Mode;
  level: number;
  length: number;
  /** When the first turn was made, or null before it. */
  start: number | null;
  end: number | null;
  moves: number;
  hints: number;
  /** The solver finished it. */
  assisted: boolean;
};
type Result = {
  solved: boolean;
  ms: number;
  moves: number;
  coins: number | null;
  test: boolean;
  record: boolean;
  firstDaily: boolean;
};
type Prefs = { letters: boolean; speed: number };

const ORDER: Face[] = ["U", "D", "L", "R", "F", "B"];
const SCRAMBLE_TURN = 70;
const MODES: Mode[] = ["levels", "daily", "free"];
export const isMode = (v: unknown): v is Mode => MODES.includes(v as Mode);

const newAttempt = (kind: Mode, level: number, length: number): Attempt => ({
  kind,
  level,
  length,
  start: null,
  end: null,
  moves: 0,
  hints: 0,
  assisted: false,
});

export function RubiksGame({
  initial,
  initialMode = "levels",
  prefs: initialPrefs = { letters: false, speed: 50 },
}: {
  initial: Saved;
  initialMode?: Mode;
  prefs?: Prefs;
}) {
  const sdk = useDingn();
  const { t } = useLocale();
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<CubeScene | null>(null);
  const [noWebgl, setNoWebgl] = useState(false);
  const [saved, setSaved] = useState(initial);
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const [mode, setMode] = useState<Mode>(initialMode);
  const [phase, setPhaseState] = useState<Phase>(
    initialMode === "free" ? "sandbox" : "ready",
  );
  const phaseRef = useRef(phase);
  /** Sets the phase, and the ref the scene's callbacks read, at once. */
  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };
  const [level, setLevel] = useState(Math.min(initial.level + 1, LAST_LEVEL));
  const attempt = useRef<Attempt>(newAttempt("free", 0, 0));
  /** Every turn since the cube was last solved or set, for hints. */
  const history = useRef<Move[] | null>([]);
  /** The player's own turns, for undo. */
  const undoStack = useRef<Move[]>([]);
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);
  const [now, setNow] = useState(() => Date.now());
  const [result, setResult] = useState<Result | null>(null);
  const [hint, setHint] = useState<Move | null>(null);
  const [stages, setStages] = useState<Stage[] | null>(null);
  const [stageAt, setStageAt] = useState({ stage: 0, move: 0 });
  const solverLeft = useRef(0);
  const [unfolded, setUnfolded] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs);
  const [notation, setNotation] = useState("");
  const [position, setPosition] = useState("");
  /** An error under the free-play boxes, in English: drawn through t(). */
  const [message, setMessage] = useState<string | null>(null);
  const [pressed, setPressed] = useState<Move | null>(null);

  /** A count in words, with the singular text for 1 (languages differ). */
  const counted = (n: number, one: string, many: string) =>
    (n === 1 ? t(one) : t(many)).replace("{0}", String(n));
  const movesText = (n: number) => counted(n, "{0} move", "{0} moves");
  const turnTime = (speed: number) => Math.round(420 - speed * 3.4);

  // ------------------------------------------------------------ the scene

  const onTurn = useRef<(move: Move, source: TurnSource) => void>(() => {});
  useEffect(() => {
    if (!host.current) return;
    let s: CubeScene;
    try {
      s = new CubeScene(host.current, {
        onTurn: (m, src) => onTurn.current(m, src),
        onBegin: (src) => {
          // The clock starts as the first turn starts.
          const a = attempt.current;
          if (
            phaseRef.current === "playing" &&
            a.start === null &&
            (src === "button" || src === "drag" || src === "undo")
          ) {
            a.start = Date.now();
            setNow(a.start);
          }
        },
        canDrag: () =>
          phaseRef.current === "playing" || phaseRef.current === "sandbox",
      });
    } catch {
      setNoWebgl(true);
      return;
    }
    scene.current = s;
    s.turnTime = turnTime(initialPrefs.speed);
    s.showLetters(initialPrefs.letters);
    s.setIdle(phaseRef.current === "ready");
    return () => {
      s.dispose();
      scene.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scene.current?.setIdle(phase === "ready" || phase === "done");
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [phase]);

  const savePrefs = (next: Prefs) => {
    setPrefs(next);
    sdk.storage.set("prefs", next).catch(() => {});
  };

  // ------------------------------------------------------------ saving and rewards

  const update = (change: (s: Saved) => Saved) => {
    const next = change(savedRef.current);
    savedRef.current = next;
    setSaved(next);
    store(sdk, next).catch(() => {});
  };

  // Signing in brings the account's progress and any badges it is owed.
  useEffect(
    () =>
      sdk.onPlayer((player) => {
        badges.reset();
        if (!player.signedIn) return;
        loadSaved({ ...sdk, player }).then((loaded) => {
          const merged = {
            ...loaded,
            level: Math.max(loaded.level, savedRef.current.level),
          };
          savedRef.current = merged;
          setSaved(merged);
          badges.unlock({ ...sdk, player }, levelBadges(merged.level));
        });
      }),
    [sdk],
  );

  const pay = async (coins: number) => {
    if (!sdk.player.signedIn || coins <= 0) return { coins: null, test: false };
    try {
      const earned = await sdk.rewards.earn(coins);
      return { coins: earned.coins, test: !!earned.test };
    } catch {
      return { coins: null, test: false };
    }
  };

  // ------------------------------------------------------------ turns

  const finish = async () => {
    const a = attempt.current;
    a.end = Date.now();
    const ms = a.start ? a.end - a.start : 0;
    scene.current?.setHint(null);
    setHint(null);
    if (a.assisted) {
      setResult({
        solved: false,
        ms,
        moves: a.moves,
        coins: null,
        test: false,
        record: false,
        firstDaily: false,
      });
      setPhase("done");
      return;
    }
    scene.current?.celebrate();
    const full = isFull(a.length);
    const clean = a.hints === 0;
    const before = savedRef.current;
    const today = utcDay();
    const firstDaily = a.kind === "daily" && before.daily?.day !== today;
    const record = full && clean && (!before.best || ms < before.best);
    update((s) => ({
      level: a.kind === "levels" ? Math.max(s.level, a.level) : s.level,
      best: record ? ms : s.best,
      solves: full ? s.solves + 1 : s.solves,
      daily:
        a.kind === "daily"
          ? {
              day: today,
              ms:
                s.daily?.day === today ? Math.min(s.daily.ms, ms) : ms,
            }
          : s.daily,
    }));
    setResult({
      solved: true,
      ms,
      moves: a.moves,
      coins: null,
      test: false,
      record,
      firstDaily,
    });
    setPhase("done");
    if (a.kind === "levels") {
      const next = Math.min(a.level + 1, LAST_LEVEL);
      setLevel(next);
    }
    // Rewards: free play pays badges only; the daily cube pays once a day.
    const ids = [
      ...(a.kind === "levels" ? levelBadges(a.level) : []),
      ...(a.kind === "daily" ? [DAILY] : []),
      ...(full ? fullBadges(ms, !clean) : []),
    ];
    const coins =
      a.kind === "levels" || (a.kind === "daily" && firstDaily)
        ? coinsFor(a.length, a.hints)
        : 0;
    const paid = await pay(coins);
    setResult((r) => r && { ...r, ...paid });
    await badges.unlock(sdk, ids);
  };

  onTurn.current = (move: Move, source: TurnSource) => {
    history.current?.push(move);
    const s = scene.current;
    if (!s) return;
    const a = attempt.current;
    const p = phaseRef.current;
    if (source === "scramble") {
      if (!s.busy && p === "scrambling") {
        a.start = null;
        setPhase("playing");
      }
      return;
    }
    if (source === "solver") {
      solverLeft.current--;
      setStageAt((at) => advance(at));
      if (solverLeft.current <= 0) {
        setStages(null);
        if (s.state.isSolved()) {
          if (a.length >= 20 || (history.current?.length ?? 99) > 20)
            badges.unlock(sdk, [WATCH]);
          if (p === "solving" && a.kind !== "free") finish();
          else setPhase(a.kind === "free" ? "sandbox" : "done");
        }
      }
      return;
    }
    // The player's own turn.
    setHint(null);
    s.setHint(null);
    if (source === "undo") undoStack.current.pop();
    else undoStack.current.push(move);
    if (p === "playing") {
      a.moves++;
      if (a.start === null) {
        a.start = Date.now();
        setNow(a.start);
      }
      if (s.state.isSolved() && !s.busy) finish();
    }
    refresh();
  };

  const advance = (at: { stage: number; move: number }) => {
    const list = stagesRef.current;
    if (!list) return at;
    const move = at.move + 1;
    if (move < (list[at.stage]?.moves.length ?? 0)) return { ...at, move };
    return { stage: at.stage + 1, move: 0 };
  };
  const stagesRef = useRef<Stage[] | null>(null);
  stagesRef.current = stages;

  const canTurn = phase === "playing" || phase === "sandbox";
  const press = (move: Move, source: TurnSource = "button") => {
    const s = scene.current;
    if (!s || !(phaseRef.current === "playing" || phaseRef.current === "sandbox"))
      return;
    setPressed(move);
    setTimeout(() => setPressed((p) => (p === move ? null : p)), 160);
    s.turn(move, source);
  };
  const undo = () => {
    const last = undoStack.current[undoStack.current.length - 1];
    if (last && !scene.current?.busy) press(inverse(last), "undo");
  };

  // Keyboard: U D L R F B turn clockwise, with Shift counterclockwise.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const face = e.key.toUpperCase();
      if (FACE_NAMES.includes(face as Face)) {
        e.preventDefault();
        press(face + (e.shiftKey ? "'" : ""));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ------------------------------------------------------------ starting

  const resetCube = (state = new CubeState()) => {
    const s = scene.current;
    s?.clearQueue();
    s?.setState(state);
    s?.setHint(null);
    history.current = state.isSolved() ? [] : null;
    undoStack.current = [];
    setHint(null);
    setStages(null);
    setResult(null);
  };

  const scramble = (moves: Move[], kind: Mode, lvl: number) => {
    resetCube();
    attempt.current = newAttempt(kind, lvl, moves.length);
    const s = scene.current;
    if (!s) return;
    setPhase("scrambling");
    for (const m of moves) s.turn(m, "scramble", SCRAMBLE_TURN);
  };

  const startLevel = (lvl = level) => scramble(levelScramble(lvl), "levels", lvl);
  const startDaily = () => scramble(dailyScramble(utcDay()), "daily", 0);

  const switchMode = (next: Mode) => {
    if (next === mode && phase !== "done") return;
    setMode(next);
    sdk.storage.set("mode", next).catch(() => {});
    resetCube();
    setMessage(null);
    attempt.current = newAttempt(next, 0, 0);
    setPhase(next === "free" ? "sandbox" : "ready");
  };

  // ------------------------------------------------------------ help

  const giveHint = () => {
    const s = scene.current;
    if (!s || s.busy || s.state.isSolved()) return;
    const solver = solveStages(s.state).flatMap((st) => st.moves);
    const back = history.current ? undoPath(history.current) : null;
    const path = back && back.length <= solver.length ? back : solver;
    const move = path[0];
    if (!move) return;
    if (phaseRef.current === "playing") attempt.current.hints++;
    setHint(move);
    s.setHint(move[0] as Face);
  };

  const solveForMe = () => {
    const s = scene.current;
    if (!s || s.busy || s.state.isSolved()) return;
    const list = solveStages(s.state);
    setStages(list);
    setStageAt({ stage: 0, move: 0 });
    setHint(null);
    s.setHint(null);
    const moves = list.flatMap((st) => st.moves);
    solverLeft.current = moves.length;
    if (phaseRef.current === "playing") attempt.current.assisted = true;
    setPhase("solving");
    for (const m of moves) s.turn(m, "solver", s.turnTime * 1.4);
  };

  const stopSolver = () => {
    const s = scene.current;
    s?.clearQueue();
    solverLeft.current = 0;
    setStages(null);
    const a = attempt.current;
    setPhase(a.kind === "free" && (!a.length || a.assisted) ? "sandbox" : "playing");
  };

  const toggleNet = async () => {
    const s = scene.current;
    if (!s) return;
    const next = !s.unfolded;
    setUnfolded(next);
    await s.setUnfolded(next);
  };

  const runNotation = () => {
    const moves = parseMoves(notation);
    if (!moves) {
      setMessage("Use U, D, L, R, F and B, with ' or 2, such as R U R' U'.");
      return;
    }
    setMessage(null);
    for (const m of moves) press(m);
  };

  const setFromPosition = () => {
    const text = position.trim().toUpperCase().replace(/\s+/g, " ");
    if (!isValidState(text)) {
      setMessage("That isn't a position a real cube can reach.");
      return;
    }
    setMessage(null);
    resetCube(new CubeState(text));
    attempt.current = newAttempt("free", 0, 0);
    setPhase("sandbox");
  };

  // ------------------------------------------------------------ drawing

  const a = attempt.current;
  const elapsed = a.start ? (a.end ?? (phase === "playing" ? now : a.start)) - a.start : 0;
  const today = utcDay();
  const dailyDone = saved.daily?.day === today ? saved.daily.ms : 0;
  const busyScene = phase === "scrambling" || phase === "solving";

  const stats = (
    <div className="rc-stats">
      <div>
        <span>{t("Time")}</span>
        <strong>{formatTime(elapsed)}</strong>
      </div>
      <div>
        <span>{t("Moves")}</span>
        <strong>{a.moves}</strong>
      </div>
      {a.length > 0 && a.length < FULL && (
        <div>
          <span>{t("Par")}</span>
          <strong>{a.length}</strong>
        </div>
      )}
    </div>
  );

  return (
    <div className={`rc-app ${unfolded ? "is-net" : ""}`}>
      <div className="rc-stage" ref={host} />
      {noWebgl && (
        <div className="rc-card rc-center">
          <h2>{t("Rubik's Cube needs WebGL, which this browser can't draw.")}</h2>
        </div>
      )}

      <header className="rc-top">
        <div className="rc-brand">
          <CubeMark />
          <span>{t("Rubik's Cube")}</span>
        </div>
        <nav className="rc-tabs" aria-label={t("Modes")}>
          {MODES.map((m) => (
            <button
              key={m}
              className={m === mode ? "active" : ""}
              aria-pressed={m === mode}
              onClick={() => switchMode(m)}
            >
              {t(m === "levels" ? "Levels" : m === "daily" ? "Daily cube" : "Free play")}
            </button>
          ))}
        </nav>
        {!sdk.player.signedIn && sdk.embedded && (
          <button className="rc-signin" onClick={() => sdk.requestSignIn()}>
            {t("Sign in to earn coins and badges")}
          </button>
        )}
      </header>

      <aside className="rc-panel rc-left" hidden={!!stages}>
        {mode === "levels" && (
          <>
            <p className="eyebrow">
              {t("Level {0} of {1}", )
                .replace("{0}", String(phase === "ready" ? level : a.level || level))
                .replace("{1}", String(LAST_LEVEL))}
            </p>
            <h2>
              {scrambleLength(phase === "ready" ? level : a.level || level) >= FULL
                ? t("Full scramble")
                : counted(
                    scrambleLength(phase === "ready" ? level : a.level || level),
                    "1-move scramble",
                    "{0}-move scramble",
                  )}
            </h2>
            <LevelDots
              level={phase === "ready" ? level : a.level || level}
              cleared={saved.level}
              disabled={busyScene}
              onPick={(l) => {
                setLevel(l);
                resetCube();
                setPhase("ready");
              }}
            />
          </>
        )}
        {mode === "daily" && (
          <>
            <p className="eyebrow">{today}</p>
            <h2>{t("Daily cube")}</h2>
            <p className="rc-muted">
              {t("Everyone gets the same full scramble today.")}
            </p>
            {dailyDone > 0 && (
              <p className="rc-muted">
                {t("Your time today: {0}").replace("{0}", formatTime(dailyDone))}
              </p>
            )}
          </>
        )}
        {mode === "free" && (
          <>
            <p className="eyebrow">{t("Free play")}</p>
            <h2>{t("Your cube, your rules")}</h2>
            <p className="rc-muted">
              {t("Turn freely, type moves, set a position, or let the solver show the layer-by-layer method.")}
            </p>
          </>
        )}
        {phase !== "ready" && stats}
        <dl className="rc-records">
          <div>
            <dt>{t("Best full solve")}</dt>
            <dd>{saved.best ? formatTime(saved.best) : "–"}</dd>
          </div>
          <div>
            <dt>{t("Full solves")}</dt>
            <dd>{saved.solves}</dd>
          </div>
        </dl>
      </aside>

      <aside className="rc-panel rc-right">
        <div className="rc-tools">
          <button onClick={giveHint} disabled={!canTurn}>
            <span aria-hidden>💡</span> {t("Hint")}
          </button>
          <button onClick={toggleNet} disabled={busyScene}>
            <span aria-hidden>{unfolded ? "▣" : "✚"}</span>{" "}
            {unfolded ? t("Fold") : t("Unfold")}
          </button>
          <button
            onClick={() => {
              const next = { ...prefs, letters: !prefs.letters };
              scene.current?.showLetters(next.letters);
              savePrefs(next);
            }}
            aria-pressed={prefs.letters}
          >
            <span aria-hidden>Aa</span> {t("Face letters")}
          </button>
          <button onClick={() => scene.current?.resetView()}>
            <span aria-hidden>⟲</span> {t("Reset view")}
          </button>
          <button onClick={solveForMe} disabled={!canTurn}>
            <span aria-hidden>▶</span> {t("Solve for me")}
          </button>
        </div>
        {hint && (
          <p className="rc-hint">
            {/* The move goes where the language puts it. */}
            {t("Try {0}").split("{0}")[0]}
            <b>{hint}</b>
            {t("Try {0}").split("{0}")[1]}
          </p>
        )}
        <label className="rc-speed">
          {t("Turn speed")}
          <input
            type="range"
            min={1}
            max={100}
            value={prefs.speed}
            onChange={(e) => {
              const speed = Number(e.target.value);
              if (scene.current) scene.current.turnTime = turnTime(speed);
              savePrefs({ ...prefs, speed });
            }}
          />
        </label>
        {mode === "free" && (
          <div className="rc-free">
            <div className="rc-row">
              <button
                className="button"
                disabled={busyScene}
                onClick={() => scramble(randomMoves(FULL), "free", 0)}
              >
                {t("Scramble")}
              </button>
              <button
                className="secondary-button"
                disabled={phase === "scrambling"}
                onClick={() => {
                  resetCube();
                  attempt.current = newAttempt("free", 0, 0);
                  setPhase("sandbox");
                }}
              >
                {t("Reset")}
              </button>
            </div>
            <label>
              {t("Moves")}
              <span className="rc-row">
                <input
                  value={notation}
                  placeholder="R U R' U'"
                  spellCheck={false}
                  onChange={(e) => setNotation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runNotation()}
                />
                <button className="secondary-button" onClick={runNotation} disabled={!canTurn}>
                  {t("Run")}
                </button>
              </span>
            </label>
            <label>
              {t("Position (Singmaster notation)")}
              <textarea
                rows={3}
                value={position}
                spellCheck={false}
                placeholder="UF UR UB UL DF DR DB DL FR FL BR BL UFR URB UBL ULF DRF DFL DLB DBR"
                onChange={(e) => setPosition(e.target.value)}
              />
              <span className="rc-row">
                <button
                  className="secondary-button"
                  onClick={() => scene.current && setPosition(scene.current.state.getState())}
                >
                  {t("Get")}
                </button>
                <button className="secondary-button" onClick={setFromPosition} disabled={busyScene}>
                  {t("Set")}
                </button>
              </span>
            </label>
            {message && <p className="rc-error">{t(message)}</p>}
          </div>
        )}
      </aside>

      {stages && (
        <div className="rc-solver rc-panel">
          <p className="eyebrow">{t("Layer by layer")}</p>
          <ol>
            {stages.map((st, i) => (
              <li
                key={st.id}
                className={
                  i < stageAt.stage ? "done" : i === stageAt.stage ? "now" : ""
                }
              >
                <span>{t(STAGE_NAMES[st.id])}</span>
                <small>
                  {i === stageAt.stage
                    ? st.moves.map((m, j) => (
                        <b key={j} className={j === stageAt.move ? "on" : ""}>
                          {m}
                        </b>
                      ))
                    : movesText(st.moves.length)}
                </small>
              </li>
            ))}
          </ol>
          <button className="secondary-button" onClick={stopSolver}>
            {t("Stop")}
          </button>
        </div>
      )}

      <footer className="rc-pad" aria-label={t("Turns")}>
        <div className="rc-moves">
          {["", "'"].map((suffix) => (
            <div className="rc-move-row" key={suffix}>
              {ORDER.map((f) => {
                const m = f + suffix;
                return (
                  <button
                    key={m}
                    className={`rc-move face-${f} ${pressed === m ? "pressed" : ""} ${hint === m ? "hinted" : ""}`}
                    disabled={!canTurn}
                    onClick={() => press(m)}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <button
          className="rc-undo"
          onClick={undo}
          disabled={!canTurn || !undoStack.current.length}
        >
          ↶ {t("Undo")}
        </button>
        <p className="rc-keys">
          {t("Drag a face to turn it, drag the background to look around. Keys: U D L R F B, Shift for counterclockwise, Ctrl+Z to undo.")}
        </p>
      </footer>

      {phase === "ready" && mode !== "free" && !noWebgl && (
        <div className="rc-card rc-center">
          {mode === "levels" ? (
            <>
              <p className="eyebrow">
                {t("Level {0}").replace("{0}", String(level))}
              </p>
              <h2>
                {scrambleLength(level) >= FULL
                  ? t("Solve a fully scrambled cube")
                  : counted(
                      scrambleLength(level),
                      "Undo a 1-move scramble",
                      "Undo a {0}-move scramble",
                    )}
              </h2>
              <p className="rc-muted">
                {t("Each level scrambles the cube a little more, up to a full scramble at level {0}.").replace("{0}", String(LAST_LEVEL))}
              </p>
              <button className="button" onClick={() => startLevel()}>
                {t("Scramble and start")}
              </button>
            </>
          ) : (
            <>
              <p className="eyebrow">{today}</p>
              <h2>{t("Today's cube")}</h2>
              <p className="rc-muted">
                {dailyDone
                  ? t("You solved today's cube in {0}. Play it again to beat your time.").replace("{0}", formatTime(dailyDone))
                  : t("A full scramble, the same for everyone today. The clock starts at your first turn.")}
              </p>
              <button className="button" onClick={startDaily}>
                {t("Scramble and start")}
              </button>
            </>
          )}
        </div>
      )}

      {phase === "done" && result && (
        <div className="rc-card rc-center rc-result">
          <p className="eyebrow">
            {result.solved ? t("Solved!") : t("Solved by the solver")}
          </p>
          <h2>{formatTime(result.ms)}</h2>
          <p>
            {movesText(result.moves)}
            {result.record && <> · <b>{t("New best!")}</b></>}
          </p>
          {result.solved && result.coins !== null && (
            <p className="rc-coins">
              {t("+{0} coins").replace("{0}", String(result.coins))}
              {result.test && ` (${t("test")})`}
            </p>
          )}
          {!result.solved && (
            <p className="rc-muted">{t("Solve it yourself to clear the level and earn coins.")}</p>
          )}
          {result.solved && !sdk.player.signedIn && sdk.embedded && (
            <p className="rc-muted">
              <button className="link-button" onClick={() => sdk.requestSignIn()}>
                {t("Sign in")}
              </button>{" "}
              {t("to keep your progress and earn coins.")}
            </p>
          )}
          <div className="rc-row">
            {a.kind === "levels" && result.solved && a.level < LAST_LEVEL && (
              <button className="button" onClick={() => startLevel(a.level + 1)}>
                {t("Next level")}
              </button>
            )}
            <button
              className={a.kind === "levels" && result.solved && a.level < LAST_LEVEL ? "secondary-button" : "button"}
              onClick={() =>
                a.kind === "daily"
                  ? startDaily()
                  : a.kind === "levels"
                    ? startLevel(a.level)
                    : scramble(randomMoves(FULL), "free", 0)
              }
            >
              {t("Play again")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LevelDots({
  level,
  cleared,
  disabled,
  onPick,
}: {
  level: number;
  cleared: number;
  disabled: boolean;
  onPick: (level: number) => void;
}) {
  const { t } = useLocale();
  return (
    <ol className="rc-levels" aria-label={t("Levels")}>
      {LEVELS.map((_, i) => {
        const l = i + 1;
        const open = l <= cleared + 1;
        return (
          <li key={l}>
            <button
              className={`${l <= cleared ? "cleared" : ""} ${l === level ? "current" : ""}`}
              disabled={!open || disabled}
              onClick={() => onPick(l)}
              aria-label={t("Level {0}").replace("{0}", String(l))}
            >
              {l}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function CubeMark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path d="M12 2 21 7v10l-9 5-9-5V7z" fill="#1d2230" stroke="#d5ff58" strokeWidth="1.4" />
      <path d="M12 12 21 7M12 12 3 7M12 12v10" stroke="#d5ff58" strokeWidth="1.4" />
    </svg>
  );
}
