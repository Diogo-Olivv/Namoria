import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { presignGet } from "@/lib/r2";
import { CreateAlbumButton } from "@/components/CreateAlbumButton";
import type { Album } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("albums")
    .select("*")
    .order("created_at", { ascending: false });
  const albums = (data ?? []) as Album[];

  // Sign covers server-side so the grid paints without a client round-trip.
  const covers = await Promise.all(
    albums.map(async (a) =>
      a.cover_key ? await presignGet(a.cover_key) : null,
    ),
  );

  return (
    <div className="mx-auto w-full max-w-3xl p-4">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Álbuns</h1>
        <CreateAlbumButton />
      </div>

      {albums.length === 0 ? (
        <div className="mt-24 flex flex-col items-center gap-3 text-center text-muted">
          <p className="text-lg">Nenhum álbum ainda.</p>
          <p className="text-sm">Crie o primeiro e comece a guardar memórias.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {albums.map((album, i) => (
            <Link
              key={album.id}
              href={`/album/${album.id}`}
              className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-border bg-surface"
            >
              {covers[i] ? (
                // eslint-disable-next-line @next/next/no-img-element -- presigned URL rotates; next/image loader can't cache it
                <img
                  src={covers[i]!}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-surface-2 to-surface" />
              )}
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="relative p-4">
                <h2 className="text-lg font-semibold text-white drop-shadow">
                  {album.title}
                </h2>
                {album.description && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-white/80 drop-shadow">
                    {album.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
