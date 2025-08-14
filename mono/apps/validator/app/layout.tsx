import { Layout } from "@repo/ui";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QR Minglz | 인증",
  description: "Mynglz의 QR 코드 인증 앱입니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout title={"QR Minglz | 인증"}>{children}</Layout>;
}
