import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  CouponServiceConfig,
  GenerateCodeResult,
  SaveCodeResult,
  ValidateCodeResult,
} from "./types";

export class CouponService {
  private supabase: SupabaseClient;

  constructor(config: CouponServiceConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * 유니크한 쿠폰 코드 생성
   */
  async generateCode(): Promise<GenerateCodeResult> {
    try {
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
      };
    } catch (error) {
      return {
        success: false,
        error: "코드 생성 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 생성된 코드를 데이터베이스에 저장
   */
  async saveCode(code: string): Promise<SaveCodeResult> {
    try {
      const { error } = await this.supabase.from("coupons").insert([
        {
          code,
          is_used: false,
        },
      ]);

      if (error) throw error;

      return {
        success: true,
        message: `쿠폰코드: ${code}\n발급이 완료되었습니다!`,
      };
    } catch (error) {
      return {
        success: false,
        error: "코드 저장 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 쿠폰 코드 검증 및 사용 처리
   */
  async validateCode(code: string): Promise<ValidateCodeResult> {
    try {
      const upperCode = code.toUpperCase().trim();

      if (!upperCode) {
        return {
          success: false,
          error: "코드를 입력해주세요.",
        };
      }

      // 코드 조회
      const { data, error } = await this.supabase
        .from("coupons")
        .select("*")
        .eq("code", upperCode)
        .single();

      if (error || !data) {
        return {
          success: true,
          isValid: false,
          message: "유효하지 않은 코드입니다.",
        };
      }

      if (data.is_used) {
        return {
          success: true,
          isValid: true,
          isUsed: true,
          message: "이미 사용된 코드입니다.",
        };
      }

      // 사용 처리
      const { error: updateError } = await this.supabase
        .from("coupons")
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
        })
        .eq("code", upperCode);

      if (updateError) throw updateError;

      return {
        success: true,
        isValid: true,
        isUsed: false,
        message: "✅ 유효한 코드입니다!\n방문이 확인되었습니다.",
      };
    } catch (error) {
      return {
        success: false,
        error: "코드 확인 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 클립보드에 텍스트 복사
   */
  async copyToClipboard(text: string): Promise<boolean> {
    // 브라우저 환경 체크
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // 구버전 브라우저 대응
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
      return false;
    }
  }

  /**
   * 쿠폰 통계 조회
   */
  async getStats() {
    try {
      const { data: totalData } = await this.supabase
        .from("coupons")
        .select("id", { count: "exact" });

      const { data: usedData } = await this.supabase
        .from("coupons")
        .select("id", { count: "exact" })
        .eq("is_used", true);

      return {
        success: true,
        total: totalData?.length || 0,
        used: usedData?.length || 0,
        unused: (totalData?.length || 0) - (usedData?.length || 0),
      };
    } catch (error) {
      return {
        success: false,
        error: "통계 조회 중 오류가 발생했습니다.",
      };
    }
  }
}
