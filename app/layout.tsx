import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Growth OS",
  description: "AI family companionship coach for Growth OS v0.1"
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
