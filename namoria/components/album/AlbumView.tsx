"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckSquare, ImagePlus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { signKeys } from "@/lib/sign";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
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

  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelected(new Set());
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleItemClick = useCallback(
    (index: number) => {
      if (selectionMode) toggleSelect(media[index].id);
      else setViewerIndex(index);
    },
    [selectionMode, toggleSelect, media],
  );

  const removeLocal = useCallback((ids: string[]) => {
    const set = new Set(ids);
    setMedia((prev) => prev.filter((m) => !set.has(m.id)));
  }, []);

  const deleteSelected = useCallback(async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setDeleting(true);
    const res = await fetch("/api/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setDeleting(false);
    setConfirmOpen(false);
    if (!res.ok) {
      toast.error("Não foi possível excluir.");
      return;
    }
    removeLocal(ids);
    exitSelection();
    toast.success(
      ids.length === 1 ? "1 item excluído." : `${ids.length} itens excluídos.`,
    );
  }, [selected, removeLocal, exitSelection]);

  const handleUpdated = useCallback((updated: Media) => {
    setMedia((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }, []);

  const handleDeletedOne = useCallback(
    (id: string) => {
      removeLocal([id]);
      setViewerIndex(null);
    },
    [removeLocal],
  );

  const selectedCount = selected.size;
  const selectedIds = useMemo(() => selected, [selected]);

  return (
    <>
      {media.length > 0 && (
        <div className="mb-3 flex h-9 items-center justify-between">
          {selectionMode ? (
            <>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Cancelar seleção"
                  onClick={exitSelection}
                >
                  <X />
                </Button>
                <span className="text-base font-medium">
                  {selectedCount} selecionada{selectedCount === 1 ? "" : "s"}
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                disabled={selectedCount === 0}
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 />
                Excluir
              </Button>
            </>
          ) : (
            <>
              <span className="text-base text-muted-foreground">
                {media.length} {media.length === 1 ? "item" : "itens"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectionMode(true)}
              >
                <CheckSquare />
                Selecionar
              </Button>
            </>
          )}
        </div>
      )}

      {media.length === 0 ? (
        <div className="mt-20 flex flex-col items-center gap-2 text-center">
          <div className="bg-brand flex size-16 items-center justify-center rounded-2xl text-white shadow-lg shadow-brand-pink/20">
            <ImagePlus className="size-8" />
          </div>
          <p className="mt-2 text-xl font-medium">Álbum vazio</p>
          <p className="text-base text-muted-foreground">
            Toque em + para enviar fotos e vídeos.
          </p>
        </div>
      ) : (
        <MediaMasonry
          media={media}
          displayUrls={displayUrls}
          signing={signing}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onItemClick={handleItemClick}
        />
      )}

      {!selectionMode && (
        <UploadFab albumId={albumId} onUploaded={handleUploaded} />
      )}

      {viewerIndex !== null && (
        <Viewer
          media={media}
          startIndex={viewerIndex}
          displayUrls={displayUrls}
          onClose={() => setViewerIndex(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeletedOne}
        />
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {selectedCount}{" "}
              {selectedCount === 1 ? "item" : "itens"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Os arquivos originais também serão apagados. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={deleteSelected}
            >
              {deleting ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
