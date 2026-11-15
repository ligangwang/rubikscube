// The game's link to dingn: the SDK connection, shared through React context,
// plus the translations Rubik's Cube needs.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { DingnGame } from "../sdk/dingn-sdk.js";
import { translate } from "./i18n";

const DingnContext = createContext<DingnGame | null>(null);

export function DingnProvider({
  sdk,
  children,
}: {
  sdk: DingnGame;
  children: ReactNode;
}) {
  // Re-render when the player signs in or out.
  const [player, setPlayer] = useState(sdk.player);
  useEffect(() => sdk.onPlayer(setPlayer), [sdk]);
  return (
    <DingnContext.Provider value={{ ...sdk, player }}>
      {children}
    </DingnContext.Provider>
  );
}

export function useDingn() {
  const sdk = useContext(DingnContext);
  if (!sdk) throw new Error("DingnProvider missing");
  return sdk;
}

export function useLocale() {
  const { locale } = useDingn();
  return { locale, t: (text: string) => translate(text, locale) };
}
