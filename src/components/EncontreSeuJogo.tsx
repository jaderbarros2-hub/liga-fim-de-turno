import Link from "next/link";
import type { Evento } from "@/lib/dados";
import { dataCurta, hora, NOMES_FORMATO } from "@/lib/formato";
import { TIPOS_EVENTO } from "@/lib/tiposEvento";

/** Faixa abaixo do topo: atalhos para a agenda já filtrada, com quantos eventos há de cada tipo. */
export function EncontreSeuJogo({ eventos }: { eventos: Evento[] }) {
  const proximo = eventos[0];
  return (
    <section aria-label="Encontre seu jogo" className="border-b border-borda">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-cinza">
            Encontre seu jogo
          </h2>
          <nav className="flex flex-wrap gap-2">
            {TIPOS_EVENTO.map((t) => {
              const n = eventos.filter(t.filtra).length;
              return (
                <Link
                  key={t.valor}
                  href={`/eventos?tipo=${t.valor}`}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold no-underline ring-1 transition ${
                    n
                      ? "bg-grafite text-gelo ring-borda-forte hover:bg-azul hover:text-white hover:ring-azul"
                      : "text-cinza ring-borda hover:text-gelo"
                  }`}
                >
                  {t.rotulo}
                  {n > 0 && (
                    <span className="rounded-full bg-preto/60 px-1.5 text-xs text-ciano">
                      {n}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        {proximo && (
          <Link
            href={`/eventos/${proximo.slug}`}
            className="group flex shrink-0 flex-col rounded-lg bg-grafite px-5 py-3 text-gelo no-underline ring-1 ring-borda hover:ring-ciano"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-ciano">
              Próximo evento
            </span>
            <span className="font-semibold">
              {dataCurta(proximo.inicio)} · {hora(proximo.inicio)} ·{" "}
              {NOMES_FORMATO[proximo.formato]}{" "}
              <span className="text-ciano transition group-hover:translate-x-1">
                →
              </span>
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}
