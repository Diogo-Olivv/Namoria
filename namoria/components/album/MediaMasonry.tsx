"use client";

import Masonry from "react-masonry-css";
import { formatDuration } from "@/lib/format";
import type { Media } from "@/lib/types";

const BREAKPOINTS = { default: 3, 640: 2 };

function PlayBadge({ duration }: { duration: number | null }) {
  return (
    <>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50">
          <svg viewBox="0 0 24 24" className="h-6 w-6 translate-x-0.5 fill-white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs text-white">
        {formatDuration(duration)}
      </span>
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
            className="relative block w-full overflow-hidden rounded-xl border border-border bg-surface"
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
            ) : (
              <div
                className={`h-full w-full bg-surface-2 ${signing ? "animate-pulse" : ""}`}
              />
            )}
            {m.type === "video" && url && <PlayBadge duration={m.duration} />}
          </button>
        );
      })}
    </Masonry>
  );
}
