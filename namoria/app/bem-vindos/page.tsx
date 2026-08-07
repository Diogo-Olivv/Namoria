import type { Metadata } from "next";
import Link from "next/link";
import { LandingHero } from "@/components/landing/LandingHero";
import { AcanthusRule } from "@/components/landing/Acanthus";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Namoria · Nossos álbuns, só nossos",
  description:
    "Um jardim privado de memórias para casais: guarde fotos e vídeos como quem prensa flores num livro.",
};

const CARDS = [
  {
    title: "Prensado com cuidado",
    body: "Cada foto e vídeo fica guardado em alta qualidade, do jeitinho que vocês viveram o momento.",
  },
  {
    title: "Só de vocês dois",
    body: "Um jardim fechado. Nada é público, nada é sugerido a ninguém. Só quem tem a chave entra.",
  },
  {
    title: "Fácil de colher",
    body: "Envie de qualquer aparelho, organize por álbuns e reencontre as memórias quando quiser.",
  },
];

export default function BemVindosPage() {
  return (
    <main className="flex flex-1 flex-col bg-paper text-ink">
      <LandingHero />

      {/* Content below the hero — where the page continues after the unpin */}
      <section className="mx-auto w-full max-w-4xl px-6 py-24 sm:px-10">
        <AcanthusRule className="mb-14" />
        <h2 className="max-w-2xl font-heading text-4xl leading-tight font-semibold text-forest">
          Um herbário das coisas que valeram a pena.
        </h2>
        <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          {CARDS.map((c) => (
            <div key={c.title} className="bg-card p-7">
              <h3 className="font-heading text-xl font-semibold text-forest">
                {c.title}
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {c.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col items-center text-center">
          <AcanthusRule className="w-full max-w-xs" />
          <p className="mt-10 font-heading text-2xl text-ink italic">
            Comecem o jardim de vocês.
          </p>
          <Button
            variant="brand"
            size="lg"
            nativeButton={false}
            className="mt-6 h-12 px-8 text-base"
            render={<Link href="/login" />}
          >
            Entrar
          </Button>
        </div>
      </section>
    </main>
  );
}
