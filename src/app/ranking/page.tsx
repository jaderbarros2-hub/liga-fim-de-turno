import type { Metadata } from "next";
import Link from "next/link";
import { FotoJogador } from "@/components/Jogador";
import { creditoArte, sortearArtes, srcArte } from "@/lib/artes";
import { classificadosPOTY, periodo, ranking, temporadasDisponiveis, TRIMESTRES, VAGAS_POTY } from "@/lib/circuito";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Ranking",
  description: "Ranking da temporada, dos trimestres e a corrida para o Player of the Year.",
};

const LIGAS = [
  { slug: "pauper", nome: "Pauper" },
  { slug: "limited", nome: "Limited" },
];

type Props = { searchParams: Promise<{ liga?: string; temporada?: string; trimestre?: string }> };

export default async function PaginaRanking({ searchParams }: Props) {
  const q = await searchParams;
  const liga = LIGAS.find((l) => l.slug === q.liga)?.slug ?? "pauper";
  const temporadas = await temporadasDisponiveis();
  const atual = periodo(new Date().toISOString());
  const temporada = temporadas.includes(Number(q.temporada)) ? Number(q.temporada) : temporadas.includes(atual.temporada) ? atual.temporada : temporadas[0];
  const trimestre = [1, 2, 3, 4].includes(Number(q.trimestre)) ? Number(q.trimestre) : undefined;

  const [linhas, poty] = await Promise.all([ranking(liga, temporada, trimestre), classificadosPOTY(liga, temporada)]);
  const [arte] = sortearArtes(liga === "pauper" ? "pauper" : "limited", 1, true);
  const link = (m: { liga?: string; temporada?: number; trimestre?: number | null }) => {
    const s = new URLSearchParams({ liga: m.liga ?? liga, temporada: String(m.temporada ?? temporada) });
    const t = m.trimestre === null ? undefined : (m.trimestre ?? trimestre);
    if (t) s.set("trimestre", String(t));
    return `/ranking?${s}`;
  };
  const podio = linhas.slice(0, 3);
  const chip = (ativo: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-semibold no-underline ${ativo ? "bg-azul text-white hover:text-white" : "text-texto2 ring-1 ring-borda hover:text-gelo hover:ring-ciano"}`;

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-borda">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={srcArte(arte)} alt="" style={{ objectPosition: arte.foco }} className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-preto via-preto/90 to-preto/40" />
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 pb-8 pt-14">
          <span className="text-sm font-semibold uppercase tracking-widest text-ciano">Temporada {temporada}</span>
          <h1 className="titulo text-6xl sm:text-7xl">Ranking</h1>
          <p className="max-w-2xl text-texto2">
            Cada etapa vale pontos. Os campeões e vices de cada Final do Trimestre garantem vaga no Player of the Year.{" "}
            <Link href="/circuito">Entenda o circuito →</Link>
          </p>
          <nav aria-label="Liga" className="mt-2 flex gap-6 border-b border-borda text-sm font-semibold">
            {LIGAS.map((l) => (
              <Link
                key={l.slug}
                href={link({ liga: l.slug })}
                aria-current={l.slug === liga ? "page" : undefined}
                className={`pb-3 no-underline ${l.slug === liga ? "border-b-2 border-azul text-gelo" : "text-cinza hover:text-gelo"}`}
              >
                {l.nome}
              </Link>
            ))}
          </nav>
        </div>
        <span className="absolute bottom-2 right-4 hidden text-[11px] text-white/50 sm:block">{creditoArte(arte)}</span>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={link({ trimestre: null })} className={chip(!trimestre)}>
              Temporada
            </Link>
            {TRIMESTRES.map((t) => (
              <Link key={t.n} href={link({ trimestre: t.n })} className={chip(trimestre === t.n)}>
                T{t.n}
              </Link>
            ))}
            {temporadas.length > 1 && (
              <span className="ml-auto flex gap-2">
                {temporadas.map((a) => (
                  <Link key={a} href={link({ temporada: a, trimestre: null })} className={chip(a === temporada)}>
                    {a}
                  </Link>
                ))}
              </span>
            )}
          </div>

          {linhas.length === 0 ? (
            <p className="border-l-2 border-azul py-2 pl-4 text-texto2">
              Ainda não há resultados {trimestre ? `no ${trimestre}º trimestre` : "nesta temporada"}. A primeira etapa define os primeiros pontos.
            </p>
          ) : (
            <>
              <ol className="grid gap-3 sm:grid-cols-3">
                {podio.map((l, i) => (
                  <li
                    key={l.chave}
                    className={`flex items-center gap-3 rounded-md p-4 ring-1 ${i === 0 ? "bg-azul/15 ring-azul" : "bg-grafite ring-borda"}`}
                  >
                    <span className={`titulo w-8 text-4xl ${i === 0 ? "text-ciano" : "text-cinza"}`}>{l.posicao}º</span>
                    <FotoJogador nick={l.nick} avatar={l.avatar} tamanho={40} />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{l.nick}</span>
                      <span className="text-sm text-texto2">
                        {l.pontos} pts · {l.etapas} {l.etapas === 1 ? "etapa" : "etapas"}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>

              <div className="overflow-x-auto rounded-md ring-1 ring-borda">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-grafite text-left text-xs uppercase tracking-wider text-cinza">
                    <tr>
                      <th className="w-14 p-3 text-center">#</th>
                      <th className="p-3">Jogador</th>
                      <th className="p-3 text-right">Pontos</th>
                      <th className="p-3 text-right">Etapas</th>
                      <th className="p-3 text-right">Títulos</th>
                      <th className="p-3 text-right">Top 8</th>
                      <th className="hidden p-3 text-right sm:table-cell">V-D-E</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l) => (
                      <tr key={l.chave} className="border-t border-borda hover:bg-grafite/60">
                        <td className="p-3 text-center font-semibold text-cinza">{l.posicao}</td>
                        <td className="p-3">
                          <span className="flex items-center gap-2.5">
                            <FotoJogador nick={l.nick} avatar={l.avatar} tamanho={26} />
                            <span className="font-semibold">{l.nick}</span>
                            {poty.vagas.some((v) => v.chave === l.chave) && (
                              <span title="Classificado ao Player of the Year" className="rounded bg-ciano/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ciano">
                                POTY
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="p-3 text-right text-base font-bold text-gelo">{l.pontos}</td>
                        <td className="p-3 text-right text-texto2">{l.etapas}</td>
                        <td className="p-3 text-right text-texto2">{l.titulos || "–"}</td>
                        <td className="p-3 text-right text-texto2">{l.top8 || "–"}</td>
                        <td className="hidden p-3 text-right text-texto2 sm:table-cell">
                          {l.vitorias}-{l.derrotas}-{l.empates}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <p className="text-xs text-cinza">
            Pontos por etapa: 1º 10 · 2º 8 · 3º e 4º 6 · 5º ao 8º 4 · participação 1. Desempate: títulos, top 8 e vitórias.
          </p>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="flex flex-col gap-3 rounded-md bg-grafite p-5 ring-1 ring-borda">
            <span className="text-xs font-bold uppercase tracking-wider text-ciano">Rumo ao Player of the Year</span>
            <h2 className="titulo text-3xl">Top 8 de {temporada}</h2>
            <ol className="flex flex-col divide-y divide-borda">
              {poty.vagas.map((v, i) => (
                <li key={v.chave} className="flex items-center gap-3 py-2.5">
                  <span className="w-5 text-sm font-semibold text-cinza">{i + 1}</span>
                  <FotoJogador nick={v.nick} avatar={v.avatar} tamanho={26} />
                  <span className="min-w-0 flex-1 truncate font-semibold">{v.nick}</span>
                  <span className="text-xs text-texto2">{v.motivo}</span>
                </li>
              ))}
              {Array.from({ length: VAGAS_POTY - poty.vagas.length }, (_, i) => (
                <li key={`v${i}`} className="flex items-center gap-3 py-2.5 text-cinza">
                  <span className="w-5 text-sm font-semibold">{poty.vagas.length + i + 1}</span>
                  <span className="h-[26px] w-[26px] rounded-full border border-dashed border-borda-forte" />
                  <span className="text-sm">Vaga em aberto</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="titulo text-2xl">Finais do Trimestre</h2>
            <ul className="flex flex-col gap-2">
              {poty.finais.map((f) => (
                <li key={f.trimestre} className="rounded-md p-4 ring-1 ring-borda">
                  <span className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cinza">
                    <span>{f.trimestre}º trimestre</span>
                    {f.evento && (
                      <Link href={`/eventos/${f.evento.slug}`} className="normal-case tracking-normal">
                        Ver final
                      </Link>
                    )}
                  </span>
                  {f.campeao ? (
                    <span className="mt-2 flex flex-col gap-1 text-sm">
                      <span>
                        <strong className="text-ciano">{f.campeao.nick}</strong> <span className="text-cinza">campeão</span>
                      </span>
                      {f.vice && (
                        <span>
                          <strong>{f.vice.nick}</strong> <span className="text-cinza">vice</span>
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="mt-2 block text-sm text-texto2">{f.evento ? "A disputar" : "Data a definir"}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
