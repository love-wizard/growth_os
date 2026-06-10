import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "成长 OS",
  description: "帮助父母更好陪伴孩子成长的 AI 家庭成长教练"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
