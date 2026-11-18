import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GradeArtigos } from "@/components/Artigos";
import { Compartilhar } from "@/components/Compartilhar";
import { Insignia } from "@/components/Insignia";
import { FotoJogador } from "@/components/Jogador";
import { COR_BARRA } from "@/components/Mana";
import { cartaDestaque } from "@/components/PaginaDeck";
import { arteFixa, creditoArte, srcArte } from "@/lib/artes";
import { listarArtigos } from "@/lib/blog";
import { NOMES_TIPO } from "@/lib/circuito";
import { chaveCarta } from "@/lib/decklist";
import { dataCurta } from "@/lib/formato";
import {
  buscarJogador,
  insigniasDoJogador,
  resultadosDoJogador,
} from "@/lib/jogador";
import { linkJogador, REDES } from "@/lib/perfil";
import { buscarCartas } from "@/lib/scryfall";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ nick: string }>;
  searchParams: Promise<{ aba?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const nick = decodeURIComponent((await params).nick);
  const p = await buscarJogador(nick);
  if (!p) return { title: "Jogador" };
  return {
    title: `${p.nick} · Perfil`,
    description:
      p.bio ??
      `Resultados, decks e conquistas de ${p.nick} na Liga Fim de Turno.`,
  };
}

const campanha = (r: { vitorias: number; derrotas: number; empates: number }) =>
  `${r.vitorias}-${r.derrotas}${r.empates ? `-${r.empates}` : ""}`;

