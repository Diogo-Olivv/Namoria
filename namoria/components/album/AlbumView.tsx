"use client";

import { useCallback, useEffect, useState } from "react";
import { signKeys } from "@/lib/sign";
import { MediaMasonry } from "@/components/album/MediaMasonry";
import { Viewer } from "@/components/album/Viewer";
import { UploadFab } from "@/components/album/UploadFab";
import type { Media } from "@/lib/types";

export function AlbumView({
  albumId,
  initialMedia,
}: {
  albumId: string;
  initialMedia: Media[];
}) {
  const [media, setMedia] = useState<Media[]>(initialMedia);
  const [displayUrls, setDisplayUrls] = useState<Record<string, string>>({});
  const [signing, setSigning] = useState(initialMedia.length > 0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Batch-sign every display_key (thumb/poster) in one request per view.
  const signDisplays = useCallback(async (items: Media[]) => {
    const keys = items.map((m) => m.display_key);
    if (keys.length === 0) return;
    const urls = await signKeys(keys);
    setDisplayUrls((prev) => ({ ...prev, ...urls }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await signDisplays(initialMedia);
      } finally {
        if (!cancelled) setSigning(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialMedia, signDisplays]);

  const handleUploaded = useCallback(
    (created: Media[]) => {
      if (created.length === 0) return;
      setMedia((prev) => [...created, ...prev]);
      void signDisplays(created);
    },
    [signDisplays],
  );

  return (
    <>
      {media.length === 0 ? (
        <div className="mt-24 flex flex-col items-center gap-2 text-center text-muted">
          <p className="text-lg">Álbum vazio.</p>
          <p className="text-sm">Toque em + para enviar fotos e vídeos.</p>
        </div>
      ) : (
        <MediaMasonry
          media={media}
          displayUrls={displayUrls}
          signing={signing}
          onOpen={setViewerIndex}
        />
      )}

      <UploadFab albumId={albumId} onUploaded={handleUploaded} />

      {viewerIndex !== null && (
        <Viewer
          media={media}
          startIndex={viewerIndex}
          displayUrls={displayUrls}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}
