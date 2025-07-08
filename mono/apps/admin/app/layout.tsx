import { Layout } from "@repo/ui";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "쿠펀 어드민",
  description: "쿠펀의 멀티 장소 쿠폰 시스템을 관리하세요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout title={"쿠펀 어드민"}>{children}</Layout>;
}
