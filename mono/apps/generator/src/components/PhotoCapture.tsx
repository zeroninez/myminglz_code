// apps/generator/src/components/PhotoCapture.tsx
"use client";

import React, { useState, useRef, useCallback } from "react";
import { ImageService } from "@repo/api";
import type { Location } from "@repo/api";

interface PhotoCaptureProps {
  location: Location;
  onPhotoUploaded: (imageUrl: string) => void;
  onError: (error: string) => void;
}

const imageService = new ImageService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export function PhotoCapture({ location, onPhotoUploaded, onError }: PhotoCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 카메라 시작
  const startCamera = async () => {
    try {
      setVideoLoaded(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // 후면 카메라 우선
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCapturing(true);
    } catch (error) {
      console.error('카메라 접근 오류:', error);
      onError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
    }
  };

  // 카메라 중지
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
    setVideoLoaded(false);
  };

  // 사진 촬영
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // 캔버스 크기를 비디오 크기에 맞춤
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 비디오 프레임을 캔버스에 그리기
    ctx.drawImage(video, 0, 0);

    // 캔버스를 데이터 URL로 변환
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoDataUrl);
    
    // 카메라 중지
    stopCamera();
  };

  // 사진 다시 찍기
  const retakePhoto = () => {
    setCapturedPhoto(null);
    setVideoLoaded(false);
    startCamera();
  };

  // 파일 선택 (갤러리에서)
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError('이미지 파일만 선택할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCapturedPhoto(result);
    };
    reader.readAsDataURL(file);
  };

  // 이미지 업로드
  const uploadPhoto = async () => {
    if (!capturedPhoto) return;

    setIsUploading(true);
    try {
      // 데이터 URL을 File 객체로 변환
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();
      const file = new File([blob], `${location.slug}-photo-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      // Supabase Storage에 업로드
      const uploadResult = await imageService.uploadImage(
        file,
        `${location.slug}-photo-${Date.now()}.jpg`
      );

      if (uploadResult.success && uploadResult.publicUrl) {
        onPhotoUploaded(uploadResult.publicUrl);
      } else {
        onError(uploadResult.error || '업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      onError('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 컴포넌트 언마운트 시 카메라 정리
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="photo-capture-container">
      {/* 조형물 이미지 표시 */}
      {location.artwork_image_path && (
        <div className="artwork-display mb-6">
          <img 
            src={imageService.getImageUrl(location.artwork_image_path)}
            alt={location.name}
            className="w-full max-w-md mx-auto rounded-lg shadow-lg"
          />
          <p className="text-center mt-2 text-gray-600">
            📸 이 조형물과 함께 사진을 찍어주세요!
          </p>
        </div>
      )}

      {/* 카메라 화면 */}
      {isCapturing && (
        <div className="camera-container mb-4">
          <div className="video-wrapper relative w-full max-w-md mx-auto bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto min-h-[300px] object-cover"
              onLoadedMetadata={() => {
                console.log('비디오 메타데이터 로드됨');
                setVideoLoaded(true);
              }}
              onCanPlay={() => {
                console.log('비디오 재생 가능');
                setVideoLoaded(true);
              }}
            />
            {/* 로딩 표시 */}
            {!videoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
                <div className="text-white text-center">
                  <div className="text-4xl mb-4">📹</div>
                  <div className="text-lg">카메라 로딩 중...</div>
                  <div className="text-sm mt-2 opacity-75">잠시만 기다려주세요</div>
                </div>
              </div>
            )}
          </div>
          <div className="camera-controls mt-4 flex justify-center gap-4">
            <button
              onClick={capturePhoto}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              📸 촬영
            </button>
            <button
              onClick={stopCamera}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 촬영된 사진 */}
      {capturedPhoto && (
        <div className="captured-photo-container mb-4">
          <img
            src={capturedPhoto}
            alt="촬영된 사진"
            className="w-full max-w-md mx-auto rounded-lg shadow-lg"
          />
          <div className="photo-controls mt-4 flex justify-center gap-4">
            <button
              onClick={retakePhoto}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              다시 찍기
            </button>
            <button
              onClick={uploadPhoto}
              disabled={isUploading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold"
            >
              {isUploading ? '업로드 중...' : '업로드'}
            </button>
          </div>
        </div>
      )}

      {/* 카메라 시작 버튼들 */}
      {!isCapturing && !capturedPhoto && (
        <div className="camera-start-container">
          <div className="flex flex-col gap-4 items-center">
            <button
              onClick={startCamera}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg"
            >
              📷 카메라로 촬영하기
            </button>
            
            <div className="text-center text-gray-500">또는</div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg"
            >
              📷 카메라로 촬영하기 (모바일)
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-lg"
            >
              📁 갤러리에서 선택하기
            </button>
            
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* 숨겨진 캔버스 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
} 