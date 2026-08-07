"use client";

import { useRef, useState } from "react";
import { CalendarDays, Loader2, Plus, RotateCw } from "lucide-react";
import { useUpload } from "@/lib/hooks/useUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toDateInput, fromDateInput } from "@/lib/format";
import type { Media } from "@/lib/types";

const today = () => toDateInput(new Date().toISOString());

export function UploadFab({
  albumId,
  onUploaded,
}: {
  albumId: string;
  onUploaded: (created: Media[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, retry, tasks, isUploading, reset } = useUpload();

  // Files wait in a staging dialog so the couple can date the batch before send.
  const [pending, setPending] = useState<File[] | null>(null);
  const [dateValue, setDateValue] = useState(today);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file
    if (files.length === 0) return;
    // Default to the file's own date (last-modified); fall back to today.
    const ms = files[0].lastModified;
    setDateValue(ms ? toDateInput(new Date(ms).toISOString()) : today());
    setPending(files);
  }

  async function confirmUpload(e: React.FormEvent) {
    e.preventDefault();
    const files = pending ?? [];
    setPending(null);
    const created = await upload(albumId, files, fromDateInput(dateValue));
    onUploaded(created);
  }

  async function onRetry(taskId: string) {
    const media = await retry(albumId, taskId);
    if (media) onUploaded([media]);
  }

  const showPanel = tasks.some((t) => t.status !== "done" || isUploading);
  const pendingCount = pending?.length ?? 0;

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

      {/* Date picker before uploading the selected batch */}
      <Dialog
        open={pending !== null}
        onOpenChange={(o) => !o && setPending(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Data do momento</DialogTitle>
            <DialogDescription>
              {pendingCount === 1
                ? "1 arquivo selecionado."
                : `${pendingCount} arquivos selecionados.`}{" "}
              Escolha a data para lembrar quando foi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={confirmUpload} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="upload-date">Data</Label>
              <Input
                id="upload-date"
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                className="h-10"
              />
            </div>
            <DialogFooter className="mt-1">
              <DialogClose render={<Button type="button" variant="ghost" />}>
                Cancelar
              </DialogClose>
              <Button type="submit" variant="brand">
                <CalendarDays />
                Enviar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
