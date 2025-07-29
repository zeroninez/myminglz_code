import React from 'react';
import { notionClient } from '@/lib/notion';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

// TODO: 실제 데이터베이스 설정 후 타입 수정 필요
interface MenuItem {
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category: string;
}

interface StoreDetail {
  name: string;
  address: string;
  operatingHours: string;
  phone: string;
  menu: any[]; // TODO: MenuItem[] 타입으로 수정 필요
  imageUrl: string;
}

interface PageProps {
  params: {
    locationSlug: string;
    storeId: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

async function fetchStoreDetail(storeId: string): Promise<StoreDetail | null> {
  try {
    const response = await notionClient.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
      filter: {
        property: "id",
        rich_text: {
          equals: storeId
        }
      }
    });

    if (!response.results.length) return null;

    // @ts-ignore: Notion DB 설정 전 임시로 any 타입 사용
    const page: any = response.results[0];
    // @ts-ignore: Notion DB 설정 전 임시로 any 타입 사용
    const properties: any = page.properties;

    // TODO: Notion DB 설정 후 타입 안전성 개선 필요
    return {
      name: properties.name?.title?.[0]?.plain_text || '',
      address: properties.address?.rich_text?.[0]?.plain_text || '',
      operatingHours: properties.operatingHours?.rich_text?.[0]?.plain_text || '',
      phone: properties.phone?.phone_number || '',
      menu: properties.menu?.relation || [],
      imageUrl: properties.imageUrl?.url || ''
    };
  } catch (error) {
    console.error('Error fetching store detail:', error);
    return null;
  }
}

export default async function Page({ params, searchParams }: PageProps) {
  const storeDetail = await fetchStoreDetail(params.storeId);

  if (!storeDetail) {
    return <div>스토어 정보를 찾을 수 없습니다.</div>;
  }

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
            src={storeDetail.imageUrl} 
            alt={storeDetail.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <h1 className="text-white text-2xl font-bold">{storeDetail.name}</h1>
          </div>
        </div>

        <div className="mt-4 bg-white/90 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666666">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <p className="text-gray-600">{storeDetail.address}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666666">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <p className="text-gray-600">{storeDetail.operatingHours}</p>
          </div>

          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666666">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
            <p className="text-gray-600">{storeDetail.phone}</p>
          </div>
        </div>

        <div className="mt-4">
          <h2 className="text-xl font-bold mb-3">메뉴</h2>
          <div className="space-y-3">
            {storeDetail.menu.map((menuItem, index) => (
              <div key={index} className="bg-white/90 rounded-lg p-4 flex gap-4">
                <div className="w-[80px] h-[80px] rounded-lg overflow-hidden">
                  <img 
                    src={menuItem.imageUrl} 
                    alt={menuItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{menuItem.name}</h3>
                    <p className="text-[#479aff] font-medium">
                      {menuItem.price.toLocaleString()}원
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{menuItem.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
