// apps/validator/src/components/QRCodeScanner.tsx (업데이트된 버전)
import React, { useRef, useState } from "react";
import jsQR from "jsqr";

interface QRCodeScannerProps {
  onScanResult?: (result: string, imageUrl: string) => void;
  onScanError?: (error: string) => void;
  text?: string;
  className?: string;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onScanResult,
  onScanError,
  text = "📷 QR 코드 스캔",
  className = "bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50",
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processQRCode = async (
    file: File
  ): Promise<{ result: string; imageUrl: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas를 생성할 수 없습니다."));
        return;
      }

      // 파일을 base64로 변환하여 이미지 URL 생성
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>): void => {
        if (e.target?.result) {
          const imageUrl = e.target.result as string;
          img.src = imageUrl;

          img.onload = (): void => {
            try {
              // 캔버스 크기 설정
              canvas.width = img.width;
              canvas.height = img.height;

              // 이미지를 캔버스에 그리기
              ctx.drawImage(img, 0, 0);

              // 이미지 데이터 가져오기
              const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );

              // QR 코드 스캔 시도 (여러 옵션으로)
              let qrCode = null;

              // 1차 시도: 기본 설정
              qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });

              // 2차 시도: 색상 반전
              if (!qrCode) {
                qrCode = jsQR(
                  imageData.data,
                  imageData.width,
                  imageData.height,
                  {
                    inversionAttempts: "onlyInvert",
                  }
                );
              }

              // 3차 시도: 모든 옵션
              if (!qrCode) {
                qrCode = jsQR(
                  imageData.data,
                  imageData.width,
                  imageData.height,
                  {
                    inversionAttempts: "attemptBoth",
                  }
                );
              }

              // 4차 시도: 더 작은 영역으로 스캔 (중앙 부분)
              if (!qrCode && canvas.width > 100 && canvas.height > 100) {
                const centerX = Math.floor(canvas.width * 0.25);
                const centerY = Math.floor(canvas.height * 0.25);
                const centerWidth = Math.floor(canvas.width * 0.5);
                const centerHeight = Math.floor(canvas.height * 0.5);

                const centerImageData = ctx.getImageData(
                  centerX,
                  centerY,
                  centerWidth,
                  centerHeight
                );

                qrCode = jsQR(
                  centerImageData.data,
                  centerImageData.width,
                  centerImageData.height,
                  {
                    inversionAttempts: "attemptBoth",
                  }
                );
              }

              if (qrCode && qrCode.data) {
                // QR 코드에서 실제 쿠폰 코드 추출
                let extractedCode = qrCode.data.trim();

                // URL 형태인 경우 마지막 부분에서 코드 추출
                if (extractedCode.includes("/")) {
                  const parts = extractedCode.split("/");
                  extractedCode = parts[parts.length - 1] ?? "";
                }

                // 쿼리 파라미터 제거
                if (extractedCode.includes("?")) {
                  extractedCode = extractedCode.split("?")[0] ?? "";
                }

                // 8자리 영숫자 패턴 검증
                const codePattern = /^[A-Z0-9]{8}$/;
                if (codePattern.test(extractedCode.toUpperCase())) {
                  resolve({
                    result: extractedCode.toUpperCase(),
                    imageUrl,
                  });
                } else {
                  // 패턴이 맞지 않으면 원본 데이터 그대로 반환
                  resolve({
                    result: extractedCode.toUpperCase(),
                    imageUrl,
                  });
                }
              } else {
                reject(
                  new Error(
                    "QR 코드를 찾을 수 없습니다.\n이미지가 선명하고 QR 코드가 잘 보이는지 확인해주세요."
                  )
                );
              }
            } catch (error) {
              console.error("QR 코드 처리 오류:", error);
              reject(new Error("이미지 처리 중 오류가 발생했습니다."));
            }
          };

          img.onerror = (): void => {
            reject(new Error("이미지를 로드할 수 없습니다."));
          };
        }
      };

      reader.onerror = (): void => {
        reject(new Error("파일을 읽을 수 없습니다."));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleScanClick = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      onScanError?.("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    // 파일 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      onScanError?.("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    setIsLoading(true);

    try {
      const { result, imageUrl } = await processQRCode(file);

      // 외부 콜백 호출 (결과값과 이미지 URL 모두 전달)
      onScanResult?.(result, imageUrl);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";

      // 외부 에러 콜백 호출
      onScanError?.(errorMessage);
    } finally {
      setIsLoading(false);
      // 파일 입력 초기화 (같은 파일 재선택 가능)
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      {/* 숨겨진 파일 입력 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* 스캔 버튼 */}
      <button
        onClick={handleScanClick}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>스캔 중...</span>
          </div>
        ) : (
          text
        )}
      </button>
    </>
  );
};
