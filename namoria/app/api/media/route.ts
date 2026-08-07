import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/route";
import { deleteObjects } from "@/lib/r2";
import type { MediaType } from "@/lib/types";

interface MediaInput {
  album_id: string;
  type: MediaType;
  title: string | null;
  taken_at: string | null;
  display_key: string;
  original_key: string;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  mime_type?: string | null;
  file_size?: number | null;
}

function parseInput(body: unknown): MediaInput | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (
    typeof b.album_id !== "string" ||
    (b.type !== "image" && b.type !== "video") ||
    typeof b.display_key !== "string" ||
    typeof b.original_key !== "string"
  ) {
    return null;
  }
  const num = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  return {
    album_id: b.album_id,
    type: b.type,
    title: typeof b.title === "string" && b.title.trim() ? b.title.trim() : null,
    taken_at: typeof b.taken_at === "string" ? b.taken_at : null,
    display_key: b.display_key,
    original_key: b.original_key,
    width: num(b.width),
    height: num(b.height),
    duration: num(b.duration),
    mime_type: typeof b.mime_type === "string" ? b.mime_type : null,
    file_size: num(b.file_size),
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const input = parseInput(body);
  if (!input) {
    return NextResponse.json({ error: "Invalid media payload" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("media")
    .insert(input)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ media: data }, { status: 201 });
}

/** Bulk delete — body { ids: string[] }. Removes R2 objects then DB rows. */
export async function DELETE(request: NextRequest) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { ids } = (body ?? {}) as { ids?: unknown };
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    !ids.every((id) => typeof id === "string" && id.length > 0)
  ) {
    return NextResponse.json({ error: "ids is invalid" }, { status: 400 });
  }

  // Fetch keys first so we can purge R2 objects, then delete the rows.
  const { data: rows, error: fetchError } = await auth.supabase
    .from("media")
    .select("id, display_key, original_key")
    .in("id", ids as string[]);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 400 });
  }

  const keys = (rows ?? []).flatMap(
    (r) => [
      (r as { display_key: string }).display_key,
      (r as { original_key: string }).original_key,
    ],
  );
  await deleteObjects(keys);

  const { error: delError } = await auth.supabase
    .from("media")
    .delete()
    .in("id", ids as string[]);

  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 400 });
  }

  return NextResponse.json({ deleted: (rows ?? []).length });
}
