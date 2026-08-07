/**
 * Album cover built from up to 4 media thumbnails, like a gallery app:
 * - 4+ photos  → 2×2 grid ("cross" seams)
 * - 2–3 photos → 2 side by side
 * - 1 photo    → single full-bleed
 * - 0 photos   → blank
 * `urls` are already-signed display URLs (rotating), so we use <img>.
 */
export function CoverCollage({ urls }: { urls: string[] }) {
  const count = urls.length >= 4 ? 4 : urls.length >= 2 ? 2 : urls.length;

  if (count === 0) {
    return <div className="absolute inset-0 bg-muted" />;
  }

  if (count === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- presigned URL rotates
      <img
        src={urls[0]}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    );
  }

  const cells = urls.slice(0, count);
  const gridClass =
    count === 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2";

  return (
    <div
      className={`absolute inset-0 grid ${gridClass} gap-[2px] bg-border transition-transform duration-300 group-hover:scale-105`}
    >
      {cells.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- presigned URL rotates
        <img key={i} src={url} alt="" className="h-full w-full object-cover" />
      ))}
    </div>
  );
}
