import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { locales } from "@/i18n";
import { absoluteUrl, localeAlternates } from "@/lib/site";

/** Home and project pages in both locales. `/lab/*` and `/styleguide` are intentionally left out. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", ...projects.map((p) => `/projets/${p.slug}`)];
  return paths.flatMap((path) =>
    locales.map((lang) => ({
      url: absoluteUrl(`/${lang}${path}`),
      changeFrequency: path === "" ? ("monthly" as const) : ("yearly" as const),
      priority: path === "" ? 1 : 0.7,
      alternates: { languages: localeAlternates(path) },
    })),
  );
}
