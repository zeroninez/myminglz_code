// apps/generator/app/[locationSlug]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { EnhancedCouponService } from "@repo/api";
import { GenerateQrCode, PhotoCapture, IntroScreen } from "@/components";
import { BottomSheet } from "@repo/ui";
import { useTimestamp } from "@/hooks";
import { useParams } from "next/navigation";
import domtoimage from 'dom-to-image-more';
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
  const handleDownload = async () => {
    const element = document.querySelector('.coupon-container') as HTMLElement;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // 고해상도
        useCORS: true, // 외부 이미지 허용
        allowTaint: true,
        backgroundColor: null, // 투명 배경
        logging: false,
        width: 500, // 더 넓은 캡처 영역
        height: 500,
        imageTimeout: 0,
        x: -100, // 좌측으로 50px 이동하여 캡처
      });

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
      <div className="relative w-[500px] h-[500px] mx-auto">
        {/* 쿠폰 컨테이너 */}
        <div className="coupon-container absolute left-1/2 top-[33%] -translate-x-1/2 -translate-y-1/2">
          {/* 캐릭터들 */}
          <img 
            src="/coupon/5e3f834fb0503d119dca1bf08d2870d26b68b76b.png"
            alt="green character"
            className="absolute -left-[44px] top-[195px] w-[149px] h-[150px] scale-x-[-1] z-10"
          />
          <img 
            src="/coupon/8dacf78389c9026b25d30382761645b95da348f2.png"
            alt="pink character"
            className="absolute -left-[77px] top-[95px] -z-10"
          />
          <img 
            src="/coupon/afb757e706c3536fc2c089807202b5a557471ac6.png"
            alt="blue character"
            className="absolute -right-25 top-[155px] w-[192px] h-[192px] z-10"
          />
          <img 
            src="/coupon/482b5f6bf6cde5ddc8423735dd80373845304d37.png"
            alt="orange character"
            className="absolute -right-10 top-4 w-[57px] h-[57px] z-10"
          />

          {/* 쿠폰 내용 */}
          <div className="relative w-[255px] h-[340px]">
            {/* SVG 쿠폰 테두리 */}
            <svg
              width="255"
              height="340"
              viewBox="0 0 255 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute top-0 left-0 w-full h-full"
            >
              <g transform="translate(0, 50)">
                <path d="M18.3477 0.464349C18.3477 5.46882 22.4962 9.52575 27.6133 9.52587C32.7305 9.52587 36.8789 5.4689 36.8789 0.464349C36.8789 0.393498 36.8757 0.322897 36.874 0.252435L58.2656 0.252435C58.264 0.3229 58.2598 0.393495 58.2598 0.464349C58.2598 5.46876 62.4083 9.52565 67.5254 9.52587C72.6426 9.52587 76.791 5.4689 76.791 0.464349C76.791 0.393496 76.7878 0.322899 76.7861 0.252435L98.1797 0.252435C98.178 0.322578 98.1738 0.392844 98.1738 0.463372C98.1738 5.46788 102.322 9.52483 107.439 9.5249C112.557 9.5249 116.705 5.46792 116.705 0.463372C116.705 0.392849 116.702 0.322573 116.7 0.252435L138.092 0.252435C138.09 0.322799 138.087 0.393597 138.087 0.464349C138.087 5.46876 142.235 9.52587 147.353 9.52587C152.47 9.52579 156.618 5.46871 156.618 0.464349C156.618 0.393592 156.614 0.322804 156.612 0.252435L178.009 0.252435C178.007 0.322898 178.004 0.393496 178.004 0.464349C178.004 5.4689 182.152 9.52587 187.27 9.52587C192.387 9.52566 196.535 5.46877 196.535 0.464349C196.535 0.393495 196.531 0.3229 196.529 0.252435L217.92 0.252435C217.918 0.322901 217.914 0.393494 217.914 0.464349C217.914 5.46882 222.063 9.52575 227.18 9.52587C232.297 9.52587 236.445 5.4689 236.445 0.464349C236.445 0.393498 236.442 0.322897 236.44 0.252435L246.75 0.252435C251.16 0.252475 254.735 3.82781 254.735 8.23779V273.852C254.735 278.262 251.16 281.837 246.75 281.837H7.99023C3.58009 281.837 0.00489546 278.262 0.00488281 273.852L0.00488281 8.23779C0.00506236 3.82779 3.58019 0.252435 7.99023 0.252435L18.3535 0.252435C18.3519 0.322901 18.3477 0.393494 18.3477 0.464349Z" fill="white"/>
                <rect y="281.84" width="254.73" height="59.0791" rx="7.98528" fill="white"/>
                <path d="M13.0439 281.84L241.688 281.84" stroke="#469AFF" strokeWidth="1.59706" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5.59 6.39"/>
              </g>
            </svg>

            {/* 내부 컨텐츠 */}
            <div className="relative z-10 w-full h-full flex flex-col items-center pt-16">
              <div className="text-[22px] font-bold mb-8" style={{ color: '#479aff' }}>EVENT BENEFIT</div>
              <div className="mb-6 -mt-6">
                <img src={qrUrl} alt="QR Code" className="w-[120px] h-[120px]" />
              </div>
              <div className="text-[10px] text-black text-center -mt-4">
                {description}
              </div>
              <button 
                onClick={() => copyToClipboard(code)}
                className="text-[9px] font-mono mb-8 flex items-center gap-1"
                style={{ color: '#666666', transition: 'color 0.2s' }}
              >
                {code}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <div className="absolute bottom-[20px] left-0 right-0 flex justify-center items-center w-full">
                <button onClick={onDownload} className="flex items-center gap-2">
                  <span className="text-[13px]" style={{ color: 'rgba(0, 0, 0, 0.8)' }}>이미지 다운로드</span>
                  <img 
                    src="/Frame 44.svg"
                    alt="download"
                    className="w-4 h-4 -ml-1"
                  />
                </button>
              </div>
            </div>
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
                    onDownload={handleDownload}
                  />

                  {/* 혜택 상점 보기 버튼 추가 */}
                  <div className="w-[393px] px-[18px] mt-[-80px] relative z-50">
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

