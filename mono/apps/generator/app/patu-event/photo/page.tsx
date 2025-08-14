// apps/generator/app/patu-event/photo/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { EnhancedCouponService } from "@repo/api";
import { PhotoCapture } from "@/components";
import { useRouter } from "next/navigation";

const couponService = new EnhancedCouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export default function PatuPhotoPage() {
  const router = useRouter();
  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    const locationData = await couponService.getLocationBySlug("patu-event");
    setLocation(locationData);
  };

  const handlePhotoUploaded = (imageUrl: string) => {
    sessionStorage.setItem("userPhoto", imageUrl);
    sessionStorage.setItem("locationSlug", "patu-event");
    router.push("/patu-event/success");
  };

  if (!location) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FF6B9D" }}>
      <div className="pt-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">
          Patu 포토존에서 사진을 찍어주세요! 📸
        </h1>
      </div>

      <PhotoCapture
        location={location}
        onPhotoUploaded={handlePhotoUploaded}
        onError={(error) => console.error(error)}
      />
    </div>
  );
}
