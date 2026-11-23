import type { Metadata } from "next";
import Link from "next/link";
import { EtiquetaLiga } from "@/components/Eventos";
import { listarEventosEncerrados } from "@/lib/dados";
import { dataCurta } from "@/lib/formato";

export const metadata: Metadata = { title: "Últimos eventos" };
export const dynamic = "force-dynamic";

export default async function Resultados() {
  const eventos = await listarEventosEncerrados(100);
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
      <h1 className="titulo text-6xl">Últimos eventos</h1>
      {eventos.length === 0 ? (
        <p className="rounded-xl border border-borda bg-grafite p-6 text-texto2">
          Os resultados das etapas aparecem aqui depois de cada evento.
        </p>
      ) : (
        <ul className="flex flex-col border-t border-borda">
          {eventos.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-borda py-4"
            >
              <span className="w-20 text-sm font-semibold text-cinza">
                {dataCurta(e.inicio)}
              </span>
              <Link
                href={`/eventos/${e.slug}?aba=resultados`}
                className="min-w-56 flex-1 font-semibold text-marfim no-underline hover:text-brasa"
              >
                {e.titulo}
              </Link>
              <EtiquetaLiga evento={e} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
