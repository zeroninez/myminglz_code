// apps/generator/app/[locationSlug]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { EnhancedCouponService } from "@repo/api";
import { GenerateQrCode, PhotoCapture, IntroScreen } from "@/components";
import { BottomSheet } from "@repo/ui";
import { useTimestamp } from "@/hooks";
import { useParams } from "next/navigation";
import html2canvas from 'html2canvas';

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
  
  // 🆕 새로운 플로우 상태들
  const [currentStep, setCurrentStep] = useState<'intro' | 'photo' | 'coupon' | 'success'>('intro');
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [shareCompleted, setShareCompleted] = useState(false);

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

  // 사진 업로드 완료 핸들러
  const handlePhotoUploaded = (imageUrl: string, isTimeout?: boolean) => {
    setUserPhotoUrl(imageUrl);
    
    if (isTimeout) {
      // 타임아웃으로 실패한 경우 자연스럽게 이전 화면으로
      setCurrentStep('photo');
    } else {
      // 성공적으로 공유된 경우
      setShareCompleted(true);
      setCurrentStep('coupon');
    }
  };

  // 에러 핸들러
  const handleError = (error: string) => {
    setModalContent({
      type: "error",
      message: error,
    });
    setShowModal(true);
  };

  // 쿠폰 발급 프로세스 (공유 완료 후에만 실행)
  const handleGetCoupon = async () => {
    if (!location || !shareCompleted) return;

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
        const imageUrl = await createBrandedImage(qrRef, newCode, {
          brandName: location.name,
          brandColor: "#10b981",
          logoText: "📍",
          locationDesc: location.description,
        });

        setSavedImageUrl(imageUrl);
        setIsLoading(false);
        // 성공 시 success 페이지로 이동
        setCurrentStep('success');
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
      if (!originalCanvas) {
        resolve("");
        return;
      }

      // QR 코드만 반환
      resolve(originalCanvas.toDataURL("image/png"));
    });
  };

  // 이미지 다운로드
  const handleDownload = async (code: string) => {
    try {
      // Canvas 생성
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 캔버스 크기 설정 (1080x1080 원본 크기)
      canvas.width = 1080;
      canvas.height = 1080;

      // 새로운 배경 이미지 로드
      const bgImage = new Image();
      
             await new Promise((resolve, reject) => {
         bgImage.onload = resolve;
         bgImage.onerror = reject;
         bgImage.src = '/coupon/이미지 갤러리 저장 (2배수).svg';
       });

      // 배경 이미지 그리기
      ctx.drawImage(bgImage, 0, 0, 1080, 1080);

      // QR 코드 생성 및 추가 (쿠폰 중앙 영역)
      if (qrRef.current) {
        const qrSize = 345;
        const qrCanvas = document.createElement('canvas');
        const qrCtx = qrCanvas.getContext('2d');
        if (qrCtx) {
          qrCanvas.width = qrSize;
          qrCanvas.height = qrSize;
          
          // 기존 QR 코드를 새 캔버스에 복사
          qrCtx.drawImage(qrRef.current, 0, 0, qrSize, qrSize);
          
          // QR 코드를 메인 캔버스에 추가 (더 낮게)
          ctx.drawImage(qrCanvas, 380, 383, 345, 345);
        }
      }

      // 쿠폰 코드 텍스트 추가 (QR 코드 아래, 더 낮게, 오른쪽으로 조정)
      ctx.font = 'bold 36px Arial, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(code, 550, 800);

      // 이미지 다운로드
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = generateFilename(
        `${location?.name || "coupon"}-${code}`
      );
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('이미지 다운로드 오류:', error);
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setModalContent({ type: "", message: "" });
  };

  // 코드 복사 함수
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("쿠폰 코드가 복사되었습니다!");
    } catch (err) {
      console.error("복사 실패:", err);
      alert("복사에 실패했습니다. 직접 코드를 복사해주세요.");
    }
  };

  // success 페이지 쿠폰 카드 컴포넌트
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
        {/* SVG 쿠폰 이미지 */}
        <div className="relative">
          <img
            src="/coupon/이미지 갤러리 저장 (2배수) (1).svg"
            alt="쿠폰 이미지"
            className="w-[393px] h-[471px] object-contain"
            style={{ transform: 'translate(-4px, -8px)' }}
          />
          
          {/* QR 코드 오버레이 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <img src={qrUrl} alt="QR Code" className="w-[115px] h-[115px]" />
          </div>
          
          {/* 쿠폰 코드 오버레이 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-14">
            <button 
              onClick={() => copyToClipboard(code)}
              className="text-[12px] font-mono font-bold flex items-center gap-1 py-2"
              style={{ color: '#000000' }}
            >
              {code}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
          
          {/* 다운로드 버튼 */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
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
        {/* 히든 QR 코드 (이미지 생성용) */}
        <div className="hidden">
          <GenerateQrCode ref={qrRef} value={generatedCode || "PLACEHOLDER"} />
        </div>

        {/* 메인 컨텐츠 */}
        <div className="h-[852px] mx-auto">
          <div>
            {currentStep === 'intro' && (
              <div>
                <IntroScreen
                  onNext={() => setCurrentStep('photo')}
                />
              </div>
            )}

            {currentStep === 'photo' && (
              <div className="h-full">
                <PhotoCapture
                  location={location}
                  onPhotoUploaded={handlePhotoUploaded}
                  onError={handleError}
                  initialPhoto={userPhotoUrl}
                />
              </div>
            )}

            {currentStep === 'coupon' && shareCompleted && (
              <div className="relative w-[auto] h-[852px] mx-auto overflow-hidden bg-[#151515]">
                {/* 배경 그리드 */}
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(76, 81, 86, 0.3) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(76, 81, 86, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '24px 24px'
                  }}
                />

                {/* 메인 컨텐츠 */}
                <div className="relative z-10 flex flex-col items-center justify-start h-full px-6 pt-[80px]">
                  <h2 className="text-[28px] font-bold text-white mb-3">
                    공유 인증 완료!
                  </h2>
                  <p className="text-[17px] text-[#8B95A1] mb-[40px] text-center">
                    사진 촬영과 SNS 공유 인증이 완료되었어요<br />
                    이제 쿠폰을 뽑아볼까요?
                  </p>

                  {/* 쿠폰 디자인 */}
                  <div className="relative w-full mx-auto mt-[60px]">
                    {/* 쿠폰 이미지 */}
                    <img
                      src="/coupon/verified.png"
                      alt="쿠폰 이미지"
                      className="object-contain mx-auto"
                      style={{ width: '363px', height: '364px' }}
                    />
                  </div>

                  {/* 쿠폰 발급 버튼 */}
                  <button
                    onClick={handleGetCoupon}
                    disabled={isLoading}
                    className="w-full max-w-[353px] h-[52px] bg-[#479BFF] text-white text-[16px] font-medium rounded-[12px] mt-[40px] hover:bg-[#3B87E0] transition-all duration-200 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>쿠폰 발급 중...</span>
                      </div>
                    ) : (
                      <span>쿠폰 받기</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'success' && savedImageUrl && (
              <div className="relative w-[auto] h-[852px] mx-auto overflow-hidden" style={{
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
                <div className="relative z-10 flex flex-col items-center justify-start h-full px-6 pt-[80px]">
                  <h2 className="text-[28px] font-bold text-white mb-3">
                    쿠폰 발급 완료!
                  </h2>
                  <p className="text-[17px] text-white mb-[40px] text-center">
                    강남 쇼핑몰 방문 인증이 완료되었어요<br />
                    쿠폰을 다운받아 다양한 혜택을 받아보세요!
                  </p>

                  <CouponCardShell
                    qrUrl={savedImageUrl}
                    description={`${location.name} 방문 인증 쿠폰`}
                    code={generatedCode}
                    onDownload={() => handleDownload(generatedCode)}
                  />

                  {/* 혜택 상점 보기 버튼 추가 */}
                  <div className="w-[393px] px-[18px] mt-20 relative z-50">
                    <button
                      onClick={() => window.location.href = `/${locationSlug}/store`}
                      className="w-full h-[52px] bg-black text-white rounded-[14px] text-[17px] font-medium hover:bg-gray-900 transition-colors"
                    >
                      혜택 상점 보기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 에러 모달 (성공 시에는 사용하지 않음) */}
        <BottomSheet isOpen={showModal} setIsOpen={closeModal}>
          <div className="p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>

              <h3 className="text-xl font-bold mb-4 text-gray-900">
                발급 실패
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
    </div>
  );
}

