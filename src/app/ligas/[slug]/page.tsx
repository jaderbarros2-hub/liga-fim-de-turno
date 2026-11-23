import { ehConstruido, grupoDeArte } from "@/lib/formatos";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SecaoArtigos } from "@/components/Artigos";
import { BotaoLink } from "@/components/Botao";
import { ListaEventos } from "@/components/Eventos";
import { FotoJogador, NomeJogador } from "@/components/Jogador";
import { creditoArte, sortearArtes, srcArte } from "@/lib/artes";
import { listarArtigos } from "@/lib/blog";
import { finaisDaTemporada, periodo, ranking } from "@/lib/circuito";
import { FORMATOS } from "@/lib/conteudoFormatos";
import { listarProximosEventos } from "@/lib/dados";
import { dataCurta, NOMES_FORMATO } from "@/lib/formato";
import { metagame, ultimosCampeoes } from "@/lib/metagame";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = FORMATOS[(await params).slug];
  return f
    ? { title: `Liga ${f.nome}`, description: f.resumo }
    : { title: "Formato" };
}

const SECOES = [
  ["formato", "O formato"],
  ["etapa", "Como é a etapa"],
  ["agenda", "Próximas etapas"],
  ["metagame", "Metagame e campeões"],
  ["ranking", "Ranking"],
  ["perguntas", "Perguntas"],
];

