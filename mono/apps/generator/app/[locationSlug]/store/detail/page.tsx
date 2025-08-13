"use client";

import React from 'react';
import { useParams } from 'next/navigation';

interface StoreDetail {
  name: string;
  tagline: string;
  images: string[];
  address: string;
  operatingHours: string;
  phone: string;
  menu: Array<{
    name: string;
    price: string;
    description: string;
    imageUrl: string;
    isFeatured?: boolean;
  }>;
}

// 임시 더미 데이터 (이미지와 동일한 구조)
const dummyStoreDetail: StoreDetail = {
  name: "CHOI DINING",
  tagline: "매일 기분 좋은 데이트다이닝",
  images: [
    "/onbording/step1 (2배수).png",
    "/onbording/step2 (2배수).png",
    "/onbording/step3 (2배수).png"
  ],
  address: "서울특별시 관악구 관악로14길 28 2층",
  operatingHours: "영업중 22:00 영업 종료",
  phone: "010-0000-0000",
  menu: [
    {
      name: "연어 후토마끼 (5pcs)",
      price: "14,500원",
      description: "숙성 연어를 듬뿍 넣은 일본식 후토마키 정말 맛있어요",
      imageUrl: "/onbording/step1 (2배수).png",
      isFeatured: true
    },
    {
      name: "육회후토마끼",
      price: "14,500원",
      description: "비법 양념으로 버무린 육회를 가득 넣은 후토마끼",
      imageUrl: "/onbording/step2 (2배수).png",
      isFeatured: true
    },
    {
      name: "마제소바",
      price: "13,000원",
      description: "백된장으로 맛을 낸 소스에 칼국수면을 비벼먹는 퓨전 일식소바",
      imageUrl: "/onbording/step3 (2배수).png"
    },
    {
      name: "테스트 1",
      price: "10,000원",
      description: "테스트용 메뉴 1번입니다. 맛있게 드세요!",
      imageUrl: "/onbording/step1 (2배수).png"
    },
    {
      name: "테스트 2",
      price: "12,000원",
      description: "테스트용 메뉴 2번입니다. 정말 맛있어요!",
      imageUrl: "/onbording/step2 (2배수).png"
    },
    {
      name: "테스트 3",
      price: "15,000원",
      description: "테스트용 메뉴 3번입니다. 추천 메뉴입니다!",
      imageUrl: "/onbording/step3 (2배수).png"
    }
  ]
};

export default function StoreDetailPage() {
  const params = useParams();
  const { locationSlug } = params;

  return (
    <div className="min-h-screen bg-white" style={{ overscrollBehavior: 'none' }}>
      {/* 상단 헤더 및 이미지 캐러셀 */}
      <div className="relative w-full h-[400px] overflow-hidden">
        {/* 메인 이미지 */}
        <img 
          src={dummyStoreDetail.images[0]} 
          alt={dummyStoreDetail.name}
          className="w-full h-full object-cover"
        />
        
        {/* 텍스트 오버레이 */}
        <div className="absolute inset-0 bg-black/20">
          <div className="absolute bottom-8 left-6 text-white">
            <p className="text-sm mb-2 text-center">{dummyStoreDetail.tagline}</p>
            <h1 className="text-3xl font-bold">{dummyStoreDetail.name}</h1>
          </div>
        </div>
        
        {/* 이미지 네비게이션 화살표 */}
        <button className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* 가게 기본 정보 */}
      <div className="px-6 py-6 space-y-4">
        {/* 주소 */}
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <span className="text-gray-700">{dummyStoreDetail.address}</span>
        </div>

        {/* 영업시간 */}
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
          </div>
          <span className="text-gray-700">{dummyStoreDetail.operatingHours}</span>
        </div>

        {/* 전화번호 */}
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <span className="text-gray-700">{dummyStoreDetail.phone}</span>
        </div>
      </div>

      {/* 메뉴 목록 */}
      <div className="px-6 pb-6">
        <div className="space-y-4">
          {dummyStoreDetail.menu.map((item, index) => (
            <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              {/* 메뉴 정보 (왼쪽) */}
              <div className="flex-1">
                {/* 대표 메뉴 태그 */}
                {item.isFeatured && (
                  <div className="inline-block px-2 py-1 bg-gray-200 rounded-full text-xs text-gray-600 mb-2">
                    대표
                  </div>
                )}
                
                                 {/* 메뉴명 */}
                 <h3 className="font-bold text-lg mb-2 text-black">{item.name}</h3>
                
                {/* 설명 */}
                <p className="text-gray-600 text-sm mb-3 leading-relaxed">{item.description}</p>
                
                {/* 가격 */}
                <p className="font-bold text-lg text-gray-800">{item.price}</p>
              </div>

              {/* 메뉴 이미지 (오른쪽) */}
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

             {/* 길찾기 버튼 */}
       <div className="fixed bottom-6 left-6 right-6">
         <button 
           onClick={() => {
             // 카카오맵 모바일 웹으로 열기 (앱 전환 최소화)
             const webUrl = `https://m.map.kakao.com/actions/searchView?q=${encodeURIComponent(dummyStoreDetail.address)}&sort=0`;
             window.open(webUrl, '_blank');
           }}
           className="w-full bg-black text-white py-4 rounded-lg font-medium text-lg"
         >
           길찾기
         </button>
       </div>
    </div>
  );
} 