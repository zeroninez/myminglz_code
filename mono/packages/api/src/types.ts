// packages/api/src/types.ts (통합된 버전)

// ===== 기존 타입들 =====
export interface CouponData {
  id?: string;
  code: string;
  is_used: boolean;
  used_at?: string;
  created_at?: string;
}

export interface CouponServiceConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export interface GenerateCodeResult {
  success: boolean;
  code?: string;
  location?: Location; // 확장된 타입 사용
  error?: string;
}

export interface SaveCodeResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ValidateCodeResult {
  success: boolean;
  isValid?: boolean;
  isUsed?: boolean;
  location?: Location; // 확장된 타입 사용
  store?: Store; // 확장된 타입 사용
  message?: string;
  error?: string;
}

// ===== 새로운 확장 타입들 =====
export interface Location {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // 🆕 이미지 관련 필드
  artwork_image_path?: string;
  share_title?: string;
  share_description?: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  location_id: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  location?: Location; // 조인된 데이터
}

export interface EnhancedCouponData {
  id?: string;
  code: string;
  location_id: string;
  store_id?: string;
  is_used: boolean;
  used_at?: string;
  validated_at?: string;
  validated_by_store_id?: string;
  created_at?: string;
  location?: Location;
  store?: Store;
  validated_by_store?: Store;
}

// ===== 결과 타입들 =====
export interface LocationStatsResult {
  success: boolean;
  location?: Location;
  total: number;
  used: number;
  unused: number;
  error?: string;
}

export interface StoreStatsResult {
  success: boolean;
  store?: Store;
  validated: number;
  error?: string;
}

export interface SystemStatsResult {
  success: boolean;
  total_coupons: number;
  used_coupons: number;
  unused_coupons: number;
  usage_rate: number;
  active_locations: number;
  active_stores: number;
  today_issued: number;
  today_used: number;
  error?: string;
}

// ===== 유틸리티 타입들 =====
export interface LocationWithStats extends Location {
  total_coupons: number;
  used_coupons: number;
  usage_rate: number;
}

export interface StoreWithStats extends Store {
  validated_coupons: number;
}

// ===== API 응답 타입들 =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ===== 검색 및 필터 타입들 =====
export interface CouponSearchFilters {
  location_id?: string;
  store_id?: string;
  is_used?: boolean;
  date_from?: string;
  date_to?: string;
  code?: string;
}

export interface LocationSearchFilters {
  is_active?: boolean;
  name?: string;
}

export interface StoreSearchFilters {
  location_id?: string;
  is_active?: boolean;
  name?: string;
}

// ===== 차트/통계 표시용 타입들 =====
export interface DailyStats {
  date: string;
  issued: number;
  used: number;
  usage_rate: number;
}

export interface LocationUsageStats {
  location: Location;
  total: number;
  used: number;
  usage_rate: number;
  daily_stats: DailyStats[];
}

export interface StoreValidationStats {
  store: Store;
  validated: number;
  daily_stats: DailyStats[];
}

// ===== 이벤트 로깅 타입들 (확장 기능용) =====
export interface EventLog {
  id: string;
  event_type:
    | "coupon_generated"
    | "coupon_validated"
    | "coupon_expired"
    | "system_error";
  event_data: Record<string, any>;
  location_id?: string;
  store_id?: string;
  created_at: string;
}

// ===== 설정 타입들 (관리자용) =====
export interface SystemConfig {
  coupon_expiry_days?: number;
  max_coupons_per_day?: number;
  enable_analytics?: boolean;
  enable_email_notifications?: boolean;
}

export interface LocationConfig extends Location {
  config?: {
    brand_color?: string;
    logo_url?: string;
    custom_message?: string;
  };
}

export interface StoreConfig extends Store {
  config?: {
    validation_message?: string;
    success_message?: string;
    failure_message?: string;
  };
}

// ===== 🆕 이미지 관련 타입들 =====
export interface ImageUploadResult {
  success: boolean;
  path?: string;
  publicUrl?: string;
  error?: string;
}

export interface ImageDeleteResult {
  success: boolean;
  error?: string;
}

export interface ImageListResult {
  success: boolean;
  files?: StorageFile[];
  error?: string;
}

export interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at?: string;
  metadata?: {
    eTag: string;
    size: number;
    mimetype: string;
    cacheControl: string;
    lastModified: string;
    contentLength: number;
    httpStatusCode: number;
  };
}

// ===== 🆕 SNS 공유 관련 타입들 =====
export interface ShareData {
  title: string;
  text: string;
  url: string;
  imageUrl?: string;
}

export interface ShareResult {
  success: boolean;
  platform?: 'kakao' | 'instagram' | 'facebook' | 'native' | 'twitter';
  error?: string;
}
