"use client";

import React, { useState } from "react";
import { CouponService } from "@repo/api";
import { QRCodeScanner } from "@/components";
import { BottomSheet } from "@repo/ui";

const couponService = new CouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function ValidatorPage() {
  const [validationCode, setValidationCode] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // 업로드된 이미지 URL
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ type: "", message: "" });

  const handleValidateCode = async () => {
    if (!validationCode.trim()) return;

    setIsLoading(true);
    try {
      const result = await couponService.validateCode(validationCode);

      if (result.success) {
        if (result.isValid) {
          if (result.isUsed) {
            setModalContent({
              type: "error",
              message: result.message || "이미 사용된 코드입니다.",
            });
          } else {
            setModalContent({
              type: "success",
              message: result.message || "유효한 코드입니다!",
            });
            setValidationCode("");
            setUploadedImage(null); // 성공시 이미지도 초기화
          }
        } else {
          setModalContent({
            type: "error",
            message: result.message || "유효하지 않은 코드입니다.",
          });
        }
      } else {
        setModalContent({
          type: "error",
          message: result.error || "코드 확인 중 오류가 발생했습니다.",
        });
      }
      setShowModal(true);
    } catch (error) {
      setModalContent({
        type: "error",
        message: "코드 확인 중 오류가 발생했습니다.",
      });
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSuccess = (result: string, imageUrl: string) => {
    setValidationCode(result.toUpperCase());
    setUploadedImage(imageUrl);
  };

  const handleScanError = (error: string) => {
    console.error("스캔 오류:", error);
    // 에러 시 간단한 알림만 표시
    setModalContent({
      type: "error",
      message: "QR 코드를 인식할 수 없습니다.\n다른 이미지를 시도해보세요.",
    });
    setShowModal(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleValidateCode();
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setValidationCode("");
  };

  const closeModal = () => {
    setShowModal(false);
    setModalContent({ type: "", message: "" });
  };

  return (
    <>
      <div className="w-full h-fit flex flex-row items-center justify-center gap-4 p-6">
        <QRCodeScanner
          onScanResult={handleScanSuccess}
          onScanError={handleScanError}
          text="📷 QR 스캔"
          className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-lg font-semibold transition-colors"
        />
        <div className="w-full h-12 rounded-xl overflow-hidden">
          <input
            type="text"
            value={validationCode}
            onChange={(e) => setValidationCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="예: ABC12345"
            className="w-full h-full p-3 bg-white font-mono text-center text-lg "
            maxLength={8}
            autoFocus
          />
        </div>
      </div>

      {/* 업로드된 이미지 미리보기 */}
      {uploadedImage && (
        <div className="w-full px-6 mb-4">
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                업로드된 QR 이미지
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
                alt="업로드된 QR 코드"
                className="max-w-full max-h-48 object-contain rounded border shadow-sm"
              />
            </div>
            {validationCode && (
              <div className="mt-3 text-center">
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-mono">
                  인식된 코드: {validationCode}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4 w-full h-full flex flex-col items-center justify-center p-6">
        <button
          onClick={handleValidateCode}
          disabled={isLoading || !validationCode.trim()}
          className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "확인 중..." : "🔍 코드 확인하기"}
        </button>

        <div className="text-center text-sm text-gray-600">
          <p>방문 증명을 위해 발급받은</p>
          <p>쿠폰 코드를 입력하거나 QR 이미지를 업로드해주세요</p>
        </div>
      </div>

      {/* 모달 */}
      <BottomSheet isOpen={showModal} setIsOpen={closeModal}>
        <div
          className={`text-center w-full h-fit min-h-[50vh] flex flex-col items-center justify-center ${
            modalContent.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          <div className="text-4xl mb-4">
            {modalContent.type === "success" ? "✅" : "❌"}
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {modalContent.type === "success" ? "성공!" : "실패!"}
          </h3>
          <p className="whitespace-pre-line mb-4">{modalContent.message}</p>
          <button
            onClick={() => setShowModal(false)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            확인
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
