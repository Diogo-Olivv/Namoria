"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type { Album } from "@/lib/types";

export function CreateAlbumButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setTitle("");
      setDescription("");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Não foi possível criar o álbum.");
      return;
    }
    const { album } = (await res.json()) as { album: Album };
    onOpenChange(false);
    router.push(`/album/${album.id}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Button variant="brand" size="lg" onClick={() => setOpen(true)}>
        <Plus />
        Novo álbum
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo álbum</DialogTitle>
          <DialogDescription>
            Dê um nome para guardar as memórias de vocês.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="album-title">Título</Label>
            <Input
              id="album-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="album-desc">Descrição (opcional)</Label>
            <Textarea
              id="album-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter className="mt-1">
            <DialogClose render={<Button type="button" variant="ghost" />}>
              Cancelar
            </DialogClose>
            <Button
              type="submit"
              variant="brand"
              disabled={saving || !title.trim()}
            >
              {saving ? "Criando…" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
