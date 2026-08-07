import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
      .order("created_at", { ascending: false }),
  ]);

  if (!album) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      <div className="mb-4">
        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Álbuns
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{(album as Album).title}</h1>
        {(album as Album).description && (
          <p className="mt-1 text-muted-foreground">
            {(album as Album).description}
          </p>
        )}
      </div>

      <AlbumView albumId={id} initialMedia={(media ?? []) as Media[]} />
    </div>
  );
}
