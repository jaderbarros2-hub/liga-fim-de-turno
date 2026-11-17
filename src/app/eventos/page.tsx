import type { Metadata } from "next";
import Link from "next/link";
import { ListaEventos } from "@/components/Eventos";
import { listarProximosEventos } from "@/lib/dados";

export const metadata: Metadata = { title: "Agenda de eventos" };
export const dynamic = "force-dynamic";

const FILTROS = [
  { valor: undefined, rotulo: "Todos" },
  { valor: "pauper", rotulo: "Pauper" },
  { valor: "limited", rotulo: "Limited" },
];

export default async function Agenda({ searchParams }: { searchParams: Promise<{ liga?: string }> }) {
  const { liga } = await searchParams;
  const ligaValida = liga === "pauper" || liga === "limited" ? liga : undefined;
  const eventos = await listarProximosEventos(50, ligaValida);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
      <h1 className="titulo text-6xl">Agenda</h1>
      <nav aria-label="Filtrar por liga" className="flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const ativo = f.valor === ligaValida;
          return (
            <Link
              key={f.rotulo}
              href={f.valor ? `/eventos?liga=${f.valor}` : "/eventos"}
              className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold no-underline ${
                ativo ? "bg-azul text-white" : "border border-borda-forte text-gelo"
              }`}
              aria-current={ativo ? "page" : undefined}
            >
              {f.rotulo}
            </Link>
          );
        })}
      </nav>
      <ListaEventos eventos={eventos} />
    </div>
  );
}
