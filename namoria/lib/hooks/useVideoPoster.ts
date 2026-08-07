"use client";

import { useCallback } from "react";

export interface VideoPoster {
  poster: Blob;
  width: number;
  height: number;
  duration: number;
}

const MAX_DIMENSION = 1440;
const SEEK_TIME = 1; // seconds — grab a representative frame

/** Extracts a WebP poster (max 1440px) + intrinsic dimensions + duration from a video File. */
export function useVideoPoster() {
  const generate = useCallback((file: File): Promise<VideoPoster> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.src = url;

      const cleanup = () => URL.revokeObjectURL(url);
      const fail = (msg: string) => {
        cleanup();
        reject(new Error(msg));
      };

      video.onloadedmetadata = () => {
        const target = Math.min(
          SEEK_TIME,
          Number.isFinite(video.duration) ? video.duration / 2 : SEEK_TIME,
        );
        // Some browsers need a tick before seeking works reliably.
        video.currentTime = Math.max(0, target);
      };

      video.onseeked = () => {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) return fail("Vídeo sem dimensões");

        const scale = Math.min(1, MAX_DIMENSION / Math.max(vw, vh));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(vw * scale);
        canvas.height = Math.round(vh * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return fail("Canvas indisponível");

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return fail("Falha ao gerar poster");
            cleanup();
            resolve({ poster: blob, width: vw, height: vh, duration: video.duration });
          },
          "image/webp",
          0.82,
        );
      };

      video.onerror = () => fail("Não foi possível carregar o vídeo");
    });
  }, []);

  return { generate };
}
