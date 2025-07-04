"use client";

import React, { useState } from "react";
import { CouponService } from "@repo/api";
import { GenerateQrCode } from "@/components";
import { BottomSheet } from "@repo/ui";
import { useTimestamp } from "@/hooks";

const couponService = new CouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function GeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ type: "", message: "" });
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>(""); // 모달용 코드

  const qrRef = React.useRef<HTMLCanvasElement>(null);

  const { generateFilename } = useTimestamp();

  // 쿠폰 받기 - 모든 프로세스를 한 번에 처리
  const handleGetCoupon = async () => {
    setIsLoading(true);
    setShowModal(true); // 바로 모달 열기

    try {
      // 1. 코드 생성
      const result = await couponService.generateCode();
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

      // 2. DB에 코드 저장
      const saveResult = await couponService.saveCode(newCode);
      if (!saveResult.success) {
        setModalContent({
          type: "error",
          message: saveResult.error || "코드 저장에 실패했습니다.",
        });
        setIsLoading(false);
        return;
      }

      // 3. QR 코드 이미지 생성 (잠시 기다린 후 QR 코드가 렌더링된 후)
      setTimeout(async () => {
        const imageUrl = await createBrandedImage(qrRef, newCode, {
          brandName: "내 쇼핑몰",
          brandColor: "#8b5cf6",
          logoText: "🛍️",
        });

        // 4. 성공 상태로 모달 업데이트
        setSavedImageUrl(imageUrl);
        setModalContent({
          type: "success",
          message: `${saveResult.message}\n\n🎉 쿠폰이 성공적으로 발급되었습니다!`,
        });
        setIsLoading(false);
      }, 500); // QR 코드 렌더링 대기
    } catch (error) {
      setModalContent({
        type: "error",
        message: "쿠폰 발급 중 오류가 발생했습니다.",
      });
      setIsLoading(false);
    }
  };

  // 이미지 생성하고 데이터 URL 반환
  const createBrandedImage = async (
    ref: React.RefObject<HTMLCanvasElement | null>,
    code: string,
    options?: {
      brandName?: string;
      brandColor?: string;
      logoText?: string;
    }
  ): Promise<string> => {
    return new Promise((resolve) => {
      const originalCanvas = ref.current;
      if (!originalCanvas) {
        resolve("");
        return;
      }

      const {
        brandName = "쿠폰 시스템",
        brandColor = "#8b5cf6",
        logoText = "🎫",
      } = options || {};

      const enhancedCanvas = document.createElement("canvas");
      const ctx = enhancedCanvas.getContext("2d");
      if (!ctx) {
        resolve("");
        return;
      }

      // 캔버스 크기
      const padding = 80;
      const headerHeight = 120;
      const footerHeight = 80;
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
      ctx.font = "40px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(logoText, enhancedCanvas.width / 2, 45);

      // 브랜드명
      ctx.font = "bold 20px Arial, sans-serif";
      ctx.fillText(brandName, enhancedCanvas.width / 2, 75);

      // 서브타이틀
      ctx.font = "14px Arial, sans-serif";
      ctx.fillStyle = "#ffffff99";
      ctx.fillText("디지털 쿠폰", enhancedCanvas.width / 2, 95);

      // QR 코드 컨테이너
      const qrX = (enhancedCanvas.width - qrSize) / 2;
      const qrY = headerHeight + padding / 2;

      // QR 코드 배경 (둥근 모서리)
      const cornerRadius = 15;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, cornerRadius);
      ctx.fill();

      // QR 코드 그림자
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      ctx.fill();

      // 그림자 리셋
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // QR 코드 그리기
      ctx.drawImage(originalCanvas, qrX, qrY, qrSize, qrSize);

      // 코드 정보 섹션
      const infoY = qrY + qrSize + 50;

      // 코드 라벨
      ctx.fillStyle = "#6b7280";
      ctx.font = "14px Arial, sans-serif";
      ctx.fillText("쿠폰 코드", enhancedCanvas.width / 2, infoY);

      // 코드 값
      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 18px monospace";
      ctx.fillText(code, enhancedCanvas.width / 2, infoY + 25);

      // 추가 정보
      const currentDateTime = new Date().toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      ctx.fillStyle = "#9ca3af";
      ctx.font = "12px Arial, sans-serif";
      ctx.fillText(
        `발급일시: ${currentDateTime}`,
        enhancedCanvas.width / 2,
        infoY + 50
      );

      // 푸터 장식
      ctx.strokeStyle = brandColor + "30";
      ctx.lineWidth = 2;
      const lineY = enhancedCanvas.height - 30;
      ctx.beginPath();
      ctx.moveTo(enhancedCanvas.width * 0.2, lineY);
      ctx.lineTo(enhancedCanvas.width * 0.8, lineY);
      ctx.stroke();

      // 데이터 URL 반환
      const dataURL = enhancedCanvas.toDataURL("image/png", 1.0);
      resolve(dataURL);
    });
  };

  // 이미지 다운로드 함수
  const downloadImage = () => {
    if (!savedImageUrl) return;

    const link = document.createElement("a");
    link.download = generateFilename(generatedCode);
    link.href = savedImageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setSavedImageUrl(null);
    setGeneratedCode("");
    setModalContent({ type: "", message: "" });
  };

  return (
    <>
      <div className="space-y-4 p-6 w-full h-full flex flex-col items-center justify-center">
        {/* 메인 쿠폰 받기 버튼 */}
        <button
          onClick={handleGetCoupon}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none shadow-lg"
        >
          🎁 쿠폰 받기
        </button>

        <p className="text-sm text-gray-500 text-center">
          버튼을 클릭하면 즉시 쿠폰이 발급됩니다
        </p>
      </div>

      {/* 숨겨진 QR 코드 컴포넌트 (이미지 생성용) */}
      {generatedCode && (
        <div className="hidden">
          <GenerateQrCode ref={qrRef} value={generatedCode} />
        </div>
      )}

      {/* 모달 */}
      <BottomSheet isOpen={showModal} setIsOpen={closeModal}>
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            {/* 로딩 상태 */}
            {isLoading && (
              <div className="py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">쿠폰 발급 중...</h3>
                <p className="text-gray-600">잠시만 기다려주세요</p>
              </div>
            )}

            {/* 성공 상태 */}
            {!isLoading && modalContent.type === "success" && (
              <div className="text-green-600">
                {savedImageUrl ? (
                  <div className="mb-4">
                    <img
                      src={savedImageUrl}
                      alt="생성된 쿠폰 QR 코드"
                      className="w-full max-w-xs mx-auto rounded-lg border shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="text-4xl mb-4">🎉</div>
                )}

                <h3 className="text-lg font-semibold mb-2">
                  쿠폰이 발급되었습니다!
                </h3>

                {generatedCode && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-gray-600">쿠폰 코드</p>
                    <p className="text-xl font-mono font-bold text-purple-600">
                      {generatedCode}
                    </p>
                  </div>
                )}

                <p className="text-gray-600 mb-4">
                  위 이미지를 저장하여 매장에서 사용하세요
                </p>

                {/* 버튼들 */}
                <div className="flex flex-col gap-3">
                  {savedImageUrl && (
                    <button
                      onClick={downloadImage}
                      className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                    >
                      📱 이미지 저장하기
                    </button>
                  )}

                  <button
                    onClick={closeModal}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    확인
                  </button>
                </div>
              </div>
            )}

            {/* 실패 상태 */}
            {!isLoading && modalContent.type === "error" && (
              <div className="text-red-600">
                <div className="text-4xl mb-4">❌</div>
                <h3 className="text-lg font-semibold mb-2">발급 실패</h3>
                <p className="text-gray-600 mb-4">{modalContent.message}</p>

                <button
                  onClick={closeModal}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
