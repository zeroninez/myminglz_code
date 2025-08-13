"use client";

import React, { useState, useEffect, useRef } from "react";
import { EnhancedCouponService } from "@repo/api";
import { BottomSheet } from "@repo/ui";
import { useTimestamp } from "@/hooks";
import { useParams, useRouter } from "next/navigation";
import { GenerateQrCode } from "@/components";
import html2canvas from 'html2canvas';

const couponService = new EnhancedCouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function SuccessPage() {
  const params = useParams();
  const router = useRouter();
  const locationSlug = params.locationSlug as string;

  const [location, setLocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ type: "", message: "" });
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);

  const qrRef = useRef<HTMLCanvasElement>(null);
  const { generateFilename } = useTimestamp();

  // 장소 정보 로드
  useEffect(() => {
    const loadLocation = async () => {
      setIsPageLoading(true);
      try {
        const locationData = await couponService.getLocationBySlug(locationSlug);
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

  // sessionStorage에서 데이터 복원 및 쿠폰 자동 발급
  useEffect(() => {
    const userPhoto = sessionStorage.getItem('userPhoto');
    const storedLocationSlug = sessionStorage.getItem('locationSlug');
    const couponGenerated = sessionStorage.getItem('couponGenerated');
    const savedGeneratedCode = sessionStorage.getItem('generatedCode');
    const savedImageUrl = sessionStorage.getItem('savedImageUrl');
    
    // 이미 쿠폰이 발급된 경우 (새로고침 시)
    if (couponGenerated === 'true' && savedGeneratedCode && savedImageUrl && storedLocationSlug === locationSlug) {
      console.log('기존 쿠폰 정보 복원:', { savedGeneratedCode, savedImageUrl });
      setGeneratedCode(savedGeneratedCode);
      setSavedImageUrl(savedImageUrl);
      setUserPhotoUrl(userPhoto || '');
      setIsLoading(false);
      return;
    }
    
    // 새로운 쿠폰 발급이 필요한 경우
    if (userPhoto && storedLocationSlug === locationSlug) {
      setUserPhotoUrl(userPhoto);
      // 쿠폰 자동 발급
      handleGetCoupon();
      // sessionStorage는 쿠폰 발급 완료 후에 정리
    } else {
      // 데이터가 없으면 photo 페이지로 리다이렉트
      router.push(`/${locationSlug}/photo`);
    }
  }, [locationSlug, location]); // Added location to dependencies

  // 쿠폰 발급 프로세스
  const handleGetCoupon = async () => {
    if (!location) return;

    setIsLoading(true);

    try {
      // 1. 장소별 코드 생성
      const result = await couponService.generateCodeForLocation(locationSlug);
      if (!result.success || !result.code) {
        setModalContent({
          type: "error",
          message: result.error || "코드 생성에 실패했습니다.",
        });
        setShowModal(true);
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
        setShowModal(true);
        setIsLoading(false);
        return;
      }

             // 3. QR 코드 이미지 생성
       setTimeout(async () => {
         console.log('QR 코드 생성 시작 - generatedCode:', newCode);
         console.log('QR Canvas ref:', qrRef.current);
         
         const imageUrl = await createBrandedImage(qrRef, newCode, {
           brandName: location.name,
           brandColor: "#10b981",
           logoText: "📍",
           locationDesc: location.description,
         });

         console.log('QR 코드 생성 완료 - imageUrl:', imageUrl);
         setSavedImageUrl(imageUrl);
         setIsLoading(false);
         
         // 쿠폰 정보를 sessionStorage에 저장 (새로고침 시 복원용)
         sessionStorage.setItem('generatedCode', newCode);
         sessionStorage.setItem('savedImageUrl', imageUrl);
         sessionStorage.setItem('couponGenerated', 'true');
         
         // userPhoto와 locationSlug는 유지 (새로고침 시 복원을 위해)
         // sessionStorage.removeItem('userPhoto'); // 제거
         // sessionStorage.removeItem('locationSlug'); // 제거
       }, 500);
    } catch (error) {
      console.error("쿠폰 발급 오류:", error);
      setModalContent({
        type: "error",
        message: "쿠폰 발급 중 오류가 발생했습니다.",
      });
      setShowModal(true);
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
      console.log('createBrandedImage - QR Canvas:', originalCanvas);
      if (!originalCanvas) {
        console.log('QR Canvas not found');
        resolve("");
        return;
      }

      html2canvas(originalCanvas, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      }).then((canvas) => {
        console.log('html2canvas completed');
        const dataUrl = canvas.toDataURL("image/png");
        resolve(dataUrl);
      }).catch((error) => {
        console.error('html2canvas error:', error);
        resolve("");
      });
    });
  };

  // 이미지 다운로드
  const handleDownload = async (code: string) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1080;
      canvas.height = 1080;

      const bgImage = new Image();
      bgImage.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        bgImage.onload = resolve;
        bgImage.onerror = reject;
        bgImage.src = '/coupon/이미지 갤러리 저장 (2배수).svg';
      });

      ctx.drawImage(bgImage, 0, 0, 1080, 1080);

             if (qrRef.current) {
         const qrSize = 345;
         const qrCanvas = document.createElement('canvas');
         const qrCtx = qrCanvas.getContext('2d');
         if (qrCtx) {
           qrCanvas.width = qrSize;
           qrCanvas.height = qrSize;
           qrCtx.drawImage(qrRef.current, 0, 0, qrSize, qrSize);
           ctx.drawImage(qrCanvas, 380, 383, 345, 345); // QR code position
         }
       }

       ctx.font = 'bold 36px Arial, sans-serif';
       ctx.fillStyle = '#000000';
       ctx.textAlign = 'center';
       ctx.fillText(code, 550, 800); // Coupon code text position

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = generateFilename(`${location?.name || "coupon"}-${code}`);
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('이미지 다운로드 오류:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // 쿠폰 정보 정리 (새로운 쿠폰 발급을 위해)
  const clearCouponData = () => {
    sessionStorage.removeItem('generatedCode');
    sessionStorage.removeItem('savedImageUrl');
    sessionStorage.removeItem('couponGenerated');
    // userPhoto와 locationSlug는 유지 (혜택 상점에서 돌아올 때 사용)
    // sessionStorage.removeItem('userPhoto');
    // sessionStorage.removeItem('locationSlug');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('쿠폰 코드가 복사되었습니다!');
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  function CouponCardShell({
    qrUrl,
    description,
    code,
    onDownload,
  }: {
    qrUrl: string;
    description: string;
    code: string;
    onDownload: () => void;
  }) {
    return (
      <div className="relative w-full max-w-[500px] h-[300px] mx-auto flex justify-center items-center">
        <div className="relative">
          <img
            src="/coupon/이미지 갤러리 저장 (2배수) (1).svg"
            alt="쿠폰 이미지"
            className="w-[393px] h-[471px] object-contain"
            style={{ transform: 'translate(-4px, -8px)' }}
          />
                     <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
             <img src={qrUrl} alt="QR Code" className="w-[115px] h-[115px]" />
           </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-14">
            <button
              onClick={() => copyToClipboard(code)}
              className="text-[12px] font-mono font-bold flex items-center gap-1 py-2"
              style={{ color: '#000000' }}
            >
              {code}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2H3C2.44772 2 2 2.44772 2 3V9C2 9.55228 2.44772 10 3 10H7C7.55228 10 8 9.55228 8 9V8M4 2C4 1.44772 4.44772 1 5 1H9C9.55228 1 10 1.44772 10 2V8C10 8.55228 9.55228 9 9 9H5C4.44772 9 4 8.55228 4 8V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <button
              onClick={onDownload}
              className="flex items-center justify-start gap-1 bg-[#D0E0FF]/80 backdrop-blur-sm rounded-full border border-white/30 hover:bg-[#D0E0FF]/90 transition-all duration-200 pl-4"
              style={{ width: '136px', height: '37px' }}
            >
              <img
                src="/Frame 44.svg"
                alt="download"
                className="w-4 h-4 filter brightness-0 invert"
              />
              <span className="text-[14px] font-medium text-white">이미지 저장</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#479BFF' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!location) {
    return <div>장소를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="min-h-screen mx-auto">
      <div className="relative w-[auto] min-h-screen mx-auto overflow-hidden" style={{
        background: `linear-gradient(
          to top,
          #b8d8ff 0px,
          #b8d8ff 92px,
          #479aff 556px,
          #479aff 100%
        )`
      }}>
        {/* 배경 그리드 */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
          }}
        />

        {/* 메인 컨텐츠 */}
        <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-6 pt-[80px]">
          <h2 className="text-[28px] font-bold text-white mb-3">
            쿠폰 발급 완료!
          </h2>
          <p className="text-[17px] text-white mb-[40px] text-center">
            {location.name} 방문 인증이 완료되었어요<br />
            쿠폰을 다운받아 다양한 혜택을 받아보세요!
          </p>

          {savedImageUrl && (
            <CouponCardShell
              qrUrl={savedImageUrl}
              description={`${location.name} 방문 인증 쿠폰`}
              code={generatedCode}
              onDownload={() => handleDownload(generatedCode)}
            />
          )}

          {/* 혜택 상점 보기 버튼 */}
          <div className="w-[393px] px-[18px] mt-20 relative z-50">
            <button
              onClick={() => router.push(`/${locationSlug}/store`)}
              className="w-full h-[52px] bg-black text-white rounded-[14px] text-[17px] font-medium hover:bg-gray-900 transition-colors"
            >
              혜택 상점 보기
            </button>
          </div>
        </div>
      </div>

             {/* QR 코드 캔버스 (숨김) */}
       <div className="absolute -top-[9999px] left-0 z-50">
         <GenerateQrCode ref={qrRef} value={generatedCode || "PLACEHOLDER"} size={200} />
       </div>

      {/* 에러 모달 */}
      <BottomSheet isOpen={showModal} setIsOpen={closeModal}>
        <div className="p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-lg font-semibold mb-2">오류</h3>
            <p className="text-gray-600">{modalContent.message}</p>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
} 