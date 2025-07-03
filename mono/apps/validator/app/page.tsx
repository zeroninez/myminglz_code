"use client";

import React, { useState } from "react";
import { CouponService } from "@repo/api";

const couponService = new CouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function ValidatorPage() {
  const [validationCode, setValidationCode] = useState("");
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleValidateCode();
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-center w-full h-fit p-6 text-gray-800">
        ✅ 쿠폰 확인기
      </h1>

      <div className="space-y-4 w-full h-full flex flex-col items-center justify-center p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            쿠폰 코드 입력
          </label>
          <input
            type="text"
            value={validationCode}
            onChange={(e) => setValidationCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="예: ABC12345"
            className="w-full p-3 border bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-center text-lg"
            maxLength={8}
            autoFocus
          />
        </div>

        <button
          onClick={handleValidateCode}
          disabled={isLoading || !validationCode.trim()}
          className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? "확인 중..." : "🔍 코드 확인하기"}
        </button>

        <div className="text-center text-sm text-gray-600">
          <p>방문 증명을 위해 발급받은</p>
          <p>쿠폰 코드를 입력해주세요</p>
        </div>
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div
              className={`text-center ${
                modalContent.type === "success"
                  ? "text-green-600"
                  : "text-red-600"
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
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
