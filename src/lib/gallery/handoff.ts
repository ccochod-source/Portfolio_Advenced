export const HANDOFF_KEY = "v7:project-handoff";

export type ProjectHandoff = { slug: string; at: number };

export function writeHandoff(slug: string) {
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({ slug, at: Date.now() } satisfies ProjectHandoff));
  } catch {}
}

/** True when the visitor arrives from the gallery expand animation for this slug (consumed once). */
export function readHandoff(slug: string): boolean {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    sessionStorage.removeItem(HANDOFF_KEY);
    if (!raw) return false;
    const handoff = JSON.parse(raw) as ProjectHandoff;
    return handoff.slug === slug && Date.now() - handoff.at < 4000;
  } catch {
    return false;
  }
}
