import Link from "next/link";
import type { Evento } from "@/lib/dados";
import { dataCurta, hora, NOMES_FORMATO, reais } from "@/lib/formato";
import { Etiqueta } from "@/components/Botao";

export function EtiquetaLiga({ evento }: { evento: Evento }) {
  return (
    <Etiqueta tipo={evento.liga.slug === "pauper" ? "azul" : "ciano"}>
      {evento.liga.slug === "pauper" ? "Pauper" : `Limited · ${NOMES_FORMATO[evento.formato]}`}
    </Etiqueta>
  );
}

export function ListaEventos({ eventos, vazio }: { eventos: Evento[]; vazio?: string }) {
  if (eventos.length === 0) {
    return (
      <p className="rounded-xl border border-borda bg-grafite p-6 text-texto2">
        {vazio ?? "Nenhum evento agendado no momento. Acompanhe os avisos no Discord da liga."}
      </p>
    );
  }
  return (
    <ol className="flex flex-col border-t border-borda">
      {eventos.map((e, i) => (
        <li
          key={e.id}
          className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-borda py-4"
        >
          <span className="titulo w-12 text-4xl text-azul">{String(i + 1).padStart(2, "0")}</span>
          <span className="w-32 text-sm font-semibold text-cinza">
            {dataCurta(e.inicio)} · {hora(e.inicio)}
          </span>
          <Link href={`/eventos/${e.slug}`} className="min-w-60 flex-1 text-lg font-semibold text-gelo no-underline hover:text-ciano">
            {e.titulo}
          </Link>
          <EtiquetaLiga evento={e} />
          <span className="text-sm text-texto2">{reais(e.valor_centavos)}</span>
          <Link
            href={`/eventos/${e.slug}`}
            className="inline-flex min-h-11 items-center rounded-lg border border-borda-forte px-4 text-sm font-semibold text-gelo no-underline hover:border-ciano"
          >
            {e.status === "aberto" ? "Inscrever" : "Ver evento"}
          </Link>
        </li>
      ))}
    </ol>
  );
}
