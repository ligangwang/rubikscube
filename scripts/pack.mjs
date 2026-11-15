// Packs the built game (dist/) and game.json into release/<id>-<version>.zip,
// the file to upload on https://dingn.com/developers/games/.
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { zipSync } from "fflate";

const manifest = JSON.parse(readFileSync("game.json", "utf8"));
const files = { "game.json": readFileSync("game.json") };
function add(dir, prefix = "") {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = prefix + name;
    if (statSync(full).isDirectory()) add(full, rel + "/");
    else files[rel] = readFileSync(full);
  }
}
add("dist");
if (!files[manifest.entry]) {
  console.error(`dist/ has no ${manifest.entry}. Run npm run build first.`);
  process.exit(1);
}
mkdirSync("release", { recursive: true });
const out = path.join("release", `${manifest.id}-${manifest.version}.zip`);
writeFileSync(out, zipSync(files, { level: 9 }));
console.log(
  `${out}: ${Object.keys(files).length} files, ${(statSync(out).size / 1e6).toFixed(1)} MB`,
);
