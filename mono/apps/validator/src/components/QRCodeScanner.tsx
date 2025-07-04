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

              // QR 코드 스캔 (다양한 옵션으로 시도)
              let qrCode = jsQR(
                imageData.data,
                imageData.width,
                imageData.height,
                {
                  inversionAttempts: "dontInvert",
                }
              );

              // 첫 번째 시도 실패 시 색상 반전하여 재시도
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

              // 두 번째 시도 실패 시 모든 옵션으로 재시도
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

              if (qrCode) {
                resolve({ result: qrCode.data, imageUrl });
              } else {
                reject(
                  new Error(
                    "QR 코드를 찾을 수 없습니다. 이미지가 선명하고 QR 코드가 잘 보이는지 확인해주세요."
                  )
                );
              }
            } catch (error) {
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
        {isLoading ? "스캔 중..." : text}
      </button>
    </>
  );
};