export default async function PerfilPublico({ params, searchParams }: Props) {
  const nick = decodeURIComponent((await params).nick);
  const q = await searchParams;
  const perfil = await buscarJogador(nick);
  if (!perfil) notFound();

  const todos = await resultadosDoJogador(perfil.id);
  const [insignias, artigos] = await Promise.all([
    insigniasDoJogador(perfil, todos),
    perfil.autorId && perfil.mostrarArtigos
      ? listarArtigos(24, { autor: perfil.autorId })
      : Promise.resolve([]),
  ]);
  const resultados = perfil.mostrarResultados ? todos : [];
  const decks = perfil.mostrarDecks ? todos.filter((r) => r.principal) : [];

  const abas = [
    resultados.length
      ? { id: "resultados", rotulo: `Resultados (${resultados.length})` }
      : null,
    decks.length ? { id: "decks", rotulo: `Decks (${decks.length})` } : null,
    artigos.length
      ? { id: "artigos", rotulo: `Artigos (${artigos.length})` }
      : null,
    { id: "insignias", rotulo: `Insígnias (${insignias.length})` },
  ].filter(Boolean) as { id: string; rotulo: string }[];
  const aba = abas.some((a) => a.id === q.aba) ? q.aba! : abas[0].id;

  // Arte: carta principal do deck público mais recente; senão, arte fixa do banco
  const cartas = decks.length
    ? await buscarCartas([
        ...new Set(decks.flatMap((d) => d.principal!.map((i) => i.nome))),
      ])
    : new Map();
  const arteDeck = new Map(
    decks.map(
      (d) => [d.evento.id, cartaDestaque(d.principal!, cartas)] as const,
    ),
  );
  const destaque = decks.length ? arteDeck.get(decks[0].evento.id) : null;
  const reserva = arteFixa(perfil.id, "geral");
  const fundo =
    destaque?.imagem_grande?.replace("/normal/", "/art_crop/") ??
    srcArte(reserva);

  const v = todos.reduce((s, r) => s + r.vitorias, 0);
  const jogos = todos.reduce(
    (s, r) => s + r.vitorias + r.derrotas + r.empates,
    0,
  );
  const numeros = perfil.mostrarResultados
    ? [
        ["Etapas", todos.length],
        ["Títulos", todos.filter((r) => r.posicao === 1).length],
        ["Top 8", todos.filter((r) => r.posicao <= 8).length],
        ["Vitórias", jogos ? `${Math.round((v / jogos) * 100)}%` : "—"],
      ]
    : [];
  const redes = REDES.filter((r) => perfil.redes[r.id]);
  const caminho = linkJogador(perfil.nick);

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-borda">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fundo}
          alt=""
          style={destaque ? undefined : { objectPosition: reserva.foco }}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[50%_30%] opacity-45"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-preto via-preto/80 to-preto/40" />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 pb-10 pt-14 text-center">
          <FotoJogador
            nick={perfil.nick}
            avatar={perfil.avatar}
            tamanho={112}
          />
          <h1 className="titulo text-5xl sm:text-6xl">{perfil.nick}</h1>
          {insignias.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {insignias.slice(0, 6).map((i) => (
                <Insignia key={i.id} insignia={i} compacta />
              ))}
            </div>
          )}
          {perfil.bio && <p className="max-w-2xl text-texto2">{perfil.bio}</p>}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {redes.map((r) => (
              <a
                key={r.id}
                href={`${r.base}${perfil.redes[r.id]}`}
                target="_blank"
                rel="noopener"
                className="text-sm font-semibold"
              >
                {r.nome}
              </a>
            ))}
            <Compartilhar
              titulo={`${perfil.nick} na Liga Fim de Turno`}
              caminho={caminho}
            />
          </div>
          {numeros.length > 0 && (
            <dl className="mt-2 grid grid-cols-4 gap-px overflow-hidden rounded-md bg-borda ring-1 ring-borda">
              {numeros.map(([r, n]) => (
                <div
                  key={r as string}
                  className="flex min-w-20 flex-col bg-preto/70 px-4 py-3 backdrop-blur sm:min-w-28"
                >
                  <dd className="titulo text-3xl">{n}</dd>
                  <dt className="text-xs text-cinza">{r}</dt>
                </div>
              ))}
            </dl>
          )}
          <span className="text-xs text-cinza">
            Na liga desde{" "}
            {new Date(perfil.desde).toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        {!destaque && (
          <span className="absolute bottom-2 right-4 hidden text-[11px] text-white/50 sm:block">
            {creditoArte(reserva)}
          </span>
        )}
      </section>

      <nav
        aria-label="Seções do perfil"
        className="z-20 border-b border-borda bg-preto/90 backdrop-blur md:sticky md:top-16"
      >
        <div className="mx-auto flex max-w-6xl justify-center gap-7 overflow-x-auto px-6 text-sm font-semibold">
          {abas.map((a) => (
            <Link
              key={a.id}
              href={`${caminho}?aba=${a.id}`}
              aria-current={aba === a.id ? "page" : undefined}
              className={`shrink-0 py-4 no-underline ${aba === a.id ? "border-b-2 border-azul text-gelo" : "text-cinza hover:text-gelo"}`}
            >
              {a.rotulo}
            </Link>
          ))}
        </div>
      </nav>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        {aba === "resultados" && (
          <div className="overflow-x-auto rounded-md ring-1 ring-borda">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-grafite text-left text-xs uppercase tracking-wider text-cinza">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Etapa</th>
                  <th className="p-3">Deck</th>
                  <th className="p-3 text-center">Colocação</th>
                  <th className="p-3 text-right">Campanha</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r) => (
                  <tr
                    key={r.evento.id}
                    className="border-t border-borda hover:bg-grafite/60"
                  >
                    <td className="p-3 text-cinza">
                      {dataCurta(r.evento.inicio)}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/eventos/${r.evento.slug}?aba=resultados`}
                        className="font-semibold text-gelo no-underline hover:text-ciano"
                      >
                        {r.evento.titulo}
                      </Link>
                      {r.evento.tipo !== "etapa" && (
                        <span className="ml-2 text-xs font-bold uppercase text-ciano">
                          {NOMES_TIPO[r.evento.tipo]}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-texto2">
                      {r.principal && perfil.mostrarDecks ? (
                        <Link
                          href={`/eventos/${r.evento.slug}/deck/${r.posicao}`}
                        >
                          {r.arquetipo ?? "Ver deck"}
                        </Link>
                      ) : (
                        (r.arquetipo ??
                        (r.evento.formato === "pauper"
                          ? "—"
                          : (r.evento.colecao ?? "Limited")))
                      )}
                    </td>
                    <td
                      className={`p-3 text-center font-bold ${r.posicao === 1 ? "text-ciano" : ""}`}
                    >
                      {r.posicao}º
                    </td>
                    <td className="p-3 text-right text-texto2">
                      {campanha(r)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {aba === "decks" && (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {decks.map((d) => {
              const c = arteDeck.get(d.evento.id);
              const cores = [
                ...new Set(
                  d.principal!.flatMap(
                    (i) =>
                      (cartas
                        .get(chaveCarta(i.nome))
                        ?.custo?.match(/[WUBRG]/g) as string[] | undefined) ??
                      [],
                  ),
                ),
              ];
              return (
                <li key={d.evento.id}>
                  <Link
                    href={`/eventos/${d.evento.slug}/deck/${d.posicao}`}
                    className="group flex flex-col overflow-hidden rounded-md bg-grafite text-gelo no-underline ring-1 ring-borda transition hover:-translate-y-0.5 hover:text-gelo hover:ring-ciano"
                  >
                    <div className="relative aspect-[2/1] overflow-hidden bg-fundo2">
                      {c?.imagem_grande && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.imagem_grande.replace(
                            "/normal/",
                            "/art_crop/",
                          )}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover object-[50%_30%] transition duration-500 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-preto/90 to-transparent" />
                      <span className="absolute bottom-2.5 left-3 text-lg font-bold">
                        {d.arquetipo ?? "Deck"}
                      </span>
                      <span className="absolute right-3 top-2.5 rounded bg-azul px-2 py-0.5 text-xs font-bold">
                        {d.posicao}º
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-texto2">
                          {d.evento.titulo}
                        </span>
                        <span className="text-xs text-cinza">
                          {dataCurta(d.evento.inicio)} · {campanha(d)}
                        </span>
                      </span>
                      <span className="flex gap-1">
                        {cores.map((cor) => (
                          <span
                            key={cor}
                            className="h-3 w-3 rounded-full"
                            style={{ background: COR_BARRA[cor] }}
                          />
                        ))}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {aba === "artigos" && <GradeArtigos artigos={artigos} />}

        {aba === "insignias" &&
          (insignias.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {insignias.map((i) => (
                <li key={i.id}>
                  <Insignia insignia={i} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-l-2 border-azul py-2 pl-4 text-texto2">
              As insígnias aparecem com as conquistas na liga: títulos, top 8,
              finais e mais.
            </p>
          ))}

        {!perfil.mostrarResultados && !perfil.mostrarDecks && (
          <p className="text-center text-sm text-cinza">
            Este jogador preferiu manter os resultados e decks reservados.
          </p>
        )}
      </div>
    </>
  );
}
