// apps/admin/app/page.tsx (새로운 admin 앱)
"use client";

import React, { useState, useEffect } from "react";
import { EnhancedCouponService, EnhancedCouponData } from "@repo/api";

const couponService = new EnhancedCouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "coupons" | "locations" | "stores"
  >("overview");
  const [systemStats, setSystemStats] = useState<any>({});
  const [recentCoupons, setRecentCoupons] = useState<EnhancedCouponData[]>([]);
  const [locationStats, setLocationStats] = useState<any[]>([]);
  const [storeStats, setStoreStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // 시스템 통계
      const stats = await couponService.getSystemStats();
      if (stats.success) {
        setSystemStats(stats);
      }

      // 최근 쿠폰
      const recent = await couponService.getRecentCoupons(20);
      setRecentCoupons(recent);

      // 장소별 사용률
      const locationUsage = await couponService.getLocationUsageStats();
      setLocationStats(locationUsage);

      // 가게별 검증 실적
      const storeValidation = await couponService.getStoreValidationStats();
      setStoreStats(storeValidation);
    } catch (error) {
      console.error("대시보드 데이터 로드 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드를 로딩하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              📊 관리자 대시보드
            </h1>
            <button
              onClick={loadDashboardData}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              🔄 새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: "overview", label: "📊 전체 현황", name: "전체 현황" },
              { id: "coupons", label: "🎫 쿠폰 관리", name: "쿠폰" },
              { id: "locations", label: "📍 장소 현황", name: "장소" },
              { id: "stores", label: "🏪 가게 현황", name: "가게" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "overview" && <OverviewTab stats={systemStats} />}
        {activeTab === "coupons" && <CouponsTab coupons={recentCoupons} />}
        {activeTab === "locations" && (
          <LocationsTab locations={locationStats} />
        )}
        {activeTab === "stores" && <StoresTab stores={storeStats} />}
      </div>
    </div>
  );
}

// 전체 현황 탭
function OverviewTab({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="총 발급 쿠폰"
          value={stats.total_coupons?.toLocaleString() || "0"}
          icon="🎫"
          color="blue"
        />
        <StatCard
          title="사용된 쿠폰"
          value={stats.used_coupons?.toLocaleString() || "0"}
          icon="✅"
          color="green"
        />
        <StatCard
          title="전체 사용률"
          value={`${stats.usage_rate || 0}%`}
          icon="📊"
          color="purple"
        />
        <StatCard
          title="오늘 발급"
          value={stats.today_issued?.toLocaleString() || "0"}
          icon="📅"
          color="orange"
        />
      </div>

      {/* 오늘의 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📅 오늘의 현황
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">발급된 쿠폰</span>
              <span className="text-2xl font-bold text-blue-600">
                {stats.today_issued || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">사용된 쿠폰</span>
              <span className="text-2xl font-bold text-green-600">
                {stats.today_used || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">오늘 사용률</span>
              <span className="text-2xl font-bold text-purple-600">
                {stats.today_issued > 0
                  ? Math.round((stats.today_used / stats.today_issued) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🏢 시스템 현황
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">등록된 장소</span>
              <span className="text-2xl font-bold text-indigo-600">
                {stats.active_locations || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">등록된 가게</span>
              <span className="text-2xl font-bold text-pink-600">
                {stats.active_stores || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">미사용 쿠폰</span>
              <span className="text-2xl font-bold text-gray-600">
                {stats.unused_coupons || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 쿠폰 관리 탭
function CouponsTab({ coupons }: { coupons: EnhancedCouponData[] }) {
  const [searchCode, setSearchCode] = useState("");
  const [searchResult, setSearchResult] = useState<EnhancedCouponData | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);

  const searchCoupon = async () => {
    if (!searchCode.trim()) return;

    setIsSearching(true);
    try {
      const result = await couponService.getCouponDetails(searchCode.trim());
      setSearchResult(result);
    } catch (error) {
      console.error("쿠폰 검색 오류:", error);
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 쿠폰 검색 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔍 쿠폰 검색
        </h3>
        <div className="flex space-x-4">
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
            placeholder="쿠폰 코드 입력 (예: ABC12345)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            onKeyPress={(e) => e.key === "Enter" && searchCoupon()}
          />
          <button
            onClick={searchCoupon}
            disabled={isSearching || !searchCode.trim()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSearching ? "검색 중..." : "검색"}
          </button>
        </div>

        {searchResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <CouponDetailCard coupon={searchResult} />
          </div>
        )}
      </div>

      {/* 최근 쿠폰 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            📋 최근 발급된 쿠폰
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {coupons.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              발급된 쿠폰이 없습니다.
            </div>
          ) : (
            coupons.map((coupon) => (
              <div key={coupon.id} className="p-6">
                <CouponDetailCard coupon={coupon} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// 장소 현황 탭
function LocationsTab({ locations }: { locations: any[] }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          📍 장소별 사용률 현황
        </h3>
      </div>
      <div className="divide-y divide-gray-200">
        {locations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            등록된 장소가 없습니다.
          </div>
        ) : (
          locations.map((item, index) => (
            <div key={item.location.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {item.location.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {item.location.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600">
                    {item.usage_rate}%
                  </div>
                  <div className="text-sm text-gray-500">
                    사용: {item.used} / 총: {item.total}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.usage_rate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 가게 현황 탭
function StoresTab({ stores }: { stores: any[] }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          🏪 가게별 검증 실적
        </h3>
      </div>
      <div className="divide-y divide-gray-200">
        {stores.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            등록된 가게가 없습니다.
          </div>
        ) : (
          stores.map((item, index) => (
            <div key={item.store.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {item.store.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {item.store.location?.name} • {item.store.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {item.validated}
                  </div>
                  <div className="text-sm text-gray-500">검증 완료</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600",
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

// 쿠폰 상세 카드 컴포넌트
function CouponDetailCard({ coupon }: { coupon: EnhancedCouponData }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg font-bold">{coupon.code}</span>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            coupon.is_used
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {coupon.is_used ? "사용됨" : "미사용"}
        </span>
      </div>

      <div className="text-sm text-gray-600">
        <p>📍 장소: {coupon.location?.name || "알 수 없음"}</p>
        <p>
          📅 발급:{" "}
          {coupon.created_at
            ? new Date(coupon.created_at).toLocaleString("ko-KR")
            : "알 수 없음"}
        </p>
        {coupon.is_used && (
          <>
            <p>
              ✅ 사용:{" "}
              {coupon.used_at
                ? new Date(coupon.used_at).toLocaleString("ko-KR")
                : "알 수 없음"}
            </p>
            <p>🏪 검증처: {coupon.validated_by_store?.name || "알 수 없음"}</p>
          </>
        )}
      </div>
    </div>
  );
}
