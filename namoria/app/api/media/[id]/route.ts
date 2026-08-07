import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/route";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/media/[id]">,
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

  const b = (body ?? {}) as { title?: unknown; taken_at?: unknown };
  const patch: { title?: string | null; taken_at?: string | null } = {};

  if ("title" in b) {
    patch.title =
      typeof b.title === "string" && b.title.trim() ? b.title.trim() : null;
  }
  if ("taken_at" in b) {
    patch.taken_at =
      typeof b.taken_at === "string" && b.taken_at ? b.taken_at : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("media")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ media: data });
}
