"use client";

import React from "react";
import { QRCodeCanvas } from "qrcode.react";

interface GenerateQrCodeProps {
  ref: React.RefObject<HTMLCanvasElement | null>;
  value: string;
  size?: number;
  className?: string;
  bgColor?: string | null;
  fgColor?: string | null;
}

export const GenerateQrCode = ({
  ref,
  value,
  size = 108,
  className = "",
  bgColor = null,
  fgColor = null,
}: GenerateQrCodeProps) => {
  return (
    <div
      className={`w-fit h-fit flex items-center justify-center p-2 ${className}`}
    >
      <QRCodeCanvas
        ref={ref}
        value={value}
        size={size}
        bgColor={bgColor ? bgColor : "transparent"}
        fgColor={fgColor ? fgColor : "black"}
      />
    </div>
  );
};
