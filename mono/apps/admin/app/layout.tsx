import { Layout } from "@repo/ui";
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "QR Minglz | 관리",
  description: "QR Minglz의 멀티 장소 쿠폰 시스템을 관리하는 어드민 앱입니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout title={"QR Minglz | 관리"}>
      <nav className="bg-white shadow border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold">🎫 QR Minglz | 관리</h1>
              <div className="flex space-x-4">
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  📊 대시보드
                </Link>
                <Link
                  href="/management"
                  className="text-gray-600 hover:text-gray-900"
                >
                  🏗️ 관리
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </Layout>
  );
}
