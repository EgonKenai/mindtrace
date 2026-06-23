import type { Metadata } from "next";
import type { ReactNode } from "react";

import { zhCN } from "@/i18n/messages/zh-CN";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: zhCN.metadata.title,
    template: `%s | ${zhCN.metadata.title}`,
  },
  description: zhCN.metadata.description,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
