# AGENTS.md

Notes for AI coding agents working on Rubik's Cube.

- This is a dingn game published like any outside developer's game: the
  dingn website (repo `ligangwang/dingn`) runs it in a sandboxed frame and the
  game talks to it only through the SDK in `sdk/`. Don't import from the
  dingn repo. Refresh `sdk/` with `npm run update-sdk`.
- Run `npm test` before committing. `npm run pack` builds the upload zip.
- Merging to `master` publishes on dingn (`.github/workflows/release.yml`)
  when `version` in `game.json` is new.
- Bump `version` in `game.json` for every release; dingn refuses a version it
  already has.
- Save with `sdk.storage` / `sdk.progress`, never `localStorage` or cookies,
  which the sandbox blocks. Keep every URL relative (`base: "./"`).
- UI strings go through `t()` with translations in `src/zh-CN.json`.
- `src/cube/` is the cube model and the layer-by-layer solver, ported from
  the original JavaScript game. Keep it free of three.js and the DOM so the
  tests can run it in Node.
