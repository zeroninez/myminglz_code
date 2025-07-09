// apps/generator/src/components/SocialShare.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Location, ShareData } from "@repo/api";

interface SocialShareProps {
  location: Location;
  userPhotoUrl: string;
  onShareCompleted: () => void;
  onError: (error: string) => void;
}

export function SocialShare({ location, userPhotoUrl, onShareCompleted, onError }: SocialShareProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareCompleted, setShareCompleted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const shareData: ShareData = {
    title: location.share_title || `${location.name}에서 찍은 사진!`,
    text: location.share_description || `${location.name}에서 멋진 조형물과 함께 사진을 찍었어요! 🎉`,
    url: window.location.href,
    imageUrl: userPhotoUrl
  };

  // 파일을 Blob으로 변환
  const getPhotoFile = async (): Promise<File | null> => {
    try {
      const response = await fetch(userPhotoUrl);
      const blob = await response.blob();
      return new File([blob], `${location.slug}-photo.jpg`, { type: 'image/jpeg' });
    } catch (error) {
      console.error('파일 변환 실패:', error);
      return null;
    }
  };

  // 카운트다운 시작
  const startCountdown = () => {
    setCountdown(10); // 10초 카운트다운
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          setShareCompleted(true);
          onShareCompleted();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Web Share API (파일 포함) - iOS Safari 인스타그램 오류 해결
  const shareWithFile = async () => {
    // 타입 안전성을 위한 체크
    const nav = navigator as any;
    
    if (!nav.share) {
      onError('이 브라우저에서는 공유 기능을 지원하지 않습니다.');
      return;
    }

    setIsSharing(true);
    
    try {
      const photoFile = await getPhotoFile();
      if (!photoFile) {
        throw new Error('사진 파일을 준비할 수 없습니다.');
      }

      // iOS Safari 인스타그램 공유 오류 해결: title을 빈 문자열로 설정
      const shareOptions = {
        title: "", // iOS Safari에서 인스타그램 공유 시 title이 있으면 오류 발생
        text: shareData.text,
        files: [photoFile]
      };

      // 파일 공유 지원 확인
      if (nav.canShare && nav.canShare(shareOptions)) {
        await nav.share(shareOptions);
      } else {
        // 파일 공유 미지원 시 텍스트만 공유 (title 여전히 빈 문자열)
        await nav.share({
          title: "",
          text: shareData.text,
          url: shareData.url
        });
      }
      
      // 공유 시도 후 10초 카운트다운 시작
      setIsSharing(false);
      startCountdown();
      
    } catch (error: any) {
      setIsSharing(false);
      if (error.name !== 'AbortError') {
        console.error('공유 오류:', error);
        onError(`공유 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  };

  // 수동 완료 버튼
  const handleManualComplete = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setShareCompleted(true);
    onShareCompleted();
  };

  if (shareCompleted) {
    return (
      <div className="share-completed text-center p-6 bg-green-50 rounded-lg">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-green-800 mb-2">공유 완료!</h3>
        <p className="text-green-600 mb-4">
          사진이 성공적으로 공유되었습니다!
          <br />
          이제 쿠폰을 받을 수 있습니다!
        </p>
        <div className="w-full h-2 bg-green-200 rounded-full">
          <div className="h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  // 카운트다운 중인 경우
  if (countdown > 0) {
    return (
      <div className="share-waiting text-center p-6 bg-blue-50 rounded-lg">
        <div className="text-6xl mb-4">⏱️</div>
        <h3 className="text-xl font-bold text-blue-800 mb-2">공유 대기 중...</h3>
        <p className="text-blue-600 mb-6">
          SNS 공유를 완료하셨나요?
          <br />
          <span className="font-bold text-2xl text-blue-800">{countdown}초</span> 후 자동으로 다음 단계로 넘어갑니다
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handleManualComplete}
            className="w-full bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg font-bold text-lg"
          >
            ✅ 공유 완료했어요!
          </button>
          
          <button
            onClick={() => {
              if (timerRef.current) {
                clearInterval(timerRef.current);
              }
              setCountdown(0);
            }}
            className="w-full bg-gray-400 hover:bg-gray-500 text-white p-3 rounded-lg"
          >
            다시 공유하기
          </button>
        </div>
        
        <div className="mt-4 w-full bg-blue-200 rounded-full h-3">
          <div 
            className="bg-blue-500 h-3 rounded-full transition-all duration-1000"
            style={{ width: `${((10 - countdown) / 10) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="social-share-container">
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-bold mb-3">SNS 공유하기</h3>
        <p className="text-gray-600 text-lg">
          <span className="text-blue-500">📱</span>촬영한 사진을 SNS에 공유하고<br />
          쿠폰을 받아보세요!
        </p>
      </div>

      {/* 촬영한 사진 미리보기 */}
      <div className="mb-8">
        <img
          src={userPhotoUrl}
          alt="촬영한 사진"
          className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
        />
      </div>

      {/* 공유 안내 */}
      <div className="mb-8 p-5 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <span>📋</span>
          <span>공유 방법</span>
        </h4>
        <div className="space-y-2 text-blue-700">
          <div className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>버튼을 누르면 공유 화면이 나타납니다</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>카카오톡, 인스타그램, 페이스북 등 원하는 앱을 선택하세요</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>공유 완료 후 "공유 완료했어요!" 버튼을 눌러주세요</span>
          </div>
        </div>
      </div>

      {/* 공유 버튼 */}
      {(navigator as any).share ? (
        <button
          onClick={shareWithFile}
          disabled={isSharing}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 text-white p-6 rounded-xl font-bold text-xl flex items-center justify-center gap-4 shadow-lg transform transition-all hover:scale-105 disabled:hover:scale-100"
        >
          <span className="text-4xl">📱</span>
          <div className="text-center">
            <div>{isSharing ? '공유 중...' : 'SNS에 공유하기'}</div>
            <div className="text-sm opacity-90 font-normal">사진 파일 포함</div>
          </div>
        </button>
      ) : (
        <div className="text-center p-8 bg-gray-100 rounded-xl">
          <div className="text-5xl mb-4">🚫</div>
          <h4 className="font-bold text-gray-800 mb-3 text-lg">공유 기능 미지원</h4>
          <p className="text-gray-600">
            이 브라우저에서는 공유 기능을 지원하지 않습니다.<br />
            <span className="font-semibold">모바일 브라우저</span>에서 접속해주세요.
          </p>
        </div>
      )}

      <div className="text-center text-gray-500 mt-6 p-4 bg-gray-50 rounded-lg">
        <span className="text-lg">💡</span>
        <p className="mt-2">
          공유 완료 후 확인 버튼을 누르거나<br />
          <span className="font-semibold text-gray-700">10초 후 자동</span>으로 쿠폰 발급 단계로 이동합니다
        </p>
      </div>
    </div>
  );
} 