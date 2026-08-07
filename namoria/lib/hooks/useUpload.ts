"use client";

import { useCallback, useRef, useState } from "react";
import { useImageCompress } from "@/lib/hooks/useImageCompress";
import { useVideoPoster } from "@/lib/hooks/useVideoPoster";
import { putWithProgress } from "@/lib/upload/put";
import type { Media, MediaType, PresignItem, PresignResult } from "@/lib/types";

export type UploadStatus = "pending" | "processing" | "uploading" | "done" | "error";

export interface UploadTask {
  id: string;
  name: string;
  type: MediaType;
  status: UploadStatus;
  progress: number; // 0..1
  error?: string;
}

function extOf(file: File): string {
  const dot = file.name.lastIndexOf(".");
  const fromName = dot >= 0 ? file.name.slice(dot + 1) : "";
  if (fromName) return fromName.toLowerCase();
  const fromMime = file.type.split("/")[1];
  return (fromMime || "bin").toLowerCase();
}

async function presign(
  albumId: string,
  items: PresignItem[],
): Promise<PresignResult[]> {
  const res = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ albumId, items }),
  });
  if (!res.ok) throw new Error("Falha ao obter URLs de upload");
  const { results } = (await res.json()) as { results: PresignResult[] };
  return results;
}

async function insertMedia(payload: Omit<Media, "id" | "created_at">): Promise<Media> {
  const res = await fetch("/api/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Falha ao salvar metadados");
  const { media } = (await res.json()) as { media: Media };
  return media;
}

/**
 * Orchestrates the full upload for a batch of files:
 * detect type → build web/vault derivatives → presign → parallel PUT (progress)
 * → insert row. Reports per-file status/progress and returns the created rows.
 */
export function useUpload() {
  const { compress } = useImageCompress();
  const { generate } = useVideoPoster();
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  // Retain the source File per task so a failed upload can be retried.
  const filesRef = useRef<Map<string, File>>(new Map());

  const patch = useCallback((id: string, partial: Partial<UploadTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...partial } : t)),
    );
  }, []);

  const uploadOne = useCallback(
    async (albumId: string, task: UploadTask, file: File): Promise<Media> => {
      const isVideo = file.type.startsWith("video/");
      patch(task.id, { status: "processing", progress: 0 });

      // 1. Build derivatives (display + original blobs).
      let displayBlob: Blob;
      let width: number | null;
      let height: number | null;
      let duration: number | null = null;

      if (isVideo) {
        const poster = await generate(file);
        displayBlob = poster.poster;
        width = poster.width;
        height = poster.height;
        duration = poster.duration;
      } else {
        const img = await compress(file);
        displayBlob = img.blob;
        width = img.width;
        height = img.height;
      }

      // 2. Presign both targets.
      const [web, vault] = await presign(albumId, [
        { target: "web", contentType: "image/webp", ext: "webp" },
        { target: "vault", contentType: file.type || "application/octet-stream", ext: extOf(file) },
      ]).then((results) => {
        const web = results.find((r) => r.target === "web");
        const vault = results.find((r) => r.target === "vault");
        if (!web || !vault) throw new Error("Presign incompleto");
        return [web, vault] as const;
      });

      // 3. Parallel upload; combine progress (display is tiny vs original).
      patch(task.id, { status: "uploading", progress: 0 });
      let webFrac = 0;
      let vaultFrac = 0;
      const report = () => patch(task.id, { progress: webFrac * 0.15 + vaultFrac * 0.85 });

      await Promise.all([
        putWithProgress(web.url, displayBlob, "image/webp", (f) => {
          webFrac = f;
          report();
        }),
        putWithProgress(vault.url, file, file.type || "application/octet-stream", (f) => {
          vaultFrac = f;
          report();
        }),
      ]);

      // 4. Persist metadata. Default the moment's date to the file's
      // last-modified time so photos are dated without manual input.
      const media = await insertMedia({
        album_id: albumId,
        type: isVideo ? "video" : "image",
        title: null,
        taken_at: new Date(file.lastModified || Date.now()).toISOString(),
        display_key: web.key,
        original_key: vault.key,
        width,
        height,
        duration,
        mime_type: file.type || null,
        file_size: file.size,
      });

      patch(task.id, { status: "done", progress: 1 });
      return media;
    },
    [compress, generate, patch],
  );

  const upload = useCallback(
    async (albumId: string, files: File[]): Promise<Media[]> => {
      const accepted = files.filter(
        (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
      );
      const initial: UploadTask[] = accepted.map((f, i) => ({
        id: `${Date.now()}-${i}-${f.name}`,
        name: f.name,
        type: f.type.startsWith("video/") ? "video" : "image",
        status: "pending",
        progress: 0,
      }));
      filesRef.current = new Map(initial.map((t, i) => [t.id, accepted[i]]));
      setTasks(initial);
      setIsUploading(true);

      const created: Media[] = [];
      try {
        // Sequential per-file (each already parallelizes its two PUTs) to keep
        // mobile memory/bandwidth sane; failures are isolated per file.
        for (let i = 0; i < accepted.length; i++) {
          const task = initial[i];
          try {
            created.push(await uploadOne(albumId, task, accepted[i]));
          } catch (err) {
            patch(task.id, {
              status: "error",
              error: err instanceof Error ? err.message : "Erro desconhecido",
            });
          }
        }
      } finally {
        setIsUploading(false);
      }
      return created;
    },
    [patch, uploadOne],
  );

  /** Retry a single failed file (source File is retained from the last run). */
  const retry = useCallback(
    async (albumId: string, taskId: string): Promise<Media | null> => {
      const task = tasks.find((t) => t.id === taskId);
      const file = filesRef.current.get(taskId);
      if (!task || !file) return null;
      setIsUploading(true);
      try {
        return await uploadOne(albumId, task, file);
      } catch (err) {
        patch(taskId, {
          status: "error",
          error: err instanceof Error ? err.message : "Erro desconhecido",
        });
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [tasks, uploadOne, patch],
  );

  const reset = useCallback(() => {
    filesRef.current.clear();
    setTasks([]);
  }, []);

  return { upload, retry, reset, tasks, isUploading };
}
