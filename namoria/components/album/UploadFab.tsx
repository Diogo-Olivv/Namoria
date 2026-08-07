"use client";

import { useRef } from "react";
import { useUpload } from "@/lib/hooks/useUpload";
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

  const activeTasks = tasks.filter((t) => t.status !== "done");
  const hasErrors = tasks.some((t) => t.status === "error");

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

      <button
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-label="Enviar mídia"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-3xl text-accent-foreground shadow-lg transition-transform active:scale-95 disabled:opacity-70"
      >
        {isUploading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent-foreground/40 border-t-accent-foreground" />
        ) : (
          "+"
        )}
      </button>

      {tasks.length > 0 && (activeTasks.length > 0 || hasErrors) && (
        <div className="fixed bottom-24 right-6 z-30 w-72 max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-surface p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Enviando</span>
            {!isUploading && (
              <button
                onClick={reset}
                className="text-xs text-muted hover:text-foreground"
              >
                Limpar
              </button>
            )}
          </div>
          <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
            {tasks.map((t) => (
              <li key={t.id} className="text-xs">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-muted">{t.name}</span>
                  <span
                    className={
                      t.status === "error"
                        ? "text-red-400"
                        : t.status === "done"
                          ? "text-green-400"
                          : "text-muted"
                    }
                  >
                    {t.status === "error"
                      ? "erro"
                      : t.status === "done"
                        ? "ok"
                        : `${Math.round(t.progress * 100)}%`}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full ${t.status === "error" ? "bg-red-400" : "bg-accent"}`}
                    style={{ width: `${Math.round(t.progress * 100)}%` }}
                  />
                </div>
                {t.status === "error" && (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="truncate text-red-400">{t.error}</span>
                    <button
                      onClick={() => onRetry(t.id)}
                      disabled={isUploading}
                      className="shrink-0 rounded-md bg-surface-2 px-2 py-0.5 text-xs text-foreground hover:bg-border disabled:opacity-60"
                    >
                      Tentar de novo
                    </button>
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
