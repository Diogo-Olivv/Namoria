import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlbumHeader } from "@/components/album/AlbumHeader";
import { AlbumView } from "@/components/album/AlbumView";
import type { Album, Media } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AlbumPage({ params }: PageProps<"/album/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: album }, { data: media }] = await Promise.all([
    supabase.from("albums").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("media")
      .select("*")
      .eq("album_id", id)
      .order("taken_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);

  if (!album) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      <Link
        href="/"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Álbuns
      </Link>
      <div className="mt-2 mb-5">
        <AlbumHeader album={album as Album} />
      </div>

      <AlbumView albumId={id} initialMedia={(media ?? []) as Media[]} />
    </div>
  );
}