export default async function PaginaFormato({ params }: Props) {
  const { slug } = await params;
  const f = FORMATOS[slug];
  if (!f) notFound();
  const agora = periodo(new Date().toISOString());

  const [eventos, meta, campeoes, rankTri, finais, artigos] = await Promise.all(
    [
      listarProximosEventos(6, slug),
      ehConstruido(slug)
        ? metagame(slug)
        : Promise.resolve({ fatias: [], etapas: 0, decks: 0 }),
      ultimosCampeoes(slug, 6),
      ranking(slug, agora.temporada, agora.trimestre),
      finaisDaTemporada(slug, agora.temporada),
      listarArtigos(4, { categoria: slug }),
    ],
  );
  const grupo = grupoDeArte(slug);
  const [aHero, aSobre] = sortearArtes(grupo, 2, true);
  const maior = Math.max(1, ...meta.fatias.map((x) => x.percentual));
  const finalAtual = finais.find((x) => x.trimestre === agora.trimestre);

  return (
    <>
      {/* Abertura */}
      <section className="relative isolate overflow-hidden border-b border-borda">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={srcArte(aHero)}
          style={{ objectPosition: aHero.foco }}
          alt=""
          className="hero-zoom absolute inset-0 -z-20 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-preto via-preto/85 to-preto/20" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-preto to-transparent" />
        <div className="mx-auto flex min-h-[480px] max-w-6xl flex-col justify-center gap-5 px-6 pb-10 pt-16">
          <span className="text-sm font-semibold uppercase tracking-widest text-brasa">
            Liga {f.nome}
          </span>
          <h1 className="titulo max-w-3xl text-5xl sm:text-6xl">{f.chamada}</h1>
          <p className="max-w-xl text-lg text-texto2">{f.resumo}</p>
          <div className="flex flex-wrap items-center gap-6">
            <BotaoLink href="#agenda">Ver próximas etapas</BotaoLink>
            <Link
              href={`/ranking?liga=${slug}`}
              className="text-sm font-semibold"
            >
              Ranking {f.nome} →
            </Link>
          </div>
          <dl className="mt-6 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-md bg-borda sm:grid-cols-4">
            {f.numeros.map((n) => (
              <div
                key={n.rotulo}
                className="flex flex-col bg-preto/80 px-4 py-3 backdrop-blur"
              >
                <dt className="order-2 text-xs text-cinza">{n.rotulo}</dt>
                <dd className="titulo text-2xl text-marfim">{n.valor}</dd>
              </div>
            ))}
          </dl>
        </div>
        <span className="absolute bottom-3 right-4 hidden text-[11px] text-white/50 sm:block">
          {creditoArte(aHero)}
        </span>
      </section>

      {/* Navegação da página */}
      <nav
        aria-label="Nesta página"
        className="z-20 border-b border-borda bg-preto/90 backdrop-blur md:sticky md:top-16"
      >
        <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-6 text-sm font-semibold">
          {SECOES.filter(
            ([id]) =>
              id !== "metagame" || campeoes.length || meta.fatias.length,
          ).map(([id, r]) => (
            <a
              key={id}
              href={`#${id}`}
              className="shrink-0 py-3 text-texto2 no-underline hover:text-marfim"
            >
              {r}
            </a>
          ))}
        </div>
      </nav>

      {/* O formato */}
      <section
        id="formato"
        className="mx-auto grid max-w-6xl scroll-mt-32 gap-12 px-6 py-20 lg:grid-cols-[1.1fr_1fr]"
      >
        <div className="flex flex-col gap-5">
          <h2 className="titulo text-4xl">O que é o {f.nome}</h2>
          <div className="conteudo-texto">
            {f.sobre.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <Link href="/circuito" className="self-start text-sm font-semibold">
            Como funciona o circuito da temporada →
          </Link>
        </div>
        <figure className="relative overflow-hidden rounded-lg ring-1 ring-borda">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={srcArte(aSobre)}
            alt=""
            loading="lazy"
            style={{ objectPosition: aSobre.foco }}
            className="h-full min-h-72 w-full object-cover"
          />
          <figcaption className="absolute bottom-2 right-3 text-[11px] text-white/70">
            {creditoArte(aSobre)}
          </figcaption>
        </figure>
      </section>

      {/* Como é a etapa */}
      <section
        id="etapa"
        className="scroll-mt-32 border-y border-borda bg-fundo2"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20">
          <h2 className="titulo text-4xl">Como é uma etapa</h2>
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {f.etapa.map((e, i) => (
              <li
                key={e.titulo}
                className="flex flex-col gap-2 border-t-2 border-vermelho pt-4"
              >
                <span className="text-sm font-semibold text-cinza">
                  Passo {i + 1}
                </span>
                <span className="text-lg font-semibold">{e.titulo}</span>
                <span className="text-texto2">{e.texto}</span>
              </li>
            ))}
          </ol>
          <div className="grid gap-6 rounded-lg bg-grafite p-6 ring-1 ring-borda lg:grid-cols-[1fr_2fr]">
            <div className="flex flex-col gap-2">
              <h3 className="titulo text-2xl">{f.premio.titulo}</h3>
              <p className="text-sm text-cinza">{f.premio.nota}</p>
            </div>
            <ul className="flex flex-col divide-y divide-borda">
              {f.premio.linhas.map((l) => (
                <li
                  key={l.faixa}
                  className="flex flex-wrap justify-between gap-2 py-3"
                >
                  <span className="font-semibold">{l.faixa}</span>
                  <span className="text-texto2">{l.divisao}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Agenda */}
      <section
        id="agenda"
        className="mx-auto flex max-w-6xl scroll-mt-32 flex-col gap-6 px-6 py-20"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="titulo text-4xl">Próximas etapas</h2>
          <Link href="/eventos" className="text-sm font-semibold">
            Agenda completa →
          </Link>
        </div>
        <ListaEventos eventos={eventos} />
      </section>

      {/* Metagame e campeões */}
      {(campeoes.length > 0 || meta.fatias.length > 0) && (
        <section
          id="metagame"
          className="scroll-mt-32 border-y border-borda bg-fundo2"
        >
          <div
            className={`mx-auto grid max-w-6xl gap-12 px-6 py-20 ${meta.fatias.length ? "lg:grid-cols-2" : ""}`}
          >
            {meta.fatias.length > 0 && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <h2 className="titulo text-4xl">Metagame</h2>
                  <p className="text-sm text-cinza">
                    {meta.decks} decks nas últimas {meta.etapas} etapas
                  </p>
                </div>
                <ul className="flex flex-col gap-3">
                  {meta.fatias.slice(0, 10).map((x) => (
                    <li key={x.arquetipo} className="flex flex-col gap-1">
                      <span className="flex justify-between text-sm">
                        <span className="font-semibold">{x.arquetipo}</span>
                        <span className="text-texto2">
                          {x.percentual.toLocaleString("pt-BR")}% · {x.top8} top
                          8
                          {x.titulos
                            ? ` · ${x.titulos} ${x.titulos === 1 ? "título" : "títulos"}`
                            : ""}
                        </span>
                      </span>
                      <span className="h-2 overflow-hidden rounded-full bg-grafite">
                        <span
                          className="block h-full rounded-full bg-vermelho"
                          style={{ width: `${(x.percentual / maior) * 100}%` }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {campeoes.length > 0 && (
              <div className="flex flex-col gap-5">
                <h2 className="titulo text-4xl">Últimos campeões</h2>
                <ul className="flex flex-col divide-y divide-borda border-y border-borda">
                  {campeoes.map((c) => (
                    <li
                      key={c.evento.slug}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3"
                    >
                      <span className="w-12 text-sm font-semibold text-cinza">
                        {dataCurta(c.evento.inicio)}
                      </span>
                      <FotoJogador nick={c.nick} avatar={null} tamanho={28} />
                      <span className="flex min-w-40 flex-1 flex-col">
                        <NomeJogador nick={c.nick} className="font-semibold" />
                        <span className="text-sm text-texto2">
                          {c.arquetipo ??
                            (ehConstruido(slug)
                              ? "Arquétipo não informado"
                              : `${NOMES_FORMATO[c.evento.formato] ?? ""}${c.evento.colecao ? ` · ${c.evento.colecao}` : ""}`)}
                          {c.evento.tipo === "final_trimestre" && (
                            <span className="ml-2 text-xs font-bold uppercase text-brasa">
                              Final do Trimestre
                            </span>
                          )}
                        </span>
                      </span>
                      {c.temLista ? (
                        <Link
                          href={`/eventos/${c.evento.slug}/deck/1`}
                          className="text-sm font-semibold"
                        >
                          Ver deck →
                        </Link>
                      ) : (
                        <Link
                          href={`/eventos/${c.evento.slug}?aba=resultados`}
                          className="text-sm font-semibold"
                        >
                          Classificação →
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Ranking */}
      <section
        id="ranking"
        className="mx-auto grid max-w-6xl scroll-mt-32 gap-12 px-6 py-20 lg:grid-cols-[1fr_1.4fr]"
      >
        <div className="flex flex-col gap-4">
          <span className="text-sm font-semibold uppercase tracking-widest text-brasa">
            {agora.trimestre}º trimestre de {agora.temporada}
          </span>
          <h2 className="titulo text-4xl">Corrida do trimestre</h2>
          <p className="text-texto2">
            A última etapa do trimestre é a Final: o campeão e o vice vão direto
            para o Player of the Year em dezembro.
          </p>
          {finalAtual?.evento && (
            <Link
              href={`/eventos/${finalAtual.evento.slug}`}
              className="self-start rounded-md bg-brasa/10 px-4 py-3 text-sm font-semibold text-brasa no-underline ring-1 ring-brasa/40"
            >
              Final do Trimestre: {dataCurta(finalAtual.evento.inicio)} →
            </Link>
          )}
          <Link
            href={`/ranking?liga=${slug}`}
            className="text-sm font-semibold"
          >
            Ranking completo →
          </Link>
        </div>
        {rankTri.length ? (
          <ol className="flex flex-col divide-y divide-borda rounded-md ring-1 ring-borda">
            {rankTri.slice(0, 8).map((l) => (
              <li
                key={l.chave}
                className="flex items-center gap-3 px-4 py-2.5 text-sm"
              >
                <span className="w-6 font-semibold text-cinza">
                  {l.posicao}
                </span>
                <FotoJogador nick={l.nick} avatar={l.avatar} tamanho={26} />
                <NomeJogador
                  nick={l.nick}
                  className="flex-1 truncate font-semibold"
                />
                <span className="text-texto2">{l.etapas} etapas</span>
                <span className="w-16 text-right font-bold">
                  {l.pontos} pts
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="self-center border-l-2 border-vermelho py-2 pl-4 text-texto2">
            O ranking do trimestre começa na primeira etapa com resultado.
          </p>
        )}
      </section>

      {artigos.length > 0 && (
        <div className="border-t border-borda bg-fundo2">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <SecaoArtigos
              titulo={`Artigos de ${f.nome}`}
              artigos={artigos}
              href={`/blog?categoria=${slug}`}
            />
          </div>
        </div>
      )}

      {/* Perguntas */}
      <section
        id="perguntas"
        className="mx-auto grid max-w-6xl scroll-mt-32 gap-12 px-6 py-20 lg:grid-cols-[1fr_1.6fr]"
      >
        <div className="flex flex-col gap-4">
          <h2 className="titulo text-4xl">Perguntas sobre o {f.nome}</h2>
          <Link href="/regras" className="text-sm font-semibold">
            Regulamento completo →
          </Link>
        </div>
        <div className="flex flex-col divide-y divide-borda border-y border-borda">
          {f.perguntas.map((q) => (
            <details key={q.p} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q.p}
                <span className="text-brasa transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-texto2">{q.r}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
