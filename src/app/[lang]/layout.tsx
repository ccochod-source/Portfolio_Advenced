import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { Backdrop } from "@/components/backdrop/Backdrop";
import { HudBar } from "@/components/HudBar";
import { Nav } from "@/components/Nav";
import { Cursor, Preloader } from "@/components/motion";
import { PRELOADER_INERT_ID } from "@/components/motion/Preloader";
import { profile } from "@/content/profile";
import { SITE_URL, absoluteUrl, localeAlternates, ogLocale } from "@/lib/site";
import { SmoothScroll } from "@/components/SmoothScroll";
import { locales } from "@/i18n";
import { getDictionary, getLocale } from "./dictionaries";
import "../globals.css";

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
});

const mono = Space_Mono({
  variable: "--font-mono-face",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const [{ meta }, lang] = await Promise.all([getDictionary(), getLocale()]);
  return {
    metadataBase: SITE_URL,
    title: { default: meta.title, template: `%s — ${meta.siteName}` },
    description: meta.description,
    alternates: { canonical: absoluteUrl(`/${lang}`), languages: localeAlternates() },
    openGraph: {
      type: "website",
      siteName: meta.siteName,
      locale: ogLocale[lang],
      alternateLocale: lang === "fr" ? ogLocale.en : ogLocale.fr,
      url: absoluteUrl(`/${lang}`),
      title: meta.title,
      description: meta.description,
    },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  return (
    <html
      lang={lang}
      className={`${grotesk.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="grain min-h-full">
        <Backdrop />
        <Preloader label={dict.preloader.label} skipHint={dict.preloader.skipHint} />
        <Cursor label={dict.common.cursorView} />
        <a href="#main" className="skip-link">
          {dict.nav.skip}
        </a>
        <SmoothScroll>
          <div id={PRELOADER_INERT_ID}>
            <Nav />
            {children}
          </div>
        </SmoothScroll>
        <HudBar />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: profile.name,
              url: absoluteUrl(`/${lang}`),
              email: `mailto:${profile.emailPro}`,
              jobTitle: dict.hero.eyebrow,
              description: dict.meta.description,
              sameAs: [profile.linkedin, profile.github],
              alumniOf: { "@type": "EducationalOrganization", name: "Eugenia School" },
              address: { "@type": "PostalAddress", addressLocality: "Paris", addressCountry: "FR" },
            }),
          }}
        />
      </body>
    </html>
  );
}
