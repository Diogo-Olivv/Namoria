"use client";

import { useCallback, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Keyboard } from "swiper/modules";
import { Download, X } from "lucide-react";
import "swiper/css";
import { Button } from "@/components/ui/button";
import { signKey } from "@/lib/sign";
import type { Media } from "@/lib/types";

export function Viewer({
  media,
  startIndex,
  displayUrls,
  onClose,
}: {
  media: Media[];
  startIndex: number;
  displayUrls: Record<string, string>;
  onClose: () => void;
}) {
  const [active, setActive] = useState(startIndex);
  // Presigned GET of original_key, signed lazily per video slide.
  const [originalUrls, setOriginalUrls] = useState<Record<string, string>>({});
  const [downloading, setDownloading] = useState(false);

  const current = media[active];

  // Lock body scroll while the fullscreen viewer is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Sign the original for the active video (needed for <video> playback).
  useEffect(() => {
    if (current?.type !== "video") return;
    if (originalUrls[current.original_key]) return;
    let cancelled = false;
    void signKey(current.original_key).then((url) => {
      if (!cancelled) {
        setOriginalUrls((prev) => ({ ...prev, [current.original_key]: url }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [current, originalUrls]);

  const download = useCallback(async () => {
    if (!current) return;
    setDownloading(true);
    try {
      const url =
        originalUrls[current.original_key] ??
        (await signKey(current.original_key));
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = current.original_key.split("/").pop() ?? "original";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } finally {
      setDownloading(false);
    }
  }, [current, originalUrls]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3">
        <span className="rounded-md bg-white/10 px-2.5 py-1 text-sm text-white/90 backdrop-blur tabular-nums">
          {active + 1} / {media.length}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={download}
            disabled={downloading}
            className="border-0 bg-white/10 text-white backdrop-blur hover:bg-white/20"
          >
            <Download />
            {downloading ? "Baixando…" : "Baixar original"}
          </Button>
          <Button
            size="icon-sm"
            aria-label="Fechar"
            onClick={onClose}
            className="border-0 bg-white/10 text-white backdrop-blur hover:bg-white/20"
          >
            <X />
          </Button>
        </div>
      </div>

      <Swiper
        modules={[Keyboard]}
        initialSlide={startIndex}
        keyboard={{ enabled: true }}
        onSlideChange={(s) => setActive(s.activeIndex)}
        className="h-full w-full"
      >
        {media.map((m) => {
          const displayUrl = displayUrls[m.display_key];
          const originalUrl = originalUrls[m.original_key];
          return (
            <SwiperSlide
              key={m.id}
              className="flex h-full w-full items-center justify-center"
            >
              {m.type === "video" ? (
                originalUrl ? (
                  <video
                    src={originalUrl}
                    poster={displayUrl}
                    controls
                    playsInline
                    className="max-h-full max-w-full"
                  />
                ) : (
                  <div className="text-white/70">Carregando vídeo…</div>
                )
              ) : displayUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- presigned URL rotates
                <img
                  src={displayUrl}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-white/70">Carregando…</div>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
