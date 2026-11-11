import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { Cursor, Preloader } from "@/components/motion";
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
  const { meta } = await getDictionary();
  return {
    title: meta.title,
    description: meta.description,
    alternates: { languages: { fr: "/fr", en: "/en" } },
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
        <Preloader greeting={dict.preloader.greeting} label={dict.preloader.label} skipHint={dict.preloader.skipHint} />
        <Cursor label={dict.common.cursorView} />
        <SmoothScroll>
          <Nav />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
