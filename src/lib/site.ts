import type { Locale } from "@/i18n";

/** Absolute origin of the deployed site, used for `metadataBase`, canonicals, the sitemap and robots. */
export const SITE_URL = new URL(
  (process.env.NEXT_PUBLIC_SITE_URL || "https://portfolio-advanced-three.vercel.app").replace(/\/$/, ""),
);

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

/** `fr`/`en`/`x-default` alternates for a path without locale prefix (e.g. `/projets/nami`). */
export function localeAlternates(path = "") {
  return {
    fr: absoluteUrl(`/fr${path}`),
    en: absoluteUrl(`/en${path}`),
    "x-default": absoluteUrl(`/fr${path}`),
  };
}

export const ogLocale: Record<Locale, string> = { fr: "fr_FR", en: "en_US" };
