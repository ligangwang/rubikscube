// Uploads release/<id>-<version>.zip to dingn with the upload key in
// DINGN_UPLOAD_KEY. The new version waits in dingn's review queue and goes
// live once it is approved. A version dingn already has is skipped, so this
// can run on every push to main: only a raised version in game.json uploads.
import { readFileSync } from "node:fs";

const key = process.env.DINGN_UPLOAD_KEY;
const site = process.env.DINGN_SITE || "https://dingn.com";
const { id, version } = JSON.parse(readFileSync("game.json", "utf8"));
if (!key) {
  console.error("Set DINGN_UPLOAD_KEY to a key from dingn's My games page.");
  process.exit(1);
}

const response = await fetch(`${site}/api/developer/games/upload`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/zip",
  },
  body: readFileSync(`release/${id}-${version}.zip`),
});
const result = await response.json().catch(() => ({}));
if (response.ok) {
  console.log(
    `Uploaded ${id} ${version}. It goes live once dingn approves it.`,
  );
  console.log(`Try it: ${site}${result.play}`);
} else if (result.error === "version-exists") {
  console.log(
    `${id} ${version} is already on dingn. Raise version in game.json to publish.`,
  );
} else {
  console.error(
    `Upload failed (${response.status}): ${result.error ?? "no response"}${result.detail ? ` ${result.detail}` : ""}`,
  );
  process.exit(1);
}
