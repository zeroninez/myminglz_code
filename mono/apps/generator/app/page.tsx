// apps/generator/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { EnhancedCouponService } from "@repo/api";
import Link from "next/link";

// Local type definition for build stability
interface Location {
  id: string;
  name: string;
  slug: string;
  address?: string;
  description?: string;
}

const couponService = new EnhancedCouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function GeneratorHomePage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total_coupons: 0,
    today_issued: 0,
    active_locations: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 장소 목록 로드
        const locationList = await couponService.getAllLocations();
        setLocations(locationList);

        // 시스템 통계 로드
        const systemStats = await couponService.getSystemStats();
        if (systemStats.success) {
          setStats({
            total_coupons: systemStats.total_coupons,
            today_issued: systemStats.today_issued,
            active_locations: systemStats.active_locations,
          });
        }
      } catch (error) {
        console.error("데이터 로드 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎫 쿠폰 발급 시스템
            </h1>
            <p className="text-gray-600">
              장소를 방문하고 방문 인증 쿠폰을 받아보세요!
            </p>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.total_coupons.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">총 발급된 쿠폰</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.today_issued.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">오늘 발급</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl mb-2">📍</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.active_locations}
            </div>
            <div className="text-sm text-gray-600">등록된 장소</div>
          </div>
        </div>

        {/* 장소 목록 */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🗺️ 방문할 수 있는 장소들
          </h2>

          {locations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏗️</div>
              <p className="text-gray-600">아직 등록된 장소가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
            </div>
          )}
        </div>

        {/* 사용 안내 */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            💡 이용 방법
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="bg-emerald-100 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <div>
                  <h4 className="font-medium text-gray-900">장소 방문</h4>
                  <p className="text-sm text-gray-600">
                    위의 장소 중 하나를 선택하여 방문하세요
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-emerald-100 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </span>
                <div>
                  <h4 className="font-medium text-gray-900">쿠폰 발급</h4>
                  <p className="text-sm text-gray-600">
                    장소 페이지에서 방문 인증 쿠폰을 발급받으세요
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="bg-emerald-100 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </span>
                <div>
                  <h4 className="font-medium text-gray-900">가게 방문</h4>
                  <p className="text-sm text-gray-600">
                    해당 장소와 연결된 가게를 방문하세요
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-emerald-100 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  4
                </span>
                <div>
                  <h4 className="font-medium text-gray-900">혜택 받기</h4>
                  <p className="text-sm text-gray-600">
                    쿠폰 코드를 제시하고 특별 혜택을 받으세요
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LocationCardProps {
  location: Location;
}

function LocationCard({ location }: LocationCardProps) {
  const [stores, setStores] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, used: 0, unused: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLocationData = async () => {
      try {
        // 연결된 가게들 조회
        const storeList = await couponService.getStoresByLocation(
          location.slug
        );
        setStores(storeList);

        // 장소별 통계 조회
        const locationStats = await couponService.getLocationStats(
          location.slug
        );
        if (locationStats.success) {
          setStats({
            total: locationStats.total,
            used: locationStats.used,
            unused: locationStats.unused,
          });
        }
      } catch (error) {
        console.error("장소 데이터 로드 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocationData();
  }, [location.slug]);

  return (
    <Link href={`/${location.slug}`}>
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">📍</div>
          <h3 className="text-lg font-bold text-gray-900">{location.name}</h3>
          {location.description && (
            <p className="text-sm text-gray-600 mt-1">{location.description}</p>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : (
          <>
            {/* 연결된 가게 수 */}
            <div className="bg-white rounded-lg p-3 mb-3">
              <div className="text-sm text-gray-600 mb-1">연결된 가게</div>
              <div className="text-xl font-bold text-emerald-600">
                {stores.length}곳
              </div>
            </div>

            {/* 쿠폰 통계 */}
            <div className="bg-white rounded-lg p-3">
              <div className="text-sm text-gray-600 mb-1">발급된 쿠폰</div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-blue-600">
                  {stats.total}
                </span>
                <span className="text-xs text-gray-500">
                  사용: {stats.used} / 미사용: {stats.unused}
                </span>
              </div>
            </div>
          </>
        )}

        <div className="mt-4 pt-4 border-t border-emerald-200">
          <div className="bg-emerald-500 text-white text-center py-2 rounded-lg font-medium">
            🎁 쿠폰 받으러 가기
          </div>
        </div>
      </div>
    </Link>
  );
}