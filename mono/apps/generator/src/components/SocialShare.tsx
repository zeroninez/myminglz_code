// apps/generator/src/components/SocialShare.tsx
"use client";

import React, { useState, useEffect } from "react";
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
  const [hasShared, setHasShared] = useState(false);

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

  // Page Visibility API로 앱 복귀 감지
  useEffect(() => {
    // Page Visibility API 지원 확인
    if (typeof document.hidden === 'undefined') {
      console.warn('Page Visibility API가 지원되지 않는 브라우저입니다.');
      return;
    }

    const handleVisibilityChange = () => {
      // 공유를 시도했고 브라우저가 다시 보이게 되었을 때
      if (!document.hidden && hasShared && !shareCompleted) {
        console.log('사용자가 공유 후 브라우저로 돌아왔습니다.');
        // 바로 완료 처리
        setShareCompleted(true);
        onShareCompleted();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasShared, shareCompleted, onShareCompleted]);

  // Web Share API (iOS Safari 인스타그램 오류 해결)
  const shareWithFile = async () => {
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

      if (nav.canShare && nav.canShare(shareOptions)) {
        await nav.share(shareOptions);
      } else {
        // 파일 공유 미지원 시 텍스트만 공유
        await nav.share({
          title: "",
          text: shareData.text,
          url: shareData.url
        });
      }
      
      // 공유 시도 표시
      setHasShared(true);
      setIsSharing(false);
      
    } catch (error: any) {
      setIsSharing(false);
      if (error.name !== 'AbortError') {
        console.error('공유 오류:', error);
        onError(`공유 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  };

  // 수동 완료 버튼 (백업용)
  const handleManualComplete = () => {
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

      {/* 공유 버튼 */}
      <div className="space-y-4">
        <button
          onClick={shareWithFile}
          disabled={isSharing}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg font-bold text-lg transform transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSharing ? "공유 중..." : "📤 SNS에 공유하기"}
        </button>

        {hasShared && (
          <button
            onClick={handleManualComplete}
            className="w-full bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg font-bold text-lg"
          >
            ✅ 공유 완료했어요!
          </button>
        )}
      </div>
    </div>
  );
} 
