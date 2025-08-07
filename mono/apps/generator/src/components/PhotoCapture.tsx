// apps/generator/src/components/PhotoCapture.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import type { Location } from "@repo/api";

export interface PhotoCaptureProps {
  location: Location;
  onPhotoUploaded: (imageUrl: string, isTimeout?: boolean) => void;
  onError: (error: string) => void;
  initialPhoto?: string | null;
}

export function PhotoCapture({ location, onPhotoUploaded, onError, initialPhoto = null }: PhotoCaptureProps) {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(initialPhoto);
  const [isSharing, setIsSharing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const shareAttemptRef = useRef<number | null>(null);
  const appSwitchAttemptRef = useRef<boolean>(false);

  // 앱 전환 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && shareAttemptRef.current) {
        // 앱 전환 시도 기록
        appSwitchAttemptRef.current = true;
      } else if (!document.hidden && shareAttemptRef.current && appSwitchAttemptRef.current) {
        // 앱에서 돌아왔을 때 성공으로 처리
        setIsSuccess(true);
        setProgress(100);
        // 페이지 새로고침으로 Web Share API 모달 강제 닫기
        sessionStorage.setItem('pendingPhoto', capturedPhoto!);
        sessionStorage.setItem('pendingStep', 'coupon');
        window.location.reload();
      }
    };

    if (isSharing) {
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isSharing, onPhotoUploaded, capturedPhoto, isSuccess]);

  // Web Share API
  const handleShare = async () => {
    try {
      setIsSharing(true);
      shareAttemptRef.current = Date.now();
      appSwitchAttemptRef.current = false;

      // base64 → Blob → File 변환
      const response = await fetch(capturedPhoto!);
      const blob = await response.blob();
      const photoFile = new File([blob], `${location.slug}-photo.jpg`, { type: 'image/jpeg' });

      const shareOptions = {
        title: "",
        text: `${location.name}에서 멋진 조형물과 함께 사진을 찍었어요! 🎉`,
        files: [photoFile]
      };

            const nav = navigator as any;
      if (nav.canShare && nav.canShare(shareOptions)) {
        await nav.share(shareOptions);
        // Web Share API 성공 시 바로 인증 완료
        onPhotoUploaded(capturedPhoto!, false);
        setIsSharing(false);
      } else {
        await nav.share({
          title: "",
          text: `${location.name}에서 멋진 조형물과 함께 사진을 찍었어요! 🎉`,
          url: window.location.href
        });
        // Web Share API 성공 시 바로 인증 완료
        onPhotoUploaded(capturedPhoto!, false);
        setIsSharing(false);
      }

    } catch (error) {
      console.error('공유 실패:', error);
      shareAttemptRef.current = null;
      appSwitchAttemptRef.current = false;
      setIsSharing(false);
    }
  };



  // 공유하기 버튼 클릭 핸들러
  const handleShareButtonClick = () => {
    if (!capturedPhoto) {
      onError('사진을 먼저 촬영해주세요.');
      return;
    }
    handleShare();
  };

  // 파일 선택 (갤러리에서)
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError('이미지 파일만 선택할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCapturedPhoto(result);
    };
    reader.readAsDataURL(file);
    
    // input value 초기화
    event.target.value = '';
  };

  // 사진 다시 찍기
  const retakePhoto = () => {
    setCapturedPhoto(null);
    setIsSharing(false);
    // input들의 value도 초기화
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  if (isSharing) {
    return (
      <div className="relative w-[393px] h-[852px] mx-auto overflow-hidden bg-[#E8EFF3]">
        {/* 배경 패턴 */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url('/pattern.png')`,
            backgroundSize: '100% auto',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
            mixBlendMode: 'multiply',
            opacity: 0.5
          }}
        />

        {/* 배경 그리드 */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(182, 215, 255, 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(182, 215, 255, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-[28px] text-gray-600 font-bold mb-2">공유 인증 중</h2>
            <p className="text-[17px] text-gray-600 mb-12">
              공유 인증을 확인하고 있어요<br />
              잠시만 기다려 주세요!
            </p>
            <div className="relative w-[120px] h-[120px] mx-auto">
              {/* 고정된 로딩 애니메이션 */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="57"
                  stroke="#479BFF"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="358.14"
                  strokeDashoffset="0"
                  style={{ 
                    animation: 'spin 2s linear infinite',
                    transformOrigin: 'center'
                  }}
                />
              </svg>
              {/* 임시 더미 이미지 (원형으로 잘린 검은색 배경) */}
              <div className="absolute inset-[8px] bg-black rounded-full flex items-center justify-center">
                <span className="text-white text-4xl"></span>
              </div>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative w-[393px] h-[852px] mx-auto overflow-hidden bg-[#E8EFF3]">
      {/* 배경 패턴 */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url('/pattern.png')`,
          backgroundSize: '100% auto',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'multiply',
          opacity: 0.5
        }}
      />

      {/* 배경 그리드 */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(182, 215, 255, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(182, 215, 255, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 h-full flex flex-col px-6 py-8">
        {/* 타이틀 */}
        <div className="text-center mb-4">
          <div className="inline-block bg-black text-[#82BBFF] text-[13px] font-medium px-3 py-1 rounded-full mb-3">
            STEP 1
          </div>
          <h2 className="text-[22px] font-bold text-black">사진 촬영하기</h2>
          <p className="mt-2 text-[15px] text-gray-600">
            해치 조형물과 함께 사진을 찍고
            <br />
            SNS에 공유해 볼까요?
          </p>
        </div>

        {/* 카메라 영역 */}
        <div className="relative mt-4">
          {/* 배경 컨테이너 */}
          <div className="absolute inset-0 bg-transparent rounded-[20px]" />
          
          {/* 카메라 프레임 */}
          <div className="relative p-4">
            <div 
              className="aspect-[335/448] w-full bg-[#A6B1BF]/40 rounded-[12px] border-2 border-dashed border-[#E4EEFF] flex flex-col items-center justify-center cursor-pointer"
              onClick={() => galleryInputRef.current?.click()}
            >
              {capturedPhoto ? (
          <img
            src={capturedPhoto}
            alt="촬영된 사진"
                  className="w-full h-full object-cover rounded-[10px]"
          />
              ) : (
                <div className="text-center flex flex-col items-center gap-2 -translate-y-3">
                  <div className="text-[50px] mb-0 text-white">+</div>
                  <div className="text-[#E4EEFF] text-[16px]">
                    사진 올리기
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="mt-6 space-y-3">
          {capturedPhoto ? (
            <div className="flex gap-3">
            <button
              onClick={retakePhoto}
                className="flex-1 bg-[#C7C7CE] hover:bg-[#BBBBC2] text-white h-[52px] rounded-[12px] font-medium"
            >
              다시 찍기
            </button>
            <button
                onClick={handleShareButtonClick}
                disabled={isSharing}
                className="flex-1 bg-[#479BFF] hover:bg-blue-600 disabled:bg-gray-400 text-white h-[52px] rounded-[12px] font-medium"
            >
                {isSharing ? '공유 중...' : '공유하기'}
            </button>
          </div>
          ) : null}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
      </div>


    </div>
  );
} 