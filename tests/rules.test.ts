import { test } from "node:test";
import assert from "node:assert/strict";
import { merge, parse } from "../src/save";
import { fullBadges, levelBadges, DAILY, WATCH } from "../src/badges";
import {
  LAST_LEVEL,
  coinsFor,
  dailyScramble,
  formatTime,
  levelScramble,
  scrambleLength,
  undoPath,
} from "../src/levels";
import { CubeState } from "../src/cube/state";
import zh from "../src/locales/zh-CN.json" with { type: "json" };
import { LANGUAGES, PACKS, translate } from "../src/i18n";
import game from "../game.json" with { type: "json" };

test("saves are read defensively", () => {
  const none = { level: 0, best: 0, solves: 0, daily: null };
  assert.deepEqual(parse(null), none);
  assert.deepEqual(parse([1]), none);
  assert.deepEqual(parse({ level: 99, best: -3, solves: 1.5 }), none);
  assert.deepEqual(
    parse({ level: 4, best: 61000, solves: 2, daily: { day: "2026-11-15", ms: 90000 } }),
    { level: 4, best: 61000, solves: 2, daily: { day: "2026-11-15", ms: 90000 } },
  );
  assert.equal(parse({ daily: { day: "today", ms: 5 } }).daily, null);
});

test("an account save and a device save combine", () => {
  assert.deepEqual(
    merge(
      { level: 3, best: 0, solves: 1, daily: { day: "2026-11-14", ms: 5000 } },
      { level: 7, best: 90000, solves: 0, daily: { day: "2026-11-15", ms: 9000 } },
    ),
    { level: 7, best: 90000, solves: 1, daily: { day: "2026-11-15", ms: 9000 } },
  );
  assert.equal(
    merge(
      { level: 0, best: 70000, solves: 0, daily: null },
      { level: 0, best: 60000, solves: 0, daily: null },
    ).best,
    60000,
  );
});

test("levels grow from one move to a full scramble", () => {
  assert.equal(scrambleLength(1), 1);
  assert.equal(scrambleLength(LAST_LEVEL), 25);
  for (let l = 1; l <= LAST_LEVEL; l++)
    assert.equal(levelScramble(l).length, scrambleLength(l));
  // Short scrambles are quarter turns, so the par is the number of moves.
  assert.ok(levelScramble(5).every((m) => !m.endsWith("2")));
});

test("the daily scramble is the same for everyone on a day", () => {
  assert.deepEqual(dailyScramble("2026-11-15"), dailyScramble("2026-11-15"));
  assert.notDeepEqual(dailyScramble("2026-11-15"), dailyScramble("2026-11-16"));
  assert.equal(dailyScramble("2026-11-15").length, 25);
});

test("coins grow with the scramble and halve with hints", () => {
  assert.equal(coinsFor(1, 0), 1);
  assert.equal(coinsFor(10, 0), 4);
  assert.equal(coinsFor(25, 0), 10);
  assert.equal(coinsFor(25, 2), 5);
  assert.equal(coinsFor(1, 1), 1);
});

test("the undo path solves the cube", () => {
  const history = [...levelScramble(8), "R", "R'", "U"];
  const c = new CubeState().apply(history);
  c.apply(undoPath(history));
  assert.equal(c.isSolved(), true);
});

test("times read as minutes, seconds and tenths", () => {
  assert.equal(formatTime(0), "0:00.0");
  assert.equal(formatTime(83456), "1:23.4");
});

test("every badge the game awards is in game.json", () => {
  assert.deepEqual(levelBadges(4), ["level-3"]);
  assert.deepEqual(fullBadges(90_000, false), ["full-solve", "full-5min", "full-2min"]);
  assert.deepEqual(fullBadges(30_000, true), []);
  const ids = new Set(game.badges.map((b) => b.id));
  for (const id of [...levelBadges(LAST_LEVEL), ...fullBadges(1, false), DAILY, WATCH])
    assert.ok(ids.has(id), id);
  assert.equal(ids.size, game.badges.length);
});

const holes = (s: string) => (s.match(/\{\d+\}/g) ?? []).sort().join();

test("every language pack has the Chinese pack's keys and placeholders", () => {
  const keys = Object.keys(zh).sort();
  assert.deepEqual(Object.keys(PACKS).sort(), ["es", "id", "ja", "ko", "pt-BR", "zh-CN"]);
  for (const [lang, pack] of Object.entries(PACKS)) {
    assert.deepEqual(Object.keys(pack).sort(), keys, lang);
    for (const [en, text] of Object.entries(pack)) {
      assert.ok(text.trim(), `${lang}: ${en}`);
      assert.equal(holes(text), holes(en), `${lang}: ${en}`);
    }
  }
});

test("game.json lists every language, with a title and description in each", () => {
  assert.deepEqual(game.languages, LANGUAGES);
  assert.ok(game.languages.includes("en"));
  // game.json names Chinese "zh"; every other language by its own code.
  const field = (lang: string) => (lang === "zh-CN" ? "zh" : lang);
  for (const lang of game.languages) {
    const title = (game.title as Record<string, string>)[field(lang)];
    const description = (game.description as Record<string, string>)[field(lang)];
    assert.ok(title?.trim(), `title ${lang}`);
    assert.ok(description?.trim(), `description ${lang}`);
  }
});

test("translate speaks each language, and English for the rest", () => {
  assert.equal(translate("Play again", "es"), "Jugar otra vez");
  assert.equal(translate("Play again", "pt-BR"), "Jogar de novo");
  assert.equal(translate("Play again", "id"), "Main lagi");
  assert.equal(translate("Play again", "ja"), "もう一度遊ぶ");
  assert.equal(translate("Play again", "ko"), "다시 하기");
  assert.equal(translate("Play again", "zh-CN"), "再玩一次");
  assert.equal(translate("Level {0} of {1}", "es"), "Nivel {0} de {1}");
  assert.equal(translate("Level 3 of 15", "pt-BR"), "Nível 3 de 15");
  assert.equal(translate("Level 3", "ja"), "レベル 3");
  for (const locale of ["en", "fr", "de", "zh", "constructor", "toString"])
    assert.equal(translate("Play again", locale), "Play again", locale);
  assert.equal(translate("Level 3 of 15", "fr"), "Level 3 of 15");
  assert.equal(translate("Not a game string", "ja"), "Not a game string");
});

test("no language other than Chinese ever gets Chinese text", () => {
  const han = /[\u4e00-\u9fff]/;
  const chinese = new Set(Object.values(zh as Record<string, string>));
  for (const locale of ["en", "es", "pt-BR", "id", "ja", "ko", "fr"])
    for (const key of Object.keys(zh)) {
      const text = translate(key, locale);
      // Japanese writes with kanji too, so for it only the exact Chinese text counts.
      if (locale !== "ja") assert.ok(!han.test(text), `${locale}: ${key}`);
      assert.ok(!chinese.has(text), `${locale}: ${key}`);
    }
});

test("cube notation stays as it is in every language", () => {
  const notation = "R U R' U'";
  for (const pack of Object.values(PACKS))
    assert.ok(pack["Use U, D, L, R, F and B, with ' or 2, such as R U R' U'."].includes(notation));
});
