import { notFound } from "next/navigation";

/** Any unknown path under a locale renders the localized `not-found.tsx` of the `[lang]` segment. */
export default function CatchAll() {
  notFound();
}
