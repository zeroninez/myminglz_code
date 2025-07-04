import { Layout } from "@repo/ui";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "쿠펀 - 인증 앱",
  description: "방문 증명 쿠폰을 확인하세요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout title={"쿠펀 - 인증 앱"}>{children}</Layout>;
}
