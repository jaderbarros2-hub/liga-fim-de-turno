import type { Metadata } from "next";
import Link from "next/link";
import { BotaoLink } from "@/components/Botao";
import { Diamante } from "@/components/Diamante";
import { arteFixa, creditoArte, srcArte } from "@/lib/artes";

export const metadata: Metadata = {
  title: "Seja apoiador",
  description:
    "Em breve: o programa de apoiadores da First Strike, com brindes e benefícios para quem ajuda a liga a crescer.",
};

// Página provisória. O esboço completo do programa está em /apoie/esboco.
export default function Apoie() {
  const arte = arteFixa("apoie", "geral");
  return (
    <section className="relative isolate overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={srcArte(arte)}
        alt=""
        style={{ objectPosition: arte.foco }}
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-preto via-preto/85 to-preto/30" />
      <div className="mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-center gap-6 px-6 py-24">
        <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-brasa">
          <Diamante /> Seja apoiador · em breve
        </span>
        <h1 className="titulo max-w-3xl text-6xl sm:text-7xl">
          Em breve, você vai poder fazer parte da liga de um jeito novo.
        </h1>
        <p className="max-w-xl text-lg text-texto2">
          Estamos preparando o programa de apoiadores: uma forma de ajudar a
          liga a crescer e, em troca, ganhar brindes exclusivos e benefícios
          para quem joga com a gente. Aguarde as novidades.
        </p>
        <div className="flex flex-wrap gap-3">
          <BotaoLink href="/contato">Quero ser avisado</BotaoLink>
          <BotaoLink href="/eventos" variante="contorno">
            Enquanto isso, ver a agenda
          </BotaoLink>
        </div>
        <p className="text-sm text-cinza">
          Tem uma loja e quer apoiar a liga?{" "}
          <Link href="/parceiros">Conheça as parcerias →</Link>
        </p>
      </div>
      <span className="absolute bottom-3 right-4 text-[11px] text-white/50">
        {creditoArte(arte)}
      </span>
    </section>
  );
}
