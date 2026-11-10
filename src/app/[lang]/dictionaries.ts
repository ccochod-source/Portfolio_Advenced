import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "@/i18n";
import type fr from "@/dictionaries/fr.json";

export type Dictionary = typeof fr;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  fr: () => import("@/dictionaries/fr.json").then((m) => m.default),
  en: () => import("@/dictionaries/en.json").then((m) => m.default),
};

export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  return locale;
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()]();
}
