"use client";

import { useCallback, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Keyboard } from "swiper/modules";
import { Calendar, Download, Pencil, Trash2, X } from "lucide-react";
import "swiper/css";
import { toast } from "sonner";
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
import { signKey } from "@/lib/sign";
import { formatDate, toDateInput, fromDateInput } from "@/lib/format";
import type { Media } from "@/lib/types";

export function Viewer({
  media,
  startIndex,
  displayUrls,
  onClose,
  onUpdated,
  onDeleted,
}: {
  media: Media[];
  startIndex: number;
  displayUrls: Record<string, string>;
  onClose: () => void;
  onUpdated: (media: Media) => void;
  onDeleted: (id: string) => void;
}) {
  const [active, setActive] = useState(startIndex);
  const [originalUrls, setOriginalUrls] = useState<Record<string, string>>({});
  const [downloading, setDownloading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [delOpen, setDelOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const current = media[active];

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

  function openEdit() {
    setEditTitle(current.title ?? "");
    setEditDate(toDateInput(current.taken_at));
    setEditOpen(true);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/media/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        taken_at: fromDateInput(editDate),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Não foi possível salvar.");
      return;
    }
    const { media: updated } = (await res.json()) as { media: Media };
    onUpdated(updated);
    setEditOpen(false);
    toast.success("Salvo.");
  }

  async function deleteOne() {
    setDeleting(true);
    const res = await fetch("/api/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [current.id] }),
    });
    setDeleting(false);
    setDelOpen(false);
    if (!res.ok) {
      toast.error("Não foi possível excluir.");
      return;
    }
    onDeleted(current.id);
    toast.success("Item excluído.");
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3">
        <span className="rounded-md bg-white/10 px-2.5 py-1 text-sm text-white/90 backdrop-blur tabular-nums">
          {active + 1} / {media.length}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            aria-label="Editar nome e data"
            onClick={openEdit}
            className="size-11 border-0 bg-white/10 text-white backdrop-blur hover:bg-white/20 [&_svg]:size-5"
          >
            <Pencil />
          </Button>
          <Button
            size="icon"
            aria-label="Baixar original"
            onClick={download}
            disabled={downloading}
            className="size-11 border-0 bg-white/10 text-white backdrop-blur hover:bg-white/20 [&_svg]:size-5"
          >
            <Download />
          </Button>
          <Button
            size="icon"
            aria-label="Excluir"
            onClick={() => setDelOpen(true)}
            className="size-11 border-0 bg-white/10 text-white backdrop-blur hover:bg-white/20 [&_svg]:size-5"
          >
            <Trash2 />
          </Button>
          <Button
            size="icon"
            aria-label="Fechar"
            onClick={onClose}
            className="size-11 border-0 bg-white/10 text-white backdrop-blur hover:bg-white/20 [&_svg]:size-5"
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
                    className="h-full w-full object-contain"
                  />
                ) : displayUrl ? (
                  // Show the poster (display_key) while the original is signed.
                  // eslint-disable-next-line @next/next/no-img-element -- presigned URL rotates
                  <img
                    src={displayUrl}
                    alt={m.title ?? ""}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="text-white/70">Carregando vídeo…</div>
                )
              ) : displayUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- presigned URL rotates
                <img
                  src={displayUrl}
                  alt={m.title ?? ""}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-white/70">Carregando…</div>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Caption: name + date — overlaid at the top, below the action icons */}
      {(current.title || current.taken_at) && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] bg-gradient-to-b from-black/70 to-transparent px-4 pt-16 pb-10 text-center">
          {current.title && (
            <p className="font-heading text-xl font-medium text-white drop-shadow">
              {current.title}
            </p>
          )}
          {current.taken_at && (
            <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-white/80">
              <Calendar className="size-4" />
              {formatDate(current.taken_at)}
            </p>
          )}
        </div>
      )}

      {/* Edit name + date */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nome e data</DialogTitle>
            <DialogDescription>
              Ajude a lembrar deste momento.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveEdit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="media-title">Nome</Label>
              <Input
                id="media-title"
                autoFocus
                maxLength={25}
                placeholder="Ex: Nosso primeiro passeio"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-10"
              />
              <span className="self-end text-xs text-muted-foreground tabular-nums">
                {editTitle.length}/25
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="media-date">Data</Label>
              <Input
                id="media-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="h-10"
              />
            </div>
            <DialogFooter className="mt-1">
              <DialogClose render={<Button type="button" variant="ghost" />}>
                Cancelar
              </DialogClose>
              <Button type="submit" variant="brand" disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete single */}
      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este item?</AlertDialogTitle>
            <AlertDialogDescription>
              O arquivo original também será apagado. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={deleteOne}
            >
              {deleting ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
