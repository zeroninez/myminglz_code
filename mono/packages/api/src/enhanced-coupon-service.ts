// packages/api/src/enhanced-coupon-service.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  CouponServiceConfig,
  GenerateCodeResult,
  SaveCodeResult,
  ValidateCodeResult,
  Location,
  Store,
  EnhancedCouponData,
  LocationStatsResult,
  StoreStatsResult,
  SystemStatsResult,
} from "./types";

export class EnhancedCouponService {
  private supabase: SupabaseClient;

  constructor(config: CouponServiceConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * 장소 정보 조회 (slug로)
   */
  async getLocationBySlug(slug: string): Promise<Location | null> {
    try {
      const { data, error } = await this.supabase
        .from("locations")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error || !data) return null;
      return data;
    } catch (error) {
      console.error("장소 조회 오류:", error);
      return null;
    }
  }

  /**
   * 장소 정보 조회 (ID로)
   */
  async getLocationById(id: string): Promise<Location | null> {
    try {
      const { data, error } = await this.supabase
        .from("locations")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error || !data) return null;
      return data;
    } catch (error) {
      console.error("장소 조회 오류:", error);
      return null;
    }
  }

  /**
   * 가게 정보 조회 (slug로)
   */
  async getStoreBySlug(slug: string): Promise<Store | null> {
    try {
      const { data, error } = await this.supabase
        .from("stores")
        .select(
          `
          *,
          location:locations(*)
        `
        )
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error || !data) return null;
      return data;
    } catch (error) {
      console.error("가게 조회 오류:", error);
      return null;
    }
  }

  /**
   * 장소의 연결된 가게들 조회
   */
  async getStoresByLocation(locationSlug: string): Promise<Store[]> {
    try {
      const location = await this.getLocationBySlug(locationSlug);
      if (!location) return [];

      const { data, error } = await this.supabase
        .from("stores")
        .select(
          `
          *,
          location:locations(*)
        `
        )
        .eq("location_id", location.id)
        .eq("is_active", true)
        .order("name");

      if (error || !data) return [];
      return data;
    } catch (error) {
      console.error("가게 목록 조회 오류:", error);
      return [];
    }
  }

  /**
   * 모든 활성 장소 조회
   */
  async getAllLocations(): Promise<Location[]> {
    try {
      const { data, error } = await this.supabase
        .from("locations")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error || !data) return [];
      return data;
    } catch (error) {
      console.error("장소 목록 조회 오류:", error);
      return [];
    }
  }

  /**
   * 모든 활성 가게 조회
   */
  async getAllStores(): Promise<Store[]> {
    try {
      const { data, error } = await this.supabase
        .from("stores")
        .select(
          `
          *,
          location:locations(*)
        `
        )
        .eq("is_active", true)
        .order("name");

      if (error || !data) return [];
      return data;
    } catch (error) {
      console.error("가게 목록 조회 오류:", error);
      return [];
    }
  }

  /**
   * 특정 장소에서 쿠폰 코드 생성
   */
  async generateCodeForLocation(
    locationSlug: string
  ): Promise<GenerateCodeResult> {
    try {
      const location = await this.getLocationBySlug(locationSlug);
      if (!location) {
        return {
          success: false,
          error: "유효하지 않은 장소입니다.",
        };
      }

      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";

      // 8자리 랜덤 생성
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // 중복 체크
      const { data } = await this.supabase
        .from("coupons")
        .select("code")
        .eq("code", code)
        .single();

      // 중복이면 타임스탬프 추가로 유니크 보장
      const finalCode = data
        ? `${code.slice(0, 4)}${Date.now().toString().slice(-4)}`
        : code;

      return {
        success: true,
        code: finalCode,
        location,
      };
    } catch (error) {
      console.error("코드 생성 오류:", error);
      return {
        success: false,
        error: "코드 생성 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 장소별 코드 저장
   */
  async saveCodeForLocation(
    code: string,
    locationSlug: string
  ): Promise<SaveCodeResult> {
    try {
      const location = await this.getLocationBySlug(locationSlug);
      if (!location) {
        return {
          success: false,
          error: "유효하지 않은 장소입니다.",
        };
      }

      const { error } = await this.supabase.from("coupons").insert([
        {
          code,
          location_id: location.id,
          is_used: false,
        },
      ]);

      if (error) throw error;

      return {
        success: true,
        message: `${location.name} 방문 쿠폰\n코드: ${code}\n발급이 완료되었습니다!`,
      };
    } catch (error) {
      console.error("코드 저장 오류:", error);
      return {
        success: false,
        error: "코드 저장 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 가게에서 쿠폰 코드 검증
   */
  async validateCodeAtStore(
    code: string,
    storeSlug: string
  ): Promise<ValidateCodeResult> {
    try {
      const store = await this.getStoreBySlug(storeSlug);
      if (!store) {
        return {
          success: false,
          error: "유효하지 않은 가게입니다.",
        };
      }

      const upperCode = code.toUpperCase().trim();
      if (!upperCode) {
        return {
          success: false,
          error: "코드를 입력해주세요.",
        };
      }

      // 코드 조회 (해당 가게의 장소에서 발급된 코드만)
      const { data, error } = await this.supabase
        .from("coupons")
        .select(
          `
          *,
          location:locations(*),
          validated_by_store:stores!validated_by_store_id(*)
        `
        )
        .eq("code", upperCode)
        .eq("location_id", store.location_id)
        .single();

      if (error || !data) {
        return {
          success: true,
          isValid: false,
          message: "이 가게에서 사용할 수 없는 코드입니다.",
        };
      }

      if (data.is_used) {
        const usedAtStore = data.validated_by_store?.name || "다른 곳";
        return {
          success: true,
          isValid: true,
          isUsed: true,
          location: data.location,
          store,
          message: `이미 ${usedAtStore}에서 사용된 코드입니다.`,
        };
      }

      // 사용 처리
      const { error: updateError } = await this.supabase
        .from("coupons")
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          validated_at: new Date().toISOString(),
          validated_by_store_id: store.id,
        })
        .eq("code", upperCode);

      if (updateError) throw updateError;

      return {
        success: true,
        isValid: true,
        isUsed: false,
        location: data.location,
        store,
        message: `✅ ${data.location.name} 방문이 확인되었습니다!\n${store.name}에서 사용 완료`,
      };
    } catch (error) {
      console.error("코드 검증 오류:", error);
      return {
        success: false,
        error: "코드 확인 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 장소별 통계 조회
   */
  async getLocationStats(locationSlug: string): Promise<LocationStatsResult> {
    try {
      const location = await this.getLocationBySlug(locationSlug);
      if (!location) {
        return {
          success: false,
          total: 0,
          used: 0,
          unused: 0,
          error: "유효하지 않은 장소입니다.",
        };
      }

      const { data: totalData, count: totalCount } = await this.supabase
        .from("coupons")
        .select("id", { count: "exact" })
        .eq("location_id", location.id);

      const { data: usedData, count: usedCount } = await this.supabase
        .from("coupons")
        .select("id", { count: "exact" })
        .eq("location_id", location.id)
        .eq("is_used", true);

      const total = totalCount || 0;
      const used = usedCount || 0;
      const unused = total - used;

      return {
        success: true,
        location,
        total,
        used,
        unused,
      };
    } catch (error) {
      console.error("장소 통계 조회 오류:", error);
      return {
        success: false,
        total: 0,
        used: 0,
        unused: 0,
        error: "통계 조회 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 가게별 검증 통계 조회
   */
  async getStoreStats(storeSlug: string): Promise<StoreStatsResult> {
    try {
      const store = await this.getStoreBySlug(storeSlug);
      if (!store) {
        return {
          success: false,
          validated: 0,
          error: "유효하지 않은 가게입니다.",
        };
      }

      const { data: validatedData, count: validatedCount } = await this.supabase
        .from("coupons")
        .select("id", { count: "exact" })
        .eq("validated_by_store_id", store.id);

      return {
        success: true,
        store,
        validated: validatedCount || 0,
      };
    } catch (error) {
      console.error("가게 통계 조회 오류:", error);
      return {
        success: false,
        validated: 0,
        error: "통계 조회 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 쿠폰 상세 조회 (관리자용)
   */
  async getCouponDetails(code: string): Promise<EnhancedCouponData | null> {
    try {
      const { data, error } = await this.supabase
        .from("coupons")
        .select(
          `
          *,
          location:locations(*),
          validated_by_store:stores!validated_by_store_id(*)
        `
        )
        .eq("code", code.toUpperCase().trim())
        .single();

      if (error || !data) return null;
      return data;
    } catch (error) {
      console.error("쿠폰 상세 조회 오류:", error);
      return null;
    }
  }

  /**
   * 최근 발급된 쿠폰 목록 (관리자용)
   */
  async getRecentCoupons(limit: number = 50): Promise<EnhancedCouponData[]> {
    try {
      const { data, error } = await this.supabase
        .from("coupons")
        .select(
          `
          *,
          location:locations(*),
          validated_by_store:stores!validated_by_store_id(*)
        `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error || !data) return [];
      return data;
    } catch (error) {
      console.error("최근 쿠폰 조회 오류:", error);
      return [];
    }
  }

  /**
   * 장소별 사용률 통계 (관리자용)
   */
  async getLocationUsageStats(): Promise<
    Array<{
      location: Location;
      total: number;
      used: number;
      usage_rate: number;
    }>
  > {
    try {
      const locations = await this.getAllLocations();
      const stats = [];

      for (const location of locations) {
        const locationStats = await this.getLocationStats(location.slug);
        if (locationStats.success) {
          const usage_rate =
            locationStats.total > 0
              ? Math.round((locationStats.used / locationStats.total) * 100)
              : 0;

          stats.push({
            location,
            total: locationStats.total,
            used: locationStats.used,
            usage_rate,
          });
        }
      }

      return stats.sort((a, b) => b.usage_rate - a.usage_rate);
    } catch (error) {
      console.error("사용률 통계 조회 오류:", error);
      return [];
    }
  }

  /**
   * 가게별 검증 실적 (관리자용)
   */
  async getStoreValidationStats(): Promise<
    Array<{
      store: Store;
      validated: number;
    }>
  > {
    try {
      const stores = await this.getAllStores();
      const stats = [];

      for (const store of stores) {
        const storeStats = await this.getStoreStats(store.slug);
        if (storeStats.success) {
          stats.push({
            store,
            validated: storeStats.validated,
          });
        }
      }

      return stats.sort((a, b) => b.validated - a.validated);
    } catch (error) {
      console.error("가게 검증 통계 조회 오류:", error);
      return [];
    }
  }

  /**
   * 클립보드에 텍스트 복사
   */
  async copyToClipboard(text: string): Promise<boolean> {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        if (typeof document === "undefined") {
          return false;
        }

        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand("copy");
        document.body.removeChild(textArea);
        return result;
      }
    } catch (error) {
      console.error("클립보드 복사 오류:", error);
      return false;
    }
  }

  /**
   * 전체 시스템 통계 (대시보드용)
   */
  async getSystemStats() {
    try {
      // 전체 쿠폰 수
      const { count: totalCoupons } = await this.supabase
        .from("coupons")
        .select("id", { count: "exact" });

      // 사용된 쿠폰 수
      const { count: usedCoupons } = await this.supabase
        .from("coupons")
        .select("id", { count: "exact" })
        .eq("is_used", true);

      // 활성 장소 수
      const { count: activeLocations } = await this.supabase
        .from("locations")
        .select("id", { count: "exact" })
        .eq("is_active", true);

      // 활성 가게 수
      const { count: activeStores } = await this.supabase
        .from("stores")
        .select("id", { count: "exact" })
        .eq("is_active", true);

      // 오늘 발급된 쿠폰 수
      const today = new Date().toISOString().split("T")[0];
      const { count: todayCoupons } = await this.supabase
        .from("coupons")
        .select("id", { count: "exact" })
        .gte("created_at", today);

      // 오늘 사용된 쿠폰 수
      const { count: todayUsed } = await this.supabase
        .from("coupons")
        .select("id", { count: "exact" })
        .gte("validated_at", today)
        .eq("is_used", true);

      const usage_rate =
        (totalCoupons || 0) > 0
          ? Math.round(((usedCoupons || 0) / (totalCoupons || 1)) * 100)
          : 0;

      return {
        success: true,
        total_coupons: totalCoupons || 0,
        used_coupons: usedCoupons || 0,
        unused_coupons: (totalCoupons || 0) - (usedCoupons || 0),
        usage_rate,
        active_locations: activeLocations || 0,
        active_stores: activeStores || 0,
        today_issued: todayCoupons || 0,
        today_used: todayUsed || 0,
      };
    } catch (error) {
      console.error("시스템 통계 조회 오류:", error);
      return {
        success: false,
        total_coupons: 0,
        used_coupons: 0,
        unused_coupons: 0,
        usage_rate: 0,
        active_locations: 0,
        active_stores: 0,
        today_issued: 0,
        today_used: 0,
        error: "통계 조회 중 오류가 발생했습니다.",
      };
    }
  }
}
