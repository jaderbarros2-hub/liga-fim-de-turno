import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AcoesLista, ComprarDeck } from "@/components/ComprarDeck";
import { DeckCompleto, type GrupoDeck } from "@/components/DeckCompleto";
import { FotoJogador } from "@/components/Jogador";
import { COR_BARRA, NOMES_COR } from "@/components/Mana";
import { BannerPatrocinado } from "@/components/Parceiros";
import { arteDoEvento, creditoArte, srcArte } from "@/lib/artes";
import { NOMES_TIPO } from "@/lib/circuito";
import { buscarEvento } from "@/lib/dados";
import { chaveCarta, grupoDaCarta, ORDEM_GRUPOS, total, type Carta, type ItemLista } from "@/lib/decklist";
import { decksDaClassificacao, TOP_PUBLICO } from "@/lib/decksEvento";
import { dataLonga } from "@/lib/formato";
import { lojaParaDeck } from "@/lib/parceiros";
import { buscarCartas } from "@/lib/scryfall";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; posicao: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, posicao } = await params;
  const evento = await buscarEvento(slug);
  if (!evento) return { title: "Deck" };
  const deck = (await decksDaClassificacao(evento.id)).find((d) => d.posicao === Number(posicao));
  return { title: `${deck?.arquetipo ?? deck?.deckNome ?? "Deck"} · ${deck?.nick ?? ""} · ${evento.titulo}` };
}

/**
 * Carta que representa o deck: de preferência a criatura com mais cópias (desempate: maior custo);
 * sem criaturas, a mágica com mais cópias. Terrenos nunca.
 */
function cartaDestaque(principal: ItemLista[], cartas: Map<string, Carta>) {
  const candidatas = [...principal]
    .map((i) => ({ i, c: cartas.get(chaveCarta(i.nome)) }))
    .filter((x) => x.c && grupoDaCarta(x.c.tipo) !== "Terrenos" && x.c.imagem_grande);
  const ordem = (a: (typeof candidatas)[number], b: (typeof candidatas)[number]) =>
    b.i.qtd - a.i.qtd || (b.c!.cmc ?? 0) - (a.c!.cmc ?? 0);
  const criaturas = candidatas.filter((x) => grupoDaCarta(x.c!.tipo) === "Criaturas").sort(ordem);
  return (criaturas[0] ?? candidatas.sort(ordem)[0])?.c;
}

const ordinal = (n: number) => `${n}º lugar`;

