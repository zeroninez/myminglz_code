// apps/generator/app/[locationSlug]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { EnhancedCouponService } from "@repo/api";
import { GenerateQrCode } from "@/components";
import { BottomSheet } from "@repo/ui";
import { useTimestamp } from "@/hooks";
import { useParams } from "next/navigation";

const couponService = new EnhancedCouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function LocationGeneratorPage() {
  const params = useParams();
  const locationSlug = params.locationSlug as string;

  const [location, setLocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ type: "", message: "" });
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>("");

  const qrRef = React.useRef<HTMLCanvasElement>(null);
  const { generateFilename } = useTimestamp();

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

  // 쿠폰 발급 프로세스
  const handleGetCoupon = async () => {
    if (!location) return;

    setIsLoading(true);
    setShowModal(true);

    try {
      // 1. 장소별 코드 생성
      const result = await couponService.generateCodeForLocation(locationSlug);
      if (!result.success || !result.code) {
        setModalContent({
          type: "error",
          message: result.error || "코드 생성에 실패했습니다.",
        });
        setIsLoading(false);
        return;
      }

      const newCode = result.code;
      setGeneratedCode(newCode);

      // 2. 장소별 DB에 코드 저장
      const saveResult = await couponService.saveCodeForLocation(
        newCode,
        locationSlug
      );
      if (!saveResult.success) {
        setModalContent({
          type: "error",
          message: saveResult.error || "코드 저장에 실패했습니다.",
        });
        setIsLoading(false);
        return;
      }

      // 3. QR 코드 이미지 생성
      setTimeout(async () => {
        const imageUrl = await createBrandedImage(qrRef, newCode, {
          brandName: location.name,
          brandColor: "#10b981",
          logoText: "📍",
          locationDesc: location.description,
        });

        setSavedImageUrl(imageUrl);
        setModalContent({
          type: "success",
          message: saveResult.message || "쿠폰이 성공적으로 발급되었습니다!",
        });
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error("쿠폰 발급 오류:", error);
      setModalContent({
        type: "error",
        message: "쿠폰 발급 중 오류가 발생했습니다.",
      });
      setIsLoading(false);
    }
  };

  // 브랜드 이미지 생성
  const createBrandedImage = async (
    ref: React.RefObject<HTMLCanvasElement | null>,
    code: string,
    options: {
      brandName: string;
      brandColor: string;
      logoText: string;
      locationDesc?: string;
    }
  ): Promise<string> => {
    return new Promise((resolve) => {
      const originalCanvas = ref.current;
      if (!originalCanvas) {
        resolve("");
        return;
      }

      const { brandName, brandColor, logoText, locationDesc } = options;

      const enhancedCanvas = document.createElement("canvas");
      const ctx = enhancedCanvas.getContext("2d");
      if (!ctx) {
        resolve("");
        return;
      }

      const padding = 80;
      const headerHeight = 140;
      const footerHeight = 100;
      const qrSize = Math.max(originalCanvas.width, originalCanvas.height);

      enhancedCanvas.width = qrSize + padding * 2;
      enhancedCanvas.height =
        qrSize + headerHeight + footerHeight + padding * 2;

      // 배경 그라데이션
      const bgGradient = ctx.createLinearGradient(
        0,
        0,
        0,
        enhancedCanvas.height
      );
      bgGradient.addColorStop(0, "#fefefe");
      bgGradient.addColorStop(0.5, "#f8fafc");
      bgGradient.addColorStop(1, "#f1f5f9");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, enhancedCanvas.width, enhancedCanvas.height);

      // 헤더 배경
      const headerGradient = ctx.createLinearGradient(0, 0, 0, headerHeight);
      headerGradient.addColorStop(0, brandColor);
      headerGradient.addColorStop(1, brandColor + "dd");
      ctx.fillStyle = headerGradient;
      ctx.fillRect(0, 0, enhancedCanvas.width, headerHeight);

      // 로고/아이콘
      ctx.font = "48px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(logoText, enhancedCanvas.width / 2, 50);

      // 장소명
      ctx.font = "bold 24px Arial, sans-serif";
      ctx.fillText(brandName, enhancedCanvas.width / 2, 85);

      // 장소 설명
      if (locationDesc) {
        ctx.font = "14px Arial, sans-serif";
        ctx.fillStyle = "#ffffff99";
        ctx.fillText(locationDesc, enhancedCanvas.width / 2, 105);
      }

      // 서브타이틀
      ctx.font = "16px Arial, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("방문 인증 쿠폰", enhancedCanvas.width / 2, 125);

      // QR 코드 영역에 그림자 효과
      const qrX = padding;
      const qrY = headerHeight + padding;

      // 그림자
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);

      // 그림자 리셋
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // QR 코드 그리기
      ctx.drawImage(originalCanvas, qrX, qrY, qrSize, qrSize);

      // 하단 정보
      const footerY = headerHeight + qrSize + padding * 2;

      // 코드 표시
      ctx.font = "bold 20px Arial, sans-serif";
      ctx.fillStyle = "#374151";
      ctx.textAlign = "center";
      ctx.fillText(
        `쿠폰 코드: ${code}`,
        enhancedCanvas.width / 2,
        footerY + 30
      );

      // 사용 안내
      ctx.font = "14px Arial, sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.fillText(
        "연결된 가게에서 제시하세요",
        enhancedCanvas.width / 2,
        footerY + 55
      );

      // 타임스탬프
      const now = new Date();
      const timeStr = now.toLocaleString("ko-KR");
      ctx.font = "12px Arial, sans-serif";
      ctx.fillStyle = "#9ca3af";
      ctx.fillText(
        `발급일시: ${timeStr}`,
        enhancedCanvas.width / 2,
        footerY + 75
      );

      resolve(enhancedCanvas.toDataURL("image/png"));
    });
  };

  // 이미지 다운로드
  const downloadImage = async () => {
    if (!savedImageUrl) return;

    try {
      const link = document.createElement("a");
      link.download = generateFilename(
        `${location?.name || "coupon"}-${generatedCode}`
      );
      link.href = savedImageUrl;
      link.click();
    } catch (error) {
      console.error("이미지 다운로드 오류:", error);
    }
  };

  // 코드 복사
  const copyCode = async () => {
    if (!generatedCode) return;

    const copied = await couponService.copyToClipboard(generatedCode);
    if (copied) {
      alert("쿠폰 코드가 복사되었습니다!");
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setModalContent({ type: "", message: "" });
    setSavedImageUrl(null);
    setGeneratedCode("");
  };

  // 로딩 중일 때
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* 히든 QR 코드 (이미지 생성용) */}
      <div className="hidden">
        <GenerateQrCode ref={qrRef} value={generatedCode || "PLACEHOLDER"} />
      </div>

      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📍</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {location.name}
              </h1>
              <p className="text-sm text-gray-600">{location.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-6">🎫</div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            방문 인증 쿠폰
          </h2>

          <p className="text-gray-600 mb-8">
            이 장소를 방문하셨나요?
            <br />
            방문 인증 쿠폰을 발급받아
            <br />
            연결된 가게에서 혜택을 받으세요!
          </p>

          <button
            onClick={handleGetCoupon}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 px-6 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>쿠폰 발급 중...</span>
              </div>
            ) : (
              <span className="text-lg">🎁 쿠폰 받기</span>
            )}
          </button>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              💡 이 쿠폰은 {location.name}과 연결된 가게에서만 사용 가능합니다
            </p>
          </div>
        </div>

        {/* 사용 안내 */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">📋</span>
            사용 방법
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-3">
              <span className="text-emerald-500 font-bold">1.</span>
              <span>위 버튼을 눌러 방문 인증 쿠폰을 발급받으세요</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-emerald-500 font-bold">2.</span>
              <span>연결된 가게를 방문하세요</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-emerald-500 font-bold">3.</span>
              <span>가게에서 쿠폰 코드를 제시하세요</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-emerald-500 font-bold">4.</span>
              <span>검증 완료 후 혜택을 받으세요</span>
            </div>
          </div>
        </div>
      </div>

      {/* 성공/실패 모달 */}
      <BottomSheet isOpen={showModal} setIsOpen={closeModal}>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">쿠폰을 발급하고 있습니다...</p>
              <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4">
                {modalContent.type === "success" ? "🎉" : "❌"}
              </div>

              <h3 className="text-xl font-bold mb-4 text-gray-900">
                {modalContent.type === "success"
                  ? "쿠폰 발급 완료!"
                  : "발급 실패"}
              </h3>

              <p className="text-gray-600 mb-6 whitespace-pre-line">
                {modalContent.message}
              </p>

              {modalContent.type === "success" && savedImageUrl && (
                <div className="space-y-4 mb-6">
                  <img
                    src={savedImageUrl}
                    alt="쿠폰 이미지"
                    className="w-full max-w-xs mx-auto rounded-lg shadow-md"
                  />

                  <div className="flex space-x-3">
                    <button
                      onClick={downloadImage}
                      className="flex-1 bg-emerald-500 text-white py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      📷 이미지 저장
                    </button>
                    <button
                      onClick={copyCode}
                      className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      📋 코드 복사
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={closeModal}
                className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
              >
                확인
              </button>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
