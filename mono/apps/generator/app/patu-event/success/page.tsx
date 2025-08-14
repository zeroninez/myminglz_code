// apps/generator/app/patu-event/success/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { EnhancedCouponService } from "@repo/api";
import { useTimestamp } from "@/hooks";
import { GenerateQrCode } from "@/components";
import html2canvas from "html2canvas";

const couponService = new EnhancedCouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function PatuSuccessPage() {
  const [location, setLocation] = useState<any>(null);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const qrRef = useRef<HTMLCanvasElement>(null);
  const { generateFilename } = useTimestamp();

  useEffect(() => {
    loadLocationAndGenerateCoupon();
  }, []);

  const loadLocationAndGenerateCoupon = async () => {
    const locationData = await couponService.getLocationBySlug("patu-event");
    setLocation(locationData);

    if (locationData) {
      await handleGetCoupon(locationData);
    }
  };

  const handleGetCoupon = async (location: any) => {
    setIsLoading(true);

    try {
      const result = await couponService.generateCodeForLocation("patu-event");
      if (result.success && result.code) {
        setGeneratedCode(result.code);

        const saveResult = await couponService.saveCodeForLocation(
          result.code,
          "patu-event"
        );
        if (saveResult.success) {
          // QR 코드 이미지 생성
          setTimeout(async () => {
            const imageUrl = await createQRImage(result.code ?? "");
            setSavedImageUrl(imageUrl);
            setIsLoading(false);
          }, 500);
        }
      }
    } catch (error) {
      console.error("쿠폰 발급 오류:", error);
      setIsLoading(false);
    }
  };

  const createQRImage = async (code: string): Promise<string> => {
    if (!qrRef.current) return "";

    try {
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("QR 이미지 생성 오류:", error);
      return "";
    }
  };

  const handleDownload = () => {
    if (savedImageUrl) {
      const link = document.createElement("a");
      link.download = generateFilename(`patu-${generatedCode}`);
      link.href = savedImageUrl;
      link.click();
    }
  };

  if (!location) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FF6B9D" }}>
      <div className="pt-20 text-center text-white">
        <h1 className="text-3xl font-bold mb-4">🎉 Patu 쿠폰 발급 완료!</h1>
        <p className="text-lg mb-8">
          아래 쿠폰을 저장하고
          <br />
          Patu Booth에서 사용하세요!
        </p>

        {isLoading ? (
          <div>쿠폰 생성 중...</div>
        ) : savedImageUrl ? (
          <div className="bg-white rounded-xl p-6 mx-6 max-w-sm mx-auto">
            <img src={savedImageUrl} alt="Patu 쿠폰" className="w-full mb-4" />
            <div className="text-2xl font-bold text-gray-800 mb-4">
              {generatedCode}
            </div>
            <button
              onClick={handleDownload}
              className="bg-pink-500 text-white px-6 py-3 rounded-lg font-medium"
            >
              📱 이미지 저장
            </button>
          </div>
        ) : null}

        <div className="mt-8">
          <button
            onClick={() => (window.location.href = "/patu-event/booth")}
            className="bg-white text-pink-500 px-8 py-3 rounded-lg font-bold"
          >
            🏪 Patu Booth 가기
          </button>
        </div>
      </div>

      {/* 숨겨진 QR 코드 */}
      <div className="absolute -top-[9999px]">
        <GenerateQrCode
          ref={qrRef}
          value={generatedCode || "PLACEHOLDER"}
          size={200}
        />
      </div>
    </div>
  );
}
