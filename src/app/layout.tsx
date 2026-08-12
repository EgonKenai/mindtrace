import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

const defaultTitle = "MindTrace";
const defaultDescription =
  "A private mood, stress, and sleep journal powered by Gemini.";

export const metadata: Metadata = {
  title: {
    default: defaultTitle,
    template: `%s | ${defaultTitle}`,
  },
  description: defaultDescription,
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: defaultTitle,
    description: defaultDescription,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
