// apps/validator/app/patu-booth/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { EnhancedCouponService } from "@repo/api";
import { QRCodeScanner } from "@/components";

const couponService = new EnhancedCouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function PatuBoothPage() {
  const [store, setStore] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    loadStore();
  }, []);

  const loadStore = async () => {
    const storeData = await couponService.getStoreBySlug("patu-booth");
    setStore(storeData);
  };

  const handleScanSuccess = (scannedCode: string) => {
    setCouponCode(scannedCode.toUpperCase());
  };

  const handleValidate = async () => {
    if (!couponCode.trim()) {
      alert("쿠폰 코드를 입력하거나 QR 코드를 스캔해주세요.");
      return;
    }

    setIsValidating(true);
    try {
      const validationResult = await couponService.validateCodeAtStore(
        couponCode.trim(),
        "patu-booth"
      );

      setResult(validationResult);
      setShowResult(true);

      if (
        validationResult.success &&
        validationResult.isValid &&
        !validationResult.isUsed
      ) {
        setCouponCode("");
      }
    } catch (error) {
      console.error("검증 오류:", error);
      setResult({ success: false, error: "검증 중 오류가 발생했습니다." });
      setShowResult(true);
    } finally {
      setIsValidating(false);
    }
  };

  const closeResult = () => {
    setShowResult(false);
    setResult(null);
  };

  if (!store) {
    return (
      <div className="min-h-screen bg-pink-500 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p>Patu Booth 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 to-purple-500">
      {/* 헤더 */}
      <div className="bg-white/20 backdrop-blur-sm">
        <div className="max-w-md mx-auto px-6 py-6">
          <div className="text-center">
            <div className="text-4xl mb-2">🏪</div>
            <h1 className="text-2xl font-bold text-white">Patu Booth</h1>
            <p className="text-white/80">쿠폰 검증 시스템</p>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">쿠폰 검증</h2>
            <p className="text-gray-600">고객의 Patu 쿠폰을 검증해주세요</p>
          </div>

          {/* QR 스캔 */}
          <div className="space-y-4 mb-6">
            <QRCodeScanner
              onScanResult={handleScanSuccess}
              onScanError={(error) => alert(error)}
              text="📷 QR 코드 스캔"
              className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors"
            />

            {/* 구분선 */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-sm text-gray-500">또는</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* 수동 입력 */}
            <div>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="쿠폰 코드 입력 (예: ABC12345)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-center text-lg font-mono"
                maxLength={8}
              />
            </div>

            {/* 검증 버튼 */}
            <button
              onClick={handleValidate}
              disabled={isValidating || !couponCode.trim()}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-4 px-6 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50"
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

          {/* 안내 */}
          <div className="bg-purple-50 rounded-xl p-4">
            <h3 className="font-medium text-purple-900 mb-2">💡 검증 안내</h3>
            <div className="space-y-1 text-sm text-purple-700">
              <p>• Patu Event에서 발급된 쿠폰만 사용 가능</p>
              <p>• 한 번 사용된 쿠폰은 재사용 불가</p>
              <p>• 유효한 쿠폰 확인 시 혜택 제공</p>
            </div>
          </div>
        </div>
      </div>

      {/* 결과 모달 */}
      {showResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {result?.success && result?.isValid && !result?.isUsed
                  ? "✅"
                  : result?.success && result?.isValid && result?.isUsed
                    ? "⚠️"
                    : "❌"}
              </div>

              <h3 className="text-xl font-bold mb-4">
                {result?.success && result?.isValid && !result?.isUsed
                  ? "검증 성공!"
                  : result?.success && result?.isValid && result?.isUsed
                    ? "이미 사용됨"
                    : "검증 실패"}
              </h3>

              <p className="text-gray-600 mb-6">
                {result?.message || "알 수 없는 오류가 발생했습니다."}
              </p>

              {result?.success && result?.isValid && !result?.isUsed && (
                <div className="bg-green-50 rounded-xl p-4 mb-6">
                  <p className="text-green-800 font-medium">
                    🎉 Patu 혜택을 제공해주세요!
                  </p>
                </div>
              )}

              <button
                onClick={closeResult}
                className="w-full bg-pink-500 text-white py-3 rounded-xl font-medium"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
