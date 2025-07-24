// apps/generator/app/[locationSlug]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { EnhancedCouponService } from "@repo/api";
import { GenerateQrCode, PhotoCapture, IntroScreen } from "@/components";
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
  
  // 🆕 새로운 플로우 상태들
  const [currentStep, setCurrentStep] = useState<'intro' | 'photo' | 'share' | 'coupon' | 'success'>('intro');
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

  // 공유 완료 핸들러
  const handleShareCompleted = () => {
    setShareCompleted(true);
    setCurrentStep('coupon');
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
      <div className="relative w-[290px] h-[380px] bg-white shadow-xl mx-auto flex flex-col items-center pt-8 pb-6 px-4" style={{ borderRadius: '20px 20px 32px 32px / 16px 16px 32px 32px' }}>
        {/* 위쪽 톱니 */}
        <div className="absolute top-0 left-0 w-full flex justify-between z-10">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="w-7 h-7 bg-[#b8d8ff] rounded-full"
              style={{ transform: 'translateY(-50%)' }}
            />
          ))}
        </div>
        {/* 내부 컨텐츠 */}
        <div className="flex-1 w-full flex flex-col items-center justify-center">
          {/* 제목 */}
          <div className="text-[22px] font-bold text-[#479aff] mb-2 tracking-wider">EVENT BENEFIT</div>
          {/* QR코드 */}
          <div className="bg-white rounded-lg p-2 shadow mb-2">
            <img src={qrUrl} alt="쿠폰 QR" className="w-[140px] h-[140px] object-contain" />
          </div>
          {/* 설명 */}
          <div className="text-[13px] text-black text-center mb-1">{description}</div>
          {/* 코드 */}
          <div className="text-[12px] text-gray-500 text-center mb-2 font-mono">{code}</div>
        </div>
        {/* 하단 점선 */}
        <div className="absolute left-0 bottom-[56px] w-full flex justify-center">
          <div className="w-[85%] border-b border-dashed border-[#b8d8ff]" />
        </div>
        {/* 다운로드 버튼 */}
        <button
          onClick={onDownload}
          className="w-full mt-4 text-[15px] text-black/80 font-medium flex items-center justify-center gap-1"
        >
          이미지 다운로드 <span className="text-lg">↓</span>
        </button>
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
    <div className="min-h-screen bg-[#DEE7EC] relative">
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
                  <div className="relative w-full max-w-[220px] mx-auto mt-[60px]">
                    {/* 왼쪽 초록 쿠폰 */}
                    <div className="absolute z-[2]" style={{ top: '82px', left: '-42px', transform: 'rotate(-13.54deg)' }}>
                      {/* 상단 컨테이너 */}
                      <div className="w-[176px] h-[191px] bg-[#77E572] rounded-[8px] overflow-hidden">
                        {/* 톱니 모양 상단 */}
                        <div className="absolute top-0 left-0 right-0 h-[20px] flex justify-evenly">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="w-[20px] h-[20px] bg-[#151515] rounded-full -mt-[10px]" />
                          ))}
                        </div>
                        <div className="h-[60px] flex items-center justify-center">
                          <span className="text-white text-[22px] mt-[10px]">COUPON</span>
                        </div>
                      </div>
                      {/* 하단 컨테이너 */}
                      <div className="w-[176px] h-[45px] bg-[#77E572] rounded-[8px] -mt-[2px]">
                        <div 
                          className="w-full h-[1px]" 
                          style={{
                            backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.3) 33%, rgba(255, 255, 255, 0) 0%)',
                            backgroundPosition: 'top',
                            backgroundSize: '12px 1px',
                            backgroundRepeat: 'repeat-x'
                          }}
                        />
                      </div>
                    </div>

                    {/* 중앙 파란 쿠폰 */}
                    <div className="relative z-[3]">
                      {/* 상단 컨테이너 */}
                      <div className="w-[220px] h-[295px] bg-[#478AFF] rounded-[8px] overflow-hidden">
                        {/* 톱니 모양 상단 */}
                        <div className="absolute top-0 left-0 right-0 h-[20px] flex justify-evenly">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="w-[20px] h-[20px] bg-[#151515] rounded-full -mt-[10px]" />
                          ))}
                        </div>
                        <div className="h-[60px] flex items-center justify-center">
                          <span className="text-white text-[22px] mt-[10px]">COUPON</span>
                        </div>
                      </div>
                      {/* 하단 컨테이너 */}
                      <div className="w-[220px] h-[69px] bg-[#478AFF] rounded-[8px] -mt-[2px]">
                        <div 
                          className="w-full h-[1px]" 
                          style={{
                            backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.3) 33%, rgba(255, 255, 255, 0) 0%)',
                            backgroundPosition: 'top',
                            backgroundSize: '15px 1px',
                            backgroundRepeat: 'repeat-x'
                          }}
                        />
                        <div className="h-full flex items-center justify-center">
                          <span className="text-white text-[15px]">HECHI X ASTEROIDER</span>
                        </div>
                      </div>
                    </div>

                    {/* 오른쪽 분홍 쿠폰 */}
                    <div className="absolute z-[1]" style={{ top: '82px', right: '-42px', transform: 'rotate(13.54deg)' }}>
                      {/* 상단 컨테이너 */}
                      <div className="w-[176px] h-[191px] bg-[#F896D8] rounded-[8px] overflow-hidden">
                        {/* 톱니 모양 상단 */}
                        <div className="absolute top-0 left-0 right-0 h-[20px] flex justify-evenly">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="w-[20px] h-[20px] bg-[#151515] rounded-full -mt-[10px]" />
                          ))}
                        </div>
                        <div className="h-[60px] flex items-center justify-center">
                          <span className="text-white text-[22px] mt-[10px]">COUPON</span>
                        </div>
                      </div>
                      {/* 하단 컨테이너 */}
                      <div className="w-[176px] h-[45px] bg-[#F896D8] rounded-[8px] -mt-[2px]">
                        <div 
                          className="w-full h-[1px]" 
                          style={{
                            backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.3) 33%, rgba(255, 255, 255, 0) 0%)',
                            backgroundPosition: 'top',
                            backgroundSize: '12px 1px',
                            backgroundRepeat: 'repeat-x'
                          }}
                        />
                      </div>
                    </div>
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
                  <CouponCardShell
                    qrUrl={savedImageUrl}
                    description={`${location.name} 방문 인증 쿠폰`}
                    code={generatedCode}
                    onDownload={downloadImage}
                  />
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
