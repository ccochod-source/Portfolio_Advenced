import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Lab · Motion — Clément Cochod",
  robots: { index: false, follow: false },
};

export default function MotionLabLayout({ children }: { children: ReactNode }) {
  return children;
}
