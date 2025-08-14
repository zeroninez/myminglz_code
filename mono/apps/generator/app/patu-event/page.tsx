// apps/generator/app/patu-event/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { EnhancedCouponService } from "@repo/api";
import { useRouter } from "next/navigation";

// Patu Event 전용 설정
const PATU_CONFIG = {
  LOCATION_SLUG: "patu-event",
  BRAND_COLOR: "#FF6B9D",
  SECONDARY_COLOR: "#4ECDC4",
  COMPANY_NAME: "Patu Event",
};

const couponService = new EnhancedCouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function PatuEventPage() {
  const router = useRouter();
  const [location, setLocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    try {
      const locationData = await couponService.getLocationBySlug(
        PATU_CONFIG.LOCATION_SLUG
      );
      setLocation(locationData);
    } catch (error) {
      console.error("장소 로드 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = () => {
    router.push("/patu-event/photo");
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: PATU_CONFIG.BRAND_COLOR }}
      >
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p>Patu Event 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Patu Event를 찾을 수 없습니다
          </h1>
          <p className="text-gray-600">관리자에게 문의하세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: `linear-gradient(135deg, ${PATU_CONFIG.BRAND_COLOR} 0%, ${PATU_CONFIG.SECONDARY_COLOR} 100%)`,
      }}
    >
      {/* Patu 브랜딩 */}
      <div className="relative z-10 pt-20 px-6 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to Patu Event!
        </h1>
        <p className="text-xl text-white/90 mb-8">
          특별한 Patu 이벤트에 참여하고
          <br />
          독점 혜택을 받아보세요!
        </p>
      </div>

      {/* 이벤트 카드 */}
      <div className="relative z-10 px-6 mt-12">
        <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 mx-auto max-w-sm">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Patu Photo Challenge
            </h2>
            <p className="text-white/80">
              포토존에서 사진을 찍고
              <br />
              Patu 굿즈를 받아가세요!
            </p>
          </div>

          <button
            onClick={handleStart}
            className="w-full bg-white text-gray-800 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ color: PATU_CONFIG.BRAND_COLOR }}
          >
            🎯 Patu Event 시작하기
          </button>
        </div>
      </div>

      {/* 혜택 미리보기 */}
      <div className="relative z-10 px-6 mt-8 text-center">
        <h3 className="text-lg font-semibold text-white mb-4">
          🎁 Patu 독점 혜택
        </h3>
        <div className="flex justify-center space-x-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl mb-1">🛍️</div>
            <div className="text-xs text-white font-medium">굿즈 할인</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl mb-1">🍔</div>
            <div className="text-xs text-white font-medium">푸드 할인</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl mb-1">🎪</div>
            <div className="text-xs text-white font-medium">특별 이벤트</div>
          </div>
        </div>
      </div>
    </div>
  );
}
