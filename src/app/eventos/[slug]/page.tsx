import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AcaoEvento } from "@/components/AcaoEvento";
import { BotaoLink, Etiqueta } from "@/components/Botao";
import { DeckDoEvento } from "@/components/DeckDoEvento";
import { EtiquetaLiga } from "@/components/Eventos";
import { FotoJogador } from "@/components/Jogador";
import { BannerPatrocinado } from "@/components/Parceiros";
import { LequeBoosters } from "@/components/Booster";
import { GaleriaCartas, type CartaGaleria } from "@/components/GaleriaCartas";
import { capaDoEvento } from "@/lib/artes";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { NOMES_TIPO, periodo, TABELA_PONTOS } from "@/lib/circuito";
import { buscarEvento, listarInscritos, listarResultados } from "@/lib/dados";
import { decksDaClassificacao, TOP_PUBLICO } from "@/lib/decksEvento";
import { dataCurta, dataLonga, hora, NOMES_FORMATO, NOMES_STATUS, reais } from "@/lib/formato";
import { regraPauper } from "@/lib/resultados";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ aba?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const evento = await buscarEvento(slug);
  return { title: evento?.titulo ?? "Evento" };
}

const pct = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
const campanha = (r: { vitorias: number; derrotas: number; empates: number }) => `${r.vitorias}-${r.derrotas}${r.empates ? `-${r.empates}` : ""}`;

