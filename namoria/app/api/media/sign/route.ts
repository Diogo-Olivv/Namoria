import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/route";
import { presignGet } from "@/lib/r2";

const MAX_KEYS = 200;

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { keys } = (body ?? {}) as { keys?: unknown };
  if (
    !Array.isArray(keys) ||
    keys.length === 0 ||
    keys.length > MAX_KEYS ||
    !keys.every((k) => typeof k === "string" && k.length > 0)
  ) {
    return NextResponse.json({ error: "keys is invalid" }, { status: 400 });
  }

  // De-duplicate before signing so N identical keys cost one signature.
  const unique = Array.from(new Set(keys as string[]));
  const signed = await Promise.all(
    unique.map(async (key) => [key, await presignGet(key)] as const),
  );

  return NextResponse.json({ urls: Object.fromEntries(signed) });
}
