import type { Locale } from "@/i18n";

export type Localized = Record<Locale, string>;

export const t = (value: Localized, locale: Locale): string => value[locale];
