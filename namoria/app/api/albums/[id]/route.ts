import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/route";
import { deleteObjects } from "@/lib/r2";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/albums/[id]">,
) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = (body ?? {}) as { title?: unknown; description?: unknown };
  const patch: { title?: string; description?: string | null } = {};

  if ("title" in b) {
    if (typeof b.title !== "string" || b.title.trim() === "") {
      return NextResponse.json({ error: "title inválido" }, { status: 400 });
    }
    patch.title = b.title.trim();
  }
  if ("description" in b) {
    patch.description =
      typeof b.description === "string" && b.description.trim()
        ? b.description.trim()
        : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("albums")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ album: data });
}

/** Deletes an album, its media rows (FK cascade) and all their R2 objects. */
export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/albums/[id]">,
) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  // Collect keys before deleting so we can purge R2.
  const { data: rows } = await auth.supabase
    .from("media")
    .select("display_key, original_key")
    .eq("album_id", id);

  const keys = (rows ?? []).flatMap((r) => [
    (r as { display_key: string }).display_key,
    (r as { original_key: string }).original_key,
  ]);
  await deleteObjects(keys);

  const { error } = await auth.supabase.from("albums").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ deleted: true });
}
