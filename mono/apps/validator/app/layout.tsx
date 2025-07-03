import { Layout } from "@repo/ui";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "쿠폰 확인기",
  description: "방문 증명 쿠폰을 확인하세요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
