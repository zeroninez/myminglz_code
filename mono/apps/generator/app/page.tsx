"use client";

import React, { useState } from "react";
import { CouponService } from "@repo/api";

const couponService = new CouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function GeneratorPage() {
  const [generatedCode, setGeneratedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ type: "", message: "" });

  const handleGenerateCode = async () => {
    setIsLoading(true);
    try {
      const result = await couponService.generateCode();
      if (result.success && result.code) {
        setGeneratedCode(result.code);
      } else {
        setModalContent({
          type: "error",
          message: result.error || "코드 생성에 실패했습니다.",
        });
        setShowModal(true);
      }
    } catch (error) {
      setModalContent({
        type: "error",
        message: "코드 생성 중 오류가 발생했습니다.",
      });
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCode = async () => {
    if (!generatedCode) return;

    setIsLoading(true);
    try {
      const saveResult = await couponService.saveCode(generatedCode);

      if (saveResult.success) {
        // 클립보드에 복사
        const copied = await couponService.copyToClipboard(generatedCode);

        setModalContent({
          type: "success",
          message: `${saveResult.message}\n\n${
            copied ? "📋 클립보드에 복사되었습니다!" : ""
          }`,
        });
        setGeneratedCode("");
      } else {
        setModalContent({
          type: "error",
          message: saveResult.error || "코드 저장에 실패했습니다.",
        });
      }
      setShowModal(true);
    } catch (error) {
      setModalContent({
        type: "error",
        message: "코드 저장 중 오류가 발생했습니다.",
      });
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-blue-600 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
            🎫 쿠폰 발급기
          </h1>

          <div className="space-y-4">
            <button
              onClick={handleGenerateCode}
              disabled={isLoading}
              className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? "코드 생성 중..." : "🎲 랜덤 코드 생성"}
            </button>

            {generatedCode && (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-2">생성된 코드:</p>
                <p className="text-2xl font-mono font-bold text-blue-600 mb-4">
                  {generatedCode}
                </p>
                <button
                  onClick={handleSaveCode}
                  disabled={isLoading}
                  className="bg-green-500 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "저장 중..." : "📋 코드 복사 & 저장"}
                </button>
              </div>
            )}
          </div>
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
    </div>
  );
}
