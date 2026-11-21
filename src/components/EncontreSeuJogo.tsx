"use client";

import Link from "next/link";
import { useState } from "react";
import { dataCurta, hora } from "@/lib/formato";

export type EventoResumo = {
  slug: string;
  titulo: string;
  inicio: string;
  formato: string;
  modalidade: string;
  cidade: string | null;
};

const FORMATOS = [
  { valor: "pauper", rotulo: "Pauper" },
  { valor: "premodern", rotulo: "Premodern" },
  { valor: "draft", rotulo: "Draft" },
  { valor: "selado", rotulo: "Selado" },
  { valor: "cubo", rotulo: "Cubo" },
];

/**
 * Faixa abaixo do topo: escolha o formato e o card ao lado mostra o próximo evento dele.
 * Sem formato escolhido, mostra o próximo evento da agenda.
 */
export function EncontreSeuJogo({ eventos }: { eventos: EventoResumo[] }) {
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const lista = escolhido
    ? eventos.filter((e) => e.formato === escolhido)
    : eventos;
  const proximo = lista[0];
  const nomeEscolhido = FORMATOS.find((f) => f.valor === escolhido)?.rotulo;

  return (
    <section aria-label="Encontre seu jogo" className="border-b border-borda">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-cinza">
            Encontre seu jogo
          </h2>
          <div
            role="radiogroup"
            aria-label="Formato"
            className="flex flex-wrap gap-2"
          >
            {FORMATOS.map((f) => {
              const n = eventos.filter((e) => e.formato === f.valor).length;
              const ativo = escolhido === f.valor;
              return (
                <button
                  key={f.valor}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => setEscolhido(ativo ? null : f.valor)}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 transition ${
                    ativo
                      ? "bg-azul text-white ring-azul"
                      : n
                        ? "bg-grafite text-gelo ring-borda-forte hover:ring-ciano"
                        : "text-cinza ring-borda hover:text-gelo"
                  }`}
                >
                  {f.rotulo}
                  {n > 0 && (
                    <span
                      className={`rounded-full px-1.5 text-xs ${ativo ? "bg-white/20 text-white" : "bg-preto/60 text-ciano"}`}
                    >
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div aria-live="polite" className="w-full shrink-0 lg:w-80">
          {proximo ? (
            <Link
              href={`/eventos/${proximo.slug}`}
              className="group flex flex-col gap-0.5 rounded-lg bg-grafite px-5 py-3 text-gelo no-underline ring-1 ring-borda hover:ring-ciano"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-ciano">
                {nomeEscolhido
                  ? `Próximo evento de ${nomeEscolhido}`
                  : "Próximo evento"}
              </span>
              <span className="truncate font-semibold">{proximo.titulo}</span>
              <span className="flex items-center justify-between gap-3 text-sm text-texto2">
                <span>
                  {dataCurta(proximo.inicio)} · {hora(proximo.inicio)} ·{" "}
                  {proximo.modalidade === "presencial"
                    ? `Presencial${proximo.cidade ? `, ${proximo.cidade}` : ""}`
                    : "Online"}
                </span>
                <span className="font-semibold text-ciano transition group-hover:translate-x-1">
                  Ver →
                </span>
              </span>
            </Link>
          ) : (
            <div className="flex flex-col gap-1 rounded-lg px-5 py-3 ring-1 ring-borda">
              <span className="text-xs font-bold uppercase tracking-wider text-cinza">
                {nomeEscolhido
                  ? `Próximo evento de ${nomeEscolhido}`
                  : "Próximo evento"}
              </span>
              <span className="text-sm text-texto2">
                Nenhum evento {nomeEscolhido ? `de ${nomeEscolhido} ` : ""}na
                agenda ainda.{" "}
                <Link href="/eventos" className="font-semibold">
                  Ver agenda →
                </Link>
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
