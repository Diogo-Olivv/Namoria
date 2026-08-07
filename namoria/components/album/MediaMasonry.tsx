"use client";

import Masonry from "react-masonry-css";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/format";
import type { Media } from "@/lib/types";

const BREAKPOINTS = { default: 3, 640: 2 };

function VideoOverlay({ duration }: { duration: number | null }) {
  return (
    <>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-brand flex size-11 items-center justify-center rounded-full text-white shadow-lg">
          <Play className="size-5 translate-x-0.5" fill="currentColor" />
        </div>
      </div>
      <Badge className="absolute right-2 bottom-2 bg-black/70 text-white tabular-nums">
        {formatDuration(duration)}
      </Badge>
    </>
  );
}

export function MediaMasonry({
  media,
  displayUrls,
  signing,
  onOpen,
}: {
  media: Media[];
  displayUrls: Record<string, string>;
  signing: boolean;
  onOpen: (index: number) => void;
}) {
  return (
    <Masonry
      breakpointCols={BREAKPOINTS}
      className="masonry-grid"
      columnClassName="masonry-grid_column"
    >
      {media.map((m, i) => {
        const url = displayUrls[m.display_key];
        const ratio = m.width && m.height ? `${m.width} / ${m.height}` : "1 / 1";
        return (
          <button
            key={m.id}
            onClick={() => onOpen(i)}
            className="relative block w-full overflow-hidden rounded-xl ring-1 ring-foreground/10 transition-transform active:scale-[0.98]"
            style={{ aspectRatio: ratio }}
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element -- presigned URL rotates
              <img
                src={url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : signing ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
            {m.type === "video" && url && <VideoOverlay duration={m.duration} />}
          </button>
        );
      })}
    </Masonry>
  );
}
