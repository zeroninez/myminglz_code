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
  const shareAttemptRef = useRef<number | null>(null);

  // 앱 전환 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && shareAttemptRef.current) {
        // 공유 시도 후 페이지로 돌아왔을 때
        const timeSinceShare = Date.now() - shareAttemptRef.current;
        
        // 1초 이상 경과했다면 공유 프로세스가 완료된 것으로 간주
        if (timeSinceShare > 1000) {
          // 인스타그램 모달 강제 종료를 위한 포커스 처리
          window.focus();
          // 약간의 지연 후 완료 처리 (모달이 완전히 닫히도록)
          setTimeout(() => {
            setShareCompleted(true);
            onShareCompleted();
            shareAttemptRef.current = null;
            
            // 추가: 현재 공유 다이얼로그 강제 종료 시도
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
            // 추가: body 스크롤 잠금 해제
            document.body.style.overflow = '';
          }, 100);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onShareCompleted]);

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

  // Web Share API
  const shareWithFile = async () => {
    const nav = navigator as any;
    
    if (!nav.share) {
      onError('이 브라우저에서는 공유 기능을 지원하지 않습니다.');
      return;
    }

    setIsSharing(true);
    shareAttemptRef.current = Date.now();  // 공유 시도 시간 기록
    
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

      // 공유 다이얼로그가 닫힐 때까지 대기
      if (nav.canShare && nav.canShare(shareOptions)) {
        await nav.share(shareOptions);
      } else {
        await nav.share({
          title: "",
          text: shareData.text,
          url: shareData.url
        });
      }
      
      // 카카오톡과 같은 즉시 공유의 경우
      if (!document.hidden) {
        setShareCompleted(true);
        onShareCompleted();
        shareAttemptRef.current = null;
      }
      // 인스타그램과 같은 앱 전환이 필요한 경우는 visibility 이벤트에서 처리
      
    } catch (error: any) {
      setIsSharing(false);
      shareAttemptRef.current = null;
      if (error.name !== 'AbortError') {
        console.error('공유 오류:', error);
        onError(`공유 중 오류가 발생했습니다: ${error.message}`);
      }
    }
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
      </div>
    </div>
  );
} 
