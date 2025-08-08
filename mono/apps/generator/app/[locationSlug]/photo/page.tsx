"use client";

import React, { useState, useEffect } from "react";
import { EnhancedCouponService } from "@repo/api";
import { PhotoCapture } from "@/components";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

const couponService = new EnhancedCouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function PhotoPage() {
  const router = useRouter();
  const params = useParams();
  const locationSlug = params.locationSlug as string;
  
  const [location, setLocation] = useState<any>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // 장소 정보 로드
  useEffect(() => {
    const loadLocation = async () => {
      setIsPageLoading(true);
      try {
        const locationData = await couponService.getLocationBySlug(locationSlug);
        if (locationData) {
          setLocation(locationData);
        }
      } catch (error) {
        console.error("장소 로드 오류:", error);
      } finally {
        setIsPageLoading(false);
      }
    };

    if (locationSlug) {
      loadLocation();
    }
  }, [locationSlug]);

  const handlePhotoUploaded = (imageUrl: string, isTimeout?: boolean) => {
    console.log('handlePhotoUploaded 호출됨:', { imageUrl, locationSlug });
    // sessionStorage에 사진 저장
    sessionStorage.setItem('userPhoto', imageUrl);
    sessionStorage.setItem('locationSlug', locationSlug);
    // 바로 success 페이지로 이동
    router.push(`/${locationSlug}/success`);
  };

  const handleError = (error: string) => {
    console.error('에러:', error);
  };

  if (isPageLoading) {
    return <div>로딩 중...</div>;
  }

  if (!location) {
    return <div>장소를 찾을 수 없습니다.</div>;
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
        <PhotoCapture 
          location={location}
          onPhotoUploaded={handlePhotoUploaded}
          onError={handleError}
        />
      </div>
    </div>
  );
} 