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

// three.js touches the DOM/WebGL, so load it only on the client.
const VineScene = dynamic(
  () => import("@/components/landing/VineScene").then((m) => m.VineScene),
  { ssr: false },
);

const BLOOM_AT = 0.94; // progress where the tips converge at the trellis

export function LandingHero() {
  const apiRef = useRef<VineApi | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // These drive BEHAVIOUR only (never className), so there's no SSR/hydration
  // mismatch — the responsive layout below is pure CSS (lg: breakpoints).
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [isDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches,
  );
  // Fewer particles on small screens for a smooth first paint.
  const [nodeCount] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? 48 : 90,
  );

  useEffect(() => {
    if (typeof window === "undefined" || reducedMotion) return;

    // Phones: a gentle autonomous loop (grow → bloom → reset). No scroll-jacking,
    // which felt broken on mobile.
    if (!isDesktop) {
      let raf = 0;
      const start = performance.now();
      const CYCLE = 7000;
      const loop = (now: number) => {
        const t = ((now - start) % CYCLE) / CYCLE;
        const p = t < 0.72 ? t / 0.72 : 1; // grow, then hold bloomed
        apiRef.current?.setProgress(p);
        apiRef.current?.setBloom(p >= BLOOM_AT);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(raf);
    }

    // Desktop: Lenis smooth scroll + ScrollTrigger map the tall track to progress.
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // No GSAP pin: the hero is pinned with CSS `position: sticky` (robust inside
    // flex/Lenis layouts). ScrollTrigger only maps the track's scroll to progress.
    let lastBloom = false;
    const trigger = ScrollTrigger.create({
      trigger: trackRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.1, // inertia: a body with weight, not glued to the scroll
      onUpdate: (self) => {
        const p = self.progress;
        apiRef.current?.setProgress(p);
        const shouldBloom = p >= BLOOM_AT;
        if (shouldBloom !== lastBloom) {
          lastBloom = shouldBloom;
          apiRef.current?.setBloom(shouldBloom); // the flower opens in the scene
        }
      },
    });

    return () => {
      trigger.kill();
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, [reducedMotion, isDesktop]);

  return (
    // On desktop the tall track drives the scroll while the inner hero sticks to
    // the viewport. On mobile (no lg:) it collapses to a normal stacked layout.
    <div ref={trackRef} className="relative lg:h-[250vh]">
      <div className="flex flex-col overflow-hidden lg:sticky lg:top-0 lg:h-screen lg:flex-row">
        {/* Left — text on paper */}
        <div className="relative flex flex-1 items-center px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
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
              livro, um jardim privado que só floresce a dois.
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

        {/* Right — the dusk garden panel (fixed height on mobile, fills on desktop) */}
        <div className="relative h-[58vh] w-full overflow-hidden bg-dusk lg:h-auto lg:min-h-0 lg:flex-1">
          <VineScene apiRef={apiRef} nodeCount={nodeCount} />

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
