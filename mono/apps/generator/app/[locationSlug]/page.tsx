// apps/generator/app/[locationSlug]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { EnhancedCouponService } from "@repo/api";
import { IntroScreen } from "@/components";
import { BottomSheet } from "@repo/ui";
import { useParams, useRouter } from "next/navigation";

const couponService = new EnhancedCouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function LocationGeneratorPage() {
  const params = useParams();
  const router = useRouter();
  const locationSlug = params.locationSlug as string;

  const [location, setLocation] = useState<any>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ type: "", message: "" });

  // 장소 정보 로드
  useEffect(() => {
    const loadLocation = async () => {
      setIsPageLoading(true);
      try {
        const locationData =
          await couponService.getLocationBySlug(locationSlug);
        if (locationData) {
          setLocation(locationData);
        } else {
          setModalContent({
            type: "error",
            message: "존재하지 않는 장소입니다.",
          });
          setShowModal(true);
        }
      } catch (error) {
        console.error("장소 로드 오류:", error);
        setModalContent({
          type: "error",
          message: "장소 정보를 불러오는데 실패했습니다.",
        });
        setShowModal(true);
      } finally {
        setIsPageLoading(false);
      }
    };

    if (locationSlug) {
      loadLocation();
    }
  }, [locationSlug]);

  // Intro에서 다음 단계로 이동
  const handleNext = () => {
    router.push(`/${locationSlug}/photo`);
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setModalContent({ type: "", message: "" });
  };

  // 로딩 중일 때
  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#479BFF' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white font-medium">
            장소 정보를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  // 장소가 없을 때
  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-700 mb-2">
            존재하지 않는 장소
          </h1>
          <p className="text-red-600">올바른 장소 링크를 확인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#DEE7EC' }}>
      {/* 배경 그리드 */}
      <div 
        className="fixed inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(182, 215, 255, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(182, 215, 255, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />

      {/* 메인 컨텐츠 */}
      <div className="relative z-10">
        <IntroScreen onNext={handleNext} />
      </div>

      {/* 에러 모달 */}
      <BottomSheet isOpen={showModal} setIsOpen={closeModal}>
        <div className="p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              오류
            </h3>
            <p className="text-gray-600 mb-6 whitespace-pre-line">
              {modalContent.message}
            </p>
            <button
              onClick={closeModal}
              className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

