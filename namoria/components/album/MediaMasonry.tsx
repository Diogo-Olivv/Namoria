"use client";

import Masonry from "react-masonry-css";
import { Check, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/format";
import type { Media } from "@/lib/types";

const BREAKPOINTS = { default: 4, 1024: 3, 640: 2 };

function VideoOverlay({ duration }: { duration: number | null }) {
  return (
    <>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-brand flex size-12 items-center justify-center rounded-full text-white shadow-lg">
          <Play className="size-5 translate-x-0.5" fill="currentColor" />
        </div>
      </div>
      <Badge className="absolute right-2 bottom-2 h-6 bg-black/70 px-2 text-sm text-white tabular-nums">
        {formatDuration(duration)}
      </Badge>
    </>
  );
}

function SelectCircle({ selected }: { selected: boolean }) {
  return (
    <div className="absolute top-2 left-2 z-10">
      <div
        className={`flex size-6 items-center justify-center rounded-full border-2 transition-colors ${
          selected
            ? "border-accent bg-accent text-accent-foreground"
            : "border-white/90 bg-black/30"
        }`}
      >
        {selected && <Check className="size-4" strokeWidth={3} />}
      </div>
    </div>
  );
}

export function MediaMasonry({
  media,
  displayUrls,
  signing,
  selectionMode,
  selectedIds,
  onItemClick,
}: {
  media: Media[];
  displayUrls: Record<string, string>;
  signing: boolean;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onItemClick: (index: number) => void;
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
        const isSelected = selectedIds.has(m.id);
        return (
          <button
            key={m.id}
            onClick={() => onItemClick(i)}
            className={`relative block w-full overflow-hidden rounded-xl ring-1 ring-foreground/10 transition-all active:scale-[0.98] ${
              isSelected ? "scale-[0.96] ring-2 ring-accent" : ""
            }`}
            style={{ aspectRatio: ratio }}
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element -- presigned URL rotates
              <img
                src={url}
                alt={m.title ?? ""}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : signing ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}

            {m.type === "video" && url && !selectionMode && (
              <VideoOverlay duration={m.duration} />
            )}

            {selectionMode && <SelectCircle selected={isSelected} />}
            {isSelected && (
              <div className="absolute inset-0 bg-accent/20" />
            )}
          </button>
        );
      })}
    </Masonry>
  );
}
