// apps/validator/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { EnhancedCouponService, Store } from "@repo/api";

import Link from "next/link";

const couponService = new EnhancedCouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function ValidatorHomePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    used_coupons: 0,
    today_used: 0,
    active_stores: 0,
    usage_rate: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 가게 목록 로드
        const storeList = await couponService.getAllStores();
        setStores(storeList);

        // 시스템 통계 로드
        const systemStats = await couponService.getSystemStats();
        if (systemStats.success) {
          setStats({
            used_coupons: systemStats.used_coupons,
            today_used: systemStats.today_used,
            active_stores: systemStats.active_stores,
            usage_rate: systemStats.usage_rate,
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🔍 쿠폰 검증 시스템
            </h1>
            <p className="text-gray-600">
              고객의 방문 인증 쿠폰을 검증하고 혜택을 제공하세요!
            </p>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.used_coupons.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">총 검증 완료</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.today_used.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">오늘 검증</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl mb-2">🏪</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.active_stores}
            </div>
            <div className="text-sm text-gray-600">등록된 가게</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.usage_rate}%
            </div>
            <div className="text-sm text-gray-600">전체 사용률</div>
          </div>
        </div>

        {/* 가게 목록 */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🏪 쿠폰 검증 가능한 가게들
          </h2>

          {stores.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏗️</div>
              <p className="text-gray-600">아직 등록된 가게가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </div>

        {/* 검증 안내 */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            💡 검증 방법
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <div>
                  <h4 className="font-medium text-gray-900">
                    가게 페이지 접속
                  </h4>
                  <p className="text-sm text-gray-600">
                    위의 가게 중 본인의 가게를 선택하세요
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </span>
                <div>
                  <h4 className="font-medium text-gray-900">쿠폰 코드 입력</h4>
                  <p className="text-sm text-gray-600">
                    고객이 제시한 8자리 쿠폰 코드를 입력하세요
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </span>
                <div>
                  <h4 className="font-medium text-gray-900">검증 확인</h4>
                  <p className="text-sm text-gray-600">
                    시스템이 자동으로 쿠폰 유효성을 확인합니다
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  4
                </span>
                <div>
                  <h4 className="font-medium text-gray-900">혜택 제공</h4>
                  <p className="text-sm text-gray-600">
                    유효한 쿠폰이면 고객에게 혜택을 제공하세요
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 주의사항 */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h4 className="font-bold text-yellow-800 mb-2 flex items-center">
            <span className="mr-2">⚠️</span>
            중요 안내사항
          </h4>
          <div className="space-y-2 text-sm text-yellow-700">
            <p>
              • 각 쿠폰은 한 번만 사용 가능하며, 사용 후 재사용할 수 없습니다
            </p>
            <p>• 본인 가게와 연결된 장소의 쿠폰만 검증할 수 있습니다</p>
            <p>• 이미 다른 곳에서 사용된 쿠폰은 검증되지 않습니다</p>
            <p>• 문제가 발생하면 시스템 관리자에게 문의하세요</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StoreCardProps {
  store: Store;
}

function StoreCard({ store }: StoreCardProps) {
  const [stats, setStats] = useState({ validated: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoreStats = async () => {
      try {
        const storeStats = await couponService.getStoreStats(store.slug);
        if (storeStats.success) {
          setStats({ validated: storeStats.validated });
        }
      } catch (error) {
        console.error("가게 통계 로드 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoreStats();
  }, [store.slug]);

  return (
    <Link href={`/${store.slug}`}>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🏪</div>
          <h3 className="text-lg font-bold text-gray-900">{store.name}</h3>
          {store.description && (
            <p className="text-sm text-gray-600 mt-1">{store.description}</p>
          )}
        </div>

        {/* 연결된 장소 정보 */}
        {store.location && (
          <div className="bg-white rounded-lg p-3 mb-3">
            <div className="text-sm text-gray-600 mb-1">연결된 장소</div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">📍</span>
              <span className="font-medium text-blue-600">
                {store.location.name}
              </span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">검증 완료</div>
            <div className="text-xl font-bold text-green-600">
              {stats.validated}개
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="bg-blue-500 text-white text-center py-2 rounded-lg font-medium">
            🔍 검증하러 가기
          </div>
        </div>
      </div>
    </Link>
  );
}
