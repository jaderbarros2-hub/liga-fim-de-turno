import type { Metadata } from "next";
import Link from "next/link";
import { EtiquetaLiga } from "@/components/Eventos";
import { ListaAgenda } from "@/components/ListaAgenda";
import {
  listarEventosEncerrados,
  listarProximosEventos,
  listarResultados,
} from "@/lib/dados";
import { dataCurta } from "@/lib/formato";
import { TIPOS_EVENTO, tipoEvento } from "@/lib/tiposEvento";

export const metadata: Metadata = { title: "Agenda de eventos" };
export const dynamic = "force-dynamic";

export default async function Agenda({
  searchParams,
}: {
  searchParams: Promise<{ liga?: string; tipo?: string }>;
}) {
  const { liga, tipo } = await searchParams;
  // ?liga= continua valendo para links antigos (ex.: página da liga)
  const ligaValida =
    liga === "pauper" || liga === "premodern" || liga === "limited"
      ? liga
      : undefined;
  const filtroTipo = tipoEvento(tipo);
  const [proximos, encerrados] = await Promise.all([
    listarProximosEventos(60, ligaValida),
    listarEventosEncerrados(5),
  ]);
  const eventos = proximos.filter((e) => !filtroTipo || filtroTipo.filtra(e));
  const ultimos = encerrados.filter(
    (e) =>
      (!filtroTipo || filtroTipo.filtra(e)) &&
      (!ligaValida || e.liga.slug === ligaValida),
  );
  const campeoes = await Promise.all(
    ultimos.map(async (e) => (await listarResultados(e.id))[0] ?? null),
  );
  const nenhumFiltro = !filtroTipo && !ligaValida;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="titulo text-5xl">Agenda</h1>
        <p className="text-texto2">
          Os próximos eventos da liga, mês a mês. Escolha um formato para
          filtrar.
        </p>
      </div>

      <nav aria-label="Filtrar eventos" className="flex flex-wrap gap-2">
        {[{ valor: "", rotulo: "Todos" }, ...TIPOS_EVENTO].map((t) => {
          const ativo = t.valor ? t.valor === filtroTipo?.valor : nenhumFiltro;
          return (
            <Link
              key={t.rotulo}
              href={t.valor && !ativo ? `/eventos?tipo=${t.valor}` : "/eventos"}
              className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold no-underline ring-1 ${
                ativo
                  ? "bg-vermelho text-white ring-vermelho"
                  : "text-texto2 ring-borda-forte hover:text-marfim hover:ring-brasa"
              }`}
              aria-current={ativo ? "page" : undefined}
            >
              {t.rotulo}
            </Link>
          );
        })}
      </nav>

      {eventos.length ? (
        <ListaAgenda eventos={eventos} />
      ) : (
        <p className="border-l-2 border-vermelho py-2 pl-4 text-texto2">
          Nenhum evento {filtroTipo ? `de ${filtroTipo.rotulo} ` : ""}na agenda
          agora. A próxima etapa é anunciada primeiro no Discord.{" "}
          {!nenhumFiltro && <Link href="/eventos">Ver todos os eventos →</Link>}
        </p>
      )}

      {ultimos.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-borda pt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="titulo text-3xl">Últimos eventos</h2>
            <Link href="/resultados" className="text-sm font-semibold">
              Todos os resultados →
            </Link>
          </div>
          <ul className="flex flex-col divide-y divide-borda">
            {ultimos.map((e, i) => (
              <li key={e.id}>
                <Link
                  href={`/eventos/${e.slug}?aba=resultados`}
                  className="group flex flex-wrap items-center gap-x-5 gap-y-1 py-3 text-marfim no-underline"
                >
                  <span className="w-14 text-sm font-semibold text-cinza">
                    {dataCurta(e.inicio)}
                  </span>
                  <span className="min-w-48 flex-1 font-semibold group-hover:text-brasa">
                    {e.titulo}
                  </span>
                  {campeoes[i] && (
                    <span className="text-sm text-texto2">
                      Campeão:{" "}
                      <span className="font-semibold text-marfim">
                        {campeoes[i].nick_endstep}
                      </span>
                    </span>
                  )}
                  <EtiquetaLiga evento={e} />
                  <span className="text-sm font-semibold text-brasa">
                    Resultado →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
