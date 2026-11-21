import { createRoot } from "react-dom/client";
import "@fontsource-variable/space-grotesk";
import "./base.css";
import "./rubiks.css";
import { connect } from "../sdk/dingn-sdk.js";
import { DingnProvider } from "./dingn";
import { RubiksGame, isMode } from "./game";
import { loadSaved } from "./save";

const sdk = await connect();
const [saved, mode, prefs] = await Promise.all([
  loadSaved(sdk),
  sdk.storage.get("mode").catch(() => null),
  sdk.storage.get("prefs").catch(() => null),
]);
const p = prefs && typeof prefs === "object" && !Array.isArray(prefs) ? prefs : {};
createRoot(document.getElementById("root")!).render(
  <DingnProvider sdk={sdk}>
    <RubiksGame
      initial={saved}
      initialMode={isMode(mode) ? mode : undefined}
      prefs={{
        letters: p.letters === true,
        speed:
          typeof p.speed === "number" && p.speed >= 1 && p.speed <= 100
            ? p.speed
            : 50,
      }}
    />
  </DingnProvider>,
);
sdk.ready();