export default async function PaginaEvento({ params, searchParams }: Props) {
  const { slug } = await params;
  const q = await searchParams;
  const evento = await buscarEvento(slug);
  if (!evento) notFound();

  const [inscritos, resultados, decks] = await Promise.all([listarInscritos(evento.id), listarResultados(evento.id), decksDaClassificacao(evento.id)]);
  const temResultado = resultados.length > 0;
  const aba = q.aba ?? (temResultado ? "resultados" : "detalhes");
  const deckPorPosicao = new Map(decks.map((d) => [d.posicao, d]));
  const pauper = evento.formato === "pauper";
  const capa = capaDoEvento(evento);
  const colecao = evento.colecao_info;
  const cubo = evento.cubo_info;
  const temVitrine = !pauper && (colecao || cubo);
  const campeao = resultados[0];
  const { trimestre } = periodo(evento.inicio);

  const abas = [
    { id: "detalhes", rotulo: "Detalhes" },
    ...(temVitrine ? [{ id: "colecao", rotulo: cubo ? `Cubo (${cubo.total_cartas ?? 0})` : "Coleção" }] : []),
    { id: "inscritos", rotulo: `Inscritos (${inscritos.length})` },
    { id: "resultados", rotulo: "Resultados" },
  ];

  // Cartas da aba Coleção/Cubo: lista congelada do cubo ou raras e míticas da coleção
  let cartasVitrine: CartaGaleria[] = [];
  if (aba === "colecao" && temVitrine) {
    const db = criarClienteAdmin();
    if (cubo) {
      const { data } = await db.from("evento_cubo").select("cartas").eq("evento_id", evento.id).maybeSingle();
      cartasVitrine = (data?.cartas as CartaGaleria[] | undefined) ?? (((await db.from("cubos").select("cartas").eq("id", evento.cubo_id!).single()).data?.cartas as CartaGaleria[]) ?? []);
    } else if (colecao) {
      const { data } = await db.from("colecoes").select("destaques").eq("codigo", colecao.codigo).single();
      cartasVitrine = (data?.destaques as CartaGaleria[]) ?? [];
    }
  }

  // Metagame da etapa (arquétipos informados pelos jogadores)
  const meta = new Map<string, number>();
  for (const d of decks) if (d.arquetipo) meta.set(d.arquetipo, (meta.get(d.arquetipo) ?? 0) + 1);
  const fatias = [...meta.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <>
      {/* Abertura com a arte do evento */}
      <section className="relative isolate overflow-hidden border-b border-borda">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={capa.src} alt="" style={{ objectPosition: capa.foco }} className="absolute inset-0 -z-20 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-preto via-preto/85 to-preto/30" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-preto to-transparent" />
        <div className="mx-auto flex max-w-6xl flex-wrap items-end gap-8 px-6 pb-10 pt-8">
          <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
            <nav aria-label="Caminho" className="flex flex-wrap gap-2 text-sm text-texto2">
              <Link href="/eventos">Agenda</Link>
              <span>/</span>
              <Link href={`/ligas/${evento.liga.slug}`}>{pauper ? "Pauper" : "Limited"}</Link>
            </nav>
            <div className="flex flex-wrap gap-2 pt-8">
              <EtiquetaLiga evento={evento} />
              {evento.tipo !== "etapa" && <Etiqueta tipo="ciano">{NOMES_TIPO[evento.tipo]}{evento.tipo === "final_trimestre" ? ` · T${trimestre}` : ""}</Etiqueta>}
              <Etiqueta tipo="contorno">{evento.modalidade === "online" ? "Online · Endstep" : "Presencial"}</Etiqueta>
              <Etiqueta tipo={evento.status === "cancelado" ? "alerta" : "contorno"}>{NOMES_STATUS[evento.status]}</Etiqueta>
            </div>
            <h1 className="titulo text-5xl sm:text-7xl">{evento.titulo}</h1>
            <p className="text-lg text-texto2">
              {dataLonga(evento.inicio)} · {hora(evento.inicio)} (horário de Brasília)
              {evento.modalidade === "presencial" && evento.local ? ` · ${evento.local}` : ""}
            </p>
            {campeao && (
              <Link
                href={`/eventos/${evento.slug}?aba=resultados`}
                className="mt-2 flex max-w-md items-center gap-3 rounded-md bg-preto/60 p-3 text-gelo no-underline ring-1 ring-ciano/40 backdrop-blur hover:text-gelo hover:ring-ciano"
              >
                <Trofeu />
                <FotoJogador nick={campeao.nick_endstep} avatar={null} tamanho={34} />
                <span className="flex min-w-0 flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-ciano">Campeão</span>
                  <span className="truncate font-semibold">
                    {campeao.nick_endstep}
                    {deckPorPosicao.get(1)?.arquetipo ? <span className="font-normal text-texto2"> · {deckPorPosicao.get(1)!.arquetipo}</span> : null}
                  </span>
                </span>
                <span className="ml-auto text-sm text-texto2">{campanha(campeao)}</span>
              </Link>
            )}
          </div>
          <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-3 rounded-lg bg-grafite/85 p-6 ring-1 ring-borda backdrop-blur">
            <Linha rotulo="Inscrição" valor={reais(evento.valor_centavos)} />
            <Linha rotulo="Premiação" valor={`${evento.percentual_premio}% das inscrições`} destaque />
            <Linha rotulo="Inscritos" valor={`${inscritos.length}${evento.vagas ? ` de ${evento.vagas}` : ""} · mínimo ${evento.minimo}`} />
            <Linha rotulo="Inscrições até" valor={`${dataCurta(evento.inscricoes_ate)}, ${hora(evento.inscricoes_ate)}`} />
            <AcaoEvento evento={evento} totalInscritos={inscritos.length} />
            <DeckDoEvento evento={evento} />
          </aside>
        </div>
        <span className="absolute bottom-2 right-4 hidden text-[11px] text-white/50 sm:block">{capa.credito}</span>
      </section>

      <nav aria-label="Abas do evento" className="z-20 border-b border-borda bg-preto/90 backdrop-blur md:sticky md:top-16">
        <div className="mx-auto flex max-w-6xl gap-7 px-6 text-sm font-semibold">
          {abas.map((a) => (
            <Link
              key={a.id}
              href={`/eventos/${evento.slug}?aba=${a.id}`}
              aria-current={aba === a.id ? "page" : undefined}
              className={`py-4 no-underline ${aba === a.id ? "border-b-2 border-azul text-gelo" : "text-cinza hover:text-gelo"}`}
            >
              {a.rotulo}
            </Link>
          ))}
        </div>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          {aba === "resultados" &&
            (!temResultado ? (
              <p className="border-l-2 border-azul py-2 pl-4 text-texto2">A classificação aparece aqui depois do evento.</p>
            ) : (
              <div className="flex flex-col gap-6">
                <ol className="grid gap-3 sm:grid-cols-3">
                  {resultados.slice(0, 3).map((r, i) => {
                    const d = deckPorPosicao.get(r.posicao);
                    return (
                      <li key={r.posicao} className={`flex flex-col gap-3 rounded-md p-4 ring-1 ${i === 0 ? "bg-azul/15 ring-azul" : "bg-grafite ring-borda"}`}>
                        <span className="flex items-center justify-between">
                          <span className={`titulo text-4xl ${i === 0 ? "text-ciano" : "text-cinza"}`}>{r.posicao}º</span>
                          <span className="text-sm font-semibold text-texto2">{campanha(r)}</span>
                        </span>
                        <span className="flex items-center gap-2.5">
                          <FotoJogador nick={r.nick_endstep} avatar={null} tamanho={32} />
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate font-semibold">{r.nick_endstep}</span>
                            {d?.arquetipo && <span className="truncate text-sm text-texto2">{d.arquetipo}</span>}
                          </span>
                        </span>
                        {d?.temLista && r.posicao <= TOP_PUBLICO && (
                          <Link href={`/eventos/${evento.slug}/deck/${r.posicao}`} className="text-sm font-semibold">
                            Ver deck →
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>

                <div className="overflow-x-auto rounded-md ring-1 ring-borda">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="bg-grafite text-left text-xs uppercase tracking-wider text-cinza">
                      <tr>
                        <th className="w-12 p-3 text-center">#</th>
                        <th className="p-3">Jogador</th>
                        {pauper && <th className="p-3">Arquétipo</th>}
                        <th className="p-3 text-right">Pontos</th>
                        <th className="p-3 text-right">V-D-E</th>
                        <th className="p-3 text-right">Deck</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultados.map((r) => {
                        const d = deckPorPosicao.get(r.posicao);
                        const listaPublica = d?.temLista && r.posicao <= TOP_PUBLICO;
                        return (
                          <tr key={r.posicao} className={`border-t hover:bg-grafite/60 ${r.posicao === TOP_PUBLICO + 1 ? "border-t-2 border-azul/60" : "border-borda"}`}>
                            <td className="p-3 text-center font-semibold text-cinza">{r.posicao}</td>
                            <td className="p-3">
                              <span className="flex items-center gap-2.5">
                                <FotoJogador nick={r.nick_endstep} avatar={null} tamanho={24} />
                                <span className="font-semibold">{r.nick_endstep}</span>
                              </span>
                            </td>
                            {pauper && <td className="p-3 text-texto2">{d?.arquetipo ?? <span className="text-cinza">—</span>}</td>}
                            <td className="p-3 text-right font-bold">{r.pontos}</td>
                            <td className="p-3 text-right text-texto2">{campanha(r)}</td>
                            <td className="p-3 text-right">
                              {listaPublica ? (
                                <Link href={`/eventos/${evento.slug}/deck/${r.posicao}`} className="font-semibold">
                                  Ver deck
                                </Link>
                              ) : (
                                <span className="text-cinza">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-cinza">
                  Pontos da etapa (vitória 3, empate 1). As listas do top {TOP_PUBLICO} ficam públicas depois do resultado; o arquétipo de todos entra no metagame.
                </p>
              </div>
            ))}

          {aba === "inscritos" &&
            (inscritos.length === 0 ? (
              <p className="border-l-2 border-azul py-2 pl-4 text-texto2">Ainda não há inscrições confirmadas.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {inscritos.map((i, n) => {
                  const nick = i.nick_endstep || i.discord_nome || "Jogador";
                  return (
                    <li key={n} className="flex items-center gap-3 rounded-md bg-grafite p-3 ring-1 ring-borda">
                      <FotoJogador nick={nick} avatar={null} tamanho={30} />
                      <span className="truncate font-semibold">{nick}</span>
                    </li>
                  );
                })}
              </ul>
            ))}

          {aba === "colecao" && temVitrine && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-texto2">
                {cubo
                  ? `Lista do ${cubo.nome} usada neste evento (congelada na data do evento).`
                  : `Raras e míticas de ${colecao!.nome} que podem aparecer nos boosters.`}
              </p>
              <GaleriaCartas cartas={cartasVitrine} />
            </div>
          )}

          {aba === "detalhes" && temVitrine && (
            <section className="mb-4 grid items-center gap-6 overflow-hidden rounded-md bg-grafite ring-1 ring-borda md:grid-cols-[1.1fr_1fr]">
              <div className="relative isolate bg-fundo2 px-4">
                <LequeBoosters
                  quantidade={evento.pacotes ?? (evento.formato === "selado" ? 6 : 3)}
                  arte={capa.src}
                  foco={capa.foco}
                  icone={colecao?.icone_svg ?? "/icone-cubo.svg"}
                  nome={colecao?.nome ?? cubo!.nome}
                  rotulo={evento.formato === "draft" ? "Booster de draft" : evento.formato === "selado" ? "Selado" : "Cube draft"}
                />
              </div>
              <div className="flex flex-col gap-3 p-6 md:pl-0">
                <span className="text-xs font-bold uppercase tracking-wider text-ciano">
                  {NOMES_FORMATO[evento.formato]}
                </span>
                <h2 className="titulo flex items-center gap-3 text-4xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={colecao?.icone_svg ?? "/icone-cubo.svg"} alt="" className="h-8 w-8 invert" />
                  {colecao?.nome ?? cubo?.nome}
                </h2>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {colecao ? (
                    <>
                      <Dado rotulo="Boosters por jogador" valor={String(evento.pacotes ?? (evento.formato === "draft" ? 3 : 6))} />
                      <Dado rotulo="Cartas na coleção" valor={colecao.total_cartas ? String(colecao.total_cartas) : "—"} />
                      <Dado rotulo="Lançamento" valor={colecao.lancamento ? new Date(`${colecao.lancamento}T12:00:00Z`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "—"} />
                      <Dado rotulo="Código" valor={colecao.codigo.toUpperCase()} />
                    </>
                  ) : (
                    <>
                      <Dado rotulo="Boosters por jogador" valor={String(evento.pacotes ?? 3)} />
                      <Dado rotulo="Cartas no cubo" valor={String(cubo!.total_cartas ?? "—")} />
                      <Dado rotulo="Curadoria" valor={cubo!.dono ?? "—"} />
                      <Dado rotulo="Lista" valor="Congelada na data do evento" />
                    </>
                  )}
                </dl>
                <div className="flex flex-wrap gap-4 pt-1 text-sm font-semibold">
                  <Link href={`/eventos/${evento.slug}?aba=colecao`}>{cubo ? "Ver a lista do cubo →" : "Ver raras e míticas →"}</Link>
                  {cubo && (
                    <a href={`https://cubecobra.com/cube/list/${cubo.cubecobra_id}`} target="_blank" rel="noopener">
                      Abrir no Cube Cobra ↗
                    </a>
                  )}
                </div>
              </div>
            </section>
          )}

          {aba === "detalhes" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Bloco titulo="Formato">
                {pauper
                  ? "Pauper, partidas melhor de 3 com sideboard. Rodadas suíças com todos os inscritos: 3 rodadas com 8 jogadores, 4 rodadas com 9 ou mais."
                  : `${NOMES_FORMATO[evento.formato]}${evento.colecao ? ` · ${evento.colecao}` : ""}. Pods de 6 a 8 jogadores, 3 rodadas suíças melhor de 3 dentro de cada pod. Deck mínimo de 40 cartas.`}
              </Bloco>
              <Bloco titulo="Como funciona a noite">
                Depois da confirmação do Pix, o link privado do evento no Endstep aparece aqui. O check-in é feito lá até 10 minutos antes do início; emparelhamentos e rodadas acontecem no próprio Endstep.
              </Bloco>
              <Bloco titulo="Premiação">
                {evento.percentual_premio}% das inscrições formam o prêmio, pago por Pix em até 48 horas.
                {pauper ? (
                  <span className="mt-3 block text-gelo">
                    Com {Math.max(evento.minimo, inscritos.length)} jogadores: {regraPauper(Math.max(evento.minimo, inscritos.length)).map((p, i) => `${i + 1}º ${pct(p)}`).join(" · ")}
                  </span>
                ) : (
                  <span className="mt-3 block text-gelo">3-0 vale 3 cotas · 2-1 vale 1 cota</span>
                )}
                <span className="mt-2 block text-sm text-cinza">Com menos de {evento.minimo} inscritos o evento é cancelado e cada inscrito escolhe reembolso ou crédito.</span>
              </Bloco>
              <Bloco titulo={evento.tipo === "final_trimestre" ? `Final do ${trimestre}º trimestre` : "Vale para o circuito"}>
                {evento.tipo === "final_trimestre"
                  ? "Quem vencer é o campeão do trimestre e o segundo lugar é o vice: os dois garantem vaga no Player of the Year em dezembro."
                  : evento.tipo === "player_of_the_year"
                    ? "O top 8 da temporada decide o melhor jogador do ano."
                    : "A classificação desta etapa soma pontos no ranking do trimestre e no anual."}
                {evento.tipo !== "player_of_the_year" && (
                  <span className="mt-3 block text-gelo">{TABELA_PONTOS.map((t) => `${t.faixa}: ${t.pontos}`).join(" · ")}</span>
                )}
                <Link href="/circuito" className="mt-2 block text-sm font-semibold">
                  Como funciona o circuito →
                </Link>
              </Bloco>
              {evento.detalhes && (
                <div className="sm:col-span-2">
                  <Bloco titulo="Informações da organização">
                    <span className="whitespace-pre-line">{evento.detalhes}</span>
                  </Bloco>
                </div>
              )}
              <Link href="/regras" className="text-sm font-semibold sm:col-span-2">
                Regulamento completo →
              </Link>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          {fatias.length > 0 && (
            <section className="flex flex-col gap-3 rounded-md bg-grafite p-5 ring-1 ring-borda">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cinza">Metagame da etapa</h2>
              <ul className="flex flex-col gap-2.5">
                {fatias.map(([nome, n]) => (
                  <li key={nome} className="flex flex-col gap-1 text-sm">
                    <span className="flex justify-between">
                      <span>{nome}</span>
                      <span className="text-cinza">{n}</span>
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-fundo2">
                      <span className="block h-full rounded-full bg-azul" style={{ width: `${(n / fatias[0][1]) * 100}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
              <Link href={`/ligas/${evento.liga.slug}#metagame`} className="text-sm font-semibold">
                Metagame da temporada →
              </Link>
            </section>
          )}
          <section className="flex flex-col gap-2 rounded-md bg-grafite p-5 ring-1 ring-borda">
            <span className="font-semibold">Primeira vez?</span>
            <span className="text-sm text-texto2">Veja como criar a conta no Endstep e entrar no evento.</span>
            <BotaoLink href="/como-jogar" variante="texto" className="justify-start">
              Como jogar
            </BotaoLink>
          </section>
          <section className="flex flex-col gap-2 rounded-md bg-grafite p-5 ring-1 ring-borda">
            <span className="font-semibold">Ranking {pauper ? "Pauper" : "Limited"}</span>
            <span className="text-sm text-texto2">Veja quem lidera o trimestre e a corrida para o Player of the Year.</span>
            <BotaoLink href={`/ranking?liga=${evento.liga.slug}`} variante="texto" className="justify-start">
              Ver ranking
            </BotaoLink>
          </section>
        </aside>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-12">
        <BannerPatrocinado posicao="evento" pagina={`/eventos/${evento.slug}`} />
      </div>
    </>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-cinza">{rotulo}</dt>
      <dd className="font-semibold">{valor}</dd>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex h-full flex-col gap-2 rounded-md bg-grafite p-5 ring-1 ring-borda">
      <h2 className="titulo text-2xl">{titulo}</h2>
      <p className="text-texto2">{children}</p>
    </section>
  );
}

function Trofeu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-ciano" aria-hidden="true">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 6h3v2a3 3 0 0 1-3 3M7 6H4v2a3 3 0 0 0 3 3" />
    </svg>
  );
}

function Linha({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-b border-borda pb-3 text-sm">
      <span className="text-cinza">{rotulo}</span>
      <span className={`font-semibold ${destaque ? "text-ciano" : ""}`}>{valor}</span>
    </div>
  );
}
