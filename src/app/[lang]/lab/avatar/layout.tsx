import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lab — Avatar 3D · Clément Cochod",
  robots: { index: false, follow: false },
};

export default function AvatarLabLayout({ children }: LayoutProps<"/[lang]/lab/avatar">) {
  return children;
}
