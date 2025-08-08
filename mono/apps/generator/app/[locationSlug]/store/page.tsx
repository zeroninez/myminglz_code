"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface StoreBenefit {
  id: string;
  name: string;
  description: string;
  condition: string;
  imageUrl: string;
  expireDate?: string; // Added expireDate to the interface
}

export default function StorePage() {
  const params = useParams();
  const locationSlug = params.locationSlug as string;
  const [benefits, setBenefits] = useState<StoreBenefit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBenefits() {
      try {
        const response = await fetch('/api/stores');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || data.details || 'Failed to fetch data');
        }
        
        if (Array.isArray(data)) {
          setBenefits(data);
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          console.error('Received data is not an array:', data);
          setBenefits([]);
        }
      } catch (error) {
        console.error("Error fetching benefits:", error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        setBenefits([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBenefits();
  }, []);

  return (
    <div className="h-full relative w-[auto] mx-auto" style={{
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
      <div className="relative z-10">
        {/* 헤더 */}
        <div className="relative px-5 pt-10 pb-6">
          <button 
            onClick={() => window.location.href = `/${locationSlug}/success`}
            className="absolute left-4 top-10"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-[22px] font-bold text-white text-center">혜택 상점 모아보기</h1>
        </div>

        {/* 설명 텍스트 */}
        <div className="px-5 text-center mb-6">
          <p className="text-[15px] text-white">
            쿠폰에 적용된 상점을 보러 갈까요?<br />
            쿠폰은 상점 중 한 곳만 사용 가능해요!
          </p>
        </div>

        {/* 혜택 목록 컨테이너 */}
        <div className="flex justify-center px-5 pb-20">
          <div className="relative w-[370px]">
            {/* 반투명 배경 컨테이너 */}
            <div className="absolute inset-0 bg-[rgba(211,231,255,0.3)] rounded-[8px]" />
            
            {/* 혜택 목록 */}
            <div className="relative z-10 p-4 space-y-3">
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : error ? (
                <div className="text-center text-white py-10">
                  <p>{error}</p>
                </div>
              ) : benefits.length === 0 ? (
                <div className="text-center text-white py-10">
                  <p>등록된 혜택이 없습니다.</p>
                </div>
              ) : (
                benefits.map((store, index) => (
                  <div key={store.id} className="flex mb-3">
                    {/* 왼쪽 컨테이너 (썸네일) */}
                    <div className="w-[114px] h-[114px] bg-white rounded-tl-[8px] rounded-bl-[8px] rounded-tr-[8px] rounded-br-[8px] p-[5.5px] flex items-center justify-center">
                      {store.imageUrl ? (
                        <img 
                          src={store.imageUrl}
                          alt={store.name}
                          className="w-[103px] h-[103px] rounded-[8px] object-cover"
                        />
                      ) : (
                        <div className="w-[103px] h-[103px] rounded-[8px] bg-[#479aff]" />
                      )}
                    </div>

                    {/* 점선 구분선 */}
                    <div 
                      className="h-[98px] bg-white my-[8px]"
                      style={{
                        width: '0.3px',
                        borderRight: '0.3px dashed #3B3B3B',
                        WebkitBorderImage: 'repeating-linear-gradient(to bottom, #3B3B3B, #3B3B3B 1px, transparent 3px, transparent 6px) 1'
                      }}
                    />

                    {/* 오른쪽 컨테이너 (내용) */}
                    <div className="w-[224px] h-[114px] bg-white rounded-tl-[8px] rounded-bl-[8px] rounded-tr-[8px] rounded-br-[8px] pl-3 pr-3 pt-2 pb-3 flex flex-col items-start">
                      <div className="flex items-center justify-between w-full">
                        <h3 className="text-[22px] font-medium text-[#479aff]">{store.name}</h3>
                        <div 
                          className="w-[18px] h-[18px] rounded-full bg-[#F6F6F6] flex items-center justify-center cursor-pointer"
                          onClick={() => window.location.href = `/${locationSlug}/store/detail`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999999" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-[15px] text-[#333333] font-medium leading-tight mt-1">{store.description}</p>
                      {store.condition && (
                        <p className="text-[12px] text-[#999999] leading-tight">{store.condition}</p>
                      )}
                      <p className="text-[12px] text-[#999999] leading-tight">{store.expireDate || "2011/11/11까지 사용 가능"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 