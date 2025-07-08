// apps/validator/app/[storeSlug]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { EnhancedCouponService } from "@repo/api";
import { QRCodeScanner } from "@/components";
import { BottomSheet } from "@repo/ui";
import { useParams } from "next/navigation";

const couponService = new EnhancedCouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function StoreValidatorPage() {
  const params = useParams();
  const storeSlug = params.storeSlug as string;

  const [store, setStore] = useState<any>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    type: "",
    message: "",
    location: null as any,
    store: null as any,
  });

  const [couponCode, setCouponCode] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [stats, setStats] = useState({ validated: 0 });

  // 가게 정보 로드
  useEffect(() => {
    const loadStore = async () => {
      setIsPageLoading(true);
      try {
        const storeData = await couponService.getStoreBySlug(storeSlug);
        if (storeData) {
          setStore(storeData);

          // 가게별 통계 로드
          const statsData = await couponService.getStoreStats(storeSlug);
          if (statsData.success) {
            setStats({ validated: statsData.validated });
          }
        } else {
          setModalContent({
            type: "error",
            message: "존재하지 않는 가게입니다.",
            location: null,
            store: null,
          });
          setShowModal(true);
        }
      } catch (error) {
        console.error("가게 로드 오류:", error);
        setModalContent({
          type: "error",
          message: "가게 정보를 불러오는데 실패했습니다.",
          location: null,
          store: null,
        });
        setShowModal(true);
      } finally {
        setIsPageLoading(false);
      }
    };

    if (storeSlug) {
      loadStore();
    }
  }, [storeSlug]);

  // QR 코드 스캔 성공 처리
  const handleScanSuccess = (result: string, imageUrl: string) => {
    setCouponCode(result.toUpperCase());
    setUploadedImage(imageUrl);
  };

  // QR 코드 스캔 에러 처리
  const handleScanError = (error: string) => {
    console.error("QR 스캔 오류:", error);
    setModalContent({
      type: "error",
      message:
        "QR 코드를 인식할 수 없습니다.\n코드를 직접 입력하거나 다른 이미지를 시도해보세요.",
      location: null,
      store: null,
    });
    setShowModal(true);
  };

  // 쿠폰 검증
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setModalContent({
        type: "error",
        message: "쿠폰 코드를 입력하거나 QR 코드를 스캔해주세요.",
        location: null,
        store: null,
      });
      setShowModal(true);
      return;
    }

    if (!store) return;

    setIsValidating(true);

    try {
      const result = await couponService.validateCodeAtStore(
        couponCode.trim(),
        storeSlug
      );

      if (result.success) {
        if (result.isValid) {
          if (result.isUsed) {
            setModalContent({
              type: "warning",
              message: result.message || "이미 사용된 쿠폰입니다.",
              location: result.location || null,
              store: result.store || null,
            });
          } else {
            setModalContent({
              type: "success",
              message: result.message || "쿠폰 검증이 완료되었습니다!",
              location: result.location || null,
              store: result.store || null,
            });

            // 통계 업데이트
            setStats((prev) => ({ validated: prev.validated + 1 }));

            // 입력 필드 및 이미지 클리어
            setCouponCode("");
            setUploadedImage(null);
          }
        } else {
          setModalContent({
            type: "error",
            message: result.message || "이 가게에서 사용할 수 없는 쿠폰입니다.",
            location: null,
            store: null,
          });
        }
      } else {
        setModalContent({
          type: "error",
          message: result.error || "쿠폰 검증 중 오류가 발생했습니다.",
          location: null,
          store: null,
        });
      }

      setShowModal(true);
    } catch (error) {
      console.error("쿠폰 검증 오류:", error);
      setModalContent({
        type: "error",
        message: "쿠폰 검증 중 오류가 발생했습니다.",
        location: null,
        store: null,
      });
      setShowModal(true);
    } finally {
      setIsValidating(false);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isValidating) {
      handleValidateCoupon();
    }
  };

  // 업로드된 이미지 제거
  const clearImage = () => {
    setUploadedImage(null);
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setModalContent({
      type: "",
      message: "",
      location: null,
      store: null,
    });
  };

  // 로딩 중일 때
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">
            가게 정보를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  // 가게가 없을 때
  if (!store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-700 mb-2">
            존재하지 않는 가게
          </h1>
          <p className="text-red-600">올바른 가게 링크를 확인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🏪</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
              <p className="text-sm text-gray-600">{store.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="max-w-md mx-auto px-6 py-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">검증 완료한 쿠폰</span>
            <span className="text-2xl font-bold text-blue-600">
              {stats.validated}
            </span>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-md mx-auto px-6 py-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">쿠폰 검증</h2>
            <p className="text-gray-600">
              QR 코드를 스캔하거나
              <br />
              쿠폰 코드를 직접 입력해주세요
            </p>
          </div>

          {/* QR 스캔과 수동 입력 영역 */}
          <div className="space-y-4 mb-6">
            {/* QR 코드 스캐너 */}
            <div className="w-full">
              <QRCodeScanner
                onScanResult={handleScanSuccess}
                onScanError={handleScanError}
                text="📷 QR 코드 스캔"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              />
            </div>

            {/* 구분선 */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-sm text-gray-500">또는</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* 수동 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                쿠폰 코드 직접 입력
              </label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="예: ABC12345"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
                disabled={isValidating}
                maxLength={8}
              />
            </div>

            {/* 업로드된 QR 이미지 미리보기 */}
            {uploadedImage && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    스캔된 QR 이미지
                  </h3>
                  <button
                    onClick={clearImage}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
                    ✕ 제거
                  </button>
                </div>
                <div className="flex justify-center">
                  <img
                    src={uploadedImage}
                    alt="스캔된 QR 코드"
                    className="max-w-full max-h-32 object-contain rounded border shadow-sm"
                  />
                </div>
                {couponCode && (
                  <div className="mt-3 text-center">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-mono">
                      인식된 코드: {couponCode}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 검증 버튼 */}
            <button
              onClick={handleValidateCoupon}
              disabled={isValidating || !couponCode.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              {isValidating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>검증 중...</span>
                </div>
              ) : (
                <span className="text-lg">✅ 쿠폰 검증하기</span>
              )}
            </button>
          </div>

          {/* 사용 안내 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center">
              <span className="mr-2">💡</span>
              검증 안내
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• QR 코드 스캔이나 코드 직접 입력 둘 다 가능합니다</p>
              <p>• 이 가게와 연결된 장소의 쿠폰만 검증 가능합니다</p>
              <p>• 한 번 사용된 쿠폰은 재사용할 수 없습니다</p>
            </div>
          </div>
        </div>
      </div>

      {/* 검증 결과 모달 */}
      <BottomSheet isOpen={showModal} setIsOpen={closeModal}>
        <div className="p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">
              {modalContent.type === "success"
                ? "✅"
                : modalContent.type === "warning"
                  ? "⚠️"
                  : "❌"}
            </div>

            <h3 className="text-xl font-bold mb-4 text-gray-900">
              {modalContent.type === "success"
                ? "검증 완료!"
                : modalContent.type === "warning"
                  ? "이미 사용됨"
                  : "검증 실패"}
            </h3>

            <p className="text-gray-600 mb-6 whitespace-pre-line">
              {modalContent.message}
            </p>

            {/* 장소 정보 표시 (성공 시) */}
            {modalContent.type === "success" && modalContent.location && (
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-lg">📍</span>
                  <span className="font-medium text-green-800">
                    {modalContent.location.name}
                  </span>
                </div>
                <p className="text-sm text-green-600">
                  방문 인증이 완료되었습니다
                </p>
              </div>
            )}

            {/* 이미 사용된 경우 경고 */}
            {modalContent.type === "warning" && (
              <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-700">
                  이 쿠폰은 이미 다른 곳에서 사용되었습니다.
                  <br />
                  고객에게 안내해주세요.
                </p>
              </div>
            )}

            <button
              onClick={closeModal}
              className={`w-full py-3 px-6 rounded-lg transition-colors ${
                modalContent.type === "success"
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : modalContent.type === "warning"
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
            >
              확인
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
