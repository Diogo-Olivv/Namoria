"use client";

import { useCallback } from "react";
import imageCompression from "browser-image-compression";

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
}

const MAX_DIMENSION = 1440;

function readDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler as dimensões da imagem"));
    };
    img.src = url;
  });
}

/** Compresses an image File to WebP (max 1440px) and returns blob + dimensions. */
export function useImageCompress() {
  const compress = useCallback(
    async (file: File): Promise<CompressedImage> => {
      const blob = await imageCompression(file, {
        maxWidthOrHeight: MAX_DIMENSION,
        fileType: "image/webp",
        useWebWorker: true,
        initialQuality: 0.82,
      });
      const { width, height } = await readDimensions(blob);
      return { blob, width, height };
    },
    [],
  );

  return { compress };
}
