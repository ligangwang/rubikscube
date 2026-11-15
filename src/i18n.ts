// Simplified Chinese for Rubik's Cube. The same rules as the website's
// translations: exact strings first, then patterns such as "Level {0}".
import zh from "./zh-CN.json";
import type { Locale } from "../sdk/dingn-sdk.js";
const catalog: Record<string, string> = zh;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const patterns = Object.entries(catalog)
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
export function translate(text: string, locale: Locale): string {
  if (locale === "en" || !text) return text;
  const key = text.replace(/\s+/g, " ").trim();
  if (catalog[key]) return catalog[key];
  for (const { re, value } of patterns) {
    const match = key.match(re);
    if (match)
      return value.replace(/\{(\d+)\}/g, (_, n) => match[Number(n) + 1] ?? "");
  }
  return text;
}
