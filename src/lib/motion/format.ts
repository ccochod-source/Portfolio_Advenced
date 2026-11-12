export type NumberLocale = "fr" | "en";

const separators: Record<NumberLocale, { group: string; decimal: string }> = {
  fr: { group: "\u202f", decimal: "," },
  en: { group: ",", decimal: "." },
};

/** Deterministic grouping (no Intl) so server and client render the same string. */
export function formatNumber(value: number, locale: NumberLocale = "fr", decimals = 0) {
  const { group, decimal } = separators[locale];
  const [int, fraction] = Math.abs(value).toFixed(decimals).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  return `${value < 0 ? "-" : ""}${grouped}${fraction ? decimal + fraction : ""}`;
}
