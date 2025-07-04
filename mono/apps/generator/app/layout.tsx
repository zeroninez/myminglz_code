import { Layout } from "@repo/ui";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "쿠펀 - 발급 앱",
  description: "방문 증명 쿠폰을 발급받으세요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout title={"쿠펀 - 발급 앱"}>{children}</Layout>;
}
