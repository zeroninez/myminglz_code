"use client";

import React from 'react';
import { useParams } from 'next/navigation';

interface StoreDetail {
  name: string;
  imageUrl: string;
  address: string;
  operatingHours: string;
  phone: string;
  menu: Array<{
    name: string;
    price: string;
    description: string;
    imageUrl: string;
  }>;
}

// 임시 더미 데이터
const dummyStoreDetail: StoreDetail = {
  name: "카페 예시",
  imageUrl: "/onbording/step1 (2배수).png",
  address: "서울시 강남구 테헤란로 123",
  operatingHours: "매일 09:00 - 21:00",
  phone: "02-1234-5678",
  menu: [
    {
      name: "아메리카노",
      price: "4,500원",
      description: "깊고 진한 맛의 에스프레소",
      imageUrl: "/onbording/step2 (2배수).png"
    },
    {
      name: "카페라떼",
      price: "5,000원",
      description: "부드러운 우유와 에스프레소의 조화",
      imageUrl: "/onbording/step3 (2배수).png"
    }
  ]
};

export default function StoreDetailPage() {
  const params = useParams();
  const { locationSlug } = params;

  return (
    <div className="min-h-screen relative w-[auto] h-[852px] mx-auto overflow-hidden">
      <div className="absolute inset-0" style={{
        background: `linear-gradient(
          to top,
          #b8d8ff 0px,
          #479aff 852px
        )`
      }} />
      <div className="absolute inset-0" style={{
        backgroundImage: `url('/pattern.png')`,
        backgroundRepeat: 'repeat',
        opacity: 0.1
      }} />
      
      <div className="relative z-10 p-4">
        <div className="w-full h-[240px] relative overflow-hidden rounded-lg">
          <img 
            src={dummyStoreDetail.imageUrl} 
            alt={dummyStoreDetail.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <h1 className="text-white text-2xl font-bold">{dummyStoreDetail.name}</h1>
          </div>
        </div>

        <div className="mt-6 space-y-4 bg-white rounded-lg p-4">
          <div>
            <h2 className="text-gray-500">주소</h2>
            <p className="mt-1">{dummyStoreDetail.address}</p>
          </div>
          <div>
            <h2 className="text-gray-500">영업시간</h2>
            <p className="mt-1">{dummyStoreDetail.operatingHours}</p>
          </div>
          <div>
            <h2 className="text-gray-500">전화번호</h2>
            <p className="mt-1">{dummyStoreDetail.phone}</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">메뉴</h2>
          <div className="space-y-4">
            {dummyStoreDetail.menu.map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-4 flex gap-4">
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="text-blue-600 font-bold mt-1">{item.price}</p>
                  <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 