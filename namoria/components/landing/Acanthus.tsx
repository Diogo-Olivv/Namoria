/**
 * Acanthus line-art corner flourish — the ornamental motif of the reskin.
 * Pure stroke paths (no fill), so it reads as hand-drawn scrollwork, not clip-art.
 * Rotate via `className` (e.g. rotate-90) to place on each corner.
 */
export function AcanthusCorner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <g
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 6 L6 46" />
        <path d="M6 6 L46 6" />
        {/* main scroll curling inward */}
        <path d="M6 30 C 30 30, 40 20, 40 6" opacity="0.85" />
        <path d="M14 14 C 40 16, 58 34, 60 60 C 62 82, 80 92, 104 90" opacity="0.7" />
        {/* acanthus leaf lobes off the scroll */}
        <path d="M60 60 C 52 52, 44 52, 40 60 C 46 62, 54 64, 60 60 Z" opacity="0.6" />
        <path d="M60 60 C 66 50, 76 48, 84 54 C 76 60, 66 64, 60 60 Z" opacity="0.6" />
        <path d="M104 90 C 96 84, 88 86, 86 94 C 92 96, 100 96, 104 90 Z" opacity="0.55" />
        {/* small curl tendril */}
        <path d="M40 6 C 42 14, 36 18, 30 16" opacity="0.6" />
      </g>
    </svg>
  );
}

/** A thin divider with a centered acanthus sprig, for section breaks. */
export function AcanthusRule({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-3 text-forest/40 ${className}`}
      aria-hidden="true"
    >
      <span className="h-px flex-1 bg-current" />
      <svg viewBox="0 0 48 24" fill="none" className="h-4 w-8 shrink-0">
        <g
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M24 4 C 24 12, 24 16, 24 20" />
          <path d="M24 10 C 18 6, 10 8, 6 14 C 14 16, 20 14, 24 10 Z" />
          <path d="M24 10 C 30 6, 38 8, 42 14 C 34 16, 28 14, 24 10 Z" />
        </g>
      </svg>
      <span className="h-px flex-1 bg-current" />
    </div>
  );
}
