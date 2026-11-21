// Rubik's Cube in every language dingn speaks. English is the source: each
// pack in ./locales maps the English text to its translation, with the same
// rules as the website's translations: exact strings first, then patterns
// such as "Level {0}" (longest literal text first).
import zhCN from "./locales/zh-CN.json";
import es from "./locales/es.json";
import ptBR from "./locales/pt-BR.json";
import id from "./locales/id.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import type { Locale } from "../sdk/dingn-sdk.js";

/** Every language pack, by locale. English needs none. */
export const PACKS: Record<string, Record<string, string>> = {
  "zh-CN": zhCN,
  es,
  "pt-BR": ptBR,
  id,
  ja,
  ko,
};
/** The languages the game speaks, as game.json lists them. */
export const LANGUAGES = ["en", ...Object.keys(PACKS)];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
type Pattern = { re: RegExp; value: string };
const compile = (catalog: Record<string, string>): Pattern[] =>
  Object.entries(catalog)
    .filter(([key]) => /\{\d+\}/.test(key))
    .sort(
      ([a], [b]) =>
        b.replace(/\{\d+\}/g, "").length - a.replace(/\{\d+\}/g, "").length,
    )
    .map(([key, value]) => ({
      re: new RegExp(
        "^" +
          key
            .split(/\{\d+\}/)
            .map(escape)
            .join("(.*?)") +
          "$",
      ),
      value,
    }));
const patterns = new Map<string, Pattern[]>();

/**
 * The text in the given language. English, a language without a pack, or a
 * text the pack lacks gives the English text back, never another language's.
 */
export function translate(text: string, locale: Locale): string {
  const catalog = Object.hasOwn(PACKS, locale) ? PACKS[locale] : undefined;
  if (!catalog || !text) return text;
  const key = text.replace(/\s+/g, " ").trim();
  if (Object.hasOwn(catalog, key)) return catalog[key];
  if (!patterns.has(locale)) patterns.set(locale, compile(catalog));
  for (const { re, value } of patterns.get(locale)!) {
    const match = key.match(re);
    if (match)
      return value.replace(/\{(\d+)\}/g, (_, n) => match[Number(n) + 1] ?? "");
  }
  return text;
}