/** Lista pública de um deck do top 8, depois do resultado publicado. */
export default async function DeckPublico({ params }: Props) {
  const { slug, posicao } = await params;
  const pos = Number(posicao);
  const evento = await buscarEvento(slug);
  if (!evento || !Number.isInteger(pos) || pos < 1 || pos > TOP_PUBLICO) notFound();

  const todos = await decksDaClassificacao(evento.id, true);
  const deck = todos.find((d) => d.posicao === pos);
  if (!deck?.principal) notFound();
  const sideboard = deck.sideboard ?? [];

  const [cartas, loja, { data: res }] = await Promise.all([
    buscarCartas([...deck.principal, ...sideboard].map((i) => i.nome)),
    lojaParaDeck(),
    criarClienteAdmin().from("resultados").select("vitorias, derrotas, empates").eq("evento_id", evento.id).eq("posicao", pos).maybeSingle(),
  ]);

  // Grupos por tipo, ordenados por custo
  const porGrupo = new Map<string, ItemLista[]>();
  for (const i of deck.principal) {
    const g = grupoDaCarta(cartas.get(chaveCarta(i.nome))?.tipo ?? "");
    porGrupo.set(g, [...(porGrupo.get(g) ?? []), i]);
  }
  const ordenar = (itens: ItemLista[]) =>
    [...itens].sort((a, b) => (cartas.get(chaveCarta(a.nome))?.cmc ?? 0) - (cartas.get(chaveCarta(b.nome))?.cmc ?? 0) || a.nome.localeCompare(b.nome));
  const montar = (titulo: string, itens: ItemLista[]) => ({
    titulo,
    total: total(itens),
    itens: ordenar(itens).map((i) => {
      const c = cartas.get(chaveCarta(i.nome));
      return { qtd: i.qtd, nome: c?.nome ?? i.nome, custo: c?.custo ?? null, imagem: c?.imagem_grande ?? null, tipo: c?.tipo ?? "" };
    }),
  });
  const grupos: GrupoDeck[] = ORDEM_GRUPOS.filter((g) => porGrupo.has(g)).map((g) => montar(g, porGrupo.get(g)!));
  if (sideboard.length) grupos.push(montar("Sideboard", sideboard));

  // Estatísticas
  const curva = [0, 0, 0, 0, 0, 0, 0];
  const pips: Record<string, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (const i of deck.principal) {
    const c = cartas.get(chaveCarta(i.nome));
    if (!c || grupoDaCarta(c.tipo) === "Terrenos") continue;
    curva[Math.min(6, Math.floor(Number(c.cmc)))] += i.qtd;
    for (const s of c.custo?.match(/[WUBRG]/g) ?? []) pips[s] += i.qtd;
  }
  const maxCurva = Math.max(1, ...curva);
  const totalPips = Object.values(pips).reduce((a, b) => a + b, 0);
  const cores = Object.entries(pips).filter(([, v]) => v > 0);
  const qtd = (g: string) => total(porGrupo.get(g) ?? []);
  const terrenos = qtd("Terrenos");
  const criaturas = qtd("Criaturas");

  const destaque = cartaDestaque(deck.principal, cartas);
  const arteFundo = destaque?.imagem_grande?.replace("/normal/", "/art_crop/") ?? null;
  const arteReserva = arteDoEvento(evento);
  const nomeDeck = deck.arquetipo ?? deck.deckNome ?? "Deck";
  const lista = [
    ...deck.principal.map((i) => `${i.qtd} ${i.nome}`),
    ...(sideboard.length ? ["", "Sideboard", ...sideboard.map((i) => `${i.qtd} ${i.nome}`)] : []),
  ].join("\n");
  const pagina = `/eventos/${slug}/deck/${pos}`;
  const top = todos.filter((d) => d.posicao <= TOP_PUBLICO && d.temLista);

  return (
    <>
      {/* Faixa com a arte da carta principal do deck */}
      <section className="relative isolate overflow-hidden border-b border-borda">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={arteFundo ?? srcArte(arteReserva)}
          alt=""
          style={arteFundo ? undefined : { objectPosition: arteReserva.foco }}
          className="absolute inset-0 -z-20 h-full w-full scale-105 object-cover object-[50%_30%] opacity-55"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-preto via-preto/80 to-preto/30" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-preto to-transparent" />
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 pb-10 pt-8">
          <nav aria-label="Caminho" className="flex flex-wrap gap-2 text-sm text-texto2">
            <Link href={`/ligas/${evento.liga.slug}`}>{evento.formato === "pauper" ? "Pauper" : "Limited"}</Link>
            <span>/</span>
            <Link href={`/eventos/${slug}?aba=resultados`}>{evento.titulo}</Link>
          </nav>
          <div className="flex flex-wrap items-center gap-2 pt-6">
            <span className="rounded bg-azul px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">{ordinal(pos)}</span>
            {evento.tipo !== "etapa" && (
              <span className="rounded bg-ciano/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-ciano">{NOMES_TIPO[evento.tipo]}</span>
            )}
            {res && (
              <span className="rounded bg-preto/60 px-2 py-0.5 text-xs font-bold text-gelo ring-1 ring-borda">
                {res.vitorias}-{res.derrotas}
                {res.empates ? `-${res.empates}` : ""}
              </span>
            )}
          </div>
          <h1 className="titulo text-5xl sm:text-7xl">{nomeDeck}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-texto2">
            <span className="flex items-center gap-2">
              <FotoJogador nick={deck.nick} avatar={null} tamanho={26} />
              <span>
                por <strong className="text-gelo">{deck.nick}</strong>
              </span>
            </span>
            <span>{dataLonga(evento.inicio)}</span>
            {cores.length > 0 && (
              <span className="flex items-center gap-1.5">
                {cores.map(([c]) => (
                  <span key={c} title={NOMES_COR[c]} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/30" style={{ background: COR_BARRA[c] }} />
                ))}
              </span>
            )}
          </div>
        </div>
        {destaque && <span className="absolute bottom-2 right-4 hidden text-[11px] text-white/50 sm:block">Arte: {destaque.nome} · © Wizards of the Coast</span>}
        {!arteFundo && <span className="absolute bottom-2 right-4 hidden text-[11px] text-white/50 sm:block">{creditoArte(arteReserva)}</span>}
      </section>

      {/* Barra de ações */}
      <div className="sticky top-16 z-20 border-b border-borda bg-preto/90 backdrop-blur max-md:static">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3">
          {loja && <ComprarDeck loja={{ id: loja.id, nome: loja.nome, aceitaLista: !!loja.url_compra_lista }} lista={lista} pagina={pagina} />}
          <AcoesLista lista={lista} nome={`${nomeDeck} - ${deck.nick}`} />
          <span className="ml-auto text-sm text-cinza">
            {total(deck.principal)} cartas · {sideboard.length ? `${total(sideboard)} no sideboard` : "sem sideboard"}
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        {/* Números do deck */}
        <section className="grid gap-4 md:grid-cols-[1fr_1.2fr_1.2fr]">
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-md bg-borda ring-1 ring-borda">
            {[
              ["Criaturas", criaturas],
              ["Outras mágicas", total(deck.principal) - criaturas - terrenos],
              ["Terrenos", terrenos],
            ].map(([r, v]) => (
              <div key={r} className="flex flex-col justify-center bg-grafite p-4">
                <dd className="titulo text-4xl">{v}</dd>
                <dt className="text-xs text-cinza">{r}</dt>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-2 rounded-md bg-grafite p-4 ring-1 ring-borda">
            <span className="text-xs font-bold uppercase tracking-wider text-cinza">Curva de mana</span>
            <div aria-label="Curva de mana" className="flex flex-1 items-end gap-2">
              {curva.map((q, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[11px] text-texto2">{q || ""}</span>
                  <div className="w-full rounded-sm bg-azul" style={{ height: `${Math.max(3, (q / maxCurva) * 64)}px` }} />
                  <span className="text-[11px] text-cinza">{i === 6 ? "6+" : i}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-md bg-grafite p-4 ring-1 ring-borda">
            <span className="text-xs font-bold uppercase tracking-wider text-cinza">Cores (símbolos de mana)</span>
            {totalPips ? (
              <>
                <div className="flex h-3 overflow-hidden rounded-full">
                  {cores.map(([c, v]) => (
                    <span key={c} style={{ width: `${(v / totalPips) * 100}%`, background: COR_BARRA[c] }} />
                  ))}
                </div>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {cores.map(([c, v]) => (
                    <li key={c} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: COR_BARRA[c] }} />
                      {NOMES_COR[c]} <span className="text-cinza">{Math.round((v / totalPips) * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <span className="text-sm text-texto2">Incolor</span>
            )}
          </div>
        </section>

        <DeckCompleto grupos={grupos} inicial={destaque?.imagem_grande ?? null} />

        <BannerPatrocinado posicao="deck" pagina={pagina} />

        {/* Outros decks do top 8 */}
        {top.length > 1 && (
          <section className="flex flex-col gap-4 border-t border-borda pt-8">
            <h2 className="titulo text-3xl">Top 8 de {evento.titulo}</h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {top.map((d) => (
                <li key={d.posicao}>
                  <Link
                    href={`/eventos/${slug}/deck/${d.posicao}`}
                    aria-current={d.posicao === pos ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-md p-3 text-gelo no-underline ring-1 hover:text-gelo hover:ring-ciano ${
                      d.posicao === pos ? "bg-azul/15 ring-azul" : "bg-grafite ring-borda"
                    }`}
                  >
                    <span className="titulo w-8 text-2xl text-cinza">{d.posicao}º</span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{d.arquetipo ?? d.deckNome ?? "Deck"}</span>
                      <span className="truncate text-xs text-texto2">{d.nick}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
