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
  message?: string;
  error?: string;
}
