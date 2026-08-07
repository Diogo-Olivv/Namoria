"use client";

import { useRef } from "react";
import { Loader2, Plus, RotateCw } from "lucide-react";
import { useUpload } from "@/lib/hooks/useUpload";
import { Button } from "@/components/ui/button";
import type { Media } from "@/lib/types";

export function UploadFab({
  albumId,
  onUploaded,
}: {
  albumId: string;
  onUploaded: (created: Media[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, retry, tasks, isUploading, reset } = useUpload();

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file
    if (files.length === 0) return;
    const created = await upload(albumId, files);
    onUploaded(created);
  }

  async function onRetry(taskId: string) {
    const media = await retry(albumId, taskId);
    if (media) onUploaded([media]);
  }

  const showPanel = tasks.some((t) => t.status !== "done" || isUploading);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={onFiles}
      />

      <Button
        variant="brand"
        size="icon-lg"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-label="Enviar mídia"
        className="fixed right-6 bottom-6 z-30 size-14 rounded-full shadow-xl shadow-brand-pink/25 [&_svg:not([class*='size-'])]:size-6"
      >
        {isUploading ? <Loader2 className="animate-spin" /> : <Plus />}
      </Button>

      {tasks.length > 0 && showPanel && (
        <div className="fixed right-6 bottom-24 z-30 w-72 max-w-[calc(100vw-3rem)] rounded-2xl bg-card p-3 ring-1 ring-foreground/10 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Enviando</span>
            {!isUploading && (
              <button
                onClick={reset}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Limpar
              </button>
            )}
          </div>
          <ul className="flex max-h-56 flex-col gap-2.5 overflow-y-auto">
            {tasks.map((t) => (
              <li key={t.id} className="text-sm">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-muted-foreground">{t.name}</span>
                  <span
                    className={
                      t.status === "error"
                        ? "text-destructive"
                        : t.status === "done"
                          ? "text-brand-blue"
                          : "text-muted-foreground tabular-nums"
                    }
                  >
                    {t.status === "error"
                      ? "erro"
                      : t.status === "done"
                        ? "✓"
                        : `${Math.round(t.progress * 100)}%`}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      t.status === "error" ? "bg-destructive" : "bg-brand"
                    }`}
                    style={{ width: `${Math.round(t.progress * 100)}%` }}
                  />
                </div>
                {t.status === "error" && (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="truncate text-destructive">{t.error}</span>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => onRetry(t.id)}
                      disabled={isUploading}
                    >
                      <RotateCw />
                      Tentar
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
