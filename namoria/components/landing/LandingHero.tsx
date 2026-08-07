"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { Button } from "@/components/ui/button";
import { AcanthusCorner } from "@/components/landing/Acanthus";
import type { VineApi } from "@/components/landing/VineScene";

// three.js touches the DOM/WebGL — load only on the client.
const VineScene = dynamic(
  () => import("@/components/landing/VineScene").then((m) => m.VineScene),
  { ssr: false },
);

const BLOOM_AT = 0.94; // progress where the tips converge at the trellis

export function LandingHero() {
  const apiRef = useRef<VineApi | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // Reduced motion → VineScene self-initialises bloomed; skip the tall scroll
  // track so there's no dead scroll. Lazy init avoids setState-in-effect.
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [bloomed, setBloomed] = useState(() => reducedMotion);
  // Fewer particles on small screens for a smooth first paint.
  const [nodeCount] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? 48 : 90,
  );

  useEffect(() => {
    if (typeof window === "undefined" || reducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    // Lenis smooth scroll, married to the GSAP ticker so the scrub never stutters.
    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // No GSAP pin — the hero is pinned with CSS `position: sticky` (robust inside
    // flex/Lenis layouts). ScrollTrigger only maps the track's scroll to progress.
    let lastBloom = false;
    const trigger = ScrollTrigger.create({
      trigger: trackRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.1, // inertia — a body with weight, not glued to the scroll
      onUpdate: (self) => {
        const p = self.progress;
        apiRef.current?.setProgress(p);
        const shouldBloom = p >= BLOOM_AT;
        if (shouldBloom !== lastBloom) {
          lastBloom = shouldBloom;
          apiRef.current?.setBloom(shouldBloom);
          setBloomed(shouldBloom);
        }
      },
    });

    return () => {
      trigger.kill();
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return (
    // Tall track drives the scroll; the inner hero sticks to the viewport while
    // the track scrolls past. Reduced motion collapses the track to one screen.
    <div
      ref={trackRef}
      className={`relative ${reducedMotion ? "" : "h-[250vh]"}`}
    >
      <div
        className={`flex flex-col overflow-hidden lg:flex-row ${
          reducedMotion ? "min-h-screen" : "sticky top-0 h-screen"
        }`}
      >
        {/* Left — text on paper */}
        <div className="relative flex flex-1 items-center px-6 py-16 sm:px-10 lg:px-16">
          <div className="relative max-w-md">
            <p className="font-mono text-xs tracking-[0.35em] text-forest/70 uppercase">
              Álbum de memórias
            </p>
            <h1 className="mt-5 font-heading text-6xl leading-[0.95] font-semibold text-forest sm:text-7xl">
              Namoria
            </h1>
            <p className="mt-5 font-heading text-2xl text-ink/90 italic">
              Nossos álbuns, só nossos.
            </p>
            <p className="mt-4 max-w-sm text-lg leading-relaxed text-muted-foreground">
              Guarde as fotos e os vídeos de vocês como quem prensa flores num
              livro — um jardim privado que só floresce a dois.
            </p>
            <Button
              variant="brand"
              size="lg"
              nativeButton={false}
              className="mt-8 h-12 px-7 text-base"
              render={<Link href="/login" />}
            >
              Entrar
            </Button>
          </div>
        </div>

        {/* Right — the dusk garden panel */}
        <div className="relative min-h-[52vh] flex-1 overflow-hidden bg-dusk lg:min-h-0">
          <VineScene apiRef={apiRef} nodeCount={nodeCount} />

          {/* Feedback: seal + counter, built from type + light only */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5">
            <span className="font-mono text-xs tracking-[0.3em] text-[#cfe0c4]/70 uppercase">
              Jardim
            </span>
            <span className="font-heading text-4xl tabular-nums text-[#cfe0c4]/80">
              {bloomed ? "01" : "00"}
            </span>
          </div>
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-8 flex justify-center transition-all duration-700 ${
              bloomed ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            <span className="border border-bloom/60 px-4 py-1.5 font-mono text-sm tracking-[0.4em] text-bloom uppercase">
              Floresceu
            </span>
          </div>

          {/* Acanthus corners framing the panel */}
          <AcanthusCorner className="absolute top-3 left-3 h-14 w-14 text-[#cfe0c4]/30" />
          <AcanthusCorner className="absolute top-3 right-3 h-14 w-14 rotate-90 text-[#cfe0c4]/30" />
          <AcanthusCorner className="absolute bottom-3 left-3 h-14 w-14 -rotate-90 text-[#cfe0c4]/30" />
          <AcanthusCorner className="absolute right-3 bottom-3 h-14 w-14 rotate-180 text-[#cfe0c4]/30" />
        </div>
      </div>
    </div>
  );
}
