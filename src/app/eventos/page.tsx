import type { Metadata } from "next";
import Link from "next/link";
import { ListaEventos } from "@/components/Eventos";
import { listarProximosEventos } from "@/lib/dados";
import { TIPOS_EVENTO, tipoEvento } from "@/lib/tiposEvento";

export const metadata: Metadata = { title: "Agenda de eventos" };
export const dynamic = "force-dynamic";

const FILTROS = [
  { valor: undefined, rotulo: "Todos" },
  { valor: "pauper", rotulo: "Pauper" },
  { valor: "premodern", rotulo: "Premodern" },
  { valor: "limited", rotulo: "Limited" },
];

export default async function Agenda({
  searchParams,
}: {
  searchParams: Promise<{ liga?: string; tipo?: string }>;
}) {
  const { liga, tipo } = await searchParams;
  const ligaValida =
    liga === "pauper" || liga === "premodern" || liga === "limited"
      ? liga
      : undefined;
  const filtroTipo = tipoEvento(tipo);
  const eventos = (await listarProximosEventos(50, ligaValida)).filter(
    (e) => !filtroTipo || filtroTipo.filtra(e),
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
      <h1 className="titulo text-6xl">Agenda</h1>
      <nav aria-label="Filtrar por liga" className="flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const ativo = f.valor === ligaValida && !filtroTipo;
          return (
            <Link
              key={f.rotulo}
              href={f.valor ? `/eventos?liga=${f.valor}` : "/eventos"}
              className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold no-underline ${
                ativo
                  ? "bg-azul text-white"
                  : "border border-borda-forte text-gelo"
              }`}
              aria-current={ativo ? "page" : undefined}
            >
              {f.rotulo}
            </Link>
          );
        })}
      </nav>
      <nav aria-label="Filtrar por tipo" className="-mt-2 flex flex-wrap gap-2">
        {TIPOS_EVENTO.map((t) => {
          const ativo = t.valor === filtroTipo?.valor;
          return (
            <Link
              key={t.valor}
              href={ativo ? "/eventos" : `/eventos?tipo=${t.valor}`}
              className={`inline-flex min-h-9 items-center rounded-full px-3 text-sm font-semibold no-underline ring-1 ${
                ativo
                  ? "bg-ciano text-preto ring-ciano"
                  : "text-texto2 ring-borda hover:text-gelo"
              }`}
              aria-current={ativo ? "page" : undefined}
            >
              {t.rotulo}
            </Link>
          );
        })}
      </nav>
      {eventos.length ? (
        <ListaEventos eventos={eventos} />
      ) : (
        <p className="border-l-2 border-azul py-2 pl-4 text-texto2">
          Nenhum evento {filtroTipo ? `de ${filtroTipo.rotulo}` : ""} na agenda
          agora. <Link href="/eventos">Ver todos os eventos →</Link>
        </p>
      )}
    </div>
  );
}
