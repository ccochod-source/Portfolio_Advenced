import { ImageResponse } from "next/og";
import { hasLocale, locales } from "@/i18n";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateImageMetadata({ params }: { params: { lang: string } }) {
  const lang = hasLocale(params.lang) ? params.lang : "fr";
  return [
    {
      id: "default",
      size,
      contentType,
      alt: lang === "fr" ? "Clément Cochod — IA × Business, portfolio" : "Clément Cochod — AI × Business, portfolio",
    },
  ];
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

const copy = {
  fr: { eyebrow: "Eugenia School · IA, Data & Business", status: "Alternance IA · septembre 2027", tagline: "Je transforme des besoins métier en outils IA." },
  en: { eyebrow: "Eugenia School · AI, Data & Business", status: "AI apprenticeship · September 2027", tagline: "I turn business needs into AI tools." },
} as const;

export default async function OpenGraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = hasLocale(raw) ? raw : "fr";
  const c = copy[lang];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(160deg, #FFF4E6 0%, #FFE4C4 45%, #FFC145 100%)",
          color: "#2B1A12",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -160,
            width: 560,
            height: 560,
            borderRadius: 999,
            background: "radial-gradient(circle at 40% 40%, #FF7A1A 0%, #FF5A4E 60%, rgba(255,90,78,0) 72%)",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#6B4A3A" }}>{c.eyebrow}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 600, letterSpacing: -3, lineHeight: 1 }}>Clément Cochod</div>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 500, color: "#B4480A", letterSpacing: -1 }}>IA × Business</div>
          <div style={{ display: "flex", fontSize: 30, color: "#6B4A3A", marginTop: 8 }}>{c.tagline}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, letterSpacing: 3, textTransform: "uppercase" }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#2B1A12", display: "flex" }} />
          {c.status}
        </div>
      </div>
    ),
    size,
  );
}
