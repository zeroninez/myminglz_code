// packages/api/src/image-service.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { CouponServiceConfig } from "./types";

export class ImageService {
  private supabase: SupabaseClient;
  private bucketName = "artwork-image";

  constructor(config: CouponServiceConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * 이미지 업로드
   */
  async uploadImage(file: File, fileName: string): Promise<{
    success: boolean;
    path?: string;
    publicUrl?: string;
    error?: string;
  }> {
    try {
      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          error: "이미지 파일만 업로드 가능합니다."
        };
      }

      // 파일 크기 검증 (10MB 제한)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: "파일 크기는 10MB 이하여야 합니다."
        };
      }

      // 파일 업로드
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(`locations/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true // 같은 이름 파일이 있으면 덮어쓰기
        });

      if (error) {
        console.error("이미지 업로드 오류:", error);
        return {
          success: false,
          error: error.message
        };
      }

      // 공개 URL 가져오기
      const { data: publicData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      return {
        success: true,
        path: data.path,
        publicUrl: publicData.publicUrl
      };

    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      return {
        success: false,
        error: "업로드 중 오류가 발생했습니다."
      };
    }
  }

  /**
   * 이미지 공개 URL 가져오기
   */
  getImageUrl(path: string): string {
    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * 이미지 삭제
   */
  async deleteImage(path: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        console.error("이미지 삭제 오류:", error);
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };

    } catch (error) {
      console.error("이미지 삭제 오류:", error);
      return {
        success: false,
        error: "삭제 중 오류가 발생했습니다."
      };
    }
  }

  /**
   * 버킷 내 모든 이미지 목록 가져오기
   */
  async listImages(folderPath = ""): Promise<{
    success: boolean;
    files?: any[];
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(folderPath);

      if (error) {
        console.error("이미지 목록 조회 오류:", error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        files: data || []
      };

    } catch (error) {
      console.error("이미지 목록 조회 오류:", error);
      return {
        success: false,
        error: "목록 조회 중 오류가 발생했습니다."
      };
    }
  }
} 