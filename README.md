# Rubik's Cube

A 3D 3×3×3 Rubik's Cube for [dingn](https://dingn.com), with a
layer-by-layer solver for cube learners. Play it at
<https://dingn.com/play/rubikscube/>.

- **Levels**: 15 levels, from a 1-move scramble up to a full 25-move scramble.
- **Daily cube**: the same full scramble for everyone each UTC day.
- **Free play**: turn freely, type moves in standard notation, read or set a
  position in Singmaster positional notation, and let the solver show the
  [beginner's layer-by-layer method](https://ruwix.com/the-rubiks-cube/how-to-solve-the-rubiks-cube-beginners-method/)
  stage by stage.
- Turn layers by dragging a face, with the move buttons, or with the keyboard
  (U D L R F B, Shift for counterclockwise, Ctrl+Z to undo). Drag the
  background to look around.
- **Unfold** opens the cube into a flat net and folds it back.
- Hints, face letters, turn speed, and seven languages (English, Chinese,
  Spanish, Portuguese, Indonesian, Japanese, Korean) that switch live.

Rubik's Cube is published on dingn the same way as any outside developer's
game: a zip uploaded on [My games](https://dingn.com/developers/games/) and
approved in dingn's review queue. It started as a Cordova app (web, Android
and iOS) built with an early three.js; version 2 is a web game on three.js
0.187, React and TypeScript.

## Develop

```sh
npm install
npm run dev     # http://localhost:5173/
npm test        # typecheck, unit tests and component tests
```

To play it inside dingn while developing, open the
[playground](https://dingn.com/developers/playground/) and load
`http://localhost:5173/`.

## What's where

- `src/cube/state.ts`: the cube state in Singmaster positional notation,
  moves, notation parsing and the check that a position is reachable.
- `src/cube/solver.ts`: the layer-by-layer solver, in stages.
- `src/cube/scramble.ts`: random and seeded scrambles.
- `src/cube-scene.ts`: the three.js cube: drawing, turning, dragging and the
  fold/unfold net.
- `src/game.tsx`: the modes, panels and move pad.
- `src/levels.ts`: levels, the daily cube, coins.
- `src/badges.ts` and `game.json`: badges for levels 3, 5, 8, 11 and 14, a
  full solve without help, full solves under 5, 2 and 1 minutes, a daily cube
  and watching the solver. A cleared level pays 1 to 10 coins by scramble
  length (half with hints) through `sdk.rewards.earn`; the daily cube pays 10
  once a day; free play pays badges only.
- `src/save.ts`: the highest level, best time and daily time. Saved on the
  device with `sdk.storage`, and to the player's account with `sdk.progress`
  when signed in.

## Release a new version

1. In a pull request, raise `version` in `game.json`. Every release needs a
   new version.
2. Merge it to `master`. The **Build and publish** Action tests the game,
   builds `release/rubikscube-<version>.zip` and uploads it to dingn with the
   `DINGN_UPLOAD_KEY` secret.
3. The new version waits in dingn's review queue and goes live once it is
   approved.

A merge that doesn't raise the version builds and tests but uploads nothing.
Every run also keeps the zip as a workflow artifact.

To upload by hand instead: `npm run pack`, then upload the zip on
<https://dingn.com/developers/games/>, or run
`DINGN_UPLOAD_KEY=... npm run upload`.

### The upload key

Create a key on <https://dingn.com/developers/games/> (signed in as the
account that owns the game), then add it to this repository under
**Settings → Secrets and variables → Actions** as `DINGN_UPLOAD_KEY`. dingn
shows the key once; if it is lost, revoke it and create another.

## The dingn SDK

`sdk/` is a copy of the dingn game SDK (`https://dingn.com/sdk/v1/`), bundled
into the game. Run `npm run update-sdk` to refresh it. The full guide is at
<https://dingn.com/developers/>.

## Credits

Written by Ligang Wang. Built with [three.js](https://threejs.org/) and
[React](https://react.dev/).
