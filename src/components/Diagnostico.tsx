import Link from "next/link";
import type { Problema } from "@/lib/diagnostico";

/** Lista de pendências de configuração, com o atalho para corrigir. */
export function ListaProblemas({
  problemas,
  vazio,
}: {
  problemas: Problema[];
  vazio?: string;
}) {
  if (!problemas.length)
    return vazio ? (
      <p className="rounded-md border border-ciano/40 bg-ciano/10 p-3 text-sm font-semibold text-ciano">
        {vazio}
      </p>
    ) : null;
  return (
    <ul className="flex flex-col divide-y divide-borda overflow-hidden rounded-xl border border-borda">
      {problemas.map((p, i) => (
        <li
          key={i}
          className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-grafite px-4 py-3 text-sm"
        >
          <span
            className={`rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${p.nivel === "erro" ? "bg-erro/15 text-erro" : "bg-alerta/15 text-alerta"}`}
          >
            {p.nivel === "erro" ? "Corrigir" : "Atenção"}
          </span>
          <span className="flex min-w-60 flex-1 flex-col">
            <span className="font-semibold text-gelo">{p.titulo}</span>
            <span className="text-texto2">{p.detalhe}</span>
          </span>
          {p.link && (
            <Link href={p.link} className="font-semibold">
              {p.acao ?? "Resolver"} →
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
