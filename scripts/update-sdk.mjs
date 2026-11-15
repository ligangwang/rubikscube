// Refreshes sdk/ with the dingn game SDK that dingn.com serves to every game.
// The game bundles its own copy, so run this when dingn announces SDK changes.
import { writeFileSync } from "node:fs";

for (const name of ["dingn-sdk.js", "dingn-sdk.d.ts"]) {
  const res = await fetch(`https://dingn.com/sdk/v1/${name}`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  writeFileSync(`sdk/${name}`, await res.text());
  console.log(`sdk/${name} updated`);
}
