import { useCallback } from "react";

// 커스텀 훅 정의
export const useTimestamp = () => {
  const getSimpleTimestamp = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");

    return `${year}${month}${day}${hour}${minute}`;
  }, []);

  const getDetailedTimestamp = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hour}${minute}${second}`;
  }, []);

  const getDateOnly = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}${month}${day}`;
  }, []);

  const generateFilename = useCallback(
    (code: string, extension: string = "png") => {
      return `${code}-${getSimpleTimestamp()}.${extension}`;
    },
    [getSimpleTimestamp]
  );

  return {
    getSimpleTimestamp, // 202501041435
    getDetailedTimestamp, // 202501041435XX (초 포함)
    getDateOnly, // 20250104
    generateFilename, // N261HRYH-202501041435.png
  };
};
