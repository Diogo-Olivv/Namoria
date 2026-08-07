"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Album } from "@/lib/types";

export function CreateAlbumButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setTitle("");
    setDescription("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Não foi possível criar o álbum.");
      return;
    }
    const { album } = (await res.json()) as { album: Album };
    close();
    router.push(`/album/${album.id}`);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
      >
        Novo álbum
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={close}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-5"
          >
            <h2 className="mb-4 text-lg font-semibold">Novo álbum</h2>
            <div className="flex flex-col gap-3">
              <input
                autoFocus
                placeholder="Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
              />
              <textarea
                placeholder="Descrição (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-xl px-4 py-2 text-sm text-muted hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
              >
                {saving ? "Criando…" : "Criar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
