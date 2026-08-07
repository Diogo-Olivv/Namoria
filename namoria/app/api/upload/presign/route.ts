import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/route";
import { presignPut, webKey, vaultKey } from "@/lib/r2";
import type { PresignItem, PresignResult } from "@/lib/types";

function isValidItem(x: unknown): x is PresignItem {
  if (typeof x !== "object" || x === null) return false;
  const item = x as Record<string, unknown>;
  return (
    (item.target === "web" || item.target === "vault") &&
    typeof item.contentType === "string" &&
    typeof item.ext === "string"
  );
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

  const { albumId, items } = (body ?? {}) as {
    albumId?: unknown;
    items?: unknown;
  };

  if (typeof albumId !== "string" || !albumId) {
    return NextResponse.json({ error: "albumId is required" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0 || !items.every(isValidItem)) {
    return NextResponse.json({ error: "items is invalid" }, { status: 400 });
  }

  const results: PresignResult[] = await Promise.all(
    items.map(async (item) => {
      const key =
        item.target === "web" ? webKey(albumId) : vaultKey(albumId, item.ext);
      const url = await presignPut(key, item.contentType);
      return { target: item.target, key, url };
    }),
  );

  return NextResponse.json({ results });
}
